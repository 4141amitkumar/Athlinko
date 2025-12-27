import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'; // Import signInWithPopup
import { doc, setDoc, getDoc } from 'firebase/firestore';
import './Register.css';

const Register = ({ setUser }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Check if user data was passed from Login page (if auth was successful but profile didn't exist)
    const [firebaseUser, setFirebaseUser] = useState(location.state?.firebaseUser || null);
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // If user lands here with auth data but no role, they must complete registration
    useEffect(() => {
        // This handles the case from App.js where user has auth but no role
        if (auth.currentUser && !firebaseUser) {
             const user = auth.currentUser;
             setFirebaseUser({
                 uid: user.uid,
                 displayName: user.displayName,
                 email: user.email,
                 photoURL: user.photoURL,
             });
        }
    }, [auth.currentUser, firebaseUser]);


    // --- Google Sign-In Popup Handler ---
    const handleGoogleSignInPopup = async () => {
        setLoading(true);
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user *already* exists in Firestore
            const userRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                // This user is already registered. Log them in.
                console.log("User already exists, logging in.");
                const userData = {
                     uid: user.uid,
                     displayName: user.displayName,
                     email: user.email,
                     photoURL: user.photoURL,
                     ...docSnap.data()
                 };
                 setUser(userData);
                 navigate('/feed', { replace: true });
            } else {
                // This is a new user. Show them the role selection.
                console.log("New user, proceeding to role selection.");
                setFirebaseUser({
                    uid: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                });
            }
        } catch (error) {
            console.error("Error during Google sign-in popup:", error);
            if (error.code !== 'auth/popup-closed-by-user') {
                setError('Registration Failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Final Registration Step Handler ---
    const handleCompleteRegistration = async (e) => {
        e.preventDefault();
        if (!firebaseUser || !role) {
            setError('Please select a role to continue.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const userRef = doc(db, "users", firebaseUser.uid);
            
            // Create the new user document in Firestore
            const newUser = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName,
                email: firebaseUser.email,
                picture: firebaseUser.photoURL || 'https://via.placeholder.com/150',
                role: role,
                connections: [],
                wishlist: [],
                joinedAt: new Date().toISOString(),
                // Add any other default fields here
                dob: '',
                homeState: '',
                primarySport: '',
                experience: '',
                achievements: ''
            };

            await setDoc(userRef, newUser);

            // Set the user in the global state
            setUser(newUser);

            // Navigate to the user's new profile or feed
            navigate('/feed', { replace: true });

        } catch (error) {
            console.error("Error completing registration: ", error);
            setError('Failed to save profile. Please try again.');
            setLoading(false);
        }
    };

    // Show loading spinner
    if (loading) {
        return (
            <div className="register-container">
                <div className="loader"></div>
            </div>
        );
    }

    // --- Render Logic ---
    return (
        <div className="register-container">
            <div className="register-card">
                {/* Stage 1: Initial Sign-in */}
                {!firebaseUser ? (
                    <>
                        <div className="register-header">
                            <h2>Join Athlinko</h2>
                            <p className="register-subtitle">Sign up to connect with athletes and coaches.</p>
                        </div>
                        <div className="google-btn-container">
                             <button className="auth-btn google-sign-in-btn" onClick={handleGoogleSignInPopup}>
                                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" style={{ marginRight: '10px', height: '20px' }} />
                                Sign up with Google
                            </button>
                        </div>
                        <p className="join-link" style={{marginTop: '1.5rem'}}>
                            Already have an account? <Link to="/login">Sign in</Link>
                        </p>
                    </>
                ) : (
                /* Stage 2: Complete Profile (Role Selection) */
                    <>
                        <div className="register-header">
                            <img src={firebaseUser.photoURL} alt="Profile" className="profile-pic" />
                            <h2>Welcome, {firebaseUser.displayName}!</h2>
                            <p className="register-subtitle">One last step. Tell us who you are.</p>
                        </div>
                        
                        <form onSubmit={handleCompleteRegistration}>
                            <div className="role-options">
                                <label className={`role-label ${role === 'player' ? 'selected' : ''}`}>
                                    <input 
                                        type="radio" 
                                        name="role" 
                                        value="player" 
                                        className="role-input"
                                        checked={role === 'player'}
                                        onChange={(e) => setRole(e.target.value)}
                                    />
                                    <div className="role-content">
                                        <span role="img" aria-label="Athlete">🏃</span>
                                        I am a Player
                                    </div>
                                </label>
                                
                                <label className={`role-label ${role === 'coach' ? 'selected' : ''}`}>
                                    <input 
                                        type="radio" 
                                        name="role" 
                                        value="coach" 
                                        className="role-input"
                                        checked={role === 'coach'}
                                        onChange={(e) => setRole(e.target.value)}
                                    />
                                    <div className="role-content">
                                        <span role="img" aria-label="Coach">📋</span>
                                        I am a Coach
                                    </div>
                                </label>
                            </div>
                            
                            <button type="submit" className="register-button" disabled={!role}>
                                Complete Registration
                            </button>
                        </form>
                    </>
                )}

                {/* Display any errors */}
                {error && <div className="error-message">{error}</div>}
            </div>
        </div>
    );
};

export default Register;