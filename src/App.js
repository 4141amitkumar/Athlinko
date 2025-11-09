import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db, rtdb } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ref, onDisconnect, set, serverTimestamp, goOffline, goOnline, onValue } from 'firebase/database';

// Import Pages and Components
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NavBar from './components/NavBar';
import Feed from './pages/Feed';
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

// --- Presence Management ---
const setupPresence = (userId) => {
    // ... (presence setup code remains the same as previous version)
    if (!userId || !rtdb) {
        console.warn("RTDB not initialized or userId missing for presence setup.");
        return () => {}; // Return a no-op cleanup function
    }
    console.log(`Setting up presence for user: ${userId}`);

    const userStatusRef = ref(rtdb, `/status/${userId}`);
    const connectedRef = ref(rtdb, '.info/connected');

    const isOnline = { state: 'online', last_changed: serverTimestamp() };
    const isOffline = { state: 'offline', last_changed: serverTimestamp() };

    // Set initial online status and handle disconnect
    const setOnlineAndOnDisconnect = () => {
        set(userStatusRef, isOnline)
            .then(() => {
                console.log(`User ${userId} marked as online.`);
                return onDisconnect(userStatusRef).set(isOffline);
            })
            .then(() => {
                 console.log(`onDisconnect handler set for user ${userId}.`);
            })
            .catch((err) => console.error("Error setting online status or onDisconnect:", err));
        goOnline(rtdb); // Ensure RTDB connection is active
    };

    const unsubscribePresence = onValue(connectedRef, (snap) => {
         console.log(`Connection state changed for ${userId}: ${snap.val()}`);
        if (snap.val() === true && auth.currentUser && auth.currentUser.uid === userId) {
            setOnlineAndOnDisconnect();
        } else {
             console.log(`User ${userId} disconnected or auth state changed (onValue).`);
        }
    });

     // Initial attempt to set online status
     setOnlineAndOnDisconnect();

    // Return cleanup function
    return () => {
        console.log(`Cleaning up presence for user: ${userId}`);
        unsubscribePresence();
        if (auth.currentUser && auth.currentUser.uid === userId) {
             set(userStatusRef, isOffline).catch((err) => {
                 console.error("Error setting user offline on cleanup:", err);
             });
             console.log(`User ${userId} explicitly set offline on cleanup.`);
        }
    };
};


