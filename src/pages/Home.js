import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import athleteGif from "../assets/illustrations/Athletics-bro.png";
import "./Home.css";
import API_BASE from "../config";

function Home({ darkMode, setUser }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [googleUserData, setGoogleUserData] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");

  // ✅ Google Sign-In
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);

        // Fetch Google user info
        const response = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        const userData = await response.json();
        setGoogleUserData(userData);
        setShowRoleModal(true); // open role modal

      } catch (error) {
        console.error("Google Sign-In Error:", error);
        alert("Google Sign-In failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      console.error("Google Sign-In Failed");
      alert("Google Sign-In failed. Please try again.");
    },
  });

  // ✅ Role selection
  const handleRoleSelect = async (role) => {
    try {
      setSelectedRole(role);
      const userWithRole = { 
        name: googleUserData.name,
        email: googleUserData.email,
        picture: googleUserData.picture,
        role 
      };

      // Send to backend
      const res = await fetch(`${API_BASE}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userWithRole),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to save user in backend");
      }

      // ✅ Store user from `result.data`
      setUser(result.data);

      setShowRoleModal(false);
      navigate("/feed");
    } catch (err) {
      console.error("Error saving user:", err);
      alert("Something went wrong while saving user. Try again.");
    }
  };

  return (
    <div className={`home-wrapper ${darkMode ? "dark" : ""}`}>
      <main className="home-main">
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
            {loading ? "Signing in..." : "Sign in with Google"}
          </button>

          {/* Email login button */}
          <button className="auth-btn" onClick={() => navigate("/login")}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/561/561127.png"
              alt="Email"
            />
            Sign in with email
          </button>

          <p className="terms">
            By clicking Continue, you agree to Athlinko’s{" "}
            <a href="/">Terms</a>, <a href="/">Privacy Policy</a>, and{" "}
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

      {/* ✅ Role Selection Modal */}
      {showRoleModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Select your role</h2>
            <button onClick={() => handleRoleSelect("player")}>Player</button>
            <button onClick={() => handleRoleSelect("coach")}>Coach</button>
            <button onClick={() => setShowRoleModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
