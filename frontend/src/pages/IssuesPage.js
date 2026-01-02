import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complianceAPI, memoryAPI } from '../services/api';
import { useToast } from '../components/Toast';
import PolicyTooltip from '../components/PolicyTooltip';

function IssuesPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [resolvingId, setResolvingId] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const response = await complianceAPI.getSummary();
      setSummary(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (memoryId) => {
    try {
      setResolvingId(memoryId);
      await memoryAPI.resolve(memoryId);
      toast.success('Session marked as resolved', 'Resolved');
      await loadSummary();
    } catch (err) {
      toast.error(`Failed to resolve: ${err.message}`, 'Error');
    } finally {
      setResolvingId(null);
    }
  };

  const handleUnresolve = async (memoryId) => {
    try {
      setResolvingId(memoryId);
      await memoryAPI.unresolve(memoryId);
      toast.success('Session resolution removed', 'Unresolved');
      await loadSummary();
    } catch (err) {
      toast.error(`Failed to unresolve: ${err.message}`, 'Error');
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) return <div className="loading">Loading issues...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!summary) return null;

  // Filter based on compliance_status
  const filteredMemories = summary.all_memories ? summary.all_memories.filter(memory => {
    if (filterStatus === 'compliant') return memory.compliance_status === 'compliant';
    if (filterStatus === 'issues') return memory.compliance_status === 'issues';
    if (filterStatus === 'resolved') return memory.compliance_status === 'resolved';
    return true;
  }) : [];

  // Counts for filter tabs
  const compliantCount = summary.all_memories ? summary.all_memories.filter(m => m.compliance_status === 'compliant').length : 0;
  const issuesCount = summary.all_memories ? summary.all_memories.filter(m => m.compliance_status === 'issues').length : 0;
  const resolvedCount = summary.all_memories ? summary.all_memories.filter(m => m.compliance_status === 'resolved').length : 0;

  return (
    <div className="issues-page">
      {summary.all_memories && summary.all_memories.length > 0 ? (
        <div className="card">
          <div className="card-header-with-actions">
            <h3>Sessions</h3>
            <div className="filter-tabs">
              <button
                className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                All ({summary.all_memories.length})
              </button>
              <button
                className={`filter-tab ${filterStatus === 'issues' ? 'active' : ''}`}
                onClick={() => setFilterStatus('issues')}
              >
                Issues ({issuesCount})
              </button>
              <button
                className={`filter-tab ${filterStatus === 'resolved' ? 'active' : ''}`}
                onClick={() => setFilterStatus('resolved')}
              >
                Resolved ({resolvedCount})
              </button>
              <button
                className={`filter-tab ${filterStatus === 'compliant' ? 'active' : ''}`}
                onClick={() => setFilterStatus('compliant')}
              >
                Compliant ({compliantCount})
              </button>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Session Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMemories.map((memory) => {
                const allPolicies = [
                  ...memory.policies_passed.map(p => ({ ...p, passed: true })),
                  ...memory.policies_violated.map(p => ({ ...p, passed: false }))
                ].sort((a, b) => a.policy_name.localeCompare(b.policy_name));

                let badgeClass = 'badge-success';
                let statusText = '✓ Compliant';

                if (memory.compliance_status === 'resolved') {
                  badgeClass = 'badge-resolved';
                  statusText = '✓ Resolved';
                } else if (memory.compliance_status === 'issues') {
                  const severities = memory.policies_violated.map(p => p.severity);
                  if (severities.includes('error')) {
                    badgeClass = 'badge-danger';
                  } else if (severities.includes('warning')) {
                    badgeClass = 'badge-warning';
                  } else if (severities.includes('info')) {
                    badgeClass = 'badge-info';
                  }
                  statusText = `✗ ${memory.non_compliant_evaluations} ${memory.non_compliant_evaluations === 1 ? 'Policy' : 'Policies'} Failed`;
                }

                return (
                  <tr key={memory.memory_id}>
                    <td>{memory.memory_name.replace(/\.json$/, '')}</td>
                    <td>
                      <PolicyTooltip policies={allPolicies}>
                        <span className={`badge ${badgeClass}`}>
                          {statusText}
                        </span>
                      </PolicyTooltip>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          className="icon-button"
                          onClick={() => navigate(`/compliance/${memory.memory_id}`)}
                          title="Review compliance details"
                        >
                          🔍
                        </button>
                        {memory.compliance_status === 'issues' && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleResolve(memory.memory_id)}
                            disabled={resolvingId === memory.memory_id}
                            title="Mark as resolved"
                          >
                            {resolvingId === memory.memory_id ? '...' : 'Resolve'}
                          </button>
                        )}
                        {memory.compliance_status === 'resolved' && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleUnresolve(memory.memory_id)}
                            disabled={resolvingId === memory.memory_id}
                            title="Remove resolved status"
                          >
                            {resolvingId === memory.memory_id ? '...' : 'Unresolve'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <h3>No sessions found</h3>
          <p>Upload sessions and run compliance evaluations to see results</p>
        </div>
      )}
    </div>
  );
}

export default IssuesPage;
