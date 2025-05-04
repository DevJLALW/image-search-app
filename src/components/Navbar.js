import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';  

function Navbar() {
  return (
    <nav className="navbar">
      <ul>
        <li>
          <Link to="/" className="nav-link">Object Detection</Link>
        </li>
        <li>
          <Link to="/image-search" className="nav-link">Image Search Engine</Link>
        </li>
        <li>
           <Link to="/video-detection" className="nav-link">Video Detection</Link>
         </li>
      </ul>
    </nav>
  );
}

export default Navbar;
