import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  console.log('Sidebar component rendering');

  const menuItems = [
    {
      id: 'integration',
      icon: '🔗',
      label: 'Integration',
      path: '/integration',
      disabled: true
    },
    {
      id: 'rpa',
      icon: '🤖',
      label: 'RPA',
      path: '/rpa',
      disabled: true
    },
    {
      id: 'agents',
      icon: '👤',
      label: 'Agents',
      path: '/'
    },
    {
      id: 'decisions',
      icon: '⚖️',
      label: 'Decisions',
      path: '/decisions',
      disabled: true
    },
    {
      id: 'healthcare',
      icon: '🏥',
      label: 'Healthcare',
      path: '/healthcare',
      disabled: true
    },
    {
      id: 'b2b',
      icon: '🤝',
      label: 'B2B',
      path: '/b2b',
      disabled: true
    }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-items">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${isActive(item.path) ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
            onClick={() => !item.disabled && navigate(item.path)}
            title={item.label}
            disabled={item.disabled}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
