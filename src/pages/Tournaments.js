import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, where, updateDoc, doc, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';
import FilterBar from '../components/FilterBar'; // Import FilterBar
import './Tournaments.css'; // Import dedicated CSS

const TournamentCard = ({ tournament, user }) => {
    // Determine registration status
    const isRegistered = tournament.participants?.includes(user.uid);
    const [isPast, setIsPast] = useState(false);

    useEffect(() => {
        if (tournament.endDate) {
            // Convert Firestore Timestamp to Date, then compare
            const endDate = tournament.endDate.toDate();
            setIsPast(endDate < new Date());
        }
    }, [tournament.endDate]);

    const handleRegister = async () => {
        if (isRegistered || isPast) return;
        
        const tournamentRef = doc(db, 'tournaments', tournament.id);
        try {
            await updateDoc(tournamentRef, {
                participants: arrayUnion(user.uid)
            });
        } catch (error) {
            console.error("Error registering for tournament:", error);
            // Add user-friendly error handling here
        }
    };

    const handleWithdraw = async () => {
        if (!isRegistered || isPast) return;
        
        const tournamentRef = doc(db, 'tournaments', tournament.id);
        try {
            await updateDoc(tournamentRef, {
                participants: arrayRemove(user.uid)
            });
        } catch (error) {
            console.error("Error withdrawing from tournament:", error);
            // Add user-friendly error handling here
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'TBA';
        return timestamp.toDate().toLocaleDateString('en-IN');
    };

    return (
        <div className={`tournament-card ${isPast ? 'past-tournament' : ''}`}>
            <h2>{tournament.name}</h2>
            <div className="tournament-details">
                <span><strong>Sport:</strong> {tournament.sport}</span>
                <span><strong>Location:</strong> {tournament.location}</span>
                <span><strong>Starts:</strong> {formatDate(tournament.startDate)}</span>
                <span><strong>Ends:</strong> {formatDate(tournament.endDate)}</span>
            </div>
            <p className="tournament-desc">{tournament.description}</p>
            
            <div className="tournament-actions">
                {isPast ? (
                    <button className="registered-btn" disabled>Completed</button>
                ) : isRegistered ? (
                    <button className="registered-btn" onClick={handleWithdraw}>You are Registered (Withdraw?)</button>
                ) : (
                    <button className="register-btn" onClick={handleRegister}>Register Now</button>
                )}
            </div>
        </div>
    );
};

const Tournaments = ({ user }) => {
    const [allTournaments, setAllTournaments] = useState([]);
    const [filteredTournaments, setFilteredTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ states: [], sports: [] });
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'past'

    useEffect(() => {
        setLoading(true);
        const now = Timestamp.now();
        
        let q;
        if (activeTab === 'active') {
            q = query(
                collection(db, 'tournaments'),
                where('endDate', '>=', now),
                orderBy('endDate', 'asc')
            );
        } else { // 'past'
             q = query(
                collection(db, 'tournaments'),
                where('endDate', '<', now),
                orderBy('endDate', 'desc')
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tournamentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAllTournaments(tournamentsData);
            setFilteredTournaments(tournamentsData); // Initially show all
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tournaments: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [activeTab]); // Refetch when tab changes

    // Memoized filtering logic
    useEffect(() => {
        const results = allTournaments.filter(t => {
            const stateMatch = filters.states.length === 0 || filters.states.includes(t.location?.split(', ')[1]);
            const sportMatch = filters.sports.length === 0 || filters.sports.includes(t.sport);
            return stateMatch && sportMatch;
        });
        setFilteredTournaments(results);
    }, [filters, allTournaments]);

    const handleFilterChange = useCallback((newFilters) => {
        setFilters(newFilters);
    }, []);

    return (
        <div className="tournaments-page-container">
            <FilterBar 
                allTournaments={allTournaments} 
                onFilterChange={handleFilterChange} 
            />
            <div className="tournaments-content">
                <div className="tournaments-tabs">
                    <button 
                        className={activeTab === 'active' ? 'active' : ''} 
                        onClick={() => setActiveTab('active')}
                    >
                        Upcoming & Active
                    </button>
                    <button 
                        className={activeTab === 'past' ? 'active' : ''} 
                        onClick={() => setActiveTab('past')}
                    >
                        Past Tournaments
                    </button>
                </div>

                <div className="tournaments-list">
                    {loading ? (
                        <p className="loading-text">Loading tournaments...</p>
                    ) : filteredTournaments.length > 0 ? (
                        filteredTournaments.map(tournament => (
                            <TournamentCard key={tournament.id} tournament={tournament} user={user} />
                        ))
                    ) : (
                        <p className="loading-text">No tournaments found matching your criteria.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Tournaments;