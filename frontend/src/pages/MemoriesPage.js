import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { memoryAPI, complianceAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { useJob } from '../context/JobContext';
import ProcessingProgress from '../components/ProcessingProgress';

function StatusBadge({ status }) {
  if (!status) return <span className="status-badge unprocessed">Unprocessed</span>;

  // Processed but missing evaluations for new policies
  if (status.is_processed && !status.is_fully_evaluated) {
    return (
      <span
        className="status-badge partial"
        title={`Evaluated against ${status.policies_evaluated} of ${status.policies_total} policies`}
      >
        Needs Re-processing
      </span>
    );
  }

  // Fully processed
  if (status.is_processed && status.is_fully_evaluated) {
    return <span className="status-badge processed">Processed</span>;
  }

  // Never processed
  return <span className="status-badge unprocessed">Unprocessed</span>;
}

function MemoriesPage() {
  const { agentId } = useParams();
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { jobStatus, isProcessing, submitJob } = useJob();

  useEffect(() => {
    if (agentId) {
      loadMemories();
    }
  }, [agentId]);

  // Listen for job completion events (from global context)
  useEffect(() => {
    const handleJobCompleted = () => {
      loadMemories();
    };

    window.addEventListener('jobCompleted', handleJobCompleted);
    return () => window.removeEventListener('jobCompleted', handleJobCompleted);
  }, []);

  const loadMemories = async () => {
    if (!agentId) return;
    try {
      setLoading(true);
      const response = await memoryAPI.list(agentId);
      setMemories(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter memories based on tab
  const filteredMemories = memories.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'processed') return m.processing_status?.is_processed && m.processing_status?.is_fully_evaluated;
    if (filter === 'needs-reprocessing') return m.processing_status?.is_processed && !m.processing_status?.is_fully_evaluated;
    if (filter === 'unprocessed') return !m.processing_status?.is_processed;
    return true;
  });

  // Counts for tabs
  const counts = {
    all: memories.length,
    processed: memories.filter(m => m.processing_status?.is_processed && m.processing_status?.is_fully_evaluated).length,
    needsReprocessing: memories.filter(m => m.processing_status?.is_processed && !m.processing_status?.is_fully_evaluated).length,
    unprocessed: memories.filter(m => !m.processing_status?.is_processed).length,
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredMemories.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMemories.map(m => m.id)));
    }
  };

  // Single handler for the process button - processes selected if any, otherwise all pending (unprocessed or needs reprocessing)
  const handleProcess = async () => {
    const pendingMemories = memories.filter(m => !m.processing_status?.is_fully_evaluated);
    const idsToProcess = selectedIds.size > 0
      ? [...selectedIds]
      : pendingMemories.map(m => m.id);

    if (idsToProcess.length === 0) {
      toast.info('All sessions are already processed', 'Info');
      return;
    }

    try {
      await submitJob(agentId, idsToProcess);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(`Processing failed: ${err.message}`, 'Error');
    }
  };

  const handleProcessSingle = async (memoryId) => {
    try {
      await complianceAPI.processBatch(agentId, [memoryId]);
      toast.success('Successfully processed session', 'Complete');
      await loadMemories();
    } catch (err) {
      toast.error(`Processing failed: ${err.message}`, 'Error');
    }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      const response = await complianceAPI.reset(agentId);
      toast.success(response.data.message || 'All evaluations reset', 'Reset Complete');
      setShowResetDialog(false);
      await loadMemories();
    } catch (err) {
      toast.error(`Reset failed: ${err.message}`, 'Error');
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <div className="loading">Loading sessions...</div>;

  // Determine button label based on selection state
  const getProcessButtonLabel = () => {
    const pending = counts.unprocessed + counts.needsReprocessing;
    if (isProcessing) return 'Processing...';
    if (selectedIds.size > 0) return `Process Selected (${selectedIds.size})`;
    return pending > 0 ? `Process All Pending (${pending})` : 'Process';
  };

  return (
    <div className="memories-page">
      <div className="page-header-actions">
        {(counts.unprocessed > 0 || counts.needsReprocessing > 0 || selectedIds.size > 0) && (
          <button
            className="btn btn-primary"
            onClick={handleProcess}
            disabled={isProcessing}
          >
            {getProcessButtonLabel()}
          </button>
        )}
        <button
          className="btn btn-secondary"
          onClick={() => setShowResetDialog(true)}
          disabled={isProcessing || resetting}
        >
          Reset All Evaluations
        </button>
      </div>

      {/* Inline progress bar when processing */}
      {isProcessing && jobStatus && (
        <div className="inline-progress">
          <ProcessingProgress jobStatus={jobStatus} title="Processing Sessions" />
        </div>
      )}

      {error && <div className="error">Error: {error}</div>}

      {/* Filter tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({counts.all})
        </button>
        <button
          className={`filter-tab ${filter === 'unprocessed' ? 'active' : ''}`}
          onClick={() => setFilter('unprocessed')}
        >
          Unprocessed ({counts.unprocessed})
        </button>
        <button
          className={`filter-tab ${filter === 'needs-reprocessing' ? 'active' : ''}`}
          onClick={() => setFilter('needs-reprocessing')}
        >
          Needs Re-processing ({counts.needsReprocessing})
        </button>
        <button
          className={`filter-tab ${filter === 'processed' ? 'active' : ''}`}
          onClick={() => setFilter('processed')}
        >
          Processed ({counts.processed})
        </button>
      </div>

      {memories.length === 0 ? (
        <div className="empty-state">
          <h3>No sessions found</h3>
          <p>Add JSON files to the <code>sample_memories</code> folder to see them here</p>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="empty-state">
          <h3>No {filter} sessions</h3>
          <p>
            {filter === 'processed'
              ? 'Process some sessions to see them here'
              : 'All sessions have been processed'}
          </p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredMemories.length && filteredMemories.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Name</th>
                <th>Status</th>
                <th>Last Modified</th>
                <th>Messages</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMemories.map((memory) => (
                <tr key={memory.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(memory.id)}
                      onChange={() => toggleSelect(memory.id)}
                    />
                  </td>
                  <td>{memory.name}</td>
                  <td>
                    <StatusBadge status={memory.processing_status} />
                  </td>
                  <td>{new Date(memory.uploaded_at).toLocaleString()}</td>
                  <td>{memory.messages.length}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <button
                        className="icon-button"
                        onClick={() => navigate(`/${agentId}/memories/${memory.id}`, { state: { from: `/${agentId}/memories` } })}
                        title="View details"
                      >
                        🔍
                      </button>
                      <button
                        className="icon-button"
                        onClick={() => handleProcessSingle(memory.id)}
                        disabled={isProcessing}
                        title="Process session"
                      >
                        {isProcessing ? '↻' : '▶️'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reset confirmation dialog */}
      {showResetDialog && (
        <div className="modal-overlay" onClick={() => setShowResetDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Reset All Evaluations?</h3>
            <p>This will permanently delete all compliance evaluations and agent variant data.</p>
            <p><strong>Warning:</strong> This action cannot be undone. You will need to re-process all sessions.</p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowResetDialog(false)}
                disabled={resetting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleReset}
                disabled={resetting}
              >
                {resetting ? 'Resetting...' : 'Reset All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemoriesPage;
