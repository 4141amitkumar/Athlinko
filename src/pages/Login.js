import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import athleteGif from "../assets/illustrations/Athletics-bro.png";
import './Login.css'; // Using a new CSS file for Login page

const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const userRef = doc(db, "users", decoded.sub);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        // **FIX:** Combine the document ID (sub) with the rest of the user data
        // This ensures the `currentUser.sub` property exists for profile checks.
        const userData = { sub: docSnap.id, ...docSnap.data() };
        setUser(userData);
        navigate('/feed');
      } else {
        // User is new, navigate to registration page with their Google profile
        navigate('/register', { state: { googleProfile: decoded } });
      }
    } catch (error) {
      console.error("Error during sign-in:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    setLoading(false);
    console.log('Login Failed');
  };

  return (
    <div className="home-wrapper"> {/* Reusing home-wrapper for consistent background */}
      <main className="home-main">
        <div className="main-left-left"></div>
        <div className="main-left">
          <h1>Sign in to Athlinko</h1>
          <p className="home-subtitle">
            Continue your athletic journey with us.
          </p>
          <div className="google-auth-btn-container">
            {loading ? <div className="loader"></div> : (
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                theme="outline"
                size="large"
                shape="pill"
                width="300px"
              />
            )}
          </div>
          <p className="terms">
            By signing in, you agree to our policies.
          </p>
        </div>
        <div className="main-right">
          <img
            src={athleteGif}
            alt="Sport animation"
            className="home-animation pulse-img"
          />
        </div>
      </main>
    </div>
  );
};

export default Login;
