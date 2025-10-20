import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import './RequestsDropdown.css';

const RequestsDropdown = ({ requests, onAccept, onReject }) => {
  return (
    <div className="requests-dropdown">
      <div className="requests-header">
        <h3>Connection Requests</h3>
      </div>
      <div className="requests-list">
        {requests.length > 0 ? (
          requests.map(req => (
            <div key={req.id} className="request-item">
              <Link to={`/profile/${req.senderId}`}>
                <img src={req.senderPicture} alt={req.senderName} className="request-avatar" />
              </Link>
              <div className="request-info">
                <Link to={`/profile/${req.senderId}`} className="request-name">
                  {req.senderName}
                </Link>
                <span className="request-type">Wants to connect.</span>
              </div>
              <div className="request-actions">
                <button onClick={() => onAccept(req)} className="request-btn accept"><Check size={16} /></button>
                <button onClick={() => onReject(req.id)} className="request-btn reject"><X size={16} /></button>
              </div>
            </div>
          ))
        ) : (
          <div className="request-item empty">
            <span>No pending requests.</span>
          </div>
        )}
      </div>
      <Link to="/requests" className="requests-footer">
        View All Requests
      </Link>
    </div>
  );
};

export default RequestsDropdown;
