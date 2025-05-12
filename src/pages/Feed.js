import React from 'react';
import './Feed.css';

function Feed({ user }) {
  return (
    <div className="feed-wrapper">
      <h2>Welcome, {user.name} 👋</h2>
      <p>This is your Athlinko feed. Soon you'll see posts from athletes and coaches!</p>

      {/* Sample profile/post */}
      <div className="post-card">
        <div className="profile-section">
          <img src={user.picture} alt={user.name} className="profile-img" />
          <div>
            <strong>{user.name}</strong>
            <p>Athlete | Sprinter</p>
          </div>
        </div>
        <img src="https://source.unsplash.com/featured/?athlete" alt="Post" className="post-img" />
        <p><strong>{user.name}</strong>: Training hard for the nationals! 💪</p>
      </div>
    </div>
  );
}

export default Feed;
