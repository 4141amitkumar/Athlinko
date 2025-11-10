import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Trash2, X } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import './PostCard.css';

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Just now';
  const date = timestamp.toDate();
  return date.toLocaleString('en-US', { /* ... format options ... */ });
};

const PostCard = ({ post, user, onLike, onDelete }) => {
  const { content, likes, timestamp } = post;

  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showCopyNotification, setShowCopyNotification] = useState(false); // ✅ Share notification ke liye state
  
  const userId = user ? user.uid : null; // Use uid instead of sub
  const isLiked = post.likedBy?.includes(userId);
  const isOwner = user && user.uid === post.user.userId; // Use uid instead of sub

  useEffect(() => {
    const commentsQuery = query(collection(db, 'posts', post.id, 'comments'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      setCommentsList(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsubscribe();
  }, [post.id]);

  const handleCommentSubmit = async (e) => { /* ... comment submit logic ... */ };
  const handleDeleteComment = async (commentId) => { /* ... comment delete logic ... */ };

  // ✅ Share button ka function
  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`; // Ek unique URL banayein
    navigator.clipboard.writeText(postUrl).then(() => {
      setShowCopyNotification(true);
      setTimeout(() => {
        setShowCopyNotification(false);
      }, 2000); // Notification 2 second ke baad gayab ho jayega
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <div className="post-card">
      {/* ✅ Share notification ko yahan display karein */}
      {showCopyNotification && <div className="share-notification">Link Copied!</div>}

      {isOwner && ( <button className="delete-post-btn" onClick={() => onDelete(post)}><Trash2 size={18} /></button> )}
      <div className="post-header"> {/* ... post header ... */} </div>
      <div className="post-content"> {/* ... post content ... */} </div>
      <div className="post-stats"> {/* ... post stats ... */} </div>
      
      <div className="post-actions">
        <div className={`action-button ${isLiked ? 'liked' : ''}`} onClick={() => onLike(post.id)}>
          <Heart size={20} fill={isLiked ? '#c91c3b' : 'none'} stroke={isLiked ? '#c91c3b' : 'currentColor'} />
          <span>Like</span>
        </div>
        <div className="action-button" onClick={() => setShowComments(!showComments)}>
          <MessageCircle size={20} />
          <span>Comment</span>
        </div>
        {/* ✅ Share button ko onClick event dein */}
        <div className="action-button" onClick={handleShare}><Share2 size={20} /><span>Share</span></div>
      </div>

      {showComments && ( <div className="comments-section"> {/* ... comments section ... */} </div> )}
    </div>
  );
};

// Full component code for clarity, including placeholder functions
const TformatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate();
    return date.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
};

const FPostCard = ({ post, user, onLike, onDelete }) => {
    const { content, likes, timestamp } = post;
    const [showComments, setShowComments] = useState(false);
    const [commentsList, setCommentsList] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [showCopyNotification, setShowCopyNotification] = useState(false);
    const userId = user ? user.uid : null; // Use uid instead of sub
    const isLiked = post.likedBy?.includes(userId);
    const isOwner = user && user.uid === post.user.userId; // Use uid instead of sub

    useEffect(() => {
        const commentsQuery = query(collection(db, 'posts', post.id, 'comments'), orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            setCommentsList(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        });
        return () => unsubscribe();
    }, [post.id]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        try {
            await addDoc(collection(db, 'posts', post.id, 'comments'), {
                text: newComment,
                user: { name: user.name, avatar: user.picture, userId: user.uid }, // Use uid instead of sub
                timestamp: serverTimestamp()
            });
            await updateDoc(doc(db, 'posts', post.id), { comments: increment(1) });
            setNewComment('');
        } catch (error) { console.error('Error adding comment:', error); }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await deleteDoc(doc(db, 'posts', post.id, 'comments', commentId));
            await updateDoc(doc(db, 'posts', post.id), { comments: increment(-1) });
        } catch (error) { console.error('Error deleting comment:', error); }
    };

    const handleShare = () => {
        const postUrl = `${window.location.origin}/feed#${post.id}`;
        navigator.clipboard.writeText(postUrl).then(() => {
            setShowCopyNotification(true);
            setTimeout(() => setShowCopyNotification(false), 2000);
        }).catch(err => console.error('Failed to copy: ', err));
    };

    return (
        <div className="post-card">
            {showCopyNotification && <div className="share-notification">Link Copied!</div>}
            {isOwner && (<button className="delete-post-btn" onClick={() => onDelete(post)}><Trash2 size={18} /></button>)}
            <div className="post-header">
                <img src={post.user.avatar} alt={`${post.user.name}'s avatar`} className="post-avatar" />
                <div className="post-user-info">
                    <span className="post-user-name">{post.user.name}</span>
                    <span className="post-timestamp">{TformatTimestamp(timestamp)}</span>
                </div>
            </div>
            <div className="post-content">
                {content.text && <p>{content.text}</p>}
                {content.image && (<div className="post-image-container"><img src={content.image} alt="Post content" className="post-image" /></div>)}
            </div>
            <div className="post-stats">
                <span>{likes} Likes</span>
                <span>{commentsList.length} Comments</span>
            </div>
            <div className="post-actions">
                <div className={`action-button ${isLiked ? 'liked' : ''}`} onClick={() => onLike(post.id)}>
                    <Heart size={20} fill={isLiked ? '#c91c3b' : 'none'} stroke={isLiked ? '#c91c3b' : 'currentColor'} />
                    <span>Like</span>
                </div>
                <div className="action-button" onClick={() => setShowComments(!showComments)}>
                    <MessageCircle size={20} />
                    <span>Comment</span>
                </div>
                <div className="action-button" onClick={handleShare}>
                    <Share2 size={20} />
                    <span>Share</span>
                </div>
            </div>
            {showComments && (
                <div className="comments-section">
                    <form className="comment-input-form" onSubmit={handleCommentSubmit}>
                        <img src={user?.picture} alt="Your avatar" className="comment-avatar" />
                        <input type="text" className="comment-input" placeholder="Write a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                        <button type="submit" className="comment-submit-btn" disabled={!newComment.trim()}>Post</button>
                    </form>
                    <div className="comments-list">
                        {commentsList.map(comment => {
                            const isCommentOwner = user && user.uid === comment.user.userId; // Use uid instead of sub
                            return (
                                <div key={comment.id} className="comment">
                                    <img src={comment.user.avatar} alt="Commenter's avatar" className="comment-avatar" />
                                    <div className="comment-content">
                                        <span className="comment-user-name">{comment.user.name}</span>
                                        <p className="comment-text">{comment.text}</p>
                                    </div>
                                    {isCommentOwner && (<button className="comment-delete-btn" onClick={() => handleDeleteComment(comment.id)}><X size={14} /></button>)}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FPostCard;