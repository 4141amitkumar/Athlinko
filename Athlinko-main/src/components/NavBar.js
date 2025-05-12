import React from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';
import logo from '../assets/logo/logo.png';

function NavBar({ darkMode, setDarkMode }) {
  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <nav className={`navbar ${darkMode ? 'dark' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-logo">
          <img src={logo} alt="Athlinko Logo" className="logo-img" />
        </div>

        <div className="navbar-links">
          <Link className="navbar-item" to="/">Home</Link>
          <Link className="navbar-item" to="/login">Login</Link>
          <Link className="navbar-item" to="/register">Register</Link>
        </div>

        <div className="navbar-actions">
          <label className="switch">
            <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