function App() {
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
    });
    const [user, setUser] = useState(null); // Initialize user as null
    const [authChecked, setAuthChecked] = useState(false); // Tracks if initial auth check is done

    // --- Central Auth Listener ---
    useEffect(() => {
        let presenceUnsubscribe = null;
        let isMounted = true; // Flag to prevent state updates after unmount

        console.log("Setting up Auth listener...");

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log("Auth State Changed. User:", firebaseUser ? firebaseUser.uid : 'null');

            // --- Cleanup previous presence listener ---
            if (presenceUnsubscribe) {
                presenceUnsubscribe();
                presenceUnsubscribe = null;
                console.log("Cleaned up previous presence listener.");
            }

            let finalUser = null; // Variable to hold the user state determined in this callback

            if (firebaseUser) {
                const userRef = doc(db, "users", firebaseUser.uid);
                try {
                    console.log("Fetching Firestore data for UID:", firebaseUser.uid);
                    const docSnap = await getDoc(userRef);

                    if (docSnap.exists()) {
                        console.log("Firestore data found.");
                        const userData = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            ...docSnap.data(),
                            name: docSnap.data().name || firebaseUser.displayName || 'User',
                            picture: docSnap.data().picture || firebaseUser.photoURL || 'https://via.placeholder.com/40',
                            sub: firebaseUser.uid
                        };
                        finalUser = userData; // Set the user object
                        console.log("User data prepared:", userData.uid);
                        presenceUnsubscribe = setupPresence(firebaseUser.uid);
                    } else {
                        console.warn("User authenticated but no Firestore profile found:", firebaseUser.uid);
                        finalUser = null; // Keep user null
                        if (rtdb) goOffline(rtdb);
                    }
                } catch (error) {
                    console.error("Error fetching Firestore user data:", error);
                    finalUser = null; // Error fetching data, treat as logged out
                    if (rtdb) goOffline(rtdb);
                }
            } else {
                console.log("User signed out.");
                finalUser = null; // Explicitly null for logged out state
                if (rtdb) goOffline(rtdb);
            }

            // --- Update state only if component is still mounted ---
            if (isMounted) {
                setUser(finalUser); // Update user state
                setAuthChecked(true); // Mark initial check complete
                console.log("Initial auth check complete. AuthChecked:", true, "User State determined:", finalUser ? finalUser.uid : finalUser);
            } else {
                 console.log("Component unmounted before auth state could be set.");
            }
        });

        // Cleanup function
        return () => {
            console.log("Cleaning up Auth listener (component unmount).");
            isMounted = false; // Set flag to prevent state updates
            unsubscribeAuth();
            if (presenceUnsubscribe) {
                presenceUnsubscribe();
                console.log("Presence listener cleaned up in Auth cleanup.");
            }
        };
        // Intentionally empty: Run only once on mount
    }, []); // <-- Correctly placed empty dependency array

    // Dark Mode Effect
    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
        document.body.className = darkMode ? 'dark' : '';
    }, [darkMode]);

    // Loading State UI - Shows until the initial onAuthStateChanged check completes
    if (!authChecked) {
        console.log("Showing loading screen: Auth not checked yet.");
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: darkMode ? '#18191a' : '#f0f2f5' }}>
                <div className="loader"></div>
            </div>
        );
    }

    // --- Render Routes ---
    // Routes render only after authChecked is true
    console.log(`Rendering Routes: AuthChecked=${authChecked}, User=${user ? user.uid : user}`);
    return (
        <div className={darkMode ? 'dark' : ''}>
            <Router>
                <NavBar darkMode={darkMode} setDarkMode={setDarkMode} user={user} setUser={setUser} />
                <Routes>
                    {/* Public routes only render if user is explicitly null (logged out) */}
                    <Route path="/" element={user === null ? <Home darkMode={darkMode} /> : <Navigate to="/feed" replace />} />
                    <Route path="/login" element={user === null ? <Login setUser={setUser} /> : <Navigate to="/feed" replace />} />
                    <Route path="/register" element={user === null ? <Register setUser={setUser} /> : <Navigate to="/feed" replace />} />

                    {/* Protected Routes: Render only if user is an object (truthy), otherwise redirect */}
                    <Route path="/feed" element={user ? <Feed user={user} /> : <Navigate to="/login" replace />} />
                    <Route path="/search" element={user ? <Search /> : <Navigate to="/login" replace />} />
                    <Route path="/profile/:userId" element={user ? <Profile currentUser={user} setUser={setUser} /> : <Navigate to="/login" replace />} />
                    <Route path="/profile/:userId/connections" element={user ? <Connections currentUser={user} /> : <Navigate to="/login" replace />} />
                    <Route path="/tournaments" element={user ? <Tournaments user={user} /> : <Navigate to="/login" replace />} />
                    <Route path="/edit-profile" element={user ? <EditProfile currentUser={user} setUser={setUser} /> : <Navigate to="/login" replace />} />
                    <Route path="/requests" element={user ? <Requests currentUser={user} /> : <Navigate to="/login" replace />} />
                    <Route path="/messages" element={user ? <Messages currentUser={user} /> : <Navigate to="/login" replace />} />
                    <Route path="/messages/:conversationId" element={user ? <Messages currentUser={user} /> : <Navigate to="/login" replace />} />
                    <Route path="/qna" element={user ? <QnA currentUser={user} /> : <Navigate to="/login" replace />} />
                    <Route path="/groups" element={user ? <Groups currentUser={user} /> : <Navigate to="/login" replace />} />
                    <Route path="/groups/:groupId" element={user ? <GroupDetail currentUser={user} /> : <Navigate to="/login" replace />} />
                    <Route path="/wishlist" element={user ? <Wishlist currentUser={user} /> : <Navigate to="/login" replace />} />
                    <Route path="/add-performance" element={user ? <AddPerformance currentUser={user} /> : <Navigate to="/login" replace />} />
                    <Route path="/edit-performance/:performanceId" element={user ? <AddPerformance currentUser={user} /> : <Navigate to="/login" replace />} />

                    {/* Fallback Route */}
                    <Route path="*" element={<Navigate to={user ? "/feed" : "/"} replace />} />
                </Routes>
            </Router>
        </div>
    );
}

export default App;

