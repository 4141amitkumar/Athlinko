import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, LogOut, User as UserIcon, Bell, Trophy, Users, MessageSquare, HelpCircle, Home, UserPlus, Search, Star } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs, orderBy, doc, updateDoc, serverTimestamp, writeBatch, arrayUnion, limit } from 'firebase/firestore';
import RequestsDropdown from './RequestsDropdown';
import { createNotification } from '../utils/notifications'; // Import the new helper
import './NavBar.css';

// Timestamp format karne ke liye helper
const formatTimeAgo = (timestamp) => {
    if (!timestamp?.toDate) return 'Just now';
    try {
        const now = new Date();
        const date = timestamp.toDate();
        const seconds = Math.floor((now - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    } catch (e) {
        return 'Just now';
    }
};

const NavBar = ({ darkMode, setDarkMode, user, setUser }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  
  // Real notifications ke liye naya state
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

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
    if (!user?.uid) {
      setNotifications([]);
      setConnectionRequests([]);
      setUnreadMessagesCount(0);
      setUnreadNotifsCount(0); // Reset count
      return; 
    }

    // --- Naya Notification Listener ---
    // User ke 'notifications' subcollection ko sunein
    const notifsQuery = query(
        collection(db, 'users', user.uid, 'notifications'), 
        orderBy('timestamp', 'desc'), 
        limit(20) // Sirf latest 20 dikhayein
    );
    const unsubscribeNotifs = onSnapshot(notifsQuery, (snapshot) => {
        const notifsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(notifsData);
        // Unread count calculate karein
        const unreadCount = notifsData.filter(n => !n.isRead).length;
        setUnreadNotifsCount(unreadCount);
    }, (error) => {
        console.error("Error fetching notifications:", error);
    });

    // --- Connection Requests Listener (Pehle jaisa) ---
    const requestsQuery = query(collection(db, 'requests'), where('receiverId', '==', user.uid), where('status', '==', 'pending'));
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      setConnectionRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
        console.error("Error fetching connection requests:", error); // Add error handling
    });

    // --- Unread Messages Listener (Pehle jaisa) ---
    const convosQuery = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid));
    const unsubscribeConversations = onSnapshot(convosQuery, (snapshot) => {
      let unreadCount = 0;
      snapshot.forEach(doc => {
        const convo = doc.data();
        const lastRead = convo.participantInfo?.[user.uid]?.lastRead?.toDate();
        const lastMessageTime = convo.lastMessageTimestamp?.toDate();
        
        // Check if lastMessage exists AND was not sent by the current user
        const lastMessageSender = convo.lastMessageSenderId; 
        
        if (lastMessageSender !== user.uid) {
            if (lastRead && lastMessageTime && lastMessageTime > lastRead) {
              unreadCount++;
            } else if (!lastRead && convo.lastMessage) { 
              unreadCount++;
            }
        }
      });
      setUnreadMessagesCount(unreadCount);
    }, (error) => {
        console.error("Error fetching conversations:", error); // Add error handling
    });


    return () => {
      unsubscribeNotifs(); // Naye listener ko clean up karein
      unsubscribeRequests();
      unsubscribeConversations();
    };
  }, [user]); // Depend on the whole user object

  const handleLogout = () => {
    auth.signOut() 
      .then(() => {
        setUser(null); 
        setShowDropdown(false);
        navigate('/');
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      });
  };

  const handleViewProfile = () => {
      if (user?.uid) {
          navigate(`/profile/${user.uid}`);
          setShowDropdown(false);
      }
  };
  
  // Naya function: Notification par click handle karein
  const handleNotificationClick = async (notif) => {
    // Navigate to link
    navigate(notif.link);
    setShowNotifications(false);
    
    // Mark as read (agar read nahi hai toh)
    if (!notif.isRead) {
        try {
            const notifRef = doc(db, 'users', user.uid, 'notifications', notif.id);
            await updateDoc(notifRef, { isRead: true });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    }
  };

  // *** YEH RAHA FIX ***
  const handleAcceptRequest = async (request) => {
      if (!user?.uid) return;
      
      console.log("Accepting request...", request.id);
      const batch = writeBatch(db);
      
      // 1. Request document ko update karein
      const requestRef = doc(db, 'requests', request.id);
      batch.update(requestRef, { status: 'accepted', updatedAt: serverTimestamp() });
      
      // 2. Current user (receiver) ki connection list update karein
      const currentUserRef = doc(db, 'users', request.receiverId); 
      batch.update(currentUserRef, { connections: arrayUnion(request.senderId) });
      
      // 3. Sender ki list update karne waali line HATA DI GAYI hai
      // const senderUserRef = doc(db, 'users', request.senderId);
      // batch.update(senderUserRef, { connections: arrayUnion(request.receiverId) }); // <-- YEH LINE PROBLEM THI

      try {
          await batch.commit(); // Ab yeh batch successful hoga
          console.log("Request accepted, batch committed.");
          
          // 4. Sender ko notification bhejein (batch ke baad)
          await createNotification(
              request.senderId, 
              `${user.name} accepted your connection request.`, 
              `/profile/${user.uid}`
          );
          console.log("Notification sent to sender.");

      } catch (error) { 
          console.error("Error accepting request (batch commit failed):", error); 
      }
  };

  const handleRejectRequest = async (requestId) => {
      const requestRef = doc(db, 'requests', requestId);
      try {
          await updateDoc(requestRef, { status: 'rejected', updatedAt: serverTimestamp() });
      } catch (error) { console.error("Error rejecting request:", error); }
  };

  return (
    <nav className={`navbar ${darkMode ? 'dark' : ''}`}>
      <div className="navbar-container">
        <Link to={user ? "/feed" : "/"} className="navbar-logo">Athlinko</Link>

        {user && (
          <div className="navbar-menu">
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
                {showRequests && <RequestsDropdown requests={connectionRequests} onAccept={handleAcceptRequest} onReject={handleRejectRequest} />}
              </div>

              {/* --- Real Notification Dropdown --- */}
               <div className="notification-container" ref={notificationRef}>
                <button className="action-btn notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
                  <Bell size={22} />
                  {unreadNotifsCount > 0 && <span className="notification-badge">{unreadNotifsCount}</span>}
                </button>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-header"><h3>Notifications</h3></div>
                    <div className="notification-list">
                      {notifications.length > 0 ? notifications.map(notif => (
                        <div key={notif.id} className={`notification-item ${!notif.isRead ? 'unread' : ''}`} onClick={() => handleNotificationClick(notif)}>
                          <span className='notification-title'>{notif.text}</span>
                          <span className='notification-details'>{formatTimeAgo(notif.timestamp)}</span>
                        </div>
                      )) : (<div className="notification-item empty"><span>No new notifications.</span></div>)}
                    </div>
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