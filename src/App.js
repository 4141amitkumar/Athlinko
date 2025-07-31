import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NavBar from './components/NavBar';
import Feed from './pages/Feed';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(() => {
    // ✅ Try to load user from localStorage if exists
    const savedUser = localStorage.getItem('athlinkoUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // ✅ Persist user in localStorage (so refresh pe bhi login bana rahe)
  useEffect(() => {
    if (user) {
      localStorage.setItem('athlinkoUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('athlinkoUser');
    }
  }, [user]);

  return (
    <Router>
      <NavBar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        user={user}
        setUser={setUser}
      />
      <Routes>
        <Route
          path="/"
          element={<Home darkMode={darkMode} setUser={setUser} />}
        />
        <Route
          path="/login"
          element={<Login darkMode={darkMode} setUser={setUser} />}
        />
        <Route
          path="/register"
          element={<Register darkMode={darkMode} setUser={setUser} />}
        />
        <Route
          path="/feed"
          element={user ? <Feed user={user} /> : <Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
