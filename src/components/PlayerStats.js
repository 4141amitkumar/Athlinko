import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Edit, Trash2 } from 'lucide-react';
import './PlayerStats.css';

const PlayerStats = ({ userId, isOwnProfile, primarySport }) => {
    const [performances, setPerformances] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!userId) return;

        const performancesQuery = query(
            collection(db, 'users', userId, 'performances'),
            orderBy('matchDate', 'desc')
        );

        const unsubscribe = onSnapshot(performancesQuery, (snapshot) => {
            const performanceData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPerformances(performanceData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching performances:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const handleDelete = async (performanceId) => {
        if (!window.confirm("Are you sure you want to delete this performance record? This action cannot be undone.")) {
            return;
        }
        try {
            await deleteDoc(doc(db, 'users', userId, 'performances', performanceId));
        } catch (error) {
            console.error("Error deleting performance:", error);
            alert("Failed to delete the record. Please try again.");
        }
    };

    const groupedBySport = performances.reduce((acc, perf) => {
        const sport = perf.sport || 'other';
        if (!acc[sport]) {
            acc[sport] = [];
        }
        acc[sport].push(perf);
        return acc;
    }, {});
    
    // Move primary sport to the top
    const sortedSports = Object.keys(groupedBySport).sort((a, b) => {
        if (a === primarySport) return -1;
        if (b === primarySport) return 1;
        return a.localeCompare(b);
    });

    const renderSummary = (sport, perfs) => {
        switch (sport) {
            case 'cricket':
                const summary = perfs.reduce((acc, p) => {
                    const runs = parseInt(p.stats.runsScored, 10) || 0;
                    acc.totalRuns += runs;
                    acc.totalBalls += parseInt(p.stats.ballsFaced, 10) || 0;
                    acc.totalWickets += parseInt(p.stats.wicketsTaken, 10) || 0;
                    if (runs >= 100) acc.centuries++;
                    else if (runs >= 50) acc.halfCenturies++;
                    if (runs > acc.highScore) acc.highScore = runs;
                    return acc;
                }, { totalRuns: 0, totalBalls: 0, totalWickets: 0, halfCenturies: 0, centuries: 0, highScore: 0 });

                const strikeRate = summary.totalBalls > 0 ? ((summary.totalRuns / summary.totalBalls) * 100).toFixed(2) : '0.00';
                
                return (
                    <div className="stats-summary">
                        <div className="summary-card"><span>{perfs.length}</span><p>Matches</p></div>
                        <div className="summary-card"><span>{summary.totalRuns}</span><p>Total Runs</p></div>
                        <div className="summary-card"><span>{summary.highScore}</span><p>High Score</p></div>
                        <div className="summary-card"><span>{strikeRate}</span><p>Strike Rate</p></div>
                        <div className="summary-card"><span>{summary.centuries}</span><p>100s</p></div>
                        <div className="summary-card"><span>{summary.halfCenturies}</span><p>50s</p></div>
                        <div className="summary-card"><span>{summary.totalWickets}</span><p>Wickets</p></div>
                    </div>
                );
            
            case 'boxing':
            case 'badminton':
                const matchSummary = perfs.reduce((acc, p) => {
                    if (p.stats.result === 'loss') {
                        acc.losses++;
                    } else {
                        acc.wins++;
                    }
                    return acc;
                }, { wins: 0, losses: 0 });

                return (
                    <div className="stats-summary">
                        <div className="summary-card"><span>{perfs.length}</span><p>Matches</p></div>
                        <div className="summary-card"><span>{matchSummary.wins}</span><p>Wins</p></div>
                        <div className="summary-card"><span>{matchSummary.losses}</span><p>Losses</p></div>
                    </div>
                );
            
            case 'football':
                const footballSummary = perfs.reduce((acc, p) => {
                    acc.goals += parseInt(p.stats.goals, 10) || 0;
                    acc.assists += parseInt(p.stats.assists, 10) || 0;
                    return acc;
                }, { goals: 0, assists: 0 });

                return (
                    <div className="stats-summary">
                        <div className="summary-card"><span>{perfs.length}</span><p>Matches</p></div>
                        <div className="summary-card"><span>{footballSummary.goals}</span><p>Goals</p></div>
                        <div className="summary-card"><span>{footballSummary.assists}</span><p>Assists</p></div>
                    </div>
                );

            default: return null;
        }
    };

    if (loading) return <p>Loading stats...</p>;
    if (performances.length === 0) return <p>No performance data has been added yet.</p>;

    return (
        <div className="player-stats-container">
            {sortedSports.map(sport => (
                <div key={sport} className="sport-section">
                    <h3>{sport.charAt(0).toUpperCase() + sport.slice(1)} Career</h3>
                    {renderSummary(sport, groupedBySport[sport])}
                    
                    <h4>Match by Match History</h4>
                    <div className="table-wrapper">
                        <table className="stats-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Opponent/Event</th>
                                    {sport === 'cricket' && <><th>Runs</th><th>Wickets</th></>}
                                    {sport === 'football' && <><th>Goals</th><th>Assists</th></>}
                                    {(sport === 'boxing' || sport === 'badminton') && <><th>Result</th><th>Details</th></>}
                                    {(sport === 'athletics' || sport === 'swimming') && <><th>Mark/Time</th><th>Rank</th></>}
                                    <th>Tournament</th>
                                    {isOwnProfile && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {groupedBySport[sport].map(perf => (
                                    <tr key={perf.id}>
                                        <td>{perf.matchDate}</td>
                                        <td>{perf.opponent}</td>
                                        {sport === 'cricket' && <><td>{perf.stats.runsScored || '-'} ({perf.stats.ballsFaced || '0'})</td><td>{perf.stats.wicketsTaken || '-'}/{perf.stats.oversBowled || '0'}</td></>}
                                        {sport === 'football' && <><td>{perf.stats.goals || '0'}</td><td>{perf.stats.assists || '0'}</td></>}
                                        {(sport === 'boxing' || sport === 'badminton') && <><td className={perf.stats.result === 'loss' ? 'loss' : 'win'}>{perf.stats.result || 'Win'}</td><td>{perf.stats.score || perf.stats.method}</td></>}
                                        {(sport === 'athletics' || sport === 'swimming') && <><td>{perf.stats.mark || perf.stats.time}</td><td>{perf.stats.rank || '-'}</td></>}
                                        <td>{perf.tournament}</td>
                                        {isOwnProfile && (
                                            <td className="actions-cell">
                                                <button onClick={() => navigate(`/edit-performance/${perf.id}`)} className="action-btn edit-btn" aria-label="Edit"><Edit size={16} /></button>
                                                <button onClick={() => handleDelete(perf.id)} className="action-btn delete-btn" aria-label="Delete"><Trash2 size={16} /></button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PlayerStats;

