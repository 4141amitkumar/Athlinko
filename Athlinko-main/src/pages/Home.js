import React from 'react';
import { Link } from 'react-router-dom';
import athleteGif from '../assets/illustrations/Athletics-bro.png';
import './Home.css';

function Home({ darkMode }) {
  return (
    <div className={`home-wrapper ${darkMode ? 'dark' : ''}`}>
      <main className="home-main">
        <div className="main-left-left"></div>
        <div className="main-left">
          <h1>Welcome to your athletic community</h1>
          <p className="home-subtitle">Connect with athletes, coaches, and clubs around you.</p>

          <button className="google-btn">
            <img
              src='https://cdn4.iconfinder.com/data/icons/logos-brands-7/512/google_logo-google_icongoogle-512.png'
              alt="Google"
            />
            Continue with Google
          </button>

          <button className="email-btn">Sign in with email</button>

          <p className="terms">
            By clicking Continue, you agree to Athlinko’s <a href="/">Terms</a>, <a href="/">Privacy Policy</a>, and <a href="/">Cookie Policy</a>.
          </p>

          <p className="join-link">
            New to Athlinko? <Link to="/register">Join now</Link>
          </p>
        </div>

        <div className="main-right">
          <img src={athleteGif} alt="Sport animation" className="home-animation pulse-img" />
        </div>
      </main>
    </div>
  );
}

export default Home;
