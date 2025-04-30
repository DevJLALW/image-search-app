import React, { useState } from 'react';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [results, setResults] = useState({
    vision: [],
    vertex: [],
    gemini: []
  });

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
    setResults({ vision: [], vertex: [], gemini: [] }); // Clear previous results
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

    const formData = new FormData();
    formData.append('image', image);

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
              {obj.name || obj.displayNames?.[idx] || 'Unknown'} —{" "}
              {((obj.score || obj.confidences?.[idx] || 0) * 100).toFixed(2)}%
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
