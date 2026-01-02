import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { memoryAPI, complianceAPI } from '../services/api';
import { useToast } from '../components/Toast';

function StatusBadge({ status }) {
  if (!status) return <span className="status-badge unprocessed">Unprocessed</span>;

  if (status.is_processed) {
    return <span className="status-badge processed">Processed</span>;
  }

  return <span className="status-badge unprocessed">Unprocessed</span>;
}

function MemoriesPage() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [processing, setProcessing] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      setLoading(true);
      const response = await memoryAPI.list();
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
    if (filter === 'processed') return m.processing_status?.is_processed;
    if (filter === 'unprocessed') return !m.processing_status?.is_processed;
    return true;
  });

  // Counts for tabs
  const counts = {
    all: memories.length,
    processed: memories.filter(m => m.processing_status?.is_processed).length,
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

  const handleProcessSelected = async () => {
    if (selectedIds.size === 0) return;

    try {
      setProcessing(true);
      toast.info(`Processing ${selectedIds.size} instance(s)...`, 'Processing');
      await complianceAPI.processBatch([...selectedIds]);
      toast.success(`Successfully processed ${selectedIds.size} instance(s)`, 'Complete');
      setSelectedIds(new Set());
      await loadMemories();
    } catch (err) {
      toast.error(`Processing failed: ${err.message}`, 'Error');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessSingle = async (memoryId) => {
    try {
      setProcessing(true);
      toast.info('Processing instance...', 'Processing');
      await complianceAPI.processBatch([memoryId]);
      toast.success('Successfully processed instance', 'Complete');
      await loadMemories();
    } catch (err) {
      toast.error(`Processing failed: ${err.message}`, 'Error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      const response = await complianceAPI.reset();
      toast.success(response.data.message || 'All evaluations reset', 'Reset Complete');
      setShowResetDialog(false);
      await loadMemories();
    } catch (err) {
      toast.error(`Reset failed: ${err.message}`, 'Error');
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <div className="loading">Loading agent instances...</div>;

  return (
    <div className="memories-page">
      <div className="page-header-actions">
        {selectedIds.size > 0 && (
          <button
            className="btn btn-success"
            onClick={handleProcessSelected}
            disabled={processing}
          >
            {processing ? 'Processing...' : `Process Selected (${selectedIds.size})`}
          </button>
        )}
        <button
          className="btn btn-secondary"
          onClick={() => setShowResetDialog(true)}
          disabled={processing || resetting}
        >
          Reset All Evaluations
        </button>
      </div>

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
          className={`filter-tab ${filter === 'processed' ? 'active' : ''}`}
          onClick={() => setFilter('processed')}
        >
          Processed ({counts.processed})
        </button>
      </div>

      {memories.length === 0 ? (
        <div className="empty-state">
          <h3>No agent instances found</h3>
          <p>Add JSON files to the <code>sample_memories</code> folder to see them here</p>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="empty-state">
          <h3>No {filter} instances</h3>
          <p>
            {filter === 'processed'
              ? 'Process some instances to see them here'
              : 'All instances have been processed'}
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
                        onClick={() => navigate(`/memories/${memory.id}`, { state: { from: '/memories' } })}
                        title="View details"
                      >
                        🔍
                      </button>
                      <button
                        className="icon-button"
                        onClick={() => handleProcessSingle(memory.id)}
                        disabled={processing}
                        title="Process instance"
                      >
                        {processing ? '↻' : '▶️'}
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
            <p><strong>Warning:</strong> This action cannot be undone. You will need to re-process all agent instances.</p>
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
