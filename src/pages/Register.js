import React, { useState } from 'react';
import './Register.css';

function Register({ darkMode }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('athlete');

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log({
      name,
      email,
      password,
      role,
    });

    alert("Registration submitted!");
  };

  return (
    <div className={`register-container ${darkMode ? 'dark' : ''}`}>
      <div className="register-card">
        <h2 className="register-title">Register on <span className="brand">Athlinko</span></h2>

        <form onSubmit={handleSubmit} className="register-form">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your full name"
          />

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Choose a secure password"
          />

          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="athlete">Athlete</option>
            <option value="coach">Coach</option>
          </select>

          <button type="submit" className="register-button">Register</button>
        </form>
      </div>
    </div>
  );
}

export default Register;
