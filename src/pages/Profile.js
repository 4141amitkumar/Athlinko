import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db, storage } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Edit3 } from 'lucide-react';
import './Profile.css';

// Age calculate karne ka helper function
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
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const fileInputRef = useRef(null);

  // User ka data fetch karein
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const userDocRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const userData = { id: docSnap.id, ...docSnap.data() };
        setProfileUser(userData);
        setFormData(userData); // Edit form ke liye data set karein
      } else {
        console.log("No such user!");
      }
      setLoading(false);
    };
    if (userId) {
        fetchUser();
    }
  }, [userId]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const storageRef = ref(storage, `profilePictures/${userId}`);
    try {
        const snapshot = await uploadBytes(storageRef, file);
        const newImageUrl = await getDownloadURL(snapshot.ref);
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, { picture: newImageUrl });
        
        const updatedUser = { ...currentUser, picture: newImageUrl };
        setUser(updatedUser); // Poore app ka state update karein
        setProfileUser(prev => ({...prev, picture: newImageUrl}));
        setFormData(prev => ({...prev, picture: newImageUrl}));
    } catch (error) {
        console.error("Error updating profile picture: ", error);
    } finally {
        setIsUploading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const userDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(userDocRef, formData);
      const updatedUser = { ...currentUser, ...formData };
      setUser(updatedUser); // Poore app ka state update karein
      setProfileUser(updatedUser);
      setEditMode(false); // Edit mode se bahar aayein
    } catch (error) {
      console.error("Error updating profile: ", error);
    }
  };

  if (loading) return <div className="profile-page-container"><p>Loading profile...</p></div>;
  if (!profileUser) return <div className="profile-page-container"><p>User not found.</p></div>;

  const isOwnProfile = currentUser && currentUser.sub === profileUser.id;
  const age = calculateAge(profileUser.dob);

  return (
    <div className="profile-page-container">
      <div className="profile-header-banner">
        <div className="profile-avatar-wrapper">
          <img src={profileUser.picture} alt={profileUser.name} className="profile-main-avatar" />
          {isOwnProfile && !editMode && (
            <button className="change-photo-btn" onClick={() => fileInputRef.current.click()}>
              <Camera size={20} />
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload}/>
            </button>
          )}
          {isUploading && <div className="upload-spinner"></div>}
        </div>
        {isOwnProfile && !editMode && (
          <button className="edit-profile-btn" onClick={() => setEditMode(true)}>
            <Edit3 size={16} /> Edit Profile
          </button>
        )}
      </div>
      
      {editMode ? (
        // --- EDIT MODE ---
        <form className="profile-edit-form" onSubmit={handleProfileUpdate}>
           <h2>Edit Your Information</h2>
           <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" name="dob" value={formData.dob || ''} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select name="role" value={formData.role || 'player'} onChange={handleInputChange}>
                <option value="player">Player</option>
                <option value="coach">Coach</option>
              </select>
            </div>
            <div className="form-group">
              <label>Home State</label>
              <input type="text" name="homeState" placeholder="e.g., Punjab" value={formData.homeState || ''} onChange={handleInputChange} />
            </div>
            <div className="form-group full-width">
              <label>Primary Sport (Professional)</label>
              <input type="text" name="primarySport" placeholder="e.g., Cricket, Wrestling" value={formData.primarySport || ''} onChange={handleInputChange} />
            </div>
            <div className="form-group full-width">
              <label>Bio / Professional Experience</label>
              <textarea name="experience" rows="4" placeholder="Tell us about your journey..." value={formData.experience || ''} onChange={handleInputChange}></textarea>
            </div>
            <div className="form-group full-width">
              <label>Key Achievements (comma separated)</label>
              <textarea name="achievements" rows="3" placeholder="e.g., National Gold Medal 2024" value={formData.achievements || ''} onChange={handleInputChange}></textarea>
            </div>
          </div>
          <div className="edit-actions">
            <button type="button" className="cancel-btn" onClick={() => setEditMode(false)}>Cancel</button>
            <button type="submit" className="save-btn">Save Changes</button>
          </div>
        </form>
      ) : (
        // --- VIEW MODE ---
        <div className="profile-view">
            <div className="profile-details">
                <h1>{profileUser.name}</h1>
                <div className="profile-meta">
                    <div className="profile-role-container">
                        <span className={`profile-role ${profileUser.role}`}>{profileUser.role || 'Not Specified'}</span>
                    </div>
                    <div className="profile-sub-meta">
                        {profileUser.homeState && age && <span> •</span>}
                        {age && <span>{age} years old     </span>}
                        {profileUser.homeState && age && <span>       •</span>}
                        {profileUser.homeState && <span>From {profileUser.homeState}</span>}
                    </div>
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
                    {profileUser.achievements ? (
                        <ul className="achievements-list">
                            {profileUser.achievements.split(',').map((item, index) => (
                                <li key={index}>{item.trim()}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No achievements listed.</p>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

