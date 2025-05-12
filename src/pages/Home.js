import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import athleteGif from '../assets/illustrations/Athletics-bro.png';
import './Home.css';

function Home({ darkMode, setUser }) {
  const navigate = useNavigate();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });
        const userInfo = await res.json();
        console.log('Google User Info:', userInfo);
        setUser(userInfo); // Send user data up to App
         navigate('/feed');
      } catch (err) {
        console.error('Failed to fetch user info:', err);
      }
    },
    onError: () => {
      console.error('Google Sign-In Failed');
    },
  });

  return (
    <div className={`home-wrapper ${darkMode ? 'dark' : ''}`}>
      <main className="home-main">
        <div className="main-left-left"></div>
        <div className="main-left">
          <h1>Welcome to your athletic community</h1>
          <p className="home-subtitle">
            Connect with athletes, coaches, and clubs around you.
          </p>

          <button className="auth-btn" onClick={() => login()}>
            <img
              src="https://cdn4.iconfinder.com/data/icons/logos-brands-7/512/google_logo-google_icongoogle-512.png"
              alt="Google"
            />
            Sign in with Google
          </button>

          <button className="auth-btn" onClick={() => navigate('/login')}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/561/561127.png"
              alt="Email"
            />
            Sign in with email
          </button>

          <p className="terms">
            By clicking Continue, you agree to Athlinko’s{' '}
            <a href="/">Terms</a>, <a href="/">Privacy Policy</a>, and{' '}
            <a href="/">Cookie Policy</a>.
          </p>

          <p className="join-link">
            New to Athlinko? <a href="/register">Join now</a>
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
}

export default Home;
