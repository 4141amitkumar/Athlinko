import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import './Search.css';

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    primarySport: '',
    homeState: '',
  });
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Ek hi baar saare users ko load karke cache kar lein
  useEffect(() => {
    setLoading(true);
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllUsers(usersList);
        setFilteredUsers(usersList); // Shuru mein sabko dikhayein
      } catch (error) {
        console.error("Error fetching users: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Filter logic ko 'useCallback' mein daalein taaki baar baar re-create na ho
  const applyFilters = useCallback(() => {
    let users = [...allUsers];

    // Filter by Role
    if (filters.role) {
      users = users.filter(user => user.role === filters.role);
    }
    // Filter by Sport
    if (filters.primarySport) {
      users = users.filter(user => user.primarySport && user.primarySport.toLowerCase() === filters.primarySport.toLowerCase());
    }
    // Filter by State
    if (filters.homeState) {
      users = users.filter(user => user.homeState && user.homeState.toLowerCase() === filters.homeState.toLowerCase());
    }
    // Filter by Search Term (Name)
    if (searchTerm) {
      users = users.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    setFilteredUsers(users);
  }, [allUsers, filters, searchTerm]);

  // Jab bhi filter ya search term badle, filtering apply karein
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const clearFilters = () => {
    setFilters({ role: '', primarySport: '', homeState: '' });
    setSearchTerm('');
  };

  // Unique values nikaalein (for dropdowns)
  const uniqueSports = [...new Set(allUsers.map(u => u.primarySport).filter(Boolean))];
  const uniqueStates = [...new Set(allUsers.map(u => u.homeState).filter(Boolean))];

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
      
      {/* --- Naye Filters --- */}
      <div className="search-filters">
        <select name="role" value={filters.role} onChange={handleFilterChange} className="filter-select">
          <option value="">All Roles</option>
          <option value="player">Player</option>
          <option value="coach">Coach</option>
        </select>
        
        <select name="primarySport" value={filters.primarySport} onChange={handleFilterChange} className="filter-select">
          <option value="">All Sports</option>
          {uniqueSports.map(sport => <option key={sport} value={sport}>{sport}</option>)}
        </select>
        
        <select name="homeState" value={filters.homeState} onChange={handleFilterChange} className="filter-select">
          <option value="">All States</option>
          {uniqueStates.map(state => <option key={state} value={state}>{state}</option>)}
        </select>
        
        <button onClick={clearFilters} className="clear-filter-btn">Clear All</button>
      </div>
      {/* --- End Filters --- */}
      
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
                  <span className="user-meta">{user.primarySport || 'N/A'} • {user.homeState || 'N/A'}</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
            <p className="loading-text">No users found with these criteria.</p>
        )}
      </div>
    </div>
  );
};

export default Search;