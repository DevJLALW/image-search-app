import React, { useState } from 'react';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [objects, setObjects] = useState([]);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e, apiRoute) => {
    e.preventDefault();
    if (!image) return;

    const formData = new FormData();
    formData.append('image', image);

    try {
      const res = await fetch(apiRoute, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setObjects(data);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while processing the image.');
    }
  };

  return (
    <div className="App">
      <h1>Object Detection</h1>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      <br />
      <button onClick={(e) => handleSubmit(e, '/api/detect-vision')}>Analyze with Vision API</button>
      <button onClick={(e) => handleSubmit(e, '/api/detect-vertex')}>Analyze with Vertex AI</button>
      <button onClick={(e) => handleSubmit(e, '/api/detect-gemini')}>Analyze with Gemini API</button>

      {objects.length > 0 && (
        <div>
          <h2>Detected Objects:</h2>
          <ul>
            {objects.map((obj, idx) => (
              <li key={idx}>
                {obj.name} — {(obj.score * 100).toFixed(2)}%
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
