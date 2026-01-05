import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/ModeSelector.css';

function ModeSelector() {
  const location = useLocation();
  const navigate = useNavigate();

  const isDesign = location.pathname.startsWith('/design');
  const activeMode = isDesign ? 'design' : 'observability';

  const modes = [
    { id: 'design', label: 'Design', disabled: false, path: '/design' },
    { id: 'deploy', label: 'Deploy', disabled: true, path: '#' },
    { id: 'observability', label: 'Observability', disabled: false, path: '/' }
  ];

  return (
    <div className="mode-selector">
      {modes.map(mode => (
        <button
          key={mode.id}
          className={`mode-tab ${activeMode === mode.id ? 'active' : ''} ${mode.disabled ? 'disabled' : ''}`}
          disabled={mode.disabled}
          onClick={() => {
            if (mode.disabled || !mode.path) return;
            navigate(mode.path);
          }}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}

export default ModeSelector;
