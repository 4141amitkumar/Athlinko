import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NavBar from './components/NavBar';
import Feed from './components/Feed';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Tournaments from './pages/Tournaments';
import EditProfile from './pages/EditProfile';
import Requests from './pages/Requests';
import Messages from './pages/Messages';
import Connections from './pages/Connections'; // Import Connections
import './App.css';
import { rtdb } from './firebase'; // Import Realtime Database
import { ref, onDisconnect, set, serverTimestamp } from 'firebase/database'; // Import RTDB functions

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('athlinkoUser');
      // Additional check to ensure user object is valid
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && parsedUser.sub) {
          return parsedUser;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  });

  useEffect(() => {
    if (user && user.sub) { // <-- IMPORTANT: Ensure user.sub exists
      localStorage.setItem('athlinkoUser', JSON.stringify(user));
      
      const userStatusRef = ref(rtdb, `/status/${user.sub}`);
      
      const isOnline = {
        state: 'online',
        last_changed: serverTimestamp(),
      };
      
      const isOffline = {
        state: 'offline',
        last_changed: serverTimestamp(),
      };

      set(userStatusRef, isOnline);
      onDisconnect(userStatusRef).set(isOffline);

    } else {
      localStorage.removeItem('athlinkoUser');
    }
    document.body.className = darkMode ? 'dark' : '';
  }, [user, darkMode]);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Router>
        <NavBar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          user={user}
          setUser={setUser}
        />
        <Routes>
          <Route path="/" element={user ? <Navigate to="/feed" /> : <Home darkMode={darkMode} />} />
          <Route path="/login" element={user ? <Navigate to="/feed" /> : <Login setUser={setUser} />} />
          <Route path="/register" element={user ? <Navigate to="/feed" /> :<Register setUser={setUser} />} />
          
          <Route path="/feed" element={user ? <Feed user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/search" element={user ? <Search /> : <Navigate to="/login" replace />} />
          
          <Route 
            path="/profile/:userId" 
            element={user ? <Profile currentUser={user} setUser={setUser} /> : <Navigate to="/login" replace />} 
          />
           <Route 
            path="/profile/:userId/connections"
            element={user ? <Connections currentUser={user} /> : <Navigate to="/login" replace />}
          />
          
          <Route path="/tournaments" element={user ? <Tournaments user={user} /> : <Navigate to="/login" replace />} />
          <Route 
            path="/edit-profile" 
            element={user ? <EditProfile currentUser={user} setUser={setUser} /> : <Navigate to="/login" replace />} 
          />
          <Route
            path="/requests"
            element={user ? <Requests currentUser={user} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/messages"
            element={user ? <Messages currentUser={user} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/messages/:conversationId"
            element={user ? <Messages currentUser={user} /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

