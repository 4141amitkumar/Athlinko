import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import FilterBar from '../components/FilterBar';
import './Tournaments.css';

// This function now fetches a larger and more detailed list of tournaments
const fetchAndCacheTournaments = async () => {
  const tournamentsRef = collection(db, "tournaments");
  const snapshot = await getDocs(tournamentsRef);

  if (!snapshot.empty) {
    console.log("Fetching tournaments from Firestore cache...");
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate()
      };
    });
  }

  console.log("Fetching new, extensive tournament data from AI...");
  const apiKey = "";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  // ✅ Naya, behtar prompt jo 40+ tournaments laayega
  const prompt = `Generate a list of 45 realistic sports tournaments in India. Ensure at least 30 are upcoming or active (dates after October 2025), and at least 10 are recently passed (dates before October 2025). Include a wide variety of sports (popular, Olympic, niche) and levels (local, state, national). Provide diverse locations. Each object must have these exact keys: "name", "sport", "location", "startDate", "endDate", "description", "organizer", and "registrationLink". The registrationLink should be a plausible, even if fake, URL. Location must be "City, State" format. Dates should be in "YYYY-MM-DD" format.`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: { type: "ARRAY", items: { type: "OBJECT", properties: { "name": { "type": "STRING" }, "sport": { "type": "STRING" }, "location": { "type": "STRING" }, "startDate": { "type": "STRING" }, "endDate": { "type": "STRING" }, "description": { "type": "STRING" }, "organizer": { "type": "STRING" }, "registrationLink": { "type": "STRING" } } } }
    }
  };
  
  try {
    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error("API call failed");
    const result = await response.json();
    const jsonText = result.candidates[0].content.parts[0].text;
    const tournamentsFromAI = JSON.parse(jsonText);

    const batch = writeBatch(db);
    const processedTournaments = tournamentsFromAI.map(t => {
      const docRef = doc(tournamentsRef);
      const tournamentData = { ...t, startDate: new Date(t.startDate), endDate: new Date(t.endDate), participants: [] };
      batch.set(docRef, tournamentData);
      return { id: docRef.id, ...tournamentData };
    });
    await batch.commit();
    return processedTournaments;
  } catch (error) {
    console.error("AI fetch failed, using extensive fallback data:", error);
    // ✅ Behtar fallback data
    return [
        { name: "IPL 2026", sport: "Cricket", location: "Multiple, India", startDate: new Date("2026-03-28"), endDate: new Date("2026-05-24"), description: "The biggest T20 cricket league.", organizer: "BCCI", registrationLink: "https://iplt20.com", id: 'ipl-2026', participants: [] },
        { name: "National Wrestling Championship 2025", sport: "Wrestling", location: "New Delhi, Delhi", startDate: new Date("2025-11-10"), endDate: new Date("2025-11-15"), description: "National title competition.", organizer: "WFI", registrationLink: "https://wrestlingfederationofindia.org", id: 'wrestling-national', participants: [] },
        { name: "Mumbai Marathon 2026", sport: "Athletics", location: "Mumbai, Maharashtra", startDate: new Date("2026-01-19"), endDate: new Date("2026-01-19"), description: "India's largest marathon.", organizer: "Procam International", registrationLink: "https://mumbaimarathon.com", id: 'mumbai-marathon', participants: [] },
        { name: "Indian Super League 2025-26", sport: "Football", location: "Multiple, India", startDate: new Date("2025-09-21"), endDate: new Date("2026-03-15"), description: "Top-tier professional football league.", organizer: "AIFF", registrationLink: "https://indiansuperleague.com", id: 'isl-2025', participants: [] },
        { name: "Pro Kabaddi League Season 11", sport: "Kabaddi", location: "Multiple, India", startDate: new Date("2025-12-01"), endDate: new Date("2026-02-20"), description: "Professional Kabaddi league.", organizer: "Mashal Sports", registrationLink: "https://prokabaddi.com", id: 'pkl-11', participants: [] },
        { name: "National Archery Championship (Past)", sport: "Archery", location: "Jamshedpur, Jharkhand", startDate: new Date("2024-03-10"), endDate: new Date("2024-03-15"), description: "Past archery championship.", organizer: "AAI", registrationLink: "#", id: 'archery-past', participants: [] },
        { name: "Khelo India University Games (Past)", sport: "Multi-sport", location: "Bengaluru, Karnataka", startDate: new Date("2024-04-24"), endDate: new Date("2024-05-03"), description: "Past university games.", organizer: "Govt. of India", registrationLink: "#", id: 'khelo-india-past', participants: [] },
    ];
  }
};

