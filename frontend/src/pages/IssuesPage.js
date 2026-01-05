import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { complianceAPI, memoryAPI } from '../services/api';
import { useToast } from '../components/Toast';
import PolicyTooltip from '../components/PolicyTooltip';

function IssuesPage() {
  const { agentId } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPolicyId, setFilterPolicyId] = useState(null);
  const [filterPolicyStatus, setFilterPolicyStatus] = useState(null); // 'violated' or 'passed'
  const [filterMemoryIds, setFilterMemoryIds] = useState([]);
  const [resolvingId, setResolvingId] = useState(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  // Initialize filters from URL params
  useEffect(() => {
    const policyId = searchParams.get('policy');
    const status = searchParams.get('status');
    const policyStatus = searchParams.get('policyStatus'); // 'violated' or 'passed'
    const memoriesParam = searchParams.get('memories');

    if (policyId) {
      setFilterPolicyId(parseInt(policyId, 10));
    } else {
      setFilterPolicyId(null);
    }

    if (status && ['all', 'issues', 'resolved', 'compliant'].includes(status)) {
      setFilterStatus(status);
    }

    if (policyStatus && ['violated', 'passed'].includes(policyStatus)) {
      setFilterPolicyStatus(policyStatus);
    } else {
      setFilterPolicyStatus(null);
    }

    if (memoriesParam) {
      const ids = memoriesParam.split(',').map(id => id.trim()).filter(Boolean);
      setFilterMemoryIds(ids);
    } else {
      setFilterMemoryIds([]);
    }
  }, [searchParams]);

  useEffect(() => {
    if (agentId) {
      loadSummary();
    }
  }, [agentId]);

  const loadSummary = async () => {
    if (!agentId) return;
    try {
      setLoading(true);
      const response = await complianceAPI.getSummary(agentId);
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
      await memoryAPI.resolve(agentId, memoryId);
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
      await memoryAPI.unresolve(agentId, memoryId);
      toast.success('Session resolution removed', 'Unresolved');
      await loadSummary();
    } catch (err) {
      toast.error(`Failed to unresolve: ${err.message}`, 'Error');
    } finally {
      setResolvingId(null);
    }
  };

  // Update URL params when filters change
  const updateFilters = (newStatus, newPolicyId, newPolicyStatus, newMemoryIds = []) => {
    const params = new URLSearchParams();
    // Always include status in URL, even if 'all'
    if (newStatus) {
      params.set('status', newStatus);
    }
    if (newPolicyId) {
      params.set('policy', newPolicyId.toString());
    }
    if (newPolicyStatus) {
      params.set('policyStatus', newPolicyStatus);
    }
    if (newMemoryIds && newMemoryIds.length > 0) {
      params.set('memories', newMemoryIds.join(','));
    }
    setSearchParams(params);
    setFilterStatus(newStatus || 'all');
    setFilterPolicyId(newPolicyId);
    setFilterPolicyStatus(newPolicyStatus);
    setFilterMemoryIds(newMemoryIds || []);
  };

  const handleStatusChange = (status) => {
    updateFilters(status, filterPolicyId, filterPolicyStatus);
  };

  const clearPolicyFilter = () => {
    updateFilters(filterStatus, null, null);
  };

  const clearAllFilters = () => {
    updateFilters('all', null, null);
  };

  if (loading) return <div className="loading">Loading issues...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!summary) return null;

  // Get policy name for filter chip display
  const getFilteredPolicyName = () => {
    if (!filterPolicyId || !summary.compliance_by_policy) return null;
    const policy = summary.compliance_by_policy[filterPolicyId];
    return policy ? policy.name : null;
  };

  const filteredPolicyName = getFilteredPolicyName();

  // Filter based on compliance_status AND policy
  const filteredMemories = summary.all_memories ? summary.all_memories.filter(memory => {
    if (filterMemoryIds.length > 0 && !filterMemoryIds.includes(memory.memory_id)) return false;
    // Status filter
    if (filterStatus === 'compliant' && memory.compliance_status !== 'compliant') return false;
    if (filterStatus === 'issues' && memory.compliance_status !== 'issues') return false;
    if (filterStatus === 'resolved' && memory.compliance_status !== 'resolved') return false;

    // Policy filter - check if memory has this policy in violated or passed
    if (filterPolicyId) {
      const violatedPolicyIds = memory.policies_violated.map(p => p.policy_id);
      const passedPolicyIds = memory.policies_passed.map(p => p.policy_id);

      // If policyStatus is specified, filter more strictly
      if (filterPolicyStatus === 'violated') {
        if (!violatedPolicyIds.includes(filterPolicyId)) return false;
      } else if (filterPolicyStatus === 'passed') {
        if (!passedPolicyIds.includes(filterPolicyId)) return false;
      } else {
        // No specific status, just check if evaluated against this policy
        const allPolicyIds = [...violatedPolicyIds, ...passedPolicyIds];
        if (!allPolicyIds.includes(filterPolicyId)) return false;
      }
    }

    return true;
  }) : [];

  // Counts for filter tabs (respect policy filter)
  const getFilteredByPolicy = (memories) => {
    if (!filterPolicyId) return memories;
    return memories.filter(memory => {
      const violatedPolicyIds = memory.policies_violated.map(p => p.policy_id);
      const passedPolicyIds = memory.policies_passed.map(p => p.policy_id);

      if (filterPolicyStatus === 'violated') {
        return violatedPolicyIds.includes(filterPolicyId);
      } else if (filterPolicyStatus === 'passed') {
        return passedPolicyIds.includes(filterPolicyId);
      }
      return [...violatedPolicyIds, ...passedPolicyIds].includes(filterPolicyId);
    });
  };

  const policyFilteredMemories = getFilteredByPolicy(summary.all_memories || []);
  const compliantCount = policyFilteredMemories.filter(m => m.compliance_status === 'compliant').length;
  const issuesCount = policyFilteredMemories.filter(m => m.compliance_status === 'issues').length;
  const resolvedCount = policyFilteredMemories.filter(m => m.compliance_status === 'resolved').length;

  // Get list of policies for the dropdown
  const policyOptions = summary.compliance_by_policy
    ? Object.entries(summary.compliance_by_policy).map(([id, policy]) => ({
        id: parseInt(id, 10),
        name: policy.name
      })).sort((a, b) => a.name.localeCompare(b.name))
    : [];

  // Handle policy filter selection from dropdown
  const handlePolicyFilterChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      updateFilters(filterStatus, null, null);
    } else {
      const [policyId, policyStatus] = value.split(':');
      updateFilters(filterStatus, parseInt(policyId, 10), policyStatus || null);
    }
  };

  // Get current dropdown value
  const getCurrentFilterValue = () => {
    if (!filterPolicyId) return '';
    if (filterPolicyStatus) {
      return `${filterPolicyId}:${filterPolicyStatus}`;
    }
    return `${filterPolicyId}`;
  };

  // Calculate partially evaluated sessions count
  const partiallyEvaluatedCount = summary.all_memories ? summary.all_memories.filter(m => m.is_fully_evaluated === false).length : 0;

  return (
    <div className="issues-page">
      {/* Warning banner for partially evaluated sessions */}
      {partiallyEvaluatedCount > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          <strong>⚠ Partial Evaluation Warning:</strong> {partiallyEvaluatedCount} session{partiallyEvaluatedCount !== 1 ? 's have' : ' has'} been evaluated against some but not all policies.
          {' '}Go to the <a href={`/${agentId}/memories`} style={{ textDecoration: 'underline' }}>Sessions page</a> and click "Process All Unprocessed" to evaluate all sessions against all enabled policies.
        </div>
      )}

      {/* Filter controls */}
      <div className="filter-controls">
        <label className="filter-control-label">Filter by policy:</label>
        <select
          className="filter-select"
          value={getCurrentFilterValue()}
          onChange={handlePolicyFilterChange}
        >
          <option value="">All policies</option>
          {policyOptions.map(policy => (
            <optgroup key={policy.id} label={policy.name}>
              <option value={`${policy.id}:violated`}>Failed: {policy.name}</option>
              <option value={`${policy.id}:passed`}>Passed: {policy.name}</option>
              <option value={`${policy.id}`}>Any: {policy.name}</option>
            </optgroup>
          ))}
        </select>
      </div>

      {/* Filter chips - show active filter for quick dismissal */}
      {filterPolicyId && (
        <div className="filter-chips">
          <span className="filter-chips-label">Active filter:</span>
          <div className={`filter-chip ${filterPolicyStatus === 'violated' ? 'filter-chip-violated' : filterPolicyStatus === 'passed' ? 'filter-chip-passed' : ''}`}>
            <span className="filter-chip-label">
              {filterPolicyStatus === 'violated' ? 'Failed:' : filterPolicyStatus === 'passed' ? 'Passed:' : 'Policy:'}
            </span>
            <span className="filter-chip-value">{filteredPolicyName || `ID ${filterPolicyId}`}</span>
            <button className="filter-chip-remove" onClick={clearPolicyFilter} title="Remove filter">×</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header-with-actions">
          <h3>Sessions</h3>
          {policyFilteredMemories.length > 0 && (
            <div className="filter-tabs">
              <button
                className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => handleStatusChange('all')}
              >
                All ({policyFilteredMemories.length})
              </button>
              <button
                className={`filter-tab ${filterStatus === 'issues' ? 'active' : ''}`}
                onClick={() => handleStatusChange('issues')}
              >
                Issues ({issuesCount})
              </button>
              <button
                className={`filter-tab ${filterStatus === 'resolved' ? 'active' : ''}`}
                onClick={() => handleStatusChange('resolved')}
              >
                Resolved ({resolvedCount})
              </button>
              <button
                className={`filter-tab ${filterStatus === 'compliant' ? 'active' : ''}`}
                onClick={() => handleStatusChange('compliant')}
              >
                Compliant ({compliantCount})
              </button>
            </div>
          )}
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
            {filteredMemories.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                  {summary.all_memories && summary.all_memories.length > 0
                    ? 'No sessions match this filter'
                    : 'No sessions evaluated yet. Process sessions from the Sessions page to see compliance results.'}
                </td>
              </tr>
            ) : (
              filteredMemories.map((memory) => {
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
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <PolicyTooltip policies={allPolicies}>
                          <span className={`badge ${badgeClass}`}>
                            {statusText}
                          </span>
                        </PolicyTooltip>
                        {memory.is_fully_evaluated === false && (
                          <span
                            className="badge badge-warning"
                            style={{ fontSize: '0.75rem' }}
                            title={`Evaluated against ${memory.evaluated_policy_count} of ${memory.total_policy_count} policies. Re-process to evaluate all policies.`}
                          >
                            ⚠ Partial ({memory.evaluated_policy_count}/{memory.total_policy_count})
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          className="icon-button"
                          onClick={() => {
                            // Build returnUrl from current filter state
                            const params = new URLSearchParams();
                            if (filterStatus) params.set('status', filterStatus);
                            if (filterPolicyId) params.set('policy', filterPolicyId.toString());
                            if (filterPolicyStatus) params.set('policyStatus', filterPolicyStatus);

                            const returnUrl = `/${agentId}/issues?${params.toString()}`;

                            navigate(`/${agentId}/compliance/${memory.memory_id}`, {
                              state: {
                                navigationList: filteredMemories.map(m => m.memory_id),
                                returnUrl: returnUrl
                              }
                            });
                          }}
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default IssuesPage;
