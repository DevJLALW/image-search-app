const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const app = express();
const upload = multer({ dest: 'uploads/' });
const secretClient = new SecretManagerServiceClient();



let client; // Vision API client

async function initializeVisionClient() {
  const secretName = process.env.GOOGLE_APPLICATION_CREDENTIALS_SECRET;

  if (secretName) {
    // Running on App Engine — fetch from Secret Manager
    const secretClient = new SecretManagerServiceClient();
    const [version] = await secretClient.accessSecretVersion({ name: secretName });
    const credentials = JSON.parse(version.payload.data.toString('utf8'));

    client = new ImageAnnotatorClient({ credentials });
    console.log('✅ Vision client initialized with Secret Manager');
  } else {
    // Running locally — use keyFilename
    client = new ImageAnnotatorClient({
      keyFilename: 'C:\\Users\\Jyoti_Len\\Documents\\Notes\\ACS\\cloudvisionapi-456009-91e71bc3fea8.json',
    });
    console.log('✅ Vision client initialized with local key file');
  }
}

app.use(cors());

// POST endpoint for image detection
app.post('/api/detect', upload.single('image'), async (req, res) => {
    try {

      if (!client) await initializeVisionClient();
      
      const filePath = req.file.path;
      console.log('File uploaded:', filePath);
  
      const content = fs.readFileSync(filePath);
  
      const [result] = await client.objectLocalization({
        image: { content },
      });
  
      console.log('Google Vision API result:', result);
  
      const objects = result.localizedObjectAnnotations.map(obj => ({
        name: obj.name,
        score: obj.score,
        boundingPoly: obj.boundingPoly.normalizedVertices,
      }));
  
      fs.unlinkSync(filePath); // Clean up
      res.json(objects);
    } catch (err) {
      console.error('Detection error:', err);
      res.status(500).json({ error: 'Detection failed', message: err.message });
    }
  });  

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

module.exports = app;