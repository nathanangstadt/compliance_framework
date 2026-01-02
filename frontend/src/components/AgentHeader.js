import React from 'react';
import '../styles/AgentHeader.css';

function AgentHeader({ agentName, agentDescription, timestamp, onResetClick }) {
  return (
    <div className="agent-header">
      <div className="agent-header-top">
        <div className="agent-header-title">
          <h1>{agentName}</h1>
          <p className="agent-description">{agentDescription}</p>
        </div>
        <div className="agent-header-controls">
          {onResetClick && (
            <button
              className="btn btn-header-secondary"
              onClick={onResetClick}
            >
              Reset Evaluations
            </button>
          )}
          {timestamp && (
            <span className="header-timestamp">{timestamp}</span>
          )}
          <div className="time-window-selector">
            <span className="time-window-label">Time window</span>
            <div className="time-window-dropdown">
              <span>Last 7 days</span>
              <button className="time-window-clear">✕</button>
            </div>
          </div>
          <div className="agent-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search"
              className="search-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentHeader;
