import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, storage } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp, arrayUnion, arrayRemove, writeBatch, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Edit3, UserPlus, UserCheck, Clock, MessageSquare, Star, Award, PlusCircle } from 'lucide-react';
import PlayerStats from '../components/PlayerStats'; // Import the new component
import SkeletonLoader from '../components/SkeletonLoader'; // Import SkeletonLoader
import { createNotification } from '../utils/notifications'; // Import notification helper
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
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // State for active tab

  useEffect(() => {
    // Reset state when userId changes
    setLoading(true);
    setProfileUser(null);
    setConnectionStatus('loading');
    setActiveTab('info');

    if (!userId) {
      setLoading(false);
      return;
    }

    const ownProfileCheck = currentUser && currentUser.uid === userId;
    setIsOwnProfile(ownProfileCheck);
    
    // Real-time listener for the profile user's data
    const unsubProfileUser = onSnapshot(doc(db, 'users', userId), (docSnap) => {
      if (docSnap.exists()) {
        const userData = { id: docSnap.id, ...docSnap.data() };
        setProfileUser(userData);

        if (!ownProfileCheck && currentUser) {
            
            // --- YEH RAHA FIX (Self-Healing Logic) ---
            
            // currentUser = Viewer (Aap)
            // userData = Profile owner (Jiska profile dekh rahe hain)
            // userId = Profile owner's ID

            // Case 1: Agar main (viewer) already connected hoon (meri list mein ID hai)
            if (currentUser.connections?.includes(userId)) {
                setConnectionStatus('connected');

                // Self-Heal (Part 1): Agar meri list mein hai, par unki list mein nahi, toh add kar dein.
                // (Aisa tab ho sakta hai agar sender ne request accept ki thi)
                if (!userData.connections?.includes(currentUser.uid)) {
                    console.log(`Self-healing: Adding ${currentUser.uid} to ${userId}'s connections`);
                    const profileUserRef = doc(db, 'users', userId);
                    updateDoc(profileUserRef, { connections: arrayUnion(currentUser.uid) });
                }
            
            // Case 2: Agar main connected nahi hoon, par woh (profile owner) mujhse connected hai
            } else if (userData.connections?.includes(currentUser.uid)) {
                setConnectionStatus('connected');
                
                // Self-Heal (Part 2): Unki list mein hai, par meri list mein nahi. Apni list update karo.
                // (Aisa tab hoga jab maine request bheji thi aur unhone accept ki)
                console.log(`Self-healing: Adding ${userId} to ${currentUser.uid}'s connections`);
                const currentUserRef = doc(db, 'users', currentUser.uid);
                updateDoc(currentUserRef, { connections: arrayUnion(userId) });

            } else {
                // Case 3: Koi bhi connected nahi hai. Ab requests check karo.
                
                // q1: Kya maine (viewer) unhe (profile owner) request bhej rakhi hai?
                // Yahaan status filter nahi karenge, taaki 'accepted' bhi pakad sakein
                const q1 = query(collection(db, 'requests'), where('senderId', '==', currentUser.uid), where('receiverId', '==', userId));
                getDocs(q1).then(sentSnap => {
                    if (!sentSnap.empty) {
                        const request = sentSnap.docs[0].data();
                        if (request.status === 'pending') {
                            setConnectionStatus('pending_sent');
                            setRequestDocId(sentSnap.docs[0].id);
                        } else if (request.status === 'accepted') {
                            // Self-Heal (Part 3): Request accepted hai, par list update nahi hui.
                            console.log(`Self-healing: Found accepted request, updating lists.`);
                            setConnectionStatus('connected');
                            const myRef = doc(db, 'users', currentUser.uid);
                            updateDoc(myRef, { connections: arrayUnion(userId) }); // Apni list update karo
                        } else {
                            // Status 'rejected' hai
                            setConnectionStatus('not_connected');
                        }
                    } else {
                        // q2: Kya unhone (profile owner) mujhe (viewer) PENDING request bhej rakhi hai?
                        const q2 = query(collection(db, 'requests'), where('senderId', '==', userId), where('receiverId', '==', currentUser.uid), where('status', '==', 'pending'));
                        getDocs(q2).then(receivedSnap => {
                            if (!receivedSnap.empty) {
                                setConnectionStatus('pending_received');
                                setRequestDocId(receivedSnap.docs[0].id);
                            } else {
                                // Na koi connection, na koi pending/accepted request
                                setConnectionStatus('not_connected');
                            }
                        });
                    }
                });
            }
        }
      } else {
        setProfileUser(null);
      }
      setLoading(false);
    });

    // Listener for coach's wishlist
    let unsubWishlist;
    if (currentUser?.role === 'coach' && !ownProfileCheck) {
        unsubWishlist = onSnapshot(doc(db, 'users', currentUser.uid), (coachDoc) => { // Use uid
            if (coachDoc.exists()) {
                const coachData = coachDoc.data();
                setIsInWishlist(coachData.wishlist?.includes(userId) || false);
            }
        });
    }

    return () => {
      unsubProfileUser();
      if (unsubWishlist) unsubWishlist();
    };
  }, [userId, currentUser]); // currentUser par depend karein taaki viewer ki list update hone par re-run ho

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
        senderId: currentUser.uid,
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
      
       // ** NOTIFICATION TRIGGER **
       await createNotification(
            profileUser.id, 
            `${currentUser.name} sent you a connection request.`, 
            `/profile/${currentUser.uid}` // Link back to sender's profile
       );

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
  
        const currentUserRef = doc(db, 'users', currentUser.uid);
        batch.update(currentUserRef, { connections: arrayUnion(profileUser.id) });
  
        // Sender ki list update karne waali line HATA DI GAYI hai (self-heal logic handle karega)
        // const senderUserRef = doc(db, 'users', profileUser.id);
        // batch.update(senderUserRef, { connections: arrayUnion(currentUser.uid) });
  
        await batch.commit();
        
        setUser(prevUser => ({
          ...prevUser,
          connections: [...(prevUser.connections || []), profileUser.id]
        }));
        
        // ** NOTIFICATION TRIGGER **
        await createNotification(
            profileUser.id, // The user who sent the request
            `${currentUser.name} accepted your connection request.`,
            `/profile/${currentUser.uid}` // Link to current user's profile
        );

      } else { 
        await updateDoc(doc(db, 'requests', requestDocId), {
            status: 'rejected',
            updatedAt: serverTimestamp(),
        });
      }
      setConnectionStatus('not_connected'); // Go back to not connected state
      setRequestDocId(null);
    } catch (error) {
      console.error("Error responding to request:", error);
    }
  };

  const handleDisconnect = async () => {
      // Use a simple confirm dialog (replace with modal for better UX later)
      if (!window.confirm("Are you sure you want to remove this connection?")) {
          return;
      }
      if (!profileUser) return;
      const batch = writeBatch(db);

      const currentUserRef = doc(db, 'users', currentUser.uid);
      batch.update(currentUserRef, { connections: arrayRemove(profileUser.id) });

      const otherUserRef = doc(db, 'users', profileUser.id);
      batch.update(otherUserRef, { connections: arrayRemove(currentUser.uid) });

      try {
          await batch.commit();
          setUser(prevUser => ({
            ...prevUser,
            connections: (prevUser.connections || []).filter(id => id !== profileUser.id)
          }));
          setConnectionStatus('not_connected'); // Update status
      } catch(error) {
          console.error("Error disconnecting:", error);
      }
  };

  const handleMessage = async () => {
    if (!currentUser || !profileUser) return;
    const participants = [currentUser.uid, profileUser.id].sort();
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
                    [currentUser.uid]: { name: currentUser.name, picture: currentUser.picture, lastRead: serverTimestamp() },
                    [profileUser.id]: { name: profileUser.name, picture: profileUser.picture, lastRead: new Date(0) }
                },
                lastMessage: '',
                lastMessageSenderId: null,
                lastMessageTimestamp: serverTimestamp()
            });
            navigate(`/messages/${newConversationRef.id}`);
        }
    } catch (error) {
        console.error("Error finding or creating conversation:", error);
    }
  };

  const handleWishlistToggle = async () => {
    if (currentUser?.role !== 'coach' || !profileUser) return;

    const coachRef = doc(db, 'users', currentUser.uid);
    try {
        await updateDoc(coachRef, {
            wishlist: isInWishlist ? arrayRemove(profileUser.id) : arrayUnion(profileUser.id)
        });
        
        // ** NOTIFICATION TRIGGER **
        if (!isInWishlist) { // Only notify when adding
             await createNotification(
                profileUser.id, // The player
                `${currentUser.name} added you to their wishlist!`,
                `/profile/${currentUser.uid}` // Link to coach's profile
            );
        }

    } catch (error) {
        console.error("Error toggling wishlist:", error);
    }
  };

  const renderConnectionButton = () => {
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
        return null; // 'loading' state
    }
  };
  
  if (loading) return <SkeletonLoader type="profile" />; // Use Profile Skeleton
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
                    <>
                        <label htmlFor="profile-picture-upload" className="change-photo-btn">
                            <Camera size={20} />
                        </label>
                        <input type="file" id="profile-picture-upload" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload}/>
                    </>
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
                
                <h1>
                  {profileUser.name}
                  {profileUser.role === 'coach' && <Award className="expert-badge" size={24} />}
                </h1>
                <div className="profile-meta">
                    <span className={`profile-role ${profileUser.role}`}>{profileUser.role || 'Not Specified'}</span>
                    {age && <span> • {age} years old</span>}
                    {profileUser.homeState && <span> • From {profileUser.homeState}</span>}
                    <span> • <Link to={`/profile/${userId}/connections`} className="connections-link">{connectionCount} Connections</Link></span>
                </div>

                {currentUser?.role === 'coach' && !isOwnProfile && profileUser.role === 'player' && (
                    <div className="contextual-actions">
                        <button className="contextual-btn" onClick={handleWishlistToggle}>
                            <Star size={16} fill={isInWishlist ? '#f39c12' : 'none'} stroke={isInWishlist ? '#f39c12' : 'currentColor'} />
                            {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        </button>
                    </div>
                )}
            </div>
            
            <div className="profile-tabs">
                <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Info</button>
                <button className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>Stats</button>
            </div>

            {activeTab === 'info' ? (
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
            ) : (
                <div className="profile-stats-section">
                    {isOwnProfile && (
                        <div className="stats-header">
                            <button className="add-performance-btn" onClick={() => navigate('/add-performance')}>
                                <PlusCircle size={16} /> Add Performance
                            </button>
                        </div>
                    )}
                    <PlayerStats userId={userId} isOwnProfile={isOwnProfile} primarySport={profileUser.primarySport} />
                </div>
            )}
        </div>
    </div>
  );
};

export default Profile;