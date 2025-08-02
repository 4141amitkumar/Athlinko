import React, { useState, useEffect } from "react";
import "./Feed.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// ✅ Helper function to safely join paths
const api = (path) => `${API_URL}${path.startsWith("/") ? path : "/" + path}`;

function Feed({ user }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        console.log("Fetching posts from:", api("/api/posts"));
        const res = await fetch(api("/api/posts"));
        const data = await res.json();
        setPosts(data);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };
    fetchPosts();
  }, []);

  // ✅ Handle new post
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && !image) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("userId", user?._id);
      formData.append("content", newPost);
      if (image) formData.append("image", image);

      const res = await fetch(api("/api/posts"), {
        method: "POST",
        body: formData, // ✅ no need for Content-Type, browser sets it
      });

      const data = await res.json();

      const populatedPost = {
        ...data,
        user: {
          _id: user?._id,
          name: user?.name,
          picture: user?.picture,
        },
      };

      setPosts([populatedPost, ...posts]);
      setNewPost("");
      setImage(null);
      setPreview(null);
    } catch (err) {
      console.error("Error creating post:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Image Preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="feed-wrapper">
      <div className="feed-container">
        <h2 className="feed-title">
          Welcome back, {user?.name?.split(" ")[0] || "Athlinko Member"} 👋
        </h2>

        {/* Post Creation Box */}
        <form className="post-form" onSubmit={handlePostSubmit}>
          <div className="post-form-header">
            <img
              src={user?.picture || "https://via.placeholder.com/50"}
              alt="Profile"
              className="profile-img"
            />
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share something with your community..."
              rows="2"
            />
          </div>

          {/* ✅ File input */}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="file-input"
          />

          {/* ✅ Image Preview */}
          {preview && (
            <div className="preview-container">
              <img src={preview} alt="Preview" className="preview-img" />
            </div>
          )}

          <button type="submit" disabled={loading} className="post-btn">
            {loading ? "Posting..." : "Post"}
          </button>
        </form>

        {/* Posts Feed */}
        <div className="posts">
          {posts.length === 0 ? (
            <p className="no-posts">No posts yet. Be the first one!</p>
          ) : (
            posts.map((post) => (
              <div key={post._id} className="post-card">
                {/* Header */}
                <div className="profile-section">
                  <img
                    src={post?.user?.picture || "https://via.placeholder.com/50"}
                    alt="Profile"
                    className="profile-img"
                  />
                  <div className="profile-info">
                    <strong>{post?.user?.name || "Unknown User"}</strong>
                    <span className="post-time">
                      {post?.createdAt
                        ? new Date(post.createdAt).toLocaleString()
                        : "Just now"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                {post?.content && (
                  <p className="post-content">{post.content}</p>
                )}

                {/* ✅ Show post image if available */}
                {post?.image && (
                  <img src={post.image} alt="Post" className="post-img" />
                )}

                {/* Actions */}
                <div className="post-actions">
                  <button className="post-action-btn">❤️ Like</button>
                  <button className="post-action-btn">💬 Comment</button>
                  <button className="post-action-btn">↗ Share</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Feed;
