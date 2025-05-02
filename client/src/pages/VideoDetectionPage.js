import React, { useState } from 'react';
import axios from 'axios';

const VideoDetectionPage = () => {
  const [video, setVideo] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleVideoChange = (e) => {
    setVideo(e.target.files[0]);
    setResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!video) return alert('Please select a video file.');

    const formData = new FormData();
    formData.append('video', video);

    try {
      setLoading(true);
      const res = await axios.post('/api/detect-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResults(res.data);
    } catch (err) {
      alert('Error analyzing video');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2>Video Object Detection</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="video/*" onChange={handleVideoChange} />
        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Detect Video Objects'}
        </button>
      </form>

      {results.length > 0 && (
        <div>
          <h3>Detected Labels:</h3>
          <ul>
            {results.map((item, index) => (
              <li key={index}>
                <strong>{item.description}</strong> - Categories: {item.categoryDescriptions.join(', ')}
                <ul>
                  {item.segments.map((seg, i) => (
                    <li key={i}>
                      From {seg.startTime}s to {seg.endTime}s (Confidence: {seg.confidence.toFixed(2)})
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VideoDetectionPage;
