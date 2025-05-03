// server.js

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const multer = require('multer');
const { google } = require('googleapis');
const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1;
const { Value } = require('google-protobuf/google/protobuf/struct_pb');
const { GoogleGenerativeAI} = require('@google/generative-ai');
const path = require('path');
const PORT = process.env.PORT || 8080;
const admin = require('firebase-admin');
const Busboy = require('busboy');

const app = express();
app.use(express.json());


// const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
// admin.initializeApp({
//    credential: admin.credential.cert(serviceAccount),
//    storageBucket: 'test_img_upload_acs',  // This is your Firebase storage bucket
// });

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: 'test_img_upload_acs',  // Your Firebase Storage bucket name
});


const bucket = admin.storage().bucket();
const db = admin.firestore(); 
const imagesearchRef = db.collection('imagesearch');

async function getAccessToken() {
    const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();
    return accessToken.token;
}



// API endpoint for image upload
app.post('/api/upload', (req, res) => {
  const busboy = Busboy({ headers: req.headers });

  const { v4: uuidv4 } = require('uuid');

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
  const safeFilename = typeof filename === 'string' ? filename : `upload-${Date.now()}`;
  const uniqueFilename = `${uuidv4()}-${safeFilename}`;
  const filePath = `images/${uniqueFilename}`;

    // Upload the file to Firebase Storage
    const fileUpload = bucket.file(filePath).createWriteStream({
      metadata: {
        contentType: mimetype,
      },
    });

    file.pipe(fileUpload);

    fileUpload.on('finish', async () => {
      console.log('File uploaded to Cloud Storage:', filePath);
      const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

            // Now, process the image with Google Vision API
            try {

              const [fileBuffer] = await bucket.file(filePath).download();  // ✅ Download from cloud
              const base64Image = fileBuffer.toString('base64');
              
              // Respond with both base64 image and the URL
              res.json({ base64Image, imageUrl });
                } 
            catch (err) {
              console.error('Error during file processing:', err);
              res.status(500).json({ error: 'File processing failed', message: err.message });
            } 
    });

    fileUpload.on('error', (err) => {
      console.error('Error during file upload:', err);
      res.status(500).json({ error: 'File upload failed', message: err.message });
    });
  });

  req.pipe(busboy);
});


