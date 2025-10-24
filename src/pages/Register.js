import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase'; // Import auth and db
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'; // Import Firebase auth functions
import './Register.css';

const Register = ({ setUser }) => {
    const navigate = useNavigate();
    const location = useLocation(); // To potentially receive pre-filled info if redirected from login
    const [role, setRole] = useState('');
    const [firebaseUser, setFirebaseUser] = useState(null); // Store Firebase user info after sign-in
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Check if user info was passed from Login page (if user didn't exist there)
    useEffect(() => {
        if (location.state?.firebaseUser) {
            setFirebaseUser(location.state.firebaseUser);
        }
    }, [location.state]);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user ALREADY exists in Firestore
            const userRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                // If user exists, they should log in instead
                setError('This email is already registered. Please log in.');
                // Optional: Automatically log them in? Or just redirect.
                // For now, redirecting to login after a delay.
                setTimeout(() => navigate('/login'), 3000);

            } else {
                // User is new, store their info and proceed to role selection
                setFirebaseUser({
                    uid: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                });
            }
        } catch (error) {
            console.error("Google sign-in check failed:", error);
             if (error.code === 'auth/popup-closed-by-user') {
                setError('Sign-in cancelled. Please try again.');
            } else if (error.code === 'auth/cancelled-popup-request') {
                 setError(''); // Don't show error if multiple popups were simply cancelled
            }
             else {
                setError('An error occurred during sign-in. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!role || !firebaseUser) {
            setError("Please select a role to continue.");
            return;
        }
        setError('');
        setLoading(true);

        // Prepare user profile data for Firestore
        const userProfile = {
            // Use details from Firebase Auth
            uid: firebaseUser.uid, // Keep uid consistent
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            picture: firebaseUser.photoURL,
            // Add the selected role
            role: role,
            // Add default/initial values for other fields
            createdAt: serverTimestamp(),
            connections: [],
            dob: '',
            homeState: '',
            primarySport: '',
            experience: '',
            achievements: '',
            // Add wishlist for coaches
            ...(role === 'coach' && { wishlist: [] })
        };

        try {
            // Save the new user profile to Firestore using their Firebase UID
            await setDoc(doc(db, "users", firebaseUser.uid), userProfile);

            // Update the global user state in App.js
            setUser(userProfile); // Pass the complete profile

            // Navigate to the feed
            navigate('/feed');

        } catch (error) {
            console.error("Error creating user profile in Firestore: ", error);
            setError("Failed to create profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                {!firebaseUser ? (
                    // Step 1: Sign in with Google
                    <>
                        <div className="register-header">
                            <span role="img" aria-label="wave" style={{ fontSize: '2rem', marginRight: '10px' }}>👋</span>
                            <h2>Create Your Account</h2>
                        </div>
                        <p className="register-subtitle">First, sign in with Google to get started.</p>
                        <div className="google-btn-container">
                            {loading ? <div className="loader"></div> : (
                                <button className="auth-btn google-sign-in-btn" onClick={handleGoogleSignIn}>
                                     <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" style={{ marginRight: '10px', height: '20px' }} />
                                    Sign in with Google
                                </button>
                            )}
                        </div>
                        {error && (
                            <div className="error-message">
                                {error} {error.includes('registered') && <Link to="/login">Go to Login</Link>}
                            </div>
                        )}
                         <p className="join-link" style={{marginTop: '1.5rem'}}>
                            Already have an account? <a href="/login">Sign In</a>
                        </p>
                    </>
                ) : (
                    // Step 2: Choose Role and Complete Registration
                    <>
                        <img src={firebaseUser.photoURL || 'https://via.placeholder.com/80'} alt="Your Profile" className="profile-pic" />
                        <h2>Welcome, {firebaseUser.displayName}!</h2>
                        <p className="register-subtitle">Just one last step. Choose your role.</p>
                        <form onSubmit={handleRegister}>
                            <div className="role-options">
                                <label className={`role-label ${role === 'player' ? 'selected' : ''}`}>
                                    <input type="radio" name="role" value="player" className="role-input" onChange={(e) => setRole(e.target.value)} checked={role === 'player'} />
                                    <div className="role-content">
                                        <span role="img" aria-label="Player">🏃</span>
                                        <span>I am a Player</span>
                                    </div>
                                </label>
                                <label className={`role-label ${role === 'coach' ? 'selected' : ''}`}>
                                    <input type="radio" name="role" value="coach" className="role-input" onChange={(e) => setRole(e.target.value)} checked={role === 'coach'}/>
                                    <div className="role-content">
                                        <span role="img" aria-label="Coach">📋</span>
                                        <span>I am a Coach</span>
                                    </div>
                                </label>
                            </div>
                             {error && <p className="error-message" style={{ color: '#c91c3b', marginBottom: '1rem' }}>{error}</p>}
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
