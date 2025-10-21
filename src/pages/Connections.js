import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, doc, onSnapshot, query, where, getDocs, documentId } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import './Connections.css'; 

const Connections = ({ currentUser }) => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [profileUser, setProfileUser] = useState(null);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        // Profile user ke document mein real-time changes ke liye listen karein
        const unsubUser = onSnapshot(doc(db, 'users', userId), async (userDoc) => {
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setProfileUser(userData);

                let connectionIds = userData.connections || [];
                
                // Filter out any empty or invalid IDs to prevent query errors
                connectionIds = connectionIds.filter(id => id && typeof id === 'string');

                if (connectionIds.length > 0) {
                    // Har connection ki details fetch karein
                    const connectionsQuery = query(collection(db, 'users'), where(documentId(), 'in', connectionIds));
                    const querySnapshot = await getDocs(connectionsQuery);
                    const connectionsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setConnections(connectionsList);
                } else {
                    setConnections([]);
                }
            } else {
                console.log("User not found");
                setProfileUser(null);
                setConnections([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error listening to user document: ", error);
            setLoading(false);
        });

        // Cleanup listener jab component unmount ho
        return () => unsubUser();
    }, [userId]);

    return (
        <div className="connections-page-container">
            <div className="connections-header">
                <button onClick={() => navigate(`/profile/${userId}`)} className="back-btn">
                    <ArrowLeft size={20} />
                </button>
                {profileUser && <h1>{profileUser.name}'s Connections</h1>}
            </div>
            
            <div className="connections-grid">
                {loading ? (
                    <p className="loading-text">Loading connections...</p>
                ) : connections.length > 0 ? (
                    connections.map(user => (
                        <Link to={`/profile/${user.id}`} key={user.id} className="user-card-link">
                            <div className="user-card">
                                <img src={user.picture} alt={user.name} className="user-avatar" />
                                <div className="user-info">
                                    <span className="user-name">{user.name}</span>
                                    <span className={`user-role ${user.role}`}>{user.role}</span>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <p className="loading-text">No connections to display.</p>
                )}
            </div>
        </div>
    );
};

export default Connections;