const Tournaments = ({ user }) => {
  const [allTournaments, setAllTournaments] = useState([]);
  const [filteredTournaments, setFilteredTournaments] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ states: [], sports: [] });

  useEffect(() => {
    const getTournaments = async () => {
      setLoading(true);
      const tournamentsList = await fetchAndCacheTournaments();
      setAllTournaments(tournamentsList);
      setLoading(false);
    };
    getTournaments();
  }, []);
  
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  useEffect(() => {
    let tournamentsToShow = allTournaments;
    const now = new Date();

    if (activeTab === 'active') tournamentsToShow = tournamentsToShow.filter(t => t.endDate && t.endDate >= now);
    else if (activeTab === 'past') tournamentsToShow = tournamentsToShow.filter(t => t.endDate && t.endDate < now);
    else if (activeTab === 'my-tournaments') tournamentsToShow = tournamentsToShow.filter(t => t.participants?.includes(user.sub));
    
    if (filters.states.length > 0) tournamentsToShow = tournamentsToShow.filter(t => t.location && filters.states.some(state => t.location.includes(state)));
    if (filters.sports.length > 0) tournamentsToShow = tournamentsToShow.filter(t => t.sport && filters.sports.includes(t.sport));

    setFilteredTournaments(tournamentsToShow);
  }, [activeTab, allTournaments, user.sub, filters]);

  const handleMarkAsRegistered = async (tournamentId) => {
    if (!user) return;
    const tournamentRef = doc(db, "tournaments", tournamentId);
    try {
      await updateDoc(tournamentRef, { participants: arrayUnion(user.sub) });
      setAllTournaments(prev => prev.map(t => 
          t.id === tournamentId ? { ...t, participants: [...(t.participants || []), user.sub] } : t
      ));
    } catch (error) { console.error("Error marking as registered: ", error); }
  };

  return (
    <div className="tournaments-page-container">
      <FilterBar allTournaments={allTournaments} onFilterChange={handleFilterChange} />
      
      <div className="tournaments-content">
        <div className="tournaments-tabs">
          <button className={activeTab === 'active' ? 'active' : ''} onClick={() => setActiveTab('active')}>Active & Upcoming</button>
          <button className={activeTab === 'past' ? 'active' : ''} onClick={() => setActiveTab('past')}>Past</button>
          <button className={activeTab === 'my-tournaments' ? 'active' : ''} onClick={() => setActiveTab('my-tournaments')}>My Tournaments</button>
        </div>
        <div className="tournaments-list">
          {loading ? <p className="loading-text">Fetching live tournament data...</p> : filteredTournaments.map(tournament => (
            <div key={tournament.id} className="tournament-card">
              <h2>{tournament.name}</h2>
              <div className="tournament-details">
                <span><strong>Sport:</strong> {tournament.sport}</span>
                <span><strong>Location:</strong> {tournament.location}</span>
                <span><strong>Date:</strong> {tournament.startDate ? tournament.startDate.toLocaleDateString('en-GB') : 'TBA'}</span>
              </div>
              <p className="tournament-desc">{tournament.description}</p>
              <div className="tournament-actions">
                {tournament.participants?.includes(user.sub) ? (
                  <button className="registered-btn" disabled>✓ Registered</button>
                ) : (
                  <>
                    <a href={tournament.registrationLink} target="_blank" rel="noopener noreferrer" className="register-btn">Register Officially</a>
                    <button className="mark-registered-btn" onClick={() => handleMarkAsRegistered(tournament.id)}>Mark as Registered</button>
                  </>
                )}
              </div>
            </div>
          ))}
          {filteredTournaments.length === 0 && !loading && <p className="loading-text">No tournaments found for the selected criteria.</p>}
        </div>
      </div>
    </div>
  );
};

export default Tournaments;

