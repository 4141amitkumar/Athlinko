import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import './Search.css';

const Search = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllUsers(usersList);

        const initialQuery = location.state?.query || '';
        setSearchTerm(initialQuery);
        
        const results = usersList.filter(user =>
          user.name.toLowerCase().includes(initialQuery.toLowerCase())
        );
        setFilteredUsers(results);

      } catch (error) {
        console.error("Error fetching users: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [location.state?.query]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    const results = allUsers.filter(user =>
      user.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(results);
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <h1>Find Athletes and Coaches</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      <div className="search-results">
        {loading ? (
          <p className="loading-text">Loading users...</p>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <Link to={`/profile/${user.id}`} key={user.id} className="user-card-link">
              <div className="user-card">
                <img src={user.picture} alt={user.name} className="user-avatar" />
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className={`user-role ${user.role}`}>{user.role}</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
            <p className="loading-text">No users found.</p>
        )}
      </div>
    </div>
  );
};

export default Search;

