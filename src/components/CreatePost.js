import React, { useState, useRef } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import './CreatePost.css';

const CreatePost = ({ user, onCreatePost }) => {
  const [postText, setPostText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const imageInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Textarea ko content ke hisab se automatically resize karein
  const handleTextChange = (e) => {
    setPostText(e.target.value);
    const textarea = textareaRef.current;
    textarea.style.height = 'auto'; // Reset height
    textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (imageInputRef.current) imageInputRef.current.value = null;
  };

  const handleSubmit = async () => {
    if (!postText.trim() && !imageFile) return;
    setLoading(true);
    await onCreatePost(postText, imageFile);
    setPostText('');
    removeImage();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(false);
  };

  return (
    <div className="create-post-container">
      <div className="create-post-header">
        <img 
          src={user?.picture || 'https://via.placeholder.com/50'}
          alt="User Avatar" 
          className="user-avatar"
        />
        <textarea 
          ref={textareaRef}
          value={postText}
          onChange={handleTextChange}
          className="create-post-input"
          placeholder={`What's on your mind, ${user?.given_name || 'User'}?`}
          rows={1} // Start with a single row
        />
      </div>

      {imagePreview && (
        <div className="image-preview-container">
          <img src={imagePreview} alt="Selected preview" className="image-preview" />
          <button onClick={removeImage} className="remove-image-btn"><X size={18} /></button>
        </div>
      )}

      <div className="create-post-actions">
        <button className="action-icon-btn" onClick={() => imageInputRef.current.click()}>
          <ImageIcon size={22} color="#45bd62" />
          <span>Photo</span>
        </button>
        <input 
          type="file" 
          accept="image/*"
          ref={imageInputRef}
          onChange={handleImageChange}
          style={{ display: 'none' }} 
        />
        <button onClick={handleSubmit} className="post-button" disabled={loading || (!postText.trim() && !imageFile)}>
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
};

export default CreatePost;

