import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';

const MODEL_TABS = [
  'vision', 
  'vertex', 
  'gemini'];

function ObjectDetectionPage() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [imageURL, setimageURL] = useState(null);
  const [results, setResults] = useState({});
  const [selectedModel, setSelectedModel] = useState('vision');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResults({});
    setBase64Image(null);

    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const uploadRes = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (uploadRes.data?.base64Image) {
        setBase64Image(uploadRes.data.base64Image);
        setimageURL(uploadRes.data.imageUrl); 
      } else {
        alert('Image upload failed or base64 data missing.');
      }
    } catch (err) {
      console.error('Upload Error:', err);
      alert('Error uploading image.');
    } finally {
      setUploading(false);
    }
  };

  const handleCompare = async () => {
    if (!base64Image) return;
    setLoading(true);

    const endpoints = {
      vision: '/api/detect-vision',
      vertex: '/api/detect-vertex',
      gemini: '/api/detect-gemini',
    };

    try {
      const newResults = {};
      for (const model of MODEL_TABS) {
        const response = await axios.post(
          endpoints[model],
          { base64Image },
          { headers: { 'Content-Type': 'application/json' } }
        );
        newResults[model] = response.data;
      }

      await axios.post('/api/save-to-firestore', {
        imageUrl: imageURL,
        results: newResults,
      });

      setResults(newResults);
    } catch (err) {
      console.error('Detection Error:', err);
      alert('Error during detection.');
    } finally {
      setLoading(false);
    }
  };

  const renderBoxes = (objects) => {
    if (!objects || !preview) return null;

    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img src={preview} alt="Uploaded" style={{ maxWidth: '100%' }} />
        {objects.map((obj, idx) => {
          const x = obj.boundingPoly[0].x * 100;
          const y = obj.boundingPoly[0].y * 100;
          const width = (obj.boundingPoly[1].x - obj.boundingPoly[0].x) * 100;
          const height = (obj.boundingPoly[2].y - obj.boundingPoly[0].y) * 100;

          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: `${width}%`,
                height: `${height}%`,
                border: '2px solid red',
                color: 'red',
                fontSize: '12px',
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
              }}
            >
              {obj.name} ({(obj.score * 100).toFixed(1)}%)
            </div>
          );
        })}
      </div>
    );
  };

  const renderBoundingBoxes = (objects) => {
    return objects.map((obj, idx) => {
      const x = obj.boundingPoly[0].x * 100;
      const y = obj.boundingPoly[0].y * 100;
      const width = (obj.boundingPoly[1].x - obj.boundingPoly[0].x) * 100;
      const height = (obj.boundingPoly[2].y - obj.boundingPoly[0].y) * 100;

      return (
        <div
          key={idx}
          className="bounding-box"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: `${width}%`,
            height: `${height}%`,
          }}
        >
          <div className="label">
            {obj.name} ({(obj.score * 100).toFixed(1)}%)
          </div>
        </div>
      );
    });
  };

  return (
    <div className="ObjectDetectionPage">
      <h2>Image Object Detection App</h2>
      <div style={{ marginBottom: '1rem' }}>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        <button onClick={handleCompare} disabled={!base64Image || loading || uploading} style={{ marginLeft: '1rem' }}>
          {loading ? 'Processing...' : uploading ? 'Uploading...' : 'Compare'}
        </button>
      </div>

      {preview && (
        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <h4>Uploaded Image</h4>
          <img src={preview} alt="Preview" style={{ maxHeight: '300px' }} />
        </div>
      )}

      {Object.keys(results).length > 0 && (
        <div className="results-container">
          {MODEL_TABS.map((model) => {
            const objects = results[model];
            return (
              <div key={model} className="result-box">
                <h3>{model.charAt(0).toUpperCase() + model.slice(1)}</h3>
                <div className="image-container">
                  <img src={preview} alt={`Detected - ${model}`} className="overlay-image" />
                  {objects && renderBoundingBoxes(objects)}
                </div>
                {objects && objects.length > 0 && (
                  <div style={{ marginTop: '1rem', textAlign: 'left' }}>
                    <h4>Detected Objects:</h4>
                    <ul>
                      {objects.map((obj, idx) => (
                        <li key={idx}>
                          <strong>{obj.name}</strong> – Confidence: {(obj.score * 100).toFixed(1)}%
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ObjectDetectionPage;
