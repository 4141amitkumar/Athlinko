import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // navigation ke liye
import { useGoogleLogin } from '@react-oauth/google'; // Google login hook
import athleteGif from '../assets/illustrations/Athletics-bro.png'; // image
import './Home.css'; // CSS styling

function Home(props) {
  const navigate = useNavigate(); // page redirect karne ke liye
  const [loading, setLoading] = useState(false); // optional loading state

  // Google Sign-In function
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true); // optional: button disable ya spinner dikhane ke liye

        // Google se user info nikalne ke liye API call
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        const userData = await response.json(); // JSON format mein response milta hai
        console.log('Google User Info:', userData); // Debug ke liye

        props.setUser(userData); // parent component ko user data bhejna
        navigate('/feed'); // login ke baad feed page pe bhejna

      } catch (error) {
        console.error('Google Sign-In Error:', error);
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      console.error('Google Sign-In Failed');
    },
  });

  // JSX return
  return (
    <div className={`home-wrapper ${props.darkMode ? 'dark' : ''}`}>
      <main className="home-main">
        {/* Left side content */}
        <div className="main-left-left"></div>

        <div className="main-left">
          <h1>Welcome to your athletic community</h1>
          <p className="home-subtitle">
            Connect with athletes, coaches, and clubs around you.
          </p>

          {/* Google login button */}
          <button className="auth-btn" onClick={() => handleGoogleLogin()}>
            <img
              src="https://cdn4.iconfinder.com/data/icons/logos-brands-7/512/google_logo-google_icongoogle-512.png"
              alt="Google"
            />
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          {/* Email login button */}
          <button className="auth-btn" onClick={() => navigate('/login')}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/561/561127.png"
              alt="Email"
            />
            Sign in with email
          </button>

          {/* Terms & links */}
          <p className="terms">
            By clicking Continue, you agree to Athlinko’s{' '}
            <a href="/">Terms</a>, <a href="/">Privacy Policy</a>, and{' '}
            <a href="/">Cookie Policy</a>.
          </p>

          <p className="join-link">
            New to Athlinko? <a href="/register">Join now</a>
          </p>
        </div>

        {/* Right side image */}
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
}

export default Home;
