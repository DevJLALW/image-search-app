import React, { useState } from 'react';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [results, setResults] = useState({
    vision: [],
    vertex: [],
    gemini: []
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreviewURL(URL.createObjectURL(file));
      setResults({ vision: [], vertex: [], gemini: [] }); // Clear previous results
    }
  };

  const analyzeAll = async () => {
    if (!image) {
      alert("Please select an image first.");
      return;
    }

    const apiRoutes = {
      vision: '/api/detect-vision',
      vertex: '/api/detect-vertex',
      gemini: '/api/detect-gemini',
    };

    const fetchResults = async (route) => {
      const fd = new FormData();
      fd.append('image', image);
      try {
        const res = await fetch(route, {
          method: 'POST',
          body: fd,
        });
        if (!res.ok) throw new Error(`Error from ${route}`);
        return await res.json();
      } catch (err) {
        console.error(`Error from ${route}:`, err);
        return [{ name: "Error", score: 0, error: true }];
      }
    };

    const [visionRes, vertexRes, geminiRes] = await Promise.all([
      fetchResults(apiRoutes.vision),
      fetchResults(apiRoutes.vertex),
      fetchResults(apiRoutes.gemini),
    ]);

    setResults({
      vision: visionRes,
      vertex: vertexRes,
      gemini: geminiRes.predictions || geminiRes,
    });
  };

  const renderResultList = (title, objects) => (
    <div className="result-box">
      <h2>{title}</h2>
      {objects.length === 0 ? (
        <p>No results</p>
      ) : (
        <ul>
          {objects.map((obj, idx) => (
            <li key={idx}>
              {obj.name || obj.displayNames?.[0] || 'Unknown'} —{" "}
              {((obj.score || obj.confidences?.[0] || 0) * 100).toFixed(2)}%
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="App">
      <h1>Object Detection Comparison</h1>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      <br />
      {previewURL && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Image Preview:</h3>
          <img
            src={previewURL}
            alt="Preview"
            style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
          />
        </div>
      )}
      <button onClick={analyzeAll}>Analyze</button>

      <div className="results-container">
        {renderResultList('Vision API', results.vision)}
        {renderResultList('Vertex AI', results.vertex)}
        {renderResultList('Gemini API', results.gemini)}
      </div>
    </div>
  );
}

export default App;
