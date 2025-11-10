import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { Check, X } from 'lucide-react';
import './Requests.css';

const Requests = ({ currentUser }) => {
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        setLoading(true);

        // Listener for received requests
        const receivedQuery = query(
            collection(db, 'requests'),
            where('receiverId', '==', currentUser.uid), // Use uid instead of sub
            where('status', '==', 'pending')
        );
        const unsubscribeReceived = onSnapshot(receivedQuery, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReceivedRequests(reqs);
            setLoading(false);
        });

        // Listener for sent requests
        const sentQuery = query(
            collection(db, 'requests'),
            where('senderId', '==', currentUser.uid), // Use uid instead of sub
            where('status', '==', 'pending')
        );
        const unsubscribeSent = onSnapshot(sentQuery, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSentRequests(reqs);
        });

        return () => {
            unsubscribeReceived();
            unsubscribeSent();
        };
    }, [currentUser]);

    const handleAcceptRequest = async (request) => {
      const batch = writeBatch(db);
      const requestRef = doc(db, 'requests', request.id);
      batch.update(requestRef, { status: 'accepted', updatedAt: serverTimestamp() });
      const currentUserRef = doc(db, 'users', request.receiverId);
      batch.update(currentUserRef, { connections: arrayUnion(request.senderId) });
      const senderUserRef = doc(db, 'users', request.senderId);
      batch.update(senderUserRef, { connections: arrayUnion(request.receiverId) });
      try {
          await batch.commit();
      } catch (error) { console.error("Error accepting request:", error); }
    };
  
    const handleRejectRequest = async (requestId) => {
      const requestRef = doc(db, 'requests', requestId);
      try {
          await updateDoc(requestRef, { status: 'rejected', updatedAt: serverTimestamp() });
      } catch (error) { console.error("Error rejecting request:", error); }
    };

    return (
        <div className="requests-page-container">
            <h1>Connection Requests</h1>

            <div className="requests-section">
                <h2>Received ({receivedRequests.length})</h2>
                {loading ? <p>Loading...</p> : (
                    <div className="requests-list-full">
                        {receivedRequests.length > 0 ? receivedRequests.map(req => (
                            <div key={req.id} className="request-card">
                                <img src={req.senderPicture} alt={req.senderName} />
                                <div className="request-card-info">
                                    <Link to={`/profile/${req.senderId}`}>{req.senderName}</Link>
                                    <span>Wants to connect with you.</span>
                                </div>
                                <div className="request-card-actions">
                                    <button onClick={() => handleAcceptRequest(req)} className="accept">Accept</button>
                                    <button onClick={() => handleRejectRequest(req.id)} className="reject">Reject</button>
                                </div>
                            </div>
                        )) : <p>No new requests.</p>}
                    </div>
                )}
            </div>

            <div className="requests-section">
                <h2>Sent ({sentRequests.length})</h2>
                 <div className="requests-list-full">
                    {sentRequests.length > 0 ? sentRequests.map(req => (
                        <div key={req.id} className="request-card">
                            <img src={req.receiverPicture} alt={req.receiverName} />
                            <div className="request-card-info">
                                <Link to={`/profile/${req.receiverId}`}>{req.receiverName}</Link>
                                <span>Request pending.</span>
                            </div>
                        </div>
                    )) : <p>No pending sent requests.</p>}
                </div>
            </div>
        </div>
    );
};

export default Requests;