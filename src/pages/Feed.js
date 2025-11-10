import React, { useState, useEffect } from 'react';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import SkeletonLoader from '../components/SkeletonLoader'; // Skeleton loader import
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, query, onSnapshot, addDoc, doc, updateDoc, orderBy, serverTimestamp, arrayUnion, arrayRemove, increment, deleteDoc, getDoc } from 'firebase/firestore';
import { createNotification } from '../utils/notifications'; // Notification helper import
import './Feed.css'; // Page-specific styles

const Feed = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true); 
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    }, (error) => { 
      console.error("Error fetching posts:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreatePost = async (postText, imageFile) => {
    if (!user?.uid) {
        console.error("User not logged in, cannot create post.");
        return;
    }
    if (!postText.trim() && !imageFile) return;

    let imageUrl = null;
    let imageRef = null; 

    if (imageFile) {
      imageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${imageFile.name}`);
      try {
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error("Image upload failed:", error);
        return; 
      }
    }

    try {
      await addDoc(collection(db, 'posts'), {
        user: { name: user.name, avatar: user.picture, userId: user.uid },
        content: { text: postText, image: imageUrl },
        likes: 0,
        comments: 0,
        likedBy: [],
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error creating post:", error);
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
    if (!user?.uid || user.uid !== postToDelete.user.userId) {
         console.error("You can only delete your own posts.");
         return;
    }
    
    try {
      if (postToDelete.content.image) {
        try {
            const imageRef = ref(storage, postToDelete.content.image);
            await deleteObject(imageRef);
        } catch (storageError) {
            console.error("Error deleting post image from storage:", storageError);
        }
      }
      await deleteDoc(doc(db, 'posts', postToDelete.id));
    } catch (error) {
      console.error("Error deleting post: ", error);
    }
  };


  const handleLikePost = async (postId) => {
    if (!user?.uid) return;
    const postRef = doc(db, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    if (!post) return; 

    const userId = user.uid;
    const isAlreadyLiked = post.likedBy?.includes(userId);

    try {
        await updateDoc(postRef, {
            likedBy: isAlreadyLiked ? arrayRemove(userId) : arrayUnion(userId),
            likes: increment(isAlreadyLiked ? -1 : 1)
        });
        
        // ** NOTIFICATION TRIGGER **
        // Bhejein agar user like kar raha hai (unlike nahi), aur user khud ka post like nahi kar raha
        if (!isAlreadyLiked && post.user.userId !== user.uid) {
          createNotification(
            post.user.userId, // Post ke owner ko bhejein
            `${user.name} liked your post.`, // Message
            `/feed` // TODO: `/post/${postId}` behtar link hoga
          );
        }

    } catch (error) {
        console.error("Error liking/unliking post:", error);
    }
  };

  const handleCommentPost = async (postId, commentText) => {
    if (!user?.uid) {
        console.error("Please log in to comment.");
        return;
    }
    if (!commentText.trim()) return;

    try {
        const commentsCollectionRef = collection(db, 'posts', postId, 'comments');
        await addDoc(commentsCollectionRef, {
            text: commentText,
            user: { name: user.name, avatar: user.picture, userId: user.uid },
            timestamp: serverTimestamp(),
        });
        
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, { comments: increment(1) });

        // ** NOTIFICATION TRIGGER **
        // Pehle post data fetch karein taaki owner ID mil sake
        const postDoc = await getDoc(postRef);
        const postOwnerId = postDoc.data()?.user?.userId;

        // Agar post owner valid hai aur user khud ke post par comment nahi kar raha
        if (postOwnerId && postOwnerId !== user.uid) {
          createNotification(
            postOwnerId, // Post ke owner ko bhejein
            `${user.name} commented on your post.`, // Message
            `/feed` // TODO: `/post/${postId}` behtar link hoga
          );
        }

    } catch (error) {
        console.error("Error posting comment: ", error);
    }
  };

    const handleDeleteComment = async (postId, commentId, commentUserId) => {
    if (!user?.uid || user.uid !== commentUserId) {
        console.error("You can only delete your own comments.");
        return;
    };

    try {
      const commentRef = doc(db, 'posts', postId, 'comments', commentId);
      await deleteDoc(commentRef);
      
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments: increment(-1)
      });
    } catch (error) {
      console.error("Error deleting comment: ", error);
    }
  };


  return (
    <div className="feed-container">
      <CreatePost user={user} onCreatePost={handleCreatePost} />
      
      {loading ? (
        <SkeletonLoader type="feed" />
      ) : posts.length > 0 ? (
        posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            user={user}
            onLike={handleLikePost}
            onDelete={handleDeletePost}
            onComment={handleCommentPost}
            onDeleteComment={handleDeleteComment}
          />
        ))
      ) : (
        <p>No posts yet. Be the first to share something!</p>
      )}
    </div>
  );
};

export default Feed;