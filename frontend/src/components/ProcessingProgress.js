import React from 'react';

function ProcessingProgress({
  jobStatus,
  onCancel,
  title = "Processing Sessions"
}) {
  if (!jobStatus) return null;

  const {
    status,
    total_items,
    completed_items,
    failed_items,
    progress_percent,
    error_message
  } = jobStatus;

  const isRunning = status === 'pending' || status === 'running';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';

  return (
    <div className="processing-progress">
      <div className="progress-header">
        <h4>{title}</h4>
        {isRunning && onCancel && (
          <button className="btn btn-sm btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      <div className="progress-bar-container">
        <div
          className={`progress-bar ${isCompleted ? 'completed' : ''} ${isFailed ? 'failed' : ''}`}
          style={{ width: `${progress_percent || 0}%` }}
        />
      </div>

      <div className="progress-details">
        <span className="progress-count">
          {completed_items} of {total_items} sessions
          {failed_items > 0 && <span className="failed-count"> ({failed_items} failed)</span>}
        </span>
        <span className="progress-percent">{Math.round(progress_percent || 0)}%</span>
      </div>

      {status === 'pending' && (
        <div className="progress-status">Preparing job...</div>
      )}

      {status === 'running' && (
        <div className="progress-status">Evaluating compliance policies...</div>
      )}

      {isCompleted && (
        <div className="progress-status success">
          Processing complete
        </div>
      )}

      {isFailed && (
        <div className="progress-status error">
          {error_message || 'Processing failed'}
        </div>
      )}
    </div>
  );
}

export default ProcessingProgress;
