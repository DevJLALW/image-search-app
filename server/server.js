// server.js

require('dotenv').config(); // Load environment variables from .env file

const axios = require('axios');
const fs = require('fs');
const multer = require('multer');
const express = require('express');
const { google } = require('googleapis'); // For OAuth2 and token generation
const app = express();

// Upload setup
const upload = multer({ dest: 'uploads/' });

// Function to encode image to base64
function encodeImageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

// Function to get the Google API OAuth2 token
async function getAccessToken() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,  // Path to your service account key
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const authClient = await auth.getClient();
  const accessToken = await authClient.getAccessToken();
  return accessToken.token;
}

// POST endpoint for image detection
app.post('/api/detect', upload.single('image'), async (req, res) => {
  try {
    const filePath = req.file.path;
    console.log('File uploaded:', filePath);

    // Encode image to base64
    const base64Image = encodeImageToBase64(filePath);

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

    fs.unlinkSync(filePath); // Clean up the uploaded file
    res.json(objects); // Send the result back to the client
  } catch (err) {
    console.error('Error during image processing:', err);
    res.status(500).json({ error: 'Detection failed', message: err.message });
  }
});

// Export the app object so it can be used in other files
module.exports = app;