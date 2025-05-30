import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import ObjectDetectionPage from './pages/ObjectDetectionPage';
import ImageSearchPage from './pages/ImageSearchPage';
import VideoDetectionPage from './pages/VideoDetectionPage'; 
import Navbar from './components/Navbar';  // Import the Navbar


function App() {
  return (
    <Router>
      <div className="App">
        <Navbar /> {/* Add the Navbar at the top */}
        <Routes>
          <Route path="/" element={<ObjectDetectionPage />} />
          <Route path="/image-search" element={<ImageSearchPage />} />
          <Route path="/video-detection" element={<VideoDetectionPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
