import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
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
  const { id } = useParams();
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const toast = useToast();

  // Get active tab from window - set by navbar
  const [activeTab, setActiveTab] = useState('compliance');

  // Listen for tab changes from navbar
  useEffect(() => {
    const handleTabChange = (event) => {
      setActiveTab(event.detail.tab);
    };
    window.addEventListener('complianceTabChange', handleTabChange);
    return () => window.removeEventListener('complianceTabChange', handleTabChange);
  }, []);

  // Expose current tab and setter for navbar
  useEffect(() => {
    window.complianceReviewState = { activeTab, setActiveTab };
    return () => { delete window.complianceReviewState; };
  }, [activeTab]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [memoryResponse, evalResponse] = await Promise.all([
          memoryAPI.get(id),
          complianceAPI.getMemoryEvaluations(id)
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
  }, [id]);

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
      await complianceAPI.evaluate(id, [policyId]);
      const evalResponse = await complianceAPI.getMemoryEvaluations(id);
      setEvaluations(evalResponse.data);
      toast.success('Policy re-evaluated successfully', 'Re-evaluation Complete');
    } catch (err) {
      toast.error(err.message, 'Re-evaluation Failed');
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

  return (
    <div className="memory-detail-page">
      <div className="memory-detail-header">
        <span className="message-count">{memory.messages.length} messages</span>
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
