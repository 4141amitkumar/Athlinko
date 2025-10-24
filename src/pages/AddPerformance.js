import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import './AddPerformance.css';

const sports = ["cricket", "football", "boxing", "badminton", "athletics", "swimming"];

const initialStats = {
    cricket: { runsScored: '', ballsFaced: '', wicketsTaken: '', oversBowled: '' },
    football: { goals: '', assists: '', minutesPlayed: '' },
    boxing: { result: 'win', method: '', rounds: '' },
    badminton: { result: 'win', score: '' },
    athletics: { eventName: '', mark: '', rank: '' },
    swimming: { eventName: '', time: '', rank: '' }
};

const AddPerformance = ({ currentUser }) => {
    const navigate = useNavigate();
    const { performanceId } = useParams();
    const isEditMode = Boolean(performanceId);

    const [sport, setSport] = useState('cricket');
    const [matchDate, setMatchDate] = useState('');
    const [opponent, setOpponent] = useState('');
    const [tournament, setTournament] = useState('');
    const [stats, setStats] = useState(initialStats.cricket);
    const [loading, setLoading] = useState(false);
    const [pageTitle, setPageTitle] = useState('Add Performance');

    useEffect(() => {
        if (isEditMode) {
            setLoading(true);
            setPageTitle('Edit Performance');
            const fetchPerformance = async () => {
                if (!currentUser) return;
                try {
                    const perfDocRef = doc(db, 'users', currentUser.sub, 'performances', performanceId);
                    const docSnap = await getDoc(perfDocRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setSport(data.sport);
                        setMatchDate(data.matchDate);
                        setOpponent(data.opponent);
                        setTournament(data.tournament);
                        setStats(data.stats);
                    } else {
                        console.error("No such performance record!");
                        navigate(`/profile/${currentUser.sub}`);
                    }
                } catch (error) {
                    console.error("Error fetching performance data:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchPerformance();
        }
    }, [performanceId, isEditMode, currentUser, navigate]);

    const handleSportChange = (e) => {
        const newSport = e.target.value;
        setSport(newSport);
        setStats(initialStats[newSport]);
    };

    const handleStatChange = (e) => {
        const { name, value } = e.target;
        setStats(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("You must be logged in to add performance data.");
            return;
        }

        setLoading(true);
        const performanceData = {
            sport,
            matchDate,
            opponent,
            tournament,
            stats,
            lastUpdated: serverTimestamp()
        };

        try {
            if (isEditMode) {
                const perfDocRef = doc(db, 'users', currentUser.sub, 'performances', performanceId);
                await setDoc(perfDocRef, performanceData, { merge: true });
            } else {
                performanceData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'users', currentUser.sub, 'performances'), performanceData);
            }
            navigate(`/profile/${currentUser.sub}`);
        } catch (error) {
            console.error("Error saving performance data:", error);
            alert("Failed to save performance data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const renderStatFields = () => {
        switch (sport) {
            case 'cricket':
                return (
                    <>
                        <div className="form-group">
                            <label>Runs Scored</label>
                            <input type="number" name="runsScored" value={stats.runsScored || ''} onChange={handleStatChange} />
                        </div>
                        <div className="form-group">
                            <label>Balls Faced</label>
                            <input type="number" name="ballsFaced" value={stats.ballsFaced || ''} onChange={handleStatChange} />
                        </div>
                        <div className="form-group">
                            <label>Wickets Taken</label>
                            <input type="number" name="wicketsTaken" value={stats.wicketsTaken || ''} onChange={handleStatChange} />
                        </div>
                        <div className="form-group">
                            <label>Overs Bowled</label>
                            <input type="number" step="0.1" name="oversBowled" value={stats.oversBowled || ''} onChange={handleStatChange} />
                        </div>
                    </>
                );
            case 'football':
                return (
                    <>
                        <div className="form-group">
                            <label>Goals</label>
                            <input type="number" name="goals" value={stats.goals || ''} onChange={handleStatChange} />
                        </div>
                        <div className="form-group">
                            <label>Assists</label>
                            <input type="number" name="assists" value={stats.assists || ''} onChange={handleStatChange} />
                        </div>
                        <div className="form-group">
                            <label>Minutes Played</label>
                            <input type="number" name="minutesPlayed" value={stats.minutesPlayed || ''} onChange={handleStatChange} />
                        </div>
                    </>
                );
            case 'boxing':
                return (
                     <>
                        <div className="form-group">
                           <label>Result</label>
                           <select name="result" value={stats.result || 'win'} onChange={handleStatChange}>
                               <option value="win">Win</option>
                               <option value="loss">Loss</option>
                           </select>
                       </div>
                       <div className="form-group">
                           <label>Method of Result (e.g., KO, TKO, Points)</label>
                           <input type="text" name="method" value={stats.method || ''} onChange={handleStatChange} />
                       </div>
                       <div className="form-group">
                           <label>Rounds</label>
                           <input type="text" name="rounds" placeholder="e.g., 3" value={stats.rounds || ''} onChange={handleStatChange} />
                       </div>
                   </>
                );
            case 'badminton':
                return (
                     <>
                        <div className="form-group">
                           <label>Result</label>
                           <select name="result" value={stats.result || 'win'} onChange={handleStatChange}>
                               <option value="win">Win</option>
                               <option value="loss">Loss</option>
                           </select>
                       </div>
                       <div className="form-group">
                           <label>Score</label>
                           <input type="text" name="score" placeholder="e.g., 21-18, 21-19" value={stats.score || ''} onChange={handleStatChange} />
                       </div>
                   </>
                );
             case 'athletics':
                return (
                     <>
                        <div className="form-group">
                           <label>Event Name (e.g., Javelin Throw, 100m Sprint)</label>
                           <input type="text" name="eventName" value={stats.eventName || ''} onChange={handleStatChange} />
                       </div>
                       <div className="form-group">
                           <label>Mark (Distance in meters or Time in seconds)</label>
                           <input type="text" name="mark" placeholder="e.g., 88.5 or 10.23" value={stats.mark || ''} onChange={handleStatChange} />
                       </div>
                       <div className="form-group">
                           <label>Rank/Position</label>
                           <input type="number" name="rank" value={stats.rank || ''} onChange={handleStatChange} />
                       </div>
                   </>
                );
            case 'swimming':
                return (
                     <>
                        <div className="form-group">
                           <label>Event Name (e.g., 100m Freestyle)</label>
                           <input type="text" name="eventName" value={stats.eventName || ''} onChange={handleStatChange} />
                       </div>
                       <div className="form-group">
                           <label>Time</label>
                           <input type="text" name="time" placeholder="e.g., 55.43s" value={stats.time || ''} onChange={handleStatChange} />
                       </div>
                       <div className="form-group">
                           <label>Rank/Position</label>
                           <input type="number" name="rank" value={stats.rank || ''} onChange={handleStatChange} />
                       </div>
                   </>
                );
            default:
                return null;
        }
    };

    if (loading && isEditMode) return <p>Loading performance data...</p>;

    return (
        <div className="add-performance-container">
            <form className="add-performance-form" onSubmit={handleSubmit}>
                <h1>{pageTitle}</h1>

                <div className="form-grid">
                    <div className="form-group">
                        <label>Sport</label>
                        <select value={sport} onChange={handleSportChange} disabled={isEditMode}>
                            {sports.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Match/Event Date</label>
                        <input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} required />
                    </div>

                     <div className="form-group full-width">
                        <label>Opponent / Event Name</label>
                        <input type="text" value={opponent} onChange={(e) => setOpponent(e.target.value)} required />
                    </div>

                     <div className="form-group full-width">
                        <label>Tournament/Competition Name</label>
                        <input type="text" value={tournament} onChange={(e) => setTournament(e.target.value)} />
                    </div>
                </div>

                <h3 className="stats-heading">Enter {sport.charAt(0).toUpperCase() + sport.slice(1)} Stats</h3>
                <div className="form-grid">
                    {renderStatFields()}
                </div>

                <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Performance'}
                    </button>
                    <button type="button" className="cancel-btn" onClick={() => navigate(`/profile/${currentUser?.sub}`)}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddPerformance;

