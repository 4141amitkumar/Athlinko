import React, { useState, useEffect, useRef } from 'react'; // Added useEffect import
import { Image as ImageIcon, X } from 'lucide-react';
import './CreatePost.css';

const CreatePost = ({ user, onCreatePost }) => {
  const [postText, setPostText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const imageInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleTextChange = (e) => {
    setPostText(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
        textarea.style.height = 'auto'; // Reset height
        textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Basic validation (optional)
      if (!file.type.startsWith('image/')) {
          alert('Please select an image file.');
          return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
         alert('Image size should be less than 5MB.');
         return;
      }

      setImageFile(file);
      // Revoke previous URL to prevent memory leaks
      if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    // Revoke object URL
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview('');
    if (imageInputRef.current) imageInputRef.current.value = null; // Reset file input
  };

  const handleSubmit = async () => {
    // Add check for user ID
    if (!user?.uid) {
        alert("Please log in to post.");
        return;
    }
    if (!postText.trim() && !imageFile) return;

    setLoading(true);
    try {
        await onCreatePost(postText, imageFile);
        // Reset state only after successful post creation
        setPostText('');
        removeImage(); // This also clears the file input
        if (textareaRef.current) textareaRef.current.style.height = 'auto'; // Reset textarea height
    } catch (error) {
        // Error handling might be done in the parent (Feed.js), but log here too
        console.error("Error during post submission:", error);
        // Optionally show an error message to the user here
    } finally {
        setLoading(false);
    }
  };

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);


  return (
    <div className="create-post-container">
      <div className="create-post-header">
        <img
          // Use user.picture, fallback if needed
          src={user?.picture || 'https://via.placeholder.com/45'}
          alt="User Avatar"
          className="user-avatar"
          // Add onerror handler for broken image links
           onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/45"; }}
        />
        <textarea
          ref={textareaRef}
          value={postText}
          onChange={handleTextChange}
          className="create-post-input"
          // Use user.name, fallback if needed
          placeholder={`What's on your mind, ${user?.name || 'User'}?`}
          rows={1}
        />
      </div>

      {imagePreview && (
        <div className="image-preview-container">
          <img src={imagePreview} alt="Selected preview" className="image-preview" />
          <button onClick={removeImage} className="remove-image-btn"><X size={18} /></button>
        </div>
      )}

      <div className="create-post-actions">
        {/* Trigger file input click */}
        <button type="button" className="action-icon-btn" onClick={() => imageInputRef.current?.click()}>
          <ImageIcon size={22} color="#45bd62" />
          <span>Photo</span>
        </button>
        <input
          type="file"
          accept="image/*"
          ref={imageInputRef}
          onChange={handleImageChange}
          style={{ display: 'none' }} // Keep hidden
        />
        <button onClick={handleSubmit} className="post-button" disabled={loading || (!postText.trim() && !imageFile)}>
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
};

export default CreatePost;

