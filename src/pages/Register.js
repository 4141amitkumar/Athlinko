import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './Register.css';

const Register = ({ setUser }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [googleProfile, setGoogleProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const userRef = doc(db, "users", decoded.sub);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        setError('This email is already registered. Please log in.');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setGoogleProfile(decoded);
      }
    } catch (err) {
      console.error("Google sign-in check failed:", err);
      setError('An error occurred during sign-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!role || !googleProfile) {
      alert("Please select a role to continue.");
      return;
    }

    setLoading(true);
    const userProfile = {
        sub: googleProfile.sub,
        name: googleProfile.name,
        email: googleProfile.email,
        picture: googleProfile.picture,
        role: role,
        createdAt: serverTimestamp(),
        connections: []
    };

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

  return (
    <div className="register-container">
      <div className="register-card">
        {!googleProfile ? (
          <>
            <div className="register-header">
              <span role="img" aria-label="wave" style={{fontSize: '2rem', marginRight: '10px'}}>👋</span>
              <h2>Create Your Account</h2>
            </div>
            <p className="register-subtitle">First, sign in with Google. It's fast and secure.</p>
            <div className="google-btn-container">
              {loading ? <div className="loader"></div> : <GoogleLogin 
                onSuccess={handleGoogleSuccess} 
                onError={() => setError('Google login failed. Please try again.')}
                theme="outline"
                size="large"
                shape="pill"
                width="300px"
              />}
            </div>
            {error && (
              <div className="error-message">
                {error} {error.includes('registered') && <Link to="/login">Go to Login</Link>}
              </div>
            )}
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
              <button type="submit" className="register-button" disabled={loading || !role}>
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
