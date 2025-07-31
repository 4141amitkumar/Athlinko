import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';
import logo from '../assets/logo/logo.png';

function NavBar({ darkMode, setDarkMode, user, setUser }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleLogout = () => {
    setUser(null);
    setShowDropdown(false);
    localStorage.removeItem('athlinkoUser'); // ✅ ensure session clear
  };

  const handleSearch = () => {
    if (searchQuery.trim() !== '') {
      console.log('Searching for:', searchQuery);
      // Future: Navigate to search results page
    }
  };

  return (
    <nav className={`navbar ${darkMode ? 'dark' : ''}`}>
      <div className="navbar-container">
        {/* Left: Logo */}
        <div className="navbar-logo">
          <img src={logo} alt="Athlinko Logo" className="logo-img" />
        </div>

        {/* Center: Navigation Links */}
        <div className="navbar-links">
          <Link className="navbar-item" to="/">Home</Link>
          {!user && (
            <>
              <Link className="navbar-item" to="/login">Login</Link>
              <Link className="navbar-item" to="/register">Register</Link>
            </>
          )}
        </div>

        {/* Right: Search + Dark Mode + Profile */}
        <div className="navbar-actions">
          {user && (
            <div className="search-container">
              <div className="search-box">
                <span className="search-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 2a8 8 0 105.293 14.293l5.707 5.707 1.414-1.414-5.707-5.707A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search athletes, coaches, clubs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
          )}

          {/* Dark Mode Toggle */}
          <label className="switch">
            <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
            <span className="slider"></span>
          </label>

          {/* Profile Dropdown */}
          {user && (
            <div className="profile-container" tabIndex={0}>
              <img
                src={user.picture}
                alt="Profile"
                className="profile-pic"
                onClick={() => setShowDropdown(!showDropdown)}
              />
              {showDropdown && (
                <div className="profile-dropdown">
                  <div className="profile-header">
                    <img src={user.picture} alt="User" className="dropdown-pic" />
                    <div>
                      <p className="profile-name">{user.name}</p>
                      <p className="profile-email">{user.email}</p>
                    </div>
                  </div>
                  <hr />
                  <button onClick={handleLogout} className="logout-btn">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="logout-icon"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
