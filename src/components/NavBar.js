import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, LogOut, User as UserIcon, Bell, Trophy } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import './NavBar.css';

const NavBar = ({ darkMode, setDarkMode, user, setUser }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Effect to close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Effect to fetch active tournaments for the notification bell
  useEffect(() => {
    const fetchActiveTournaments = async () => {
      if (!user) return;
      try {
        const now = new Date();
        const q = query(
          collection(db, "tournaments"), 
          where("endDate", ">=", now),
          orderBy("endDate", "asc")
        );
        const querySnapshot = await getDocs(q);
        setNotifications(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching tournaments:", error);
      }
    };
    fetchActiveTournaments();
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    setShowDropdown(false);
    localStorage.removeItem('athlinkoUser');
    navigate('/');
  };

  const handleViewProfile = () => {
    if (user && user.sub) {
      navigate(`/profile/${user.sub}`);
      setShowDropdown(false);
    }
  };

  return (
    <nav className={`navbar ${darkMode ? 'dark' : ''}`}>
      <div className="navbar-container">
        <Link to={user ? "/feed" : "/"} className="navbar-logo">Athlinko</Link>
        
        {user && (
          <div className="navbar-menu">
            <Link to="/feed" className={`nav-item ${location.pathname === '/feed' ? 'active' : ''}`}>Feed</Link>
            <Link to="/search" className={`nav-item ${location.pathname.startsWith('/search') ? 'active' : ''}`}>Search</Link>
            <Link to="/tournaments" className={`nav-item ${location.pathname.startsWith('/tournaments') ? 'active' : ''}`}>
              <Trophy size={18} />
              <span>Tournaments</span>
            </Link>
          </div>
        )}

        <div className="navbar-actions">
          <button onClick={() => setDarkMode(!darkMode)} className="action-btn theme-toggle">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user ? (
            <>
              <div className="notification-container" ref={notificationRef}>
                <button className="action-btn notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
                  <Bell size={22} />
                  {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
                </button>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-header"><h3>Active Tournaments</h3></div>
                    <div className="notification-list">
                      {notifications.length > 0 ? notifications.map(tourney => (
                        <Link to="/tournaments" key={tourney.id} className="notification-item" onClick={() => setShowNotifications(false)}>
                          <span className='notification-title'>{tourney.name}</span>
                          <span className='notification-details'>{tourney.location}</span>
                        </Link>
                      )) : (
                        <div className="notification-item empty"><span>No active tournaments.</span></div>
                      )}
                    </div>
                    <Link to="/tournaments" className="notification-footer" onClick={() => setShowNotifications(false)}>View All Tournaments</Link>
                  </div>
                )}
              </div>

              <div className="profile-container" ref={dropdownRef}>
                <img src={user.picture} alt="Profile" className="profile-pic" onClick={() => setShowDropdown(!showDropdown)} />
                {showDropdown && (
                  <div className="profile-dropdown">
                    <div className="profile-header">
                      <img src={user.picture} alt="User" className="dropdown-pic" />
                      <div className="profile-info">
                        <p className="profile-name">{user.name}</p>
                        <p className="profile-role">{user.role}</p>
                      </div>
                    </div>
                    <div className="dropdown-actions">
                      <button onClick={handleViewProfile} className="dropdown-btn"><UserIcon size={16} /><span>My Profile</span></button>
                      <hr className="dropdown-divider" />
                      <button onClick={handleLogout} className="dropdown-btn logout-btn"><LogOut size={16} /><span>Sign Out</span></button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="nav-item">Login</Link>
              <Link to="/register" className="nav-item register-btn">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;

