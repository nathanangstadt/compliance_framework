import React, { useState } from 'react';
import '../styles/PolicyTooltip.css';

function PolicyTooltip({ children, policies }) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <span
      className="policy-tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && policies.length > 0 && (
        <div
          className="policy-tooltip"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`
          }}
        >
          <div className="policy-tooltip-content">
            {policies.map((policy, index) => {
              // Determine badge class based on pass/fail and severity
              let badgeClass = 'badge-success';
              if (!policy.passed) {
                if (policy.severity === 'error') {
                  badgeClass = 'badge-danger';
                } else if (policy.severity === 'warning') {
                  badgeClass = 'badge-warning';
                } else if (policy.severity === 'info') {
                  badgeClass = 'badge-info';
                }
              }

              return (
                <div key={index} className="policy-item">
                  <span className={`badge ${badgeClass}`}>
                    {policy.passed ? '✓' : '✗'} {policy.policy_name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </span>
  );
}

export default PolicyTooltip;
