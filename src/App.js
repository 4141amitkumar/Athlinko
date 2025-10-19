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
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('athlinkoUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('athlinkoUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('athlinkoUser');
    }
  }, [user]);

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
          
          {/* ✅ Yahan `setUser` ko pass kiya gaya hai */}
          <Route 
            path="/profile/:userId" 
            element={user ? <Profile currentUser={user} setUser={setUser} /> : <Navigate to="/login" replace />} 
          />
          
          <Route path="/tournaments" element={user ? <Tournaments user={user} /> : <Navigate to="/login" replace />} />
          <Route 
            path="/edit-profile" 
            element={user ? <EditProfile currentUser={user} setUser={setUser} /> : <Navigate to="/login" replace />} 
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

