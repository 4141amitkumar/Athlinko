import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { Heart, MessageCircle, Share2, Trash2, X } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import './PostCard.css';

// Full, corrected timestamp formatter
const formatTimestamp = (timestamp) => {
    if (!timestamp?.toDate) return 'Just now';
    try {
        const now = new Date();
        const date = timestamp.toDate();
        const seconds = Math.floor((now - date) / 1000);

        let interval = seconds / 31536000; // years
        if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " year ago" : " years ago");
        interval = seconds / 2592000; // months
        if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " month ago" : " months ago");
        interval = seconds / 86400; // days
        if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " day ago" : " days ago");
        interval = seconds / 3600; // hours
        if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " hour ago" : " hours ago");
        interval = seconds / 60; // minutes
        if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " minute ago" : " minutes ago");
        if (seconds < 10) return "Just now";
        return Math.floor(seconds) + " seconds ago";
    } catch (e) {
        return 'A while ago';
    }
};

// *** BUG FIX ***
// Cleaned up the file, removed the duplicate component, and implemented all functions.
const PostCard = ({ post, user, onLike, onDelete, onComment, onDeleteComment }) => {
    const { content, likes, timestamp } = post;
    const [showComments, setShowComments] = useState(false);
    const [commentsList, setCommentsList] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [showCopyNotification, setShowCopyNotification] = useState(false);
    
    const userId = user ? user.uid : null;
    const isLiked = post.likedBy?.includes(userId);
    const isOwner = user && user.uid === post.user.userId;

    useEffect(() => {
        // Set up the listener for comments
        const commentsQuery = query(collection(db, 'posts', post.id, 'comments'), orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            setCommentsList(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        }, (error) => {
            console.error("Error fetching comments: ", error);
        });
        return () => unsubscribe(); // Cleanup listener
    }, [post.id]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        
        // Pass to parent (Feed.js) to handle logic
        try {
            await onComment(post.id, newComment);
            setNewComment(''); // Clear input on success
        } catch (error) {
            console.error("Error submitting comment: ", error);
        }
    };

    const handleDeleteComment = async (commentId, commentUserId) => {
        // Pass to parent (Feed.js) to handle logic
        try {
            await onDeleteComment(post.id, commentId, commentUserId);
        } catch (error) {
            console.error("Error deleting comment: ", error);
        }
    };

    // *** BUG FIX ***
    // Updated handleShare to copy a more specific (though not yet functional) link
    const handleShare = () => {
        // Ideally, this would be a unique post page, but /feed#post-id is a good fallback
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
                <Link to={`/profile/${post.user.userId}`}>
                    <img 
                        src={post.user.avatar || 'https://via.placeholder.com/45'} 
                        alt={`${post.user.name}'s avatar`} 
                        className="post-avatar" 
                        onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/45"; }}
                    />
                </Link>
                <div className="post-user-info">
                    <Link to={`/profile/${post.user.userId}`} className="post-user-name">
                        {post.user.name}
                    </Link>
                    <span className="post-timestamp">{formatTimestamp(timestamp)}</span>
                </div>
            </div>
            
            <div className="post-content">
                {content.text && <p>{content.text}</p>}
                {content.image && (
                    <div className="post-image-container">
                        <img src={content.image} alt="Post content" className="post-image" />
                    </div>
                )}
            </div>
            
            <div className="post-stats">
                <span>{likes || 0} Likes</span>
                <span>{commentsList.length || 0} Comments</span>
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
                        <img 
                            src={user?.picture || 'https://via.placeholder.com/32'} 
                            alt="Your avatar" 
                            className="comment-avatar" 
                            onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/32"; }}
                        />
                        <input type="text" className="comment-input" placeholder="Write a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                        <button type="submit" className="comment-submit-btn" disabled={!newComment.trim()}>Post</button>
                    </form>
                    <div className="comments-list">
                        {commentsList.map(comment => {
                            const isCommentOwner = user && user.uid === comment.user.userId;
                            return (
                                <div key={comment.id} className="comment">
                                    <Link to={`/profile/${comment.user.userId}`}>
                                        <img 
                                            src={comment.user.avatar || 'https://via.placeholder.com/32'} 
                                            alt="Commenter's avatar" 
                                            className="comment-avatar" 
                                            onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/32"; }}
                                        />
                                    </Link>
                                    <div className="comment-content">
                                        <Link to={`/profile/${comment.user.userId}`} className="comment-user-name">
                                            {comment.user.name}
                                        </Link>
                                        <p className="comment-text">{comment.text}</p>
                                    </div>
                                    {isCommentOwner && (<button className="comment-delete-btn" onClick={() => handleDeleteComment(comment.id, comment.user.userId)}><X size={14} /></button>)}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostCard;