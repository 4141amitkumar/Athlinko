import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"; 
import { collection, query, onSnapshot, addDoc, doc, updateDoc, orderBy, serverTimestamp, arrayUnion, arrayRemove, increment, deleteDoc } from 'firebase/firestore';
import './Feed.css';

const Feed = ({ user }) => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsubscribe();
  }, []);

  const handleCreatePost = async (postText, imageFile) => {
    if (!postText.trim() && !imageFile) return;
    let imageUrl = null;
    if (imageFile) {
        const imageRef = ref(storage, `posts/${Date.now()}_${imageFile.name}`);
        try {
            const snapshot = await uploadBytes(imageRef, imageFile);
            imageUrl = await getDownloadURL(snapshot.ref);
        } catch (error) { console.error("IMAGE UPLOAD FAILED:", error); return; }
    }
    try {
        await addDoc(collection(db, 'posts'), {
            user: { name: user.name, avatar: user.picture, userId: user.sub },
            content: { text: postText, image: imageUrl },
            likes: 0, 
            comments: 0, // Initial comment count
            likedBy: [],
            timestamp: serverTimestamp(),
        });
    } catch (error) { console.error("FIRESTORE SAVE FAILED:", error); }
  };

  const handleDeletePost = async (postToDelete) => {
    if (!user || user.sub !== postToDelete.user.userId) return alert("You can only delete your own posts.");
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
        if (postToDelete.content.image) {
            const imageRef = ref(storage, postToDelete.content.image);
            await deleteObject(imageRef);
        }
        await deleteDoc(doc(db, 'posts', postToDelete.id));
    } catch (error) { console.error("Error deleting post: ", error); }
  };

  const handleLikePost = async (postId) => {
    if (!user) return;
    const postRef = doc(db, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    const userId = user.sub;
    const isAlreadyLiked = post.likedBy?.includes(userId);
    await updateDoc(postRef, {
        likedBy: isAlreadyLiked ? arrayRemove(userId) : arrayUnion(userId),
        likes: increment(isAlreadyLiked ? -1 : 1)
    });
  };
    
  return (
    <div className="feed-container">
      <CreatePost user={user} onCreatePost={handleCreatePost} />
      {posts.map(post => (
        <PostCard 
          key={post.id} 
          post={post} 
          user={user} 
          onLike={handleLikePost}
          onDelete={handleDeletePost}
        />
      ))}
    </div>
  );
};

export default Feed;

