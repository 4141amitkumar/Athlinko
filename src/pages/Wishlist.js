import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, where, documentId, getDocs } from 'firebase/firestore';
import './Wishlist.css';

const Wishlist = ({ currentUser }) => {
  const [wishlistPlayers, setWishlistPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'coach') {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', currentUser.sub), async (userDoc) => {
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const playerIds = userData.wishlist || [];

        if (playerIds.length > 0) {
          const playersQuery = query(collection(db, 'users'), where(documentId(), 'in', playerIds));
          const querySnapshot = await getDocs(playersQuery);
          const playersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setWishlistPlayers(playersList);
        } else {
          setWishlistPlayers([]);
        }
      }
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  if (loading) {
    return <p className="wishlist-message">Loading your wishlist...</p>;
  }
  
  if (currentUser.role !== 'coach') {
    return <p className="wishlist-message">This feature is available for coaches only.</p>
  }

  return (
    <div className="wishlist-page-container">
      <h1>My Player Wishlist</h1>
      {wishlistPlayers.length > 0 ? (
        <div className="wishlist-grid">
          {wishlistPlayers.map(player => (
            <Link to={`/profile/${player.id}`} key={player.id} className="user-card-link">
              <div className="user-card">
                <img src={player.picture} alt={player.name} className="user-avatar" />
                <div className="user-info">
                  <span className="user-name">{player.name}</span>
                  <span className="user-role player">{player.primarySport || player.role}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="wishlist-message">You haven't added any players to your wishlist yet.</p>
      )}
    </div>
  );
};

export default Wishlist;
