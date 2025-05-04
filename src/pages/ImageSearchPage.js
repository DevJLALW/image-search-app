import React, { useState } from 'react';
import axios from 'axios';

function ImageSearchPage() {
  const [tag, setTag] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!tag.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/images-by-tag/${encodeURIComponent(tag.trim())}`);
      setImages(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch images.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ImageSearchPage">
      <h2>Image Search by Tag</h2>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="Enter tag..."
          style={{ padding: '8px', width: '200px' }}
        />
        <button onClick={handleSearch} style={{ marginLeft: '1rem' }}>
          Search
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="results-container">
        {images.map((img, idx) => (
          <div className="result-box" key={idx}>
            <img src={`data:${img.mimeType};base64,${img.base64}`} alt="Search result" style={{
              maxWidth: '100%',
              maxHeight: '300px',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto',
              borderRadius: '8px',
            }} />
            <ul>
              {img.tags?.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageSearchPage;
