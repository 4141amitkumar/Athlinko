import React, { useState, useEffect } from "react";
import "./Feed.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
function Feed({ user }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/posts`);
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
    if (!newPost.trim()) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?._id,
          content: newPost,
        }),
      });

      const data = await res.json();

      // ✅ Ensure populated user info
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
    } catch (err) {
      console.error("Error creating post:", err);
    } finally {
      setLoading(false);
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
