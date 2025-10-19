import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import './FilterBar.css';

const FilterBar = ({ allTournaments, onFilterChange }) => {
  const [states, setStates] = useState([]);
  const [sports, setSports] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedSports, setSelectedSports] = useState([]);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const stateRef = useRef(null);
  const sportRef = useRef(null);

  useEffect(() => {
    const uniqueStates = [...new Set(allTournaments.map(t => t.location?.split(', ')[1]).filter(Boolean))].sort();
    const uniqueSports = [...new Set(allTournaments.map(t => t.sport).filter(Boolean))].sort();
    setStates(uniqueStates);
    setSports(uniqueSports);
  }, [allTournaments]);

  useEffect(() => {
    onFilterChange({ states: selectedStates, sports: selectedSports });
  }, [selectedStates, selectedSports, onFilterChange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (stateRef.current && !stateRef.current.contains(event.target)) setShowStateDropdown(false);
      if (sportRef.current && !sportRef.current.contains(event.target)) setShowSportDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleStateChange = (state) => setSelectedStates(prev => prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]);
  const handleSportChange = (sport) => setSelectedSports(prev => prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]);

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <div className="filter-dropdown" ref={stateRef}>
          <button className="filter-button" onClick={() => setShowStateDropdown(!showStateDropdown)}>
            <span>{selectedStates.length > 0 ? `${selectedStates.length} State(s)` : 'All States'}</span>
            <ChevronDown size={20} />
          </button>
          {showStateDropdown && (
            <div className="dropdown-panel">
              {states.map(state => (
                <label key={state} className="dropdown-item"><input type="checkbox" checked={selectedStates.includes(state)} onChange={() => handleStateChange(state)} /> {state}</label>
              ))}
            </div>
          )}
        </div>
        <div className="filter-dropdown" ref={sportRef}>
          <button className="filter-button" onClick={() => setShowSportDropdown(!showSportDropdown)}>
            <span>{selectedSports.length > 0 ? `${selectedSports.length} Sport(s)` : 'All Sports'}</span>
            <ChevronDown size={20} />
          </button>
          {showSportDropdown && (
            <div className="dropdown-panel">
              {sports.map(sport => (
                <label key={sport} className="dropdown-item"><input type="checkbox" checked={selectedSports.includes(sport)} onChange={() => handleSportChange(sport)} /> {sport}</label>
              ))}
            </div>
          )}
        </div>
      </div>
      {(selectedStates.length > 0 || selectedSports.length > 0) && (
        <button className="clear-all-btn" onClick={() => { setSelectedStates([]); setSelectedSports([]); }}>
          <X size={16} /> Clear All
        </button>
      )}
    </div>
  );
};

export default FilterBar;

