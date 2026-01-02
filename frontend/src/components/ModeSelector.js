import React from 'react';
import '../styles/ModeSelector.css';

function ModeSelector() {
  const modes = [
    { id: 'design', label: 'Design', disabled: true },
    { id: 'deploy', label: 'Deploy', disabled: true },
    { id: 'observability', label: 'Observability', disabled: false }
  ];

  const activeMode = 'observability';

  return (
    <div className="mode-selector">
      {modes.map(mode => (
        <button
          key={mode.id}
          className={`mode-tab ${activeMode === mode.id ? 'active' : ''} ${mode.disabled ? 'disabled' : ''}`}
          disabled={mode.disabled}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}

export default ModeSelector;
