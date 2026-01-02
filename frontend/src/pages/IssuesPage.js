import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complianceAPI } from '../services/api';
import PolicyTooltip from '../components/PolicyTooltip';

function IssuesPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

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

  if (loading) return <div className="loading">Loading issues...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!summary) return null;

  const filteredMemories = summary.all_memories ? summary.all_memories.filter(memory => {
    if (filterStatus === 'compliant') return memory.is_compliant;
    if (filterStatus === 'non-compliant') return !memory.is_compliant;
    return true;
  }) : [];

  const compliantCount = summary.all_memories ? summary.all_memories.filter(m => m.is_compliant).length : 0;
  const nonCompliantCount = summary.all_memories ? summary.all_memories.filter(m => !m.is_compliant).length : 0;

  return (
    <div className="issues-page">
      {summary.all_memories && summary.all_memories.length > 0 ? (
        <div className="card">
          <div className="card-header-with-actions">
            <h3>Agent instances</h3>
            <div className="filter-tabs">
              <button
                className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                All ({summary.all_memories.length})
              </button>
              <button
                className={`filter-tab ${filterStatus === 'compliant' ? 'active' : ''}`}
                onClick={() => setFilterStatus('compliant')}
              >
                Compliant ({compliantCount})
              </button>
              <button
                className={`filter-tab ${filterStatus === 'non-compliant' ? 'active' : ''}`}
                onClick={() => setFilterStatus('non-compliant')}
              >
                Non-Compliant ({nonCompliantCount})
              </button>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Agent Instance Name</th>
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
                if (!memory.is_compliant && memory.policies_violated.length > 0) {
                  const severities = memory.policies_violated.map(p => p.severity);
                  if (severities.includes('error')) {
                    badgeClass = 'badge-danger';
                  } else if (severities.includes('warning')) {
                    badgeClass = 'badge-warning';
                  } else if (severities.includes('info')) {
                    badgeClass = 'badge-info';
                  }
                }

                return (
                  <tr key={memory.memory_id}>
                    <td>{memory.memory_name.replace(/\.json$/, '')}</td>
                    <td>
                      <PolicyTooltip policies={allPolicies}>
                        {memory.is_compliant ? (
                          <span className={`badge ${badgeClass}`}>
                            ✓ Compliant
                          </span>
                        ) : (
                          <span className={`badge ${badgeClass}`}>
                            ✗ {memory.non_compliant_evaluations} {memory.non_compliant_evaluations === 1 ? 'Policy' : 'Policies'} Failed
                          </span>
                        )}
                      </PolicyTooltip>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        onClick={() => navigate(`/compliance/${memory.memory_id}`)}
                        title="Review compliance details"
                      >
                        🔍
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <h3>No agent instances found</h3>
          <p>Upload agent instances and run compliance evaluations to see results</p>
        </div>
      )}
    </div>
  );
}

export default IssuesPage;
