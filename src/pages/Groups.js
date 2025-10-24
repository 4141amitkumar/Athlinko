import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import './Groups.css';

const Groups = ({ currentUser }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'groups'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroups(groupsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupDesc.trim()) return;

    try {
      await addDoc(collection(db, 'groups'), {
        name: newGroupName,
        description: newGroupDesc,
        creatorId: currentUser.sub,
        creatorName: currentUser.name,
        members: [currentUser.sub],
        createdAt: serverTimestamp(),
      });
      setNewGroupName('');
      setNewGroupDesc('');
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating group: ", error);
    }
  };

  return (
    <div className="groups-page-container">
      <div className="groups-header">
        <h1>Communities</h1>
        <p>Find or create groups based on your sport, location, or interests.</p>
        <button className="create-group-btn" onClick={() => setShowCreateForm(!showCreateForm)}>
          <PlusCircle size={20} />
          {showCreateForm ? 'Cancel' : 'Create New Group'}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-group-form-container">
          <form onSubmit={handleCreateGroup}>
            <h3>New Community</h3>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Community Name (e.g., Punjab Cricketers)"
              required
            />
            <textarea
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              placeholder="What is this community about?"
              rows="3"
              required
            />
            <button type="submit" disabled={!newGroupName.trim() || !newGroupDesc.trim()}>
              Create Community
            </button>
          </form>
        </div>
      )}

      <div className="groups-grid">
        {loading ? <p>Loading communities...</p> : groups.map(group => (
          <Link to={`/groups/${group.id}`} key={group.id} className="group-card">
            <h3>{group.name}</h3>
            <p>{group.description}</p>
            <div className="group-card-footer">
              <span>{group.members.length} member(s)</span>
              <span>Created by {group.creatorName}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Groups;
