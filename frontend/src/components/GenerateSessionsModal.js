import React, { useState } from 'react';
import { agentsAPI } from '../services/api';
import { useToast } from './Toast';

function GenerateSessionsModal({ agentId, agentName, agentDescription, onClose, onJobSubmitted }) {
  const [formData, setFormData] = useState({
    num_sessions: 10,
    scenario_variations: '',
    session_time_definition: '',
    include_edge_cases: true
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.num_sessions < 1 || formData.num_sessions > 100) {
      toast.error('Number of sessions must be between 1 and 100', 'Validation Error');
      return;
    }

    setLoading(true);

    try {
      const response = await agentsAPI.generateSessions(agentId, formData);
      toast.success(`Generating ${formData.num_sessions} sessions for ${agentName}`, 'Job Started');
      onJobSubmitted(response.data.job_id);
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      toast.error(errorMsg, 'Error Starting Job');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
        <h3>Generate Sessions for {agentName}</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.938rem' }}>
          The LLM will create realistic simulated sessions with tool use sequences matching your agent's workflow.
        </p>
        {agentDescription && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text)' }}>Agent Description</div>
            <div>{agentDescription}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Number of Sessions *</label>
            <input
              type="number"
              value={formData.num_sessions}
              onChange={(e) => setFormData({...formData, num_sessions: parseInt(e.target.value) || 1})}
              min="1"
              max="100"
              required
              style={{ width: '150px' }}
            />
            <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.813rem', display: 'block', marginTop: '0.25rem' }}>
              Maximum 100 sessions per batch
            </small>
          </div>

          <div className="form-group">
            <label>Scenario Variations (optional)</label>
            <textarea
              value={formData.scenario_variations}
              onChange={(e) => setFormData({...formData, scenario_variations: e.target.value})}
              placeholder="e.g., high priority order, international shipping, bulk discount, first-time customer"
              rows={3}
              style={{ fontSize: '0.938rem' }}
            />
            <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.813rem', display: 'block', marginTop: '0.25rem' }}>
              Comma-separated scenarios to simulate. The LLM will cycle through these to create varied sessions.
            </small>
          </div>

          <div className="form-group">
            <label>Session Timing (optional)</label>
            <textarea
              value={formData.session_time_definition}
              onChange={(e) => setFormData({...formData, session_time_definition: e.target.value})}
              placeholder="e.g., randomly between Monday-Friday, 08:00-17:00 UTC"
              rows={2}
              style={{ fontSize: '0.938rem' }}
            />
            <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.813rem', display: 'block', marginTop: '0.25rem' }}>
              Optional window for session timestamps. Leave blank to auto-spread timestamps across weekdays.
            </small>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.include_edge_cases}
                onChange={(e) => setFormData({...formData, include_edge_cases: e.target.checked})}
                style={{ width: 'auto', margin: 0 }}
              />
              <span>Include edge cases and error scenarios</span>
            </label>
            <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.813rem', display: 'block', marginLeft: '1.5rem', marginTop: '0.25rem' }}>
              Adds scenarios like "customer not found", "payment declined", "system timeout", etc.
            </small>
          </div>

          <div style={{
            padding: '1rem',
            backgroundColor: '#e3f2fd',
            borderLeft: '4px solid #2196f3',
            borderRadius: '4px',
            marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#0d47a1', fontWeight: 500, marginBottom: '0.25rem' }}>
              💡 Processing Time
            </div>
            <div style={{ fontSize: '0.813rem', color: '#1565c0' }}>
              Generation runs in the background. You'll see progress updates in the notification area. Typical speed: ~2-3 sessions per minute.
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Starting...' : 'Generate Sessions'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GenerateSessionsModal;
