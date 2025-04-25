import React, { useState } from 'react';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [objects, setObjects] = useState([]);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return;
  
    const formData = new FormData();
    formData.append('image', image);
  
    try {
      const res = await fetch('/api/detect', {
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
      alert('An error occurred while processing the image. Check the console for more details.');
    }
  };  

  return (
    <div className="App">
      <h1>Object Detection</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        <button type="submit">Analyze</button>
      </form>

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