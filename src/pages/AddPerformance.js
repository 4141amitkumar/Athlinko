import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, where, documentId, getDocs } from 'firebase/firestore';
import './Wishlist.css';

const Wishlist = ({ currentUser }) => {
  const [wishlistPlayers, setWishlistPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add check for currentUser, role, and uid
    if (currentUser?.role !== 'coach' || !currentUser?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true); // Start loading

    // Use currentUser.uid to get the coach's document
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), async (coachDoc) => {
      if (coachDoc.exists()) {
        const coachData = coachDoc.data();
        let playerIds = coachData.wishlist || [];

        // Filter out any empty/invalid IDs
        playerIds = playerIds.filter(id => id && typeof id === 'string');


        if (playerIds.length > 0) {
            try {
                // Fetch details for players in the wishlist
                const playersQuery = query(collection(db, 'users'), where(documentId(), 'in', playerIds));
                const querySnapshot = await getDocs(playersQuery);
                const playersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setWishlistPlayers(playersList);
            } catch (error) {
                console.error("Error fetching wishlist player details:", error);
                setWishlistPlayers([]); // Set empty on error
            }
        } else {
          setWishlistPlayers([]); // Set empty if wishlist array is empty
        }
      } else {
           console.warn("Coach document not found:", currentUser.uid);
           setWishlistPlayers([]); // Coach doc doesn't exist
      }
      setLoading(false); // Stop loading after processing
    }, (error) => { // Add error handler for onSnapshot
         console.error("Error listening to coach document:", error);
         setLoading(false);
         setWishlistPlayers([]);
    });

    return () => unsub(); // Cleanup listener
  }, [currentUser]); // Depend on currentUser object

  if (loading) {
    return <p className="wishlist-message">Loading your wishlist...</p>;
  }

  // Check role again for rendering message (in case props change unexpectedly)
  if (currentUser?.role !== 'coach') {
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
                <img
                    src={player.picture || 'https://via.placeholder.com/80'}
                    alt={player.name}
                    className="user-avatar"
                    onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/80"; }}
                 />
                <div className="user-info">
                  <span className="user-name">{player.name || 'Unknown Player'}</span>
                   {/* Display sport or role safely */}
                  <span className={`user-role ${player.role || 'player'}`}>{player.primarySport || player.role || 'Player'}</span>
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
