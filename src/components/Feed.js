import React, { useState, useEffect } from 'react';
import PostCard from '../components/PostCard'; 
import CreatePost from '../components/CreatePost';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, query, onSnapshot, addDoc, doc, updateDoc, orderBy, serverTimestamp, arrayUnion, arrayRemove, increment, deleteDoc } from 'firebase/firestore';
import './Feed.css';

const Feed = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true); // Set loading true when starting fetch
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    }, (error) => { // Add error handling
      console.error("Error fetching posts:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreatePost = async (postText, imageFile) => {
    // Add check for user and user.uid
    if (!user?.uid) {
        console.error("User not logged in, cannot create post.");
        return;
    }
    if (!postText.trim() && !imageFile) return;

    let imageUrl = null;
    let imageRef = null; // Store image ref for potential deletion on error

    // Image Upload Logic
    if (imageFile) {
      imageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${imageFile.name}`); // Include user ID in path
      try {
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error("Image upload failed:", error);
        alert("Image upload failed. Please try again."); // Inform user
        return; // Stop post creation if image upload fails
      }
    }

    // Firestore Post Creation Logic
    try {
      await addDoc(collection(db, 'posts'), {
        user: { name: user.name, avatar: user.picture, userId: user.uid }, // Use user.uid
        content: { text: postText, image: imageUrl },
        likes: 0,
        comments: 0,
        likedBy: [],
        timestamp: serverTimestamp(),
      });
      // Reset form handled by CreatePost component after successful onCreatePost call
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again."); // Inform user
      // If image was uploaded but Firestore failed, delete the image
      if (imageUrl && imageRef) {
          try {
              await deleteObject(imageRef);
              console.log("Cleaned up orphaned image due to post creation error.");
          } catch (deleteError) {
              console.error("Error deleting orphaned image:", deleteError);
          }
      }
    }
  };

  const handleDeletePost = async (postToDelete) => {
    // Use user.uid for check
    if (!user?.uid || user.uid !== postToDelete.user.userId) {
         alert("You can only delete your own posts.");
         return;
    }
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      // Delete Image from Storage if it exists
      if (postToDelete.content.image) {
        try {
            // Attempt to create ref from URL - requires parsing or storing path separately
            // For simplicity, assuming the URL structure allows direct ref creation (might need adjustment)
            const imageRef = ref(storage, postToDelete.content.image);
            await deleteObject(imageRef);
        } catch (storageError) {
             // Log error but continue trying to delete Firestore doc
            console.error("Error deleting post image from storage (might be harmless if URL format changed or file already gone):", storageError);
        }
      }
      // Delete Post Document from Firestore
      await deleteDoc(doc(db, 'posts', postToDelete.id));
      // No need to update local state, onSnapshot will handle it
    } catch (error) {
      console.error("Error deleting post: ", error);
      alert("Failed to delete post. Please try again.");
    }
  };


  const handleLikePost = async (postId) => {
    // Use user.uid for check and update
    if (!user?.uid) return;
    const postRef = doc(db, 'posts', postId);
    // Find post in local state to check if already liked
    const post = posts.find(p => p.id === postId);
    if (!post) return; // Post might have been deleted

    const userId = user.uid; // Use uid
    const isAlreadyLiked = post.likedBy?.includes(userId);

    try {
        await updateDoc(postRef, {
            likedBy: isAlreadyLiked ? arrayRemove(userId) : arrayUnion(userId),
            likes: increment(isAlreadyLiked ? -1 : 1)
        });
         // No need to update local state, onSnapshot will handle it
    } catch (error) {
        console.error("Error liking/unliking post:", error);
    }
  };

  const handleCommentPost = async (postId, commentText) => {
    // Use user.uid
    if (!user?.uid) return alert("Please log in to comment.");
    if (!commentText.trim()) return; // Don't post empty comments

    try {
        const commentsCollectionRef = collection(db, 'posts', postId, 'comments');
        await addDoc(commentsCollectionRef, {
            text: commentText,
            // Use user.uid
            user: { name: user.name, avatar: user.picture, userId: user.uid },
            timestamp: serverTimestamp(),
        });
        // Update comment count on the post document
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, { comments: increment(1) });
         // Let onSnapshot update the UI
    } catch (error) {
        console.error("Error posting comment: ", error);
        alert("Failed to post comment. Please try again.");
    }
  };

    const handleDeleteComment = async (postId, commentId, commentUserId) => {
    // Use user.uid for check
    if (!user?.uid || user.uid !== commentUserId) {
        alert("You can only delete your own comments.");
        return;
    };
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    try {
      const commentRef = doc(db, 'posts', postId, 'comments', commentId);
      await deleteDoc(commentRef);
      // Decrement comment count on the post document
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments: increment(-1)
      });
       // Let onSnapshot update the UI
    } catch (error) {
      console.error("Error deleting comment: ", error);
      alert("Failed to delete comment.");
    }
  };


  return (
    <div className="feed-container">
      {/* Pass user object which now includes uid */}
      <CreatePost user={user} onCreatePost={handleCreatePost} />
      {loading ? (
        <p>Loading feed...</p>
      ) : posts.length > 0 ? (
        posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            user={user} // Pass user object which now includes uid
            onLike={handleLikePost}
            onDelete={handleDeletePost}
            onComment={handleCommentPost}
            onDeleteComment={handleDeleteComment} // Pass down delete comment handler
          />
        ))
      ) : (
        <p>No posts yet. Be the first to share something!</p>
      )}
    </div>
  );
};

export default Feed;
