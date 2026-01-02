import React, { useState, useEffect } from 'react';
import './APIStatusBanner.css';

function APIStatusBanner() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    checkAPIStatus();
  }, []);

  const checkAPIStatus = async () => {
    try {
      setLoading(true);
      console.log('[APIStatusBanner] Checking API status...');
      const response = await fetch('http://localhost:8000/api/test/anthropic');
      const data = await response.json();
      console.log('[APIStatusBanner] API status:', data);
      setStatus(data);
    } catch (err) {
      console.error('[APIStatusBanner] Error checking API status:', err);
      setStatus({
        configured: false,
        message: 'Unable to check API status',
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    console.log('[APIStatusBanner] Loading...');
    return null; // Don't show anything while loading
  }

  // Don't show banner if API is working correctly
  if (status?.configured === true) {
    console.log('[APIStatusBanner] API is configured correctly, hiding banner');
    return null;
  }

  console.log('[APIStatusBanner] Rendering warning banner for status:', status);

  return (
    <div className="api-status-banner warning">
      <div className="banner-header" onClick={() => setExpanded(!expanded)}>
        <div className="banner-icon">⚠️</div>
        <div className="banner-content">
          <div className="banner-title">LLM API Configuration Issue</div>
          <div className="banner-message">
            {status?.message || 'API key not configured'}
          </div>
        </div>
        <button className="banner-toggle">
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="banner-details">
          <div className="banner-suggestion">
            <strong>Solution:</strong> {status?.suggestion || 'Configure your Anthropic API key in backend/.env'}
          </div>

          <div className="banner-actions">
            <a
              href="https://console.anthropic.com/settings/plans"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Add Credits to Anthropic Account
            </a>
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              Get API Key
            </a>
            <button
              className="btn btn-secondary"
              onClick={checkAPIStatus}
            >
              🔄 Recheck Status
            </button>
          </div>

          <div className="banner-help">
            <strong>Note:</strong> LLM-based checks (🤖 LLM Tool Response, 🔍 LLM Response Validation)
            require a working Anthropic API key. Other check types will work without it.
            <br/><br/>
            See <code>SETUP_API_KEYS.md</code> for detailed setup instructions.
          </div>

          {status?.error && (
            <details className="banner-error">
              <summary>Technical Details</summary>
              <pre>{status.error}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default APIStatusBanner;
