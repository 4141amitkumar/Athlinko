import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db, rtdb } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore'; // onSnapshot import karein
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
    if (!userId || !rtdb) {
        console.warn("RTDB not initialized or userId missing for presence setup.");
        return () => {}; // Return a no-op cleanup function
    }
    console.log(`Setting up presence for user: ${userId}`);

    const userStatusRef = ref(rtdb, `/status/${userId}`);
    const connectedRef = ref(rtdb, '.info/connected');

    const isOnline = { state: 'online', last_changed: serverTimestamp() };
    const isOffline = { state: 'offline', last_changed: serverTimestamp() };

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
        goOnline(rtdb); 
    };

    const unsubscribePresence = onValue(connectedRef, (snap) => {
         console.log(`Connection state changed for ${userId}: ${snap.val()}`);
        if (snap.val() === true && auth.currentUser && auth.currentUser.uid === userId) {
            setOnlineAndOnDisconnect();
        } else {
             console.log(`User ${userId} disconnected or auth state changed (onValue).`);
        }
    });

     setOnlineAndOnDisconnect();

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
    const [user, setUser] = useState(null); 
    const [authChecked, setAuthChecked] = useState(false); 

    // --- Central Auth & User Data Listener ---
    useEffect(() => {
        let presenceUnsubscribe = null;
        let unsubscribeUserDoc = null; // Naya listener user ke document ke liye

        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            console.log("Auth State Changed. User:", firebaseUser ? firebaseUser.uid : 'null');
            
            // Puraane listeners ko clean up karein
            if (unsubscribeUserDoc) unsubscribeUserDoc();
            if (presenceUnsubscribe) presenceUnsubscribe();

            if (firebaseUser) {
                const userRef = doc(db, "users", firebaseUser.uid);
                
                // *** YEH HAI NAYA FIX ***
                // User ke document mein real-time changes ko sunein
                unsubscribeUserDoc = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        console.log("Real-time user data updated.");
                        const userData = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            ...docSnap.data(),
                            name: docSnap.data().name || firebaseUser.displayName || 'User',
                            picture: docSnap.data().picture || firebaseUser.photoURL || 'https://via.placeholder.com/40',
                        };
                        
                        setUser(userData); // Yahaan state set karein
                        setAuthChecked(true);

                        // (Re)setup presence
                        if (presenceUnsubscribe) presenceUnsubscribe(); 
                        presenceUnsubscribe = setupPresence(firebaseUser.uid);

                    } else {
                        // User Auth mein hai, par Firestore mein nahi (Register page par hona chahiye)
                        console.warn("User authenticated but no Firestore profile found:", firebaseUser.uid);
                        setUser(null); 
                        setAuthChecked(true);
                        if (rtdb) goOffline(rtdb);
                    }
                }, (error) => {
                    // Agar listener mein error aaye
                    console.error("Error listening to user document:", error);
                    setUser(null);
                    setAuthChecked(true);
                    if (rtdb) goOffline(rtdb);
                });
                
            } else {
                // User logged out hai
                console.log("User signed out.");
                setUser(null); 
                setAuthChecked(true);
                if (rtdb) goOffline(rtdb);
            }
        });

        // Jab component unmount ho toh saare listeners band karein
        return () => {
            console.log("Cleaning up all listeners (component unmount).");
            unsubscribeAuth();
            if (unsubscribeUserDoc) unsubscribeUserDoc();
            if (presenceUnsubscribe) presenceUnsubscribe();
        };
    }, []); // Yeh useEffect sirf ek baar mount par chalega

    // Dark Mode Effect
    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
        document.body.className = darkMode ? 'dark' : '';
    }, [darkMode]);

    if (!authChecked) {
        console.log("Showing loading screen: Auth not checked yet.");
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: darkMode ? '#18191a' : '#f0f2f5' }}>
                <div className="loader"></div>
            </div>
        );
    }

    // --- Render Routes ---
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