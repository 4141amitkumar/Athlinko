import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase'; // Import auth and db
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth'; // Import Firebase redirect functions
import { doc, getDoc } from 'firebase/firestore';
import athleteGif from "../assets/illustrations/Athletics-bro.png";
import './Login.css';

const Login = ({ setUser }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false); // Can indicate processing redirect result
    const [error, setError] = useState('');

    // --- New useEffect to handle redirect result ---
    useEffect(() => {
        setLoading(true);
        getRedirectResult(auth)
            .then((result) => {
                if (result) {
                    // User successfully signed in via redirect
                    const user = result.user;
                    console.log("Redirect Result User:", user);

                    // Check if user exists in Firestore
                    const userRef = doc(db, "users", user.uid);
                    return getDoc(userRef).then(docSnap => ({ user, docSnap })); // Pass both user and docSnap

                } else {
                    // No redirect result, likely initial page load
                    setLoading(false);
                    return null; // Indicate no result to process
                }
            })
             .then(data => {
                 if (!data) return; // Exit if no redirect result was processed

                 const { user, docSnap } = data;

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
            })
            .catch((error) => {
                console.error("Error processing redirect result:", error);
                setError('Login Failed. Please try again.');
                setLoading(false);
            });
            // Intentionally run only once on mount to catch the redirect result
            // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate, setUser]); // Dependencies added: navigate, setUser

    // --- Updated function to initiate redirect ---
    const handleGoogleSignInRedirect = async () => {
        setLoading(true); // Indicate loading before redirect starts
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            // This initiates the redirect away from the current page
            await signInWithRedirect(auth, provider);
            // No need to setLoading(false) here, as the page will navigate away
        } catch (error) {
            console.error("Error initiating Google sign-in redirect:", error);
            setError('Failed to start Google Sign-In. Please try again.');
            setLoading(false); // Set loading false only if redirect fails immediately
        }
    };

    // Show loading indicator while processing redirect result
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
                         {/* Button now triggers redirect */}
                         <button className="auth-btn google-sign-in-btn" onClick={handleGoogleSignInRedirect}>
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

