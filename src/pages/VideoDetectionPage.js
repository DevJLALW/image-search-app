import React, { useState } from 'react';
 import axios from 'axios';
 
 const VideoDetectionPage = () => {
   const [video, setVideo] = useState(null);
   const [results, setResults] = useState([]);
   const [loading, setLoading] = useState(false);
   const [videoPreview, setVideoPreview] = useState(null);
 
   const handleVideoChange = (e) => {
    const file = e.target.files[0];
    setVideo(file);
    setResults([]);
    setVideoPreview(file ? URL.createObjectURL(file) : null);
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

       {videoPreview && (
         <div className="my-4">
           <h4>Video Preview:</h4>
           <video src={videoPreview} controls width="400" />
         </div>
       )}

       {results.length > 0 && (
         <div style={{ marginTop: '2rem' }}>
           <h3>Detected Objects</h3>
           <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
             <thead>
               <tr style={{ backgroundColor: '#f2f2f2' }}>
                 <th style={{ border: '1px solid #ccc', padding: '8px' }}>Object</th>
                 <th style={{ border: '1px solid #ccc', padding: '8px' }}>Category</th>
                 <th style={{ border: '1px solid #ccc', padding: '8px' }}>Timestamp</th>
                 <th style={{ border: '1px solid #ccc', padding: '8px' }}>Confidence</th>
               </tr>
             </thead>
             <tbody>
               {results.map((item, index) =>
                 item.segments.map((seg, i) => (
                   <tr key={`${index}-${i}`}>
                     <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.description}</td>
                     <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.categoryDescriptions.join(', ')}</td>
                     <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                       {seg.startTime}s – {seg.endTime}s
                     </td>
                     <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                       {seg.confidence.toFixed(2)}
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
         </div>
       )}
     </div>
   );
 };
 
 export default VideoDetectionPage;