import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { memoryAPI, complianceAPI } from '../services/api';
import MessageList from '../components/MessageList';
import ToolFlowVisualization from '../components/ToolFlowVisualization';
import { ViolationSummary } from '../components/ViolationDisplay';
import { useToast } from '../components/Toast';
import './MemoryDetailPage.css';

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
  if (!memory) return <div className="error">Agent instance not found</div>;

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
      </div>
    </div>
  );
}

export default ComplianceReviewPage;
