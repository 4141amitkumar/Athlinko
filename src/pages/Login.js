import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase'; // Import auth and db
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'; // Import Firebase popup functions
import { doc, getDoc } from 'firebase/firestore';
import athleteGif from "../assets/illustrations/Athletics-bro.png";
import './Login.css';

const Login = ({ setUser }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false); // Can indicate processing
    const [error, setError] = useState('');

    // --- Removed useEffect that handled getRedirectResult ---
    // The popup flow is promise-based and doesn't need a listener on mount.

    // --- Updated function to initiate popup ---
    const handleGoogleSignInPopup = async () => {
        setLoading(true); // Indicate loading before popup opens
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            // This initiates the popup and waits for the result
            const result = await signInWithPopup(auth, provider);
            
            const user = result.user;
            console.log("Popup Result User:", user);

            // Check if user exists in Firestore
            const userRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                 // User exists in Firestore
                 const userData = {
                     uid: user.uid,
                     displayName: user.displayName,
                     email: user.email,
                     photoURL: user.photoURL,
                     ...docSnap.data()
                 };
                 setUser(userData);
                 navigate('/feed', { replace: true }); // Use replace to clear history
             } else {
                 // User is new, navigate to registration
                 navigate('/register', {
                     state: {
                         firebaseUser: {
                             uid: user.uid,
                             displayName: user.displayName,
                             email: user.email,
                             photoURL: user.photoURL,
                         }
                     },
                     replace: true // Use replace to clear history
                 });
             }
        } catch (error) {
            console.error("Error during Google sign-in popup:", error);
            if (error.code !== 'auth/popup-closed-by-user') {
                setError('Login Failed. Please try again.');
            }
            setLoading(false); // Set loading false only if popup fails or is closed
        }
    };

    // Show loading indicator while processing
    if (loading) {
        return (
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 70px)' }}>
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="home-wrapper">
            <main className="home-main">
                 <div className="main-left-left"></div>
                 <div className="main-left">
                    <h1>Sign in to Athlinko</h1>
                    <p className="home-subtitle">
                        Continue your athletic journey with us.
                    </p>
                    <div className="google-auth-btn-container">
                         {/* Button now triggers popup */}
                         <button className="auth-btn google-sign-in-btn" onClick={handleGoogleSignInPopup}>
                             <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" style={{ marginRight: '10px', height: '20px' }} />
                             Sign in with Google
                         </button>
                    </div>
                    {error && <p className="error-message" style={{ color: '#c91c3b', marginTop: '1rem' }}>{error}</p>}
                    <p className="terms">
                        By signing in, you agree to our policies.
                    </p>
                     <p className="join-link" style={{marginTop: '1.5rem'}}>
                        Don't have an account? <a href="/register">Register here</a>
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