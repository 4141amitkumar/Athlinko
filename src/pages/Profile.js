import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, storage } from '../firebase';
import { doc, getDoc, onSnapshot, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp, arrayUnion, arrayRemove, writeBatch, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Edit3, UserPlus, UserCheck, Clock, UserX, MessageSquare } from 'lucide-react';
import './Profile.css';

// Helper function to calculate age from date of birth
const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const Profile = ({ currentUser, setUser }) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('loading');
  const [requestDocId, setRequestDocId] = useState(null);
  const fileInputRef = useRef(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const ownProfileCheck = currentUser && currentUser.sub === userId;
    setIsOwnProfile(ownProfileCheck);
    
    // Real-time listener for the profile user's data
    const unsubProfileUser = onSnapshot(doc(db, 'users', userId), (docSnap) => {
      if (docSnap.exists()) {
        const userData = { id: docSnap.id, ...docSnap.data() };
        setProfileUser(userData);

        // Fetch connection status if it's not the user's own profile
        if (!ownProfileCheck && currentUser) {
            if (userData.connections?.includes(currentUser.sub)) {
                setConnectionStatus('connected');
            } else {
                // Check for pending requests
                const q1 = query(collection(db, 'requests'), where('senderId', '==', currentUser.sub), where('receiverId', '==', userId), where('status', '==', 'pending'));
                getDocs(q1).then(sentSnap => {
                    if (!sentSnap.empty) {
                        setConnectionStatus('pending_sent');
                        setRequestDocId(sentSnap.docs[0].id);
                    } else {
                        const q2 = query(collection(db, 'requests'), where('senderId', '==', userId), where('receiverId', '==', currentUser.sub), where('status', '==', 'pending'));
                        getDocs(q2).then(receivedSnap => {
                            if (!receivedSnap.empty) {
                                setConnectionStatus('pending_received');
                                setRequestDocId(receivedSnap.docs[0].id);
                            } else {
                                setConnectionStatus('not_connected');
                            }
                        });
                    }
                });
            }
        }
      } else {
        console.log("No such user!");
        setProfileUser(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user data:", error);
      setLoading(false);
    });

    return () => {
      unsubProfileUser();
    };
  }, [userId, currentUser]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !isOwnProfile) return;
    setIsUploading(true);
    const storageRef = ref(storage, `profilePictures/${userId}`);
    try {
        const snapshot = await uploadBytes(storageRef, file);
        const newImageUrl = await getDownloadURL(snapshot.ref);
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, { picture: newImageUrl });
        
        // Update user state in App.js as well
        setUser(prevUser => ({ ...prevUser, picture: newImageUrl }));
    } catch (error) {
        console.error("Error updating profile picture: ", error);
    } finally {
        setIsUploading(false);
    }
  };
  
  const handleSendRequest = async (type) => {
    if (!currentUser || !profileUser) return;
    try {
      const docRef = await addDoc(collection(db, 'requests'), {
        senderId: currentUser.sub,
        senderName: currentUser.name,
        senderPicture: currentUser.picture,
        senderRole: currentUser.role,
        receiverId: profileUser.id,
        receiverName: profileUser.name,
        receiverPicture: profileUser.picture,
        receiverRole: profileUser.role,
        requestType: type,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setConnectionStatus('pending_sent');
      setRequestDocId(docRef.id);
    } catch (error) {
      console.error("Error sending request:", error);
    }
  };

  const handleCancelRequest = async () => {
    if (!requestDocId) return;
    try {
        await deleteDoc(doc(db, 'requests', requestDocId));
        setConnectionStatus('not_connected');
        setRequestDocId(null);
    } catch (error) {
        console.error("Error cancelling request:", error);
    }
  };

  const handleRespondToRequest = async (response) => {
    if (!requestDocId || !profileUser) return;
    try {
      if (response === 'accepted') {
        const batch = writeBatch(db);
        const requestRef = doc(db, 'requests', requestDocId);
        batch.update(requestRef, { status: 'accepted', updatedAt: serverTimestamp() });
  
        const currentUserRef = doc(db, 'users', currentUser.sub);
        batch.update(currentUserRef, { connections: arrayUnion(profileUser.id) });
  
        const senderUserRef = doc(db, 'users', profileUser.id);
        batch.update(senderUserRef, { connections: arrayUnion(currentUser.sub) });
  
        await batch.commit();
        
        // Update global user state for immediate UI feedback
        setUser(prevUser => ({
          ...prevUser,
          connections: [...(prevUser.connections || []), profileUser.id]
        }));
      } else { // rejected
        await updateDoc(doc(db, 'requests', requestDocId), {
            status: 'rejected',
            updatedAt: serverTimestamp(),
        });
      }
      setRequestDocId(null);
    } catch (error) {
      console.error("Error responding to request:", error);
    }
  };

  const handleDisconnect = async () => {
      if (!window.confirm("Are you sure you want to remove this connection?")) return;
      if (!profileUser) return;
      const batch = writeBatch(db);

      const currentUserRef = doc(db, 'users', currentUser.sub);
      batch.update(currentUserRef, { connections: arrayRemove(profileUser.id) });

      const otherUserRef = doc(db, 'users', profileUser.id);
      batch.update(otherUserRef, { connections: arrayRemove(currentUser.sub) });

      try {
          await batch.commit();
           // Update global user state for immediate UI feedback
          setUser(prevUser => ({
            ...prevUser,
            connections: (prevUser.connections || []).filter(id => id !== profileUser.id)
          }));
      } catch(error) {
          console.error("Error disconnecting:", error);
      }
  };

  const handleMessage = async () => {
    if (!currentUser || !profileUser) return;
    const participants = [currentUser.sub, profileUser.id].sort();
    const conversationQuery = query(
        collection(db, 'conversations'),
        where('participants', '==', participants)
    );
    try {
        const querySnapshot = await getDocs(conversationQuery);
        if (!querySnapshot.empty) {
            const conversationId = querySnapshot.docs[0].id;
            navigate(`/messages/${conversationId}`);
        } else {
            const newConversationRef = await addDoc(collection(db, 'conversations'), {
                participants,
                participantInfo: {
                    [currentUser.sub]: { name: currentUser.name, picture: currentUser.picture, lastRead: serverTimestamp() },
                    [profileUser.id]: { name: profileUser.name, picture: profileUser.picture, lastRead: new Date(0) }
                },
                lastMessage: '',
                lastMessageTimestamp: serverTimestamp()
            });
            navigate(`/messages/${newConversationRef.id}`);
        }
    } catch (error) {
        console.error("Error finding or creating conversation:", error);
    }
  };

  const renderConnectionButton = () => {
    // We remove 'loading' from here because the main useEffect handles it
    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="connected-actions">
            <button className="profile-action-btn connected" onClick={handleDisconnect}><UserCheck size={16} /> Connected</button>
            <button className="profile-action-btn message" onClick={handleMessage}><MessageSquare size={16} /> Message</button>
          </div>
        );
      case 'pending_sent':
        return <button className="profile-action-btn pending" onClick={handleCancelRequest}><Clock size={16} /> Request Sent</button>;
      case 'pending_received':
        return (
          <div className="request-response-btns">
            <button className="profile-action-btn accept" onClick={() => handleRespondToRequest('accepted')}>Accept</button>
            <button className="profile-action-btn reject" onClick={() => handleRespondToRequest('rejected')}>Reject</button>
          </div>
        );
      case 'not_connected':
        return <button className="profile-action-btn connect" onClick={() => handleSendRequest('connection')}><UserPlus size={16} /> Connect</button>;
      default:
        return null;
    }
  };
  
  if (loading) return <div className="profile-page-container"><p>Loading profile...</p></div>;
  if (!profileUser) return <div className="profile-page-container"><p>User not found.</p></div>;

  const age = calculateAge(profileUser.dob);
  const connectionCount = profileUser.connections ? profileUser.connections.length : 0;

  return (
    <div className="profile-page-container">
        <div className="profile-header-banner">
            
            {isOwnProfile && (
              <div className="profile-edit-button-container">
                <button className="profile-action-btn edit-profile" onClick={() => navigate('/edit-profile')}>
                    <Edit3 size={16} /> Edit Profile
                </button>
              </div>
            )}

            <div className="profile-avatar-wrapper">
                <img src={profileUser.picture} alt={profileUser.name} className="profile-main-avatar" />
                {isOwnProfile && (
                    <button className="change-photo-btn" onClick={() => fileInputRef.current.click()}>
                        <Camera size={20} />
                        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload}/>
                    </button>
                )}
                {isUploading && <div className="upload-spinner"></div>}
            </div>
        </div>
        
        <div className="profile-view">
            <div className="profile-details">

                {!isOwnProfile && (
                  <div className="profile-actions-header">
                    {renderConnectionButton()}
                  </div>
                )}
                
                <h1>{profileUser.name}</h1>
                <div className="profile-meta">
                    <span className={`profile-role ${profileUser.role}`}>{profileUser.role || 'Not Specified'}</span>
                    {age && <span> • {age} years old</span>}
                    {profileUser.homeState && <span> • From {profileUser.homeState}</span>}
                    <span> • <Link to={`/profile/${userId}/connections`} className="connections-link">{connectionCount} Connections</Link></span>
                </div>
            </div>

            <div className="profile-info-grid">
              <div className="info-item">
                  <h4>Primary Sport</h4>
                  <p>{profileUser.primarySport || 'Not Specified'}</p>
              </div>
              <div className="info-item">
                  <h4>Email</h4>
                  <p>{profileUser.email || 'Not Specified'}</p>
              </div>
              <div className="info-item full-width">
                  <h4>Bio & Experience</h4>
                  <p className="profile-bio">{profileUser.experience || 'No bio provided.'}</p>
              </div>
              <div className="info-item full-width">
                  <h4>Key Achievements</h4>
                  <p>{profileUser.achievements || 'No achievements listed.'}</p>
              </div>
            </div>
        </div>
    </div>
  );
};

export default Profile;

