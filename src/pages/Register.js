import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './Register.css';

const Register = ({ setUser }) => {
  const navigate = useNavigate();
  // ✅ Corrected the typo here
  const [role, setRole] = useState(''); 
  const [googleProfile, setGoogleProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!role) {
      alert("Please select your role to continue.");
      return;
    }
    if (!googleProfile) {
      alert("An error occurred. Please try signing in again.");
      return;
    }

    setLoading(true);
    const userProfile = { ...googleProfile, role, createdAt: serverTimestamp() };

    try {
      await setDoc(doc(db, "users", googleProfile.sub), userProfile);
      setUser(userProfile);
      navigate('/feed');
    } catch (error) {
      console.error("Error creating user profile: ", error);
      alert("Failed to create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    setGoogleProfile(decoded);
  };

  return (
    <div className="register-container">
      <div className="register-card">
        {!googleProfile ? (
          <>
            <div className="register-header">
              <span role="img" aria-label="wave" style={{fontSize: '2rem', marginRight: '10px'}}></span>
              <h2>Create Your Account</h2>
            </div>
            <p className="register-subtitle">First, let's get you signed in with Google. It's fast and secure.</p>
            <div className="google-btn-container">
              <GoogleLogin 
                onSuccess={handleGoogleSuccess} 
                onError={() => console.log('Login Failed')}
                theme="outline"
                size="large"
                shape="pill"
                width="300px"
              />
            </div>
          </>
        ) : (
          <>
            <img src={googleProfile.picture} alt="Your Profile" className="profile-pic" />
            <h2>Welcome, {googleProfile.name}!</h2>
            <p className="register-subtitle">Just one last step. Tell us who you are in the community.</p>
            <form onSubmit={handleRegister}>
              <div className="role-options">
                <label className={`role-label ${role === 'player' ? 'selected' : ''}`}>
                  <input type="radio" name="role" value="player" className="role-input" onChange={(e) => setRole(e.target.value)} />
                  <div className="role-content">
                    <span role="img" aria-label="Player">🏃</span>
                    <span>I am a Player</span>
                  </div>
                </label>
                <label className={`role-label ${role === 'coach' ? 'selected' : ''}`}>
                  <input type="radio" name="role" value="coach" className="role-input" onChange={(e) => setRole(e.target.value)} />
                  <div className="role-content">
                    <span role="img" aria-label="Coach">📋</span>
                    <span>I am a Coach</span>
                  </div>
                </label>
              </div>
              <button type="submit" className="register-button" disabled={loading}>
                {loading ? 'Setting up...' : 'Complete Registration'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;

