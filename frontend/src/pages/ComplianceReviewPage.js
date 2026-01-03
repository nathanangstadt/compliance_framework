import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { memoryAPI, complianceAPI } from '../services/api';
import MessageList from '../components/MessageList';
import ToolFlowVisualization from '../components/ToolFlowVisualization';
import { ViolationSummary } from '../components/ViolationDisplay';
import { useToast } from '../components/Toast';
import './MemoryDetailPage.css';

// Session metadata display component
function SessionInfoPanel({ memory, evaluations }) {
  // Calculate token counts from messages
  const tokenStats = useMemo(() => {
    let inputTokens = 0;
    let outputTokens = 0;

    memory.messages?.forEach(msg => {
      if (msg.usage) {
        inputTokens += msg.usage.input_tokens || 0;
        outputTokens += msg.usage.output_tokens || 0;
      }
    });

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens
    };
  }, [memory.messages]);

  // Extract tool names used in session
  const toolsUsed = useMemo(() => {
    const tools = new Set();
    memory.messages?.forEach(msg => {
      if (msg.role === 'assistant' && Array.isArray(msg.content)) {
        msg.content.forEach(block => {
          if (block.type === 'tool_use') {
            tools.add(block.name);
          }
        });
      }
    });
    return Array.from(tools);
  }, [memory.messages]);

  // Format duration from seconds
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    return `${Math.round(seconds / 3600)} hours`;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const metadata = memory.metadata || {};

  return (
    <div className="session-info-panel">
      <div className="info-section">
        <h4>Session Details</h4>
        <table className="info-table">
          <tbody>
            <tr>
              <td className="info-label">Session ID</td>
              <td className="info-value">{metadata.session_id || memory.id}</td>
            </tr>
            <tr>
              <td className="info-label">File Name</td>
              <td className="info-value">{memory.name}</td>
            </tr>
            {metadata.timestamp && (
              <tr>
                <td className="info-label">Start Time</td>
                <td className="info-value">{formatDate(metadata.timestamp)}</td>
              </tr>
            )}
            {metadata.duration_seconds && (
              <tr>
                <td className="info-label">Duration</td>
                <td className="info-value">{formatDuration(metadata.duration_seconds)}</td>
              </tr>
            )}
            <tr>
              <td className="info-label">Last Modified</td>
              <td className="info-value">{formatDate(memory.uploaded_at)}</td>
            </tr>
            <tr>
              <td className="info-label">Message Count</td>
              <td className="info-value">{memory.message_count || memory.messages?.length || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {metadata.user_id && (
        <div className="info-section">
          <h4>User Information</h4>
          <table className="info-table">
            <tbody>
              <tr>
                <td className="info-label">User ID</td>
                <td className="info-value">{metadata.user_id}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {metadata.business_identifiers && Object.keys(metadata.business_identifiers).length > 0 && (
        <div className="info-section">
          <h4>Business Identifiers</h4>
          <table className="info-table">
            <tbody>
              {Object.entries(metadata.business_identifiers).map(([key, value]) => (
                <tr key={key}>
                  <td className="info-label">{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
                  <td className="info-value">{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {metadata.tags && metadata.tags.length > 0 && (
        <div className="info-section">
          <h4>Tags</h4>
          <div className="tags-container">
            {metadata.tags.map((tag, idx) => (
              <span key={idx} className="info-tag">{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div className="info-section">
        <h4>Token Usage</h4>
        <table className="info-table">
          <tbody>
            <tr>
              <td className="info-label">Input Tokens</td>
              <td className="info-value">{tokenStats.inputTokens.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="info-label">Output Tokens</td>
              <td className="info-value">{tokenStats.outputTokens.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="info-label">Total Tokens</td>
              <td className="info-value">{tokenStats.totalTokens.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {toolsUsed.length > 0 && (
        <div className="info-section">
          <h4>Tools Used ({toolsUsed.length})</h4>
          <div className="tools-list">
            {toolsUsed.map((tool, idx) => (
              <span key={idx} className="tool-chip">{tool}</span>
            ))}
          </div>
        </div>
      )}

      <div className="info-section">
        <h4>Compliance Summary</h4>
        <table className="info-table">
          <tbody>
            <tr>
              <td className="info-label">Policies Evaluated</td>
              <td className="info-value">{evaluations.length}</td>
            </tr>
            <tr>
              <td className="info-label">Policies Passed</td>
              <td className="info-value">{evaluations.filter(e => e.is_compliant).length}</td>
            </tr>
            <tr>
              <td className="info-label">Policies Failed</td>
              <td className="info-value">{evaluations.filter(e => !e.is_compliant).length}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComplianceReviewPage() {
  const { agentId, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [allMemories, setAllMemories] = useState([]);
  const [resolvingId, setResolvingId] = useState(null);
  const toast = useToast();

  // Get navigation list from location state (passed from IssuesPage)
  const navigationList = location.state?.navigationList || null;
  const returnUrl = location.state?.returnUrl || `/${agentId}/issues`;

  // Get active tab from window - set by navbar
  const [activeTab, setActiveTab] = useState('compliance');

  // Expose returnUrl immediately for navbar (before useEffect runs)
  window.complianceReviewState = window.complianceReviewState || {};
  window.complianceReviewState.returnUrl = returnUrl;
  window.complianceReviewState.activeTab = activeTab;
  window.complianceReviewState.setActiveTab = setActiveTab;

  // Listen for tab changes from navbar
  useEffect(() => {
    const handleTabChange = (event) => {
      setActiveTab(event.detail.tab);
    };
    window.addEventListener('complianceTabChange', handleTabChange);
    return () => window.removeEventListener('complianceTabChange', handleTabChange);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { delete window.complianceReviewState; };
  }, []);

  // Load all memories for navigation
  useEffect(() => {
    if (!agentId) return;
    const loadAllMemories = async () => {
      try {
        const response = await complianceAPI.getSummary(agentId);
        setAllMemories(response.data.all_memories || []);
      } catch (err) {
        console.error('Failed to load all memories:', err);
      }
    };
    loadAllMemories();
  }, [agentId]);

  useEffect(() => {
    if (!agentId || !id) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const [memoryResponse, evalResponse] = await Promise.all([
          memoryAPI.get(agentId, id),
          complianceAPI.getMemoryEvaluations(agentId, id)
        ]);
        setMemory(memoryResponse.data);
        setEvaluations(evalResponse.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [agentId, id]);

  // Update navbar title when memory is loaded
  useEffect(() => {
    if (memory) {
      const titleElement = document.getElementById('compliance-review-title');
      if (titleElement) {
        const cleanName = memory.name.replace(/\.json$/, '');
        titleElement.querySelector('h1').textContent = cleanName;
      }
    }
  }, [memory]);

  const handleReEvaluatePolicy = async (policyId) => {
    try {
      await complianceAPI.evaluate(agentId, id, [policyId]);
      const evalResponse = await complianceAPI.getMemoryEvaluations(agentId, id);
      setEvaluations(evalResponse.data);
      toast.success('Policy re-evaluated successfully', 'Re-evaluation Complete');
    } catch (err) {
      toast.error(err.message, 'Re-evaluation Failed');
    }
  };

  const handleResolve = async () => {
    try {
      setResolvingId(id);
      await memoryAPI.resolve(agentId, id);
      toast.success('Session marked as resolved', 'Resolved');
      // Reload data to get updated compliance status
      const [evalResponse, summaryResponse] = await Promise.all([
        complianceAPI.getMemoryEvaluations(agentId, id),
        complianceAPI.getSummary(agentId)
      ]);
      setEvaluations(evalResponse.data);
      setAllMemories(summaryResponse.data.all_memories || []);
    } catch (err) {
      toast.error(`Failed to resolve: ${err.message}`, 'Error');
    } finally {
      setResolvingId(null);
    }
  };

  const handleUnresolve = async () => {
    try {
      setResolvingId(id);
      await memoryAPI.unresolve(agentId, id);
      toast.success('Session resolution removed', 'Unresolved');
      // Reload data to get updated compliance status
      const [evalResponse, summaryResponse] = await Promise.all([
        complianceAPI.getMemoryEvaluations(agentId, id),
        complianceAPI.getSummary(agentId)
      ]);
      setEvaluations(evalResponse.data);
      setAllMemories(summaryResponse.data.all_memories || []);
    } catch (err) {
      toast.error(`Failed to unresolve: ${err.message}`, 'Error');
    } finally {
      setResolvingId(null);
    }
  };

  // Navigation helpers - use navigationList if provided, otherwise use all memories
  const navList = navigationList || allMemories.map(m => m.memory_id);
  const currentIndex = navList.findIndex(memId => memId === id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < navList.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      navigate(`/${agentId}/compliance/${navList[currentIndex - 1]}`, {
        state: location.state // Preserve navigation state
      });
    }
  };

  const handleNext = () => {
    if (hasNext) {
      navigate(`/${agentId}/compliance/${navList[currentIndex + 1]}`, {
        state: location.state // Preserve navigation state
      });
    }
  };

  // Build violations map for message overlay
  const getViolationsForMessage = useMemo(() => {
    if (!evaluations.length) return () => [];

    return (messageIndex) => {
      const violations = [];
      evaluations.forEach(eval_ => {
        if (!eval_.is_compliant && eval_.violations) {
          eval_.violations.forEach(v => {
            // For IF_ANY_THEN_ALL policies, show both triggers and failed requirements
            if (v.violation_type === 'IF_ANY_THEN_ALL' || v.violation_type === 'IF_ALL_THEN_ALL') {
              // Add triggered checks for this message
              if (v.triggered_checks) {
                v.triggered_checks.forEach(check => {
                  if (check.matched_items && check.matched_items.some(item => item.message_index === messageIndex)) {
                    violations.push({
                      ...check,
                      policy_id: eval_.policy_id,
                      policy_name: v.policy_name || eval_.policy_name,
                      is_trigger: true,
                      is_compliant: eval_.is_compliant
                    });
                  }
                });
              }

              // Add failed requirements for this message
              if (v.failed_requirements) {
                v.failed_requirements.forEach(check => {
                  if (check.matched_items && check.matched_items.some(item => item.message_index === messageIndex)) {
                    violations.push({
                      ...check,
                      policy_id: eval_.policy_id,
                      policy_name: v.policy_name || eval_.policy_name,
                      is_requirement: true,
                      is_compliant: eval_.is_compliant
                    });
                  }
                });
              }
            } else {
              // For other policy types, show violations at this message index
              if (v.message_index === messageIndex) {
                violations.push({
                  ...v,
                  policy_id: eval_.policy_id,
                  is_compliant: eval_.is_compliant
                });
              }
            }
          });
        }
      });
      return violations;
    };
  }, [evaluations]);

  if (loading) return <div className="loading">Loading compliance review...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!memory) return <div className="error">Session not found</div>;

  // Determine compliance status from summary
  const currentMemoryData = allMemories.find(m => m.memory_id === id);
  const complianceStatus = currentMemoryData?.compliance_status || 'compliant';
  const hasIssues = complianceStatus === 'issues';
  const isResolved = complianceStatus === 'resolved';

  return (
    <div className="memory-detail-page">
      <div className="memory-detail-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-sm btn-secondary"
              onClick={handlePrevious}
              disabled={!hasPrevious}
              title="Previous session"
            >
              ← Previous
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleNext}
              disabled={!hasNext}
              title="Next session"
            >
              Next →
            </button>
          </div>

          <span className="message-count">{memory.messages.length} messages</span>

          {/* Resolve/Unresolve buttons */}
          {hasIssues && (
            <button
              className="btn btn-sm btn-success"
              onClick={handleResolve}
              disabled={resolvingId === id}
              title="Mark as resolved"
            >
              {resolvingId === id ? '...' : 'Resolve'}
            </button>
          )}
          {isResolved && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleUnresolve}
              disabled={resolvingId === id}
              title="Remove resolved status"
            >
              {resolvingId === id ? '...' : 'Unresolve'}
            </button>
          )}
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'compliance' && (
          <ViolationSummary
            evaluations={evaluations}
            memoryId={id}
            onReEvaluate={handleReEvaluatePolicy}
          />
        )}

        {activeTab === 'messages' && (
          <div className="messages-tab-content">
            <div className="tab-header">
              <h3>Messages</h3>
              <div className="tab-underline"></div>
            </div>
            <MessageList
              messages={memory.messages}
              getViolationsForMessage={getViolationsForMessage}
            />
          </div>
        )}

        {activeTab === 'toolflow' && (
          <ToolFlowVisualization messages={memory.messages} />
        )}

        {activeTab === 'info' && (
          <SessionInfoPanel memory={memory} evaluations={evaluations} />
        )}
      </div>
    </div>
  );
}

export default ComplianceReviewPage;
