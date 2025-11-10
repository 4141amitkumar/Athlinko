import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import './AddPerformance.css';

const AddPerformance = ({ currentUser }) => {
    const navigate = useNavigate();
    const { performanceId } = useParams(); // Check if we are editing
    const isEditMode = Boolean(performanceId);

    const [sport, setSport] = useState('cricket');
    const [formData, setFormData] = useState({
        matchDate: '',
        opponent: '',
        tournament: '',
        notes: '',
    });
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    
    // Fetch existing performance data if in edit mode
    useEffect(() => {
        if (isEditMode && currentUser) {
            setLoading(true);
            const docRef = doc(db, 'users', currentUser.uid, 'performances', performanceId);
            getDoc(docRef).then(docSnap => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setSport(data.sport);
                    setFormData({
                        matchDate: data.matchDate || '',
                        opponent: data.opponent || '',
                        tournament: data.tournament || '',
                        notes: data.notes || '',
                    });
                    setStats(data.stats || {});
                } else {
                    console.error("No such performance record!");
                    navigate(`/profile/${currentUser.uid}`);
                }
                setLoading(false);
            }).catch(error => {
                console.error("Error fetching performance record:", error);
                setLoading(false);
            });
        }
    }, [performanceId, isEditMode, currentUser, navigate]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStatsChange = (e) => {
        const { name, value } = e.target;
        setStats(prev => ({ ...prev, [name]: value }));
    };

    const handleSportChange = (e) => {
        setSport(e.target.value);
        setStats({}); // Reset stats when sport changes
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        setLoading(true);

        const performanceData = {
            sport,
            ...formData,
            stats,
            updatedAt: serverTimestamp(),
        };

        try {
            if (isEditMode) {
                // Update existing document
                const docRef = doc(db, 'users', currentUser.uid, 'performances', performanceId);
                await updateDoc(docRef, performanceData);
            } else {
                // Add new document
                const collectionRef = collection(db, 'users', currentUser.uid, 'performances');
                performanceData.createdAt = serverTimestamp();
                await addDoc(collectionRef, performanceData);
            }
            navigate(`/profile/${currentUser.uid}`);
        } catch (error) {
            console.error("Error saving performance:", error);
            // Implement a user-friendly error message here instead of alert
        } finally {
            setLoading(false);
        }
    };

    const renderStatsFields = () => {
        switch (sport) {
            case 'cricket':
                return (
                    <>
                        <div className="form-group">
                            <label>Runs Scored</label>
                            <input type="number" name="runsScored" value={stats.runsScored || ''} onChange={handleStatsChange} />
                        </div>
                        <div className="form-group">
                            <label>Balls Faced</label>
                            <input type="number" name="ballsFaced" value={stats.ballsFaced || ''} onChange={handleStatsChange} />
                        </div>
                        <div className="form-group">
                            <label>Wickets Taken</label>
                            <input type="number" name="wicketsTaken" value={stats.wicketsTaken || ''} onChange={handleStatsChange} />
                        </div>
                        <div className="form-group">
                            <label>Overs Bowled</label>
                            <input type="text" name="oversBowled" placeholder="e.g., 4 or 3.2" value={stats.oversBowled || ''} onChange={handleStatsChange} />
                        </div>
                    </>
                );
            case 'football':
                return (
                    <>
                        <div className="form-group">
                            <label>Goals</label>
                            <input type="number" name="goals" value={stats.goals || ''} onChange={handleStatsChange} />
                        </div>
                        <div className="form-group">
                            <label>Assists</label>
                            <input type="number" name="assists" value={stats.assists || ''} onChange={handleStatsChange} />
                        </div>
                    </>
                );
            case 'badminton':
            case 'boxing':
                return (
                    <>
                        <div className="form-group">
                            <label>Result</label>
                            <select name="result" value={stats.result || 'win'} onChange={handleStatsChange}>
                                <option value="win">Win</option>
                                <option value="loss">Loss</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Score / Method</label>
                            <input type="text" name="score" placeholder="e.g., 21-18, 21-19 or KO" value={stats.score || ''} onChange={handleStatsChange} />
                        </div>
                    </>
                );
            case 'athletics':
                return (
                    <>
                         <div className="form-group">
                            <label>Event</label>
                            <input type="text" name="event" placeholder="e.g., 100m Sprint, Javelin Throw" value={stats.event || ''} onChange={handleStatsChange} />
                        </div>
                        <div className="form-group">
                            <label>Mark / Time</label>
                            <input type="text" name="mark" placeholder="e.g., 10.58s or 75.2m" value={stats.mark || ''} onChange={handleStatsChange} />
                        </div>
                         <div className="form-group">
                            <label>Rank / Position</label>
                            <input type="number" name="rank" placeholder="1, 2, 3..." value={stats.rank || ''} onChange={handleStatsChange} />
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    if (loading && isEditMode) {
        return <p>Loading performance data...</p>;
    }

    return (
        <div className="add-performance-container">
            <form className="add-performance-form" onSubmit={handleSubmit}>
                <h1>{isEditMode ? 'Edit Performance' : 'Add New Performance'}</h1>
                
                <div className="form-grid">
                    <div className="form-group">
                        <label>Sport</label>
                        <select name="sport" value={sport} onChange={handleSportChange}>
                            <option value="cricket">Cricket</option>
                            <option value="football">Football</option>
                            <option value="badminton">Badminton</option>
                            <option value="boxing">Boxing</option>
                            <option value="athletics">Athletics</option>
                            {/* Add more sports as needed */}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Match / Event Date</label>
                        <input type="date" name="matchDate" value={formData.matchDate} onChange={handleFormChange} required />
                    </div>
                    
                    <div className="form-group">
                        <label>Opponent / Event Name</label>
                        <input type="text" name="opponent" placeholder="e.g., Punjab XI or District Meet" value={formData.opponent} onChange={handleFormChange} required />
                    </div>
                    
                    <div className="form-group">
                        <label>Tournament (Optional)</label>
                        <input type="text" name="tournament" placeholder="e.g., State Championship" value={formData.tournament} onChange={handleFormChange} />
                    </div>

                    <h4 className="stats-heading">Sport Specific Stats</h4>
                    {renderStatsFields()}

                    <div className="form-group full-width">
                        <label>Notes (Optional)</label>
                        <textarea name="notes" placeholder="Any personal notes about the match..." value={formData.notes} onChange={handleFormChange}></textarea>
                    </div>
                </div>
                
                <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={() => navigate(-1)} disabled={loading}>Cancel</button>
                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? 'Saving...' : (isEditMode ? 'Update Performance' : 'Save Performance')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddPerformance;