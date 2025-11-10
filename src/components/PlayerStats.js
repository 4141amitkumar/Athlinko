import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Edit, Trash2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import './PlayerStats.css';

// Helper: Cricket Stats ko process karna
const processCricketStats = (perfs) => {
    let matches = 0;
    let totalRuns = 0;
    let totalBalls = 0;
    let totalWickets = 0;
    let halfCenturies = 0;
    let centuries = 0;
    let highScore = 0;
    
    // Chart data ke liye, match-by-match runs
    const chartData = perfs.map((p, index) => {
        const runs = parseInt(p.stats.runsScored, 10) || 0;
        const wickets = parseInt(p.stats.wicketsTaken, 10) || 0;
        
        // Summary calculations
        matches++;
        totalRuns += runs;
        totalBalls += parseInt(p.stats.ballsFaced, 10) || 0;
        totalWickets += wickets;
        if (runs >= 100) centuries++;
        else if (runs >= 50) halfCenturies++;
        if (runs > highScore) highScore = runs;

        return {
            name: `Match ${index + 1}`, // Simple name for X-axis
            Runs: runs,
            Wickets: wickets,
            opponent: p.opponent,
            date: p.matchDate
        };
    }).reverse(); // Taaki chart left-to-right puraana se naya dikhaye

    const strikeRate = totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(2) : '0.00';

    const summary = [
        { name: 'Matches', value: matches },
        { name: 'Total Runs', value: totalRuns },
        { name: 'High Score', value: highScore },
        { name: 'Strike Rate', value: strikeRate },
        { name: '100s', value: centuries },
        { name: '50s', value: halfCenturies },
        { name: 'Wickets', value: totalWickets },
    ];
    
    return { summary, chartData };
};

// Helper: Doosre sports ke stats process karna
const processMatchStats = (perfs) => {
    let matches = 0;
    let wins = 0;
    let losses = 0;
    
    perfs.forEach(p => {
        matches++;
        if (p.stats.result === 'loss') losses++;
        else wins++;
    });
    
    // Bar chart ke liye data
    const chartData = [
        { name: 'Wins', value: wins, fill: '#28a745' },
        { name: 'Losses', value: losses, fill: '#dc3545' }
    ];

    const summary = [
        { name: 'Matches', value: matches },
        { name: 'Wins', value: wins },
        { name: 'Losses', value: losses },
    ];

    return { summary, chartData };
};

// Custom Tooltip jo graph par hover karne par dikhega
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="custom-tooltip">
                <p className="label">{`${data.date} vs ${data.opponent}`}</p>
                {payload.map(pld => (
                     <p key={pld.dataKey} style={{ color: pld.color }}>
                        {`${pld.dataKey}: ${pld.value}`}
                     </p>
                ))}
            </div>
        );
    }
    return null;
};


const PlayerStats = ({ userId, isOwnProfile, primarySport }) => {
    const [performances, setPerformances] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!userId) return;

        const performancesQuery = query(
            collection(db, 'users', userId, 'performances'),
            orderBy('matchDate', 'desc') // Naya data pehle
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
    
    // useMemo ka istemaal taaki data har render par re-calculate na ho
    const groupedBySport = useMemo(() => {
        const groups = performances.reduce((acc, perf) => {
            const sport = perf.sport || 'other';
            if (!acc[sport]) acc[sport] = [];
            acc[sport].push(perf);
            return acc;
        }, {});
        
        // Har group ke andar stats ko process karein
        Object.keys(groups).forEach(sport => {
            let processedData;
            if (sport === 'cricket') {
                processedData = processCricketStats(groups[sport]);
            } else if (['badminton', 'boxing'].includes(sport)) {
                processedData = processMatchStats(groups[sport]);
            }
            // Add more sport processors here...
            
            groups[sport] = {
                raw: groups[sport], // original data
                processed: processedData // summary and chart data
            };
        });
        
        return groups;
    }, [performances]);
    
    const sortedSports = Object.keys(groupedBySport).sort((a, b) => {
        if (a === primarySport) return -1;
        if (b === primarySport) return 1;
        return a.localeCompare(b);
    });

    if (loading) return <p>Loading stats...</p>;
    if (performances.length === 0) return <p>No performance data has been added yet.</p>;

    return (
        <div className="player-stats-container">
            {sortedSports.map(sport => {
                const { raw: perfs, processed } = groupedBySport[sport];
                
                return (
                    <div key={sport} className="sport-section">
                        <h3>{sport.charAt(0).toUpperCase() + sport.slice(1)} Career</h3>
                        
                        {/* --- Summary Cards --- */}
                        {processed?.summary && (
                            <div className="stats-summary">
                                {processed.summary.map(item => (
                                    <div className="summary-card" key={item.name}>
                                        <span>{item.value}</span>
                                        <p>{item.name}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* --- Charts --- */}
                        {sport === 'cricket' && processed?.chartData.length > 0 && (
                            <div className="chart-container">
                                <h4>Performance Over Time (Last {processed.chartData.length} Matches)</h4>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={processed.chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                                        <XAxis dataKey="name" stroke="#666" />
                                        <YAxis yAxisId="left" stroke="#8B0000" />
                                        <YAxis yAxisId="right" orientation="right" stroke="#28a745" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Line yAxisId="left" type="monotone" dataKey="Runs" stroke="#8B0000" activeDot={{ r: 8 }} />
                                        <Line yAxisId="right" type="monotone" dataKey="Wickets" stroke="#28a745" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        
                        {(sport === 'badminton' || sport === 'boxing') && processed?.chartData.length > 0 && (
                             <div className="chart-container">
                                <h4>Career Win/Loss</h4>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={processed.chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                                        <XAxis type="number" stroke="#666" />
                                        <YAxis dataKey="name" type="category" stroke="#666" />
                                        <Tooltip />
                                        <Bar dataKey="value" />
                                    </BarChart>
                                </ResponsiveContainer>
                             </div>
                        )}

                        {/* --- Match History Table (Ab bhi zaroori hai details ke liye) --- */}
                        <h4>Match by Match History</h4>
                        <div className="table-wrapper">
                            <table className="stats-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Opponent/Event</th>
                                        {/* Dynamic headers based on sport */}
                                        {Object.keys(perfs[0].stats).map(statKey => <th key={statKey}>{statKey.replace(/([A-Z])/g, ' $1')}</th>)}
                                        {isOwnProfile && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {perfs.map(perf => (
                                        <tr key={perf.id}>
                                            <td>{perf.matchDate}</td>
                                            <td>{perf.opponent}</td>
                                            {Object.keys(perfs[0].stats).map(statKey => (
                                                <td key={statKey} className={perf.stats[statKey] === 'loss' ? 'loss' : perf.stats[statKey] === 'win' ? 'win' : ''}>
                                                    {perf.stats[statKey] || '-'}
                                                </td>
                                            ))}
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
                );
            })}
        </div>
    );
};

export default PlayerStats;