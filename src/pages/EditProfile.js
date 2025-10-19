import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './EditProfile.css';

const EditProfile = ({ currentUser, setUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    role: 'player',
    dob: '',
    homeState: '',
    primarySport: '',
    experience: '',
    achievements: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser && currentUser.sub) {
        const userDocRef = doc(db, 'users', currentUser.sub);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setFormData({
            name: userData.name || '',
            role: userData.role || 'player',
            dob: userData.dob || '',
            homeState: userData.homeState || '',
            primarySport: userData.primarySport || '',
            experience: userData.experience || '',
            achievements: userData.achievements || '',
          });
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.sub);
      await updateDoc(userDocRef, formData);
      
      // Poore application ke state ko update karein
      const updatedUser = { ...currentUser, ...formData };
      setUser(updatedUser);

      navigate(`/profile/${currentUser.sub}`); // Save karne ke baad profile par wapas bhej dein
    } catch (error) {
      console.error("Error updating profile: ", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="edit-profile-container">
      <form className="edit-profile-form" onSubmit={handleSave}>
        <h1>Edit Your Profile</h1>
        
        <label>Name</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} />

        <label>Role</label>
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="player">Player</option>
          <option value="coach">Coach</option>
        </select>

        <label>Date of Birth</label>
        <input type="date" name="dob" value={formData.dob} onChange={handleChange} />

        <label>Home State</label>
        <input type="text" name="homeState" placeholder="e.g., Punjab" value={formData.homeState} onChange={handleChange} />
        
        <label>Primary Sport</label>
        <input type="text" name="primarySport" placeholder="e.g., Cricket" value={formData.primarySport} onChange={handleChange} />

        <label>Professional Experience / Bio</label>
        <textarea name="experience" placeholder="Tell us about your journey..." value={formData.experience} onChange={handleChange}></textarea>

        <label>Achievements</label>
        <textarea name="achievements" placeholder="Your key achievements..." value={formData.achievements} onChange={handleChange}></textarea>
        
        <div className="form-actions">
          <button type="submit" className="save-btn" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
          <button type="button" className="cancel-btn" onClick={() => navigate(`/profile/${currentUser.sub}`)}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
