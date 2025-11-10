import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import './GroupDetail.css';

const GroupDetail = ({ currentUser }) => {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    // Get group details
    const groupRef = doc(db, 'groups', groupId);
    const unsubscribeGroup = onSnapshot(groupRef, (docSnap) => {
      if (docSnap.exists()) {
        const groupData = { id: docSnap.id, ...docSnap.data() };
        setGroup(groupData);
        setIsMember(groupData.members?.includes(currentUser.uid)); // Use uid instead of sub
      } else {
        setGroup(null);
      }
      setLoading(false);
    });

    // Get group posts
    const postsQuery = query(collection(db, 'groups', groupId, 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeGroup();
      unsubscribePosts();
    };
  }, [groupId, currentUser.uid]); // Use uid instead of sub

  const handleJoinLeave = async () => {
    const groupRef = doc(db, 'groups', groupId);
    try {
      await updateDoc(groupRef, {
        members: isMember ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) // Use uid instead of sub
      });
    } catch (error) {
      console.error("Error updating membership:", error);
    }
  };

  const handleCreatePost = async (postText, imageFile) => {
    // This will be simpler than the main feed's, without image support for now
    if (!postText.trim()) return;
    try {
      await addDoc(collection(db, 'groups', groupId, 'posts'), {
        user: { name: currentUser.name, avatar: currentUser.picture, userId: currentUser.uid }, // Use uid instead of sub
        content: { text: postText, image: null },
        likes: 0,
        comments: 0,
        likedBy: [],
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error creating group post:", error);
    }
  };

  if (loading) return <p className="loading-text-center">Loading Community...</p>;
  if (!group) return <p className="loading-text-center">Community not found.</p>;

  return (
    <div className="group-detail-page">
      <div className="group-detail-header">
        <div className="header-content">
          <h1>{group.name}</h1>
          <p>{group.description}</p>
          <div className="header-meta">
            <span>{group.members.length} member(s)</span>
            <button onClick={handleJoinLeave} className={`join-leave-btn ${isMember ? 'leave' : 'join'}`}>
              {isMember ? 'Leave Community' : 'Join Community'}
            </button>
          </div>
        </div>
      </div>

      <div className="group-detail-body">
        {isMember ? (
          <>
            <CreatePost user={currentUser} onCreatePost={handleCreatePost} />
            <div className="group-posts-feed">
              {posts.map(post => (
                <PostCard key={post.id} post={post} user={currentUser} onLike={() => {}} onDelete={() => {}} />
              ))}
              {posts.length === 0 && <p>No posts in this community yet. Start the conversation!</p>}
            </div>
          </>
        ) : (
          <div className="join-prompt">
            <h2>Join this community to see the feed and post.</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetail;