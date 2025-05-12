import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NavBar from './components/NavBar';
import Feed from './pages/Feed';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null); // User state moved to App level

  return (
    <Router>
      <NavBar darkMode={darkMode} setDarkMode={setDarkMode} user={user} setUser={setUser}/>
      <Routes>
        <Route path="/" element={<Home darkMode={darkMode} setUser={setUser} />} />
        <Route path="/login" element={<Login darkMode={darkMode} />} />
        <Route path="/register" element={<Register darkMode={darkMode} />} />
        <Route path="/feed" element={user ? <Feed user={user} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
