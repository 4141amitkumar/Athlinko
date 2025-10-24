import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Import auth and onAuthStateChanged
import { auth, db, rtdb } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
// Corrected: Import onValue with other database imports
import { ref, onDisconnect, set, serverTimestamp, goOffline, goOnline, onValue } from 'firebase/database';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NavBar from './components/NavBar';
import Feed from './components/Feed';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Tournaments from './pages/Tournaments';
import EditProfile from './pages/EditProfile';
import Requests from './pages/Requests';
import Messages from './pages/Messages';
import Connections from './pages/Connections';
import QnA from './pages/QnA';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Wishlist from './pages/Wishlist';
import AddPerformance from './pages/AddPerformance';
import './App.css';

function App() {
    const [darkMode, setDarkMode] = useState(() => {
        // Optional: Check localStorage for saved dark mode preference
        return localStorage.getItem('darkMode') === 'true';
    });
    const [user, setUser] = useState(null); // Initialize user as null
    const [loadingAuth, setLoadingAuth] = useState(true); // State to track auth status loading

    // --- Central Auth Listener ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in via Firebase Auth
                console.log("onAuthStateChanged: User signed in:", firebaseUser.uid);
                // Fetch additional user details from Firestore
                const userRef = doc(db, "users", firebaseUser.uid);
                const docSnap = await getDoc(userRef);

                if (docSnap.exists()) {
                    // Combine auth data and Firestore data
                    const userData = {
                        uid: firebaseUser.uid,
                        displayName: firebaseUser.displayName,
                        email: firebaseUser.email,
                        photoURL: firebaseUser.photoURL,
                        ...docSnap.data() // Includes role, wishlist, etc.
                    };
                    setUser(userData); // Set the full user profile
                     // Setup presence management ONLY AFTER user is fully loaded
                     setupPresence(firebaseUser.uid);
                } else {
                    // User signed in via Auth, but no Firestore profile yet.
                    // This might happen during registration flow or if Firestore write failed.
                    // For now, treat as logged out until profile is created.
                    console.warn("User authenticated but no Firestore profile found:", firebaseUser.uid);
                    setUser(null);
                     goOffline(rtdb); // Ensure offline status if profile is missing
                }
            } else {
                // User is signed out
                 console.log("onAuthStateChanged: User signed out");
                setUser(null);
                goOffline(rtdb); // Go offline when logged out
            }
            setLoadingAuth(false); // Auth state determined, stop loading indicator
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []); // Run only once on mount

     // --- Presence Management ---
     const setupPresence = (userId) => {
         if (!userId) return;

         const userStatusRef = ref(rtdb, `/status/${userId}`);

         const isOnline = {
             state: 'online',
             last_changed: serverTimestamp(),
         };

         const isOffline = {
             state: 'offline',
             last_changed: serverTimestamp(),
         };

         // Use RTDB's built-in connection management
         const connectedRef = ref(rtdb, '.info/connected');
         onValue(connectedRef, (snap) => {
             if (snap.val() === true && user) { // Only set online if user is still logged in
                 set(userStatusRef, isOnline);
                 // Set offline status on disconnect
                 onDisconnect(userStatusRef).set(isOffline);
             } else if(snap.val() === false && user){
                 // We might be temporarily disconnected, but don't set offline status immediately
                 // `onDisconnect` handles the final offline state.
             }
         });
          // Initial online set might be slightly redundant due to onValue, but ensures state
         goOnline(rtdb);
         set(userStatusRef, isOnline);
     };

     // Handle Dark Mode toggle and persistence
    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
        document.body.className = darkMode ? 'dark' : '';
    }, [darkMode]);

    // Show loading indicator while checking auth status
    if (loadingAuth) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: darkMode ? '#18191a' : '#f0f2f5' }}>
                <div className="loader"></div> {/* Use your existing loader style */}
            </div>
        );
    }

    // Determine the correct user identifier for RTDB presence
    // Use `uid` from Firebase Auth state, fallback needed if user object structure changes
    const userIdForPresence = user?.uid;

    return (
        <div className={darkMode ? 'dark' : ''}>
            <Router>
                <NavBar
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    user={user} // Pass the user state from onAuthStateChanged
                    // setUser is no longer needed directly in NavBar for logout, handled via auth.signOut()
                />
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={!user ? <Home darkMode={darkMode} /> : <Navigate to="/feed" />} />
                    {/* Pass setUser to Login/Register only if needed for IMMEDIATE UI update before redirect/auth listener catches up */}
                    <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/feed" />} />
                    <Route path="/register" element={!user ? <Register setUser={setUser} /> : <Navigate to="/feed" />} />

                    {/* Protected Routes */}
                    <Route path="/feed" element={user ? <Feed user={user} /> : <Navigate to="/login" replace />} />
                    <Route path="/search" element={user ? <Search /> : <Navigate to="/login" replace />} />
                    <Route
                        path="/profile/:userId"
                        element={user ? <Profile currentUser={user} /* Pass setUser if Profile needs to update global state */ /> : <Navigate to="/login" replace />}
                    />
                    <Route
                        path="/profile/:userId/connections"
                        element={user ? <Connections currentUser={user} /> : <Navigate to="/login" replace />}
                    />
                    <Route path="/tournaments" element={user ? <Tournaments user={user} /> : <Navigate to="/login" replace />} />
                    <Route
                        path="/edit-profile"
                        element={user ? <EditProfile currentUser={user} setUser={setUser} /> : <Navigate to="/login" replace />}
                    />
                    <Route
                        path="/requests"
                        element={user ? <Requests currentUser={user} /> : <Navigate to="/login" replace />}
                    />
                    <Route
                        path="/messages"
                        element={user ? <Messages currentUser={user} /> : <Navigate to="/login" replace />}
                    />
                    <Route
                        path="/messages/:conversationId"
                        element={user ? <Messages currentUser={user} /> : <Navigate to="/login" replace />}
                    />
                     <Route
                        path="/qna"
                        element={user ? <QnA currentUser={user} /> : <Navigate to="/login" replace />}
                    />
                    <Route
                        path="/groups"
                        element={user ? <Groups currentUser={user} /> : <Navigate to="/login" replace />}
                    />
                     <Route
                        path="/groups/:groupId"
                        element={user ? <GroupDetail currentUser={user} /> : <Navigate to="/login" replace />}
                    />
                     <Route
                        path="/wishlist"
                        element={user ? <Wishlist currentUser={user} /> : <Navigate to="/login" replace />}
                    />
                    <Route
                        path="/add-performance"
                        element={user ? <AddPerformance currentUser={user} /> : <Navigate to="/login" replace />}
                     />
                     <Route
                        path="/edit-performance/:performanceId"
                        element={user ? <AddPerformance currentUser={user} /> : <Navigate to="/login" replace />}
                    />

                    {/* Fallback Route - Optional */}
                    {/* <Route path="*" element={<Navigate to={user ? "/feed" : "/"} replace />} /> */}
                </Routes>
            </Router>
        </div>
    );
}

export default App;

