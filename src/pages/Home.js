import React from "react";
import { useNavigate } from "react-router-dom";
import athleteGif from "../assets/illustrations/Athletics-bro.png";
import "./Home.css";

function Home({ darkMode }) {
  const navigate = useNavigate();

  return (
    <div className={`home-wrapper ${darkMode ? "dark" : ""}`}>
      <main className="home-main">
        <div className="main-left-left"></div>

        <div className="main-left">
          <h1>Welcome to your Athletic Community</h1>
          <p className="home-subtitle">
            Connect with athletes, coaches, and clubs. Discover opportunities, showcase your talent, and take your career to the next level.
          </p>

          {/* This button now navigates to the register page */}
          <button className="auth-btn join-now-btn" onClick={() => navigate("/register")}>
            Join Now
          </button>

          <p className="join-link">
            Already have an account? <a href="/login">Sign In</a>
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

