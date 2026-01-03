import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { policyAPI, memoryAPI } from '../services/api';
import CompositePolicyBuilder from '../components/CompositePolicyBuilder';
import APIStatusBanner from '../components/APIStatusBanner';
import ProcessingProgress from '../components/ProcessingProgress';
import { useToast } from '../components/Toast';
import { useJob } from '../context/JobContext';

function PoliciesPage() {
  const { agentId } = useParams();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [evaluatingPolicyId, setEvaluatingPolicyId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const toast = useToast();
  const { jobStatus, isProcessing, submitJob } = useJob();

  useEffect(() => {
    if (agentId) {
      loadPolicies();
    }
  }, [agentId]);

  const loadPolicies = async () => {
    if (!agentId) return;
    try {
      setLoading(true);
      const response = await policyAPI.list(agentId);
      setPolicies(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPolicy(null);
    setShowBuilder(true);
  };

  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setShowBuilder(true);
  };

  const handleDelete = async (id) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    const id = deleteConfirm;
    setDeleteConfirm(null);

    try {
      await policyAPI.delete(agentId, id);
      toast.success('Policy deleted successfully');
      loadPolicies();
    } catch (err) {
      setError(err.message);
      toast.error(err.message, 'Delete Failed');
    }
  };

  const handleToggleEnabled = async (policy) => {
    try {
      await policyAPI.update(agentId, policy.id, { enabled: !policy.enabled });
      loadPolicies();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async (policyData) => {
    try {
      if (editingPolicy) {
        // Update existing policy
        await policyAPI.update(agentId, editingPolicy.id, policyData);
        toast.success('Policy updated successfully');
      } else {
        // Create new policy
        await policyAPI.create(agentId, policyData);
        toast.success('Policy created successfully');
      }
      setShowBuilder(false);
      setEditingPolicy(null);
      loadPolicies();
    } catch (err) {
      setError(err.message);
      toast.error(err.message, 'Error Saving Policy');
    }
  };

  const handleEvaluatePolicy = async (policyId, policyName) => {
    if (isProcessing) {
      toast.info('A job is already running. Please wait.');
      return;
    }

    try {
      // Get all memories for this agent
      const memoriesResponse = await memoryAPI.list(agentId);
      const memories = memoriesResponse.data;

      if (memories.length === 0) {
        toast.info('No sessions found to evaluate');
        return;
      }

      // Track which policy we're evaluating for UI feedback
      setEvaluatingPolicyId(policyId);

      // Submit async job with all memory IDs and this specific policy
      const memoryIds = memories.map(m => m.id);
      await submitJob(agentId, memoryIds, [policyId]);

      toast.success(`Started evaluation of "${policyName}" against ${memories.length} session(s)`);
    } catch (err) {
      toast.error(err.message, 'Evaluation Failed');
      setEvaluatingPolicyId(null);
    }
  };

  // Clear evaluating policy ID when job completes
  useEffect(() => {
    if (!isProcessing && evaluatingPolicyId) {
      setEvaluatingPolicyId(null);
    }
  }, [isProcessing, evaluatingPolicyId]);

  const getPolicyTypeBadge = (type, config) => {
    if (type === 'composite') {
      const logicType = config?.violation_logic?.type || 'UNKNOWN';

      // Show just the logic type for cleaner, more scalable display
      return (
        <span className="badge badge-primary" style={{ fontSize: '0.85rem' }}>
          {logicType}
        </span>
      );
    }

    // Legacy types (will show error when evaluated)
    const types = {
      response_length: { label: 'Response Length (Legacy)', class: 'badge-warning' },
      tool_call: { label: 'Tool Call (Legacy)', class: 'badge-warning' },
      tool_response: { label: 'Tool Response (Legacy)', class: 'badge-warning' },
      compound_tool: { label: 'Compound Tool (Legacy)', class: 'badge-warning' },
      llm_eval: { label: 'LLM Evaluation (Legacy)', class: 'badge-warning' },
    };
    const typeInfo = types[type] || { label: type, class: 'badge-secondary' };
    return <span className={`badge ${typeInfo.class}`}>{typeInfo.label}</span>;
  };

  const getSeverityBadge = (severity) => {
    const severities = {
      error: { label: 'Error', class: 'badge-danger' },
      warning: { label: 'Warning', class: 'badge-warning' },
      info: { label: 'Info', class: 'badge-info' }
    };
    const severityInfo = severities[severity || 'error'];
    return <span className={`badge ${severityInfo.class}`}>{severityInfo.label}</span>;
  };

  if (loading) return <div className="loading">Loading policies...</div>;

  return (
    <div className="policies-page">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button
          className="btn btn-primary"
          onClick={handleCreate}
        >
          + Create Policy
        </button>
      </div>

      <APIStatusBanner />

      {/* Inline progress bar when evaluating */}
      {isProcessing && evaluatingPolicyId && (
        <div className="inline-progress">
          <ProcessingProgress
            jobStatus={jobStatus}
            title={`Evaluating "${policies.find(p => p.id === evaluatingPolicyId)?.name || 'policy'}"`}
          />
        </div>
      )}

      {error && <div className="error">Error: {error}</div>}

      {policies.length === 0 ? (
        <div className="empty-state">
          <h3>No policies defined</h3>
          <p>Create your first composite policy to start monitoring compliance</p>
          <button className="btn btn-primary" onClick={handleCreate}>
            Get Started
          </button>
        </div>
      ) : (
        <div className="card">
          <h3>Policies ({policies.length})</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy.id}>
                  <td><strong>{policy.name}</strong></td>
                  <td>{getPolicyTypeBadge(policy.policy_type, policy.config)}</td>
                  <td>{getSeverityBadge(policy.severity)}</td>
                  <td>{policy.description || '-'}</td>
                  <td>
                    <span className={`badge ${policy.enabled ? 'badge-success' : 'badge-secondary'}`}>
                      {policy.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <button
                        className="icon-button"
                        onClick={() => handleEvaluatePolicy(policy.id, policy.name)}
                        disabled={isProcessing}
                        title="Evaluate this policy against all sessions"
                      >
                        {evaluatingPolicyId === policy.id ? '↻' : '▶️'}
                      </button>
                      <button
                        className="icon-button"
                        onClick={() => handleEdit(policy)}
                        title="Edit policy"
                      >
                        ✏️
                      </button>
                      <button
                        className="icon-button"
                        onClick={() => handleToggleEnabled(policy)}
                        title={policy.enabled ? 'Disable policy' : 'Enable policy'}
                      >
                        {policy.enabled ? '⏸️' : '▶️'}
                      </button>
                      <button
                        className="icon-button delete"
                        onClick={() => handleDelete(policy.id)}
                        title="Delete policy"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showBuilder && (
        <CompositePolicyBuilder
          initialPolicy={editingPolicy}
          onClose={() => {
            setShowBuilder(false);
            setEditingPolicy(null);
          }}
          onSave={handleSave}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Policy</h3>
            <p>Are you sure you want to delete this policy? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PoliciesPage;
