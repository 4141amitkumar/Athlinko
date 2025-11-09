import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, LogOut, User as UserIcon, Bell, Trophy, Users, MessageSquare, HelpCircle, Home, UserPlus, Search, Star } from 'lucide-react';
import { auth, db } from '../firebase'; // Import auth
import { collection, query, where, onSnapshot, getDocs, orderBy, doc, updateDoc, serverTimestamp, writeBatch, arrayUnion } from 'firebase/firestore';
import RequestsDropdown from './RequestsDropdown';
import './NavBar.css';

// Pass setUser prop for logout functionality
const NavBar = ({ darkMode, setDarkMode, user, setUser }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const requestsRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setShowNotifications(false);
      if (requestsRef.current && !requestsRef.current.contains(event.target)) setShowRequests(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Add check for user and user.uid before running queries
    if (!user?.uid) {
      setNotifications([]);
      setConnectionRequests([]);
      setUnreadMessagesCount(0);
      return; // Exit early if user or user.uid is not available
    }

    // Fetch active tournaments
    const fetchActiveTournaments = async () => {
      try {
        const now = new Date();
        const q = query(collection(db, "tournaments"), where("endDate", ">=", now), orderBy("endDate", "asc"));
        const querySnapshot = await getDocs(q);
        setNotifications(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) { console.error("Error fetching tournaments:", error); }
    };

    // Listen for incoming connection requests - Use user.uid
    const requestsQuery = query(collection(db, 'requests'), where('receiverId', '==', user.uid), where('status', '==', 'pending'));
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      setConnectionRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
        console.error("Error fetching connection requests:", error); // Add error handling
    });

    // Listen for unread messages - Use user.uid
    const convosQuery = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid));
    const unsubscribeConversations = onSnapshot(convosQuery, (snapshot) => {
      let unreadCount = 0;
      snapshot.forEach(doc => {
        const convo = doc.data();
        // Ensure participantInfo and user.uid exist before accessing
        const lastRead = convo.participantInfo?.[user.uid]?.lastRead?.toDate();
        const lastMessageTime = convo.lastMessageTimestamp?.toDate();
        // Check if lastMessage exists and potentially modify logic if needed
        if (lastRead && lastMessageTime && lastMessageTime > lastRead) {
          unreadCount++;
        } else if (!lastRead && convo.lastMessage) { // This condition might need adjustment based on data structure
          unreadCount++;
        }
      });
      setUnreadMessagesCount(unreadCount);
    }, (error) => {
        console.error("Error fetching conversations:", error); // Add error handling
    });

    fetchActiveTournaments();

    return () => {
      unsubscribeRequests();
      unsubscribeConversations();
    };
  }, [user]); // Depend on the whole user object

  const handleLogout = () => {
    auth.signOut() // Use Firebase auth signOut
      .then(() => {
        setUser(null); // Update local state via prop from App.js
        setShowDropdown(false);
        // No need for localStorage removal if using onAuthStateChanged
        navigate('/');
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      });
  };

  const handleViewProfile = () => {
      // Use user.uid
      if (user?.uid) {
          navigate(`/profile/${user.uid}`);
          setShowDropdown(false);
      }
  };

  const handleAcceptRequest = async (request) => {
      // Ensure user.uid is available
      if (!user?.uid) return;
      const batch = writeBatch(db);
      const requestRef = doc(db, 'requests', request.id);
      batch.update(requestRef, { status: 'accepted', updatedAt: serverTimestamp() });
      const currentUserRef = doc(db, 'users', request.receiverId); // receiverId should be the current user's uid
      batch.update(currentUserRef, { connections: arrayUnion(request.senderId) });
      const senderUserRef = doc(db, 'users', request.senderId);
      batch.update(senderUserRef, { connections: arrayUnion(request.receiverId) }); // Use receiverId
      try {
          await batch.commit();
          // Optional: Update local state immediately if needed, though listener should catch it
      } catch (error) { console.error("Error accepting request:", error); }
  };

  const handleRejectRequest = async (requestId) => {
      const requestRef = doc(db, 'requests', requestId);
      try {
          await updateDoc(requestRef, { status: 'rejected', updatedAt: serverTimestamp() });
          // Optional: Update local state immediately if needed, though listener should catch it
      } catch (error) { console.error("Error rejecting request:", error); }
  };

  return (
    <nav className={`navbar ${darkMode ? 'dark' : ''}`}>
      <div className="navbar-container">
        <Link to={user ? "/feed" : "/"} className="navbar-logo">Athlinko</Link>

        {user && (
          <div className="navbar-menu">
            {/* Navigation Links remain the same */}
            <Link to="/feed" className={`nav-item ${location.pathname === '/feed' ? 'active' : ''}`}><Home size={18}/><span>Feed</span></Link>
            <Link to="/search" className={`nav-item ${location.pathname.startsWith('/search') ? 'active' : ''}`}><Search size={18}/><span>Search</span></Link>
            <Link to="/groups" className={`nav-item ${location.pathname.startsWith('/groups') ? 'active' : ''}`}><Users size={18}/><span>Communities</span></Link>
            <Link to="/tournaments" className={`nav-item ${location.pathname.startsWith('/tournaments') ? 'active' : ''}`}>
              <Trophy size={18} /><span>Tournaments</span>
            </Link>
            <Link to="/qna" className={`nav-item ${location.pathname.startsWith('/qna') ? 'active' : ''}`}>
              <HelpCircle size={18} /><span>Ask an Expert</span>
            </Link>
          </div>
        )}

        <div className="navbar-actions">
          <button onClick={() => setDarkMode(!darkMode)} className="action-btn theme-toggle">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user ? (
            <>
              <Link to="/messages" className="action-btn notification-bell">
                <MessageSquare size={22} />
                {unreadMessagesCount > 0 && <span className="notification-badge">{unreadMessagesCount}</span>}
              </Link>
              <div className="notification-container" ref={requestsRef}>
                <button className="action-btn notification-bell" onClick={() => setShowRequests(!showRequests)}>
                  <UserPlus size={22} />
                  {connectionRequests.length > 0 && <span className="notification-badge">{connectionRequests.length}</span>}
                </button>
                 {/* Pass user.uid to RequestsDropdown if needed, though actions are handled here */}
                {showRequests && <RequestsDropdown requests={connectionRequests} onAccept={handleAcceptRequest} onReject={handleRejectRequest} />}
              </div>

              {/* Notifications dropdown remains the same */}
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
                      )) : (<div className="notification-item empty"><span>No active tournaments.</span></div>)}
                    </div>
                    <Link to="/tournaments" className="notification-footer" onClick={() => setShowNotifications(false)}>View All Tournaments</Link>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="profile-container" ref={dropdownRef}>
                <img src={user.picture} alt="Profile" className="profile-pic" onClick={() => setShowDropdown(!showDropdown)} />
                {showDropdown && (
                  <div className="profile-dropdown">
                    <div className="profile-header">
                      <img src={user.picture} alt="User" className="dropdown-pic" />
                      <div className="profile-info">
                        <p className="profile-name">{user.name}</p>
                        {/* Ensure user.role exists */}
                        <p className="profile-role">{user.role}</p>
                      </div>
                    </div>
                    <div className="dropdown-actions">
                      <button onClick={handleViewProfile} className="dropdown-btn"><UserIcon size={16} /><span>My Profile</span></button>
                      {user.role === 'coach' && (
                        <button onClick={() => {navigate('/wishlist'); setShowDropdown(false);}} className="dropdown-btn">
                          <Star size={16} /><span>My Wishlist</span>
                        </button>
                      )}
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