// Vision API detection
app.post('/api/detect-vision', async (req, res) => {
    try {
      
        const { base64Image } = req.body;
  
        if (!base64Image) {
          return res.status(400).json({ error: 'Base64 image is required' });
        }
        
        // Prepare the request payload for Google Vision API
        const requestPayload = {
            requests: [
                {
                    image: { content: base64Image },
                    features: [
                        {
                            type: 'OBJECT_LOCALIZATION',
                            maxResults: 10,
                        },
                    ],
                },
            ],
        };
        
        // Get the OAuth2 access token dynamically
        const accessToken = await getAccessToken();
        
        // Call the Vision API using Axios
        const visionAPIUrl = 'https://vision.googleapis.com/v1/images:annotate';
        const response = await axios.post(visionAPIUrl, requestPayload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        
        // Print the full response JSON in the terminal
        //console.log('Full JSON response from Vision API:', JSON.stringify(response.data, null, 2));
        
        // Process and send back the detected objects
        const objects = response.data.responses[0].localizedObjectAnnotations.map(obj => ({
            name: obj.name,
            score: obj.score,
            boundingPoly: obj.boundingPoly.normalizedVertices,
        }));
        
        //fs.unlinkSync(filePath); // Clean up the uploaded file
        res.json(objects); // Send the result back to the client
    } catch (err) {
        console.error('Error during image processing:', err);
        res.status(500).json({ error: 'Detection failed', message: err.message });
    }
});


// Vertex AI detection (AutoML Image Object Detection focus)

const projectId = process.env.VERTEX_PROJECT_ID;
const endpointId = process.env.VERTEX_ENDPOINT_ID;
const location = process.env.VERTEX_LOCATION || 'us-central1';

const confidenceThreshold = 0.5;
const maxPredictions = 10;

app.post('/api/detect-vertex',  async (req, res) => {
    //let filePath = null;
    try {
        const { base64Image } = req.body;
  
        if (!base64Image) {
          return res.status(400).json({ error: 'Base64 image is required' });
        }
        
        const restApiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/endpoints/${endpointId}:predict`;
        
        const requestPayload = {
            instances: [
                {
                    content: base64Image,
                }
            ],
            parameters: {
                confidenceThreshold: confidenceThreshold,
                maxPredictions: maxPredictions,
            }
        };
        
        console.log('Vertex AI (REST): API URL:', restApiUrl);
        
        // Get access token
        const accessToken = await getAccessToken();
        
        console.log('Vertex AI (REST): Making prediction request via Axios...');
        
        const response = await axios.post(restApiUrl, requestPayload, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        
        console.log('Vertex AI (REST): Raw Prediction response status:', response.status);
        console.log('Vertex AI (REST): Raw Prediction response data:', JSON.stringify(response.data, null, 2));
        
        if (!response.data || !response.data.predictions || !Array.isArray(response.data.predictions)) {
            console.log('Vertex AI (REST): No predictions array found in the response data.');
            // if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.json([]);
        }
        
        const objects = response.data.predictions.map(predictionFields => {
            if (!predictionFields || typeof predictionFields !== 'object') {
                console.warn('Vertex AI (REST): Skipping prediction with unexpected structure:', predictionFields);
                return null;
            }
            
            const displayNames = predictionFields.displayNames || [];
            const confidences = predictionFields.confidences || [];
            const bboxes = predictionFields.bboxes || []; // Array of [xmin, xmax, ymin, ymax] arrays
            
            if (displayNames.length !== confidences.length || displayNames.length !== bboxes.length) {
                console.warn("Vertex AI (REST): Prediction array length mismatch", {
                    names: displayNames.length, scores: confidences.length, boxes: bboxes.length,
                    prediction: predictionFields
                });
                return [];
            }
            
            return displayNames.map((name, idx) => {
                const bbox = bboxes[idx];
                if (!Array.isArray(bbox) || bbox.length < 4 || bbox.some(isNaN)) {
                    console.warn(`Vertex AI (REST): Invalid bbox data for prediction ${idx}:`, bbox);
                    return null;
                }
                const normalizedVertices = [
                    { x: bbox[0], y: bbox[2] }, { x: bbox[1], y: bbox[2] },
                    { x: bbox[1], y: bbox[3] }, { x: bbox[0], y: bbox[3] },
                ];
                return { name: name, score: confidences[idx], boundingPoly: normalizedVertices };
            });
        }).flat().filter(obj => obj !== null);
        
        // Clean up
        // if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        console.log(`Vertex AI (REST): Successfully processed, found ${objects.length} objects.`);
        res.json(objects);
        
    } catch (err) {
        console.error('❌ Error during Vertex AI (REST) detection:');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Headers:', JSON.stringify(err.response.headers, null, 2));
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
            const errData = err.response.data?.error || {};
            res.status(err.response.status || 500).json({
                error: 'Vertex AI REST detection failed',
                message: errData.message || err.message,
                code: errData.code,
                details: errData.details || 'No details provided in REST error',
            });
        } else {
            console.error('Error Message:', err.message);
            console.error('Full Error:', err);
            res.status(500).json({
                error: 'Vertex AI REST detection failed',
                message: err.message,
                code: err.code,
                details: 'Error occurred before receiving a response'
            });
        }
        
        // if (filePath && fs.existsSync(filePath)) {
        //     try { fs.unlinkSync(filePath); } catch (e) { console.error("Error deleting file on error:", e); }
        // }
    }
});


// Gemini API - Multimodal Image + Prompt
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/detect-gemini',  async (req, res) => {

  try {
    const { base64Image } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: 'Base64 image is required.' });
    }
    const imageData = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg',
      },
    };
    

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `List all objects in this image. For each object, include:
- Label (e.g., "person")
- Confidence score
- Normalized bounding box in the format [xmin, xmax, ymin, ymax]

Respond with JSON in the following structure:
{
  "predictions": [
    {
      "confidences": [ ... ],
      "displayNames": [ ... ],
      "bboxes": [ [xmin, xmax, ymin, ymax], ... ]
    }
  ]
}`;

    let result;
    try {
      result = await model.generateContent([{ text: prompt }, imageData]);
    } catch (genErr) {
      console.error("Error during generateContent:", genErr.response?.data || genErr.message || genErr);
      throw new Error("Gemini generateContent failed");
    }

    let responseText;
    try {
      responseText = result.response.text();
      console.log("Raw Gemini response text:", responseText);
    } catch (parseErr) {
      console.error("Error extracting response text:", parseErr.message);
      throw new Error("Failed to extract text from Gemini response");
    }

    let jsonMatch;
    try {
      jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
    } catch (jsonErr) {
      console.error("Regex match failed:", jsonErr.message);
      throw new Error("Failed to parse JSON block from response");
    }

    // Flatten Gemini response to match expected object format
    const predictions = JSON.parse(jsonMatch[0]).predictions || [];

    const objects = predictions.flatMap(prediction => {
      const displayNames = prediction.displayNames || [];
      const confidences = prediction.confidences || [];
      const bboxes = prediction.bboxes || [];

      if (
        displayNames.length !== confidences.length ||
        displayNames.length !== bboxes.length
      ) {
        console.warn('Gemini: Prediction array length mismatch:', { displayNames, confidences, bboxes });
        return [];
      }

      return displayNames.map((name, idx) => {
        const bbox = bboxes[idx];
        const normalizedVertices = [
          { x: bbox[0], y: bbox[2] },
          { x: bbox[1], y: bbox[2] },
          { x: bbox[1], y: bbox[3] },
          { x: bbox[0], y: bbox[3] },
        ];
        return {
          name,
          score: confidences[idx],
          boundingPoly: normalizedVertices,
        };
      });
    });

    res.json(objects);

  } catch (err) {
    console.error('Gemini detection error:', err.message);
    res.status(500).json({ error: 'Gemini detection failed', message: err.message });
  } 
});



// if (require.main === module) {
//     const PORT = process.env.PORT || 3001;
//     app.listen(PORT, () => {
//         console.log(`Server listening on port ${PORT}`);
//     });
// }

// Serve React build folder
app.use(express.static(path.join(__dirname, 'build')));

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});