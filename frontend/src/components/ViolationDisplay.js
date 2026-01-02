import React, { useState } from 'react';
import './ViolationDisplay.css';

/**
 * ViolationDisplay - Beautiful display for composite policy violations
 *
 * Handles both new composite policy violations and legacy violations
 */
function ViolationDisplay({ violation, policyName, isCompliant = false }) {
  const [expanded, setExpanded] = useState(false);

  // New composite policy violation structure
  // Check for violation_type to identify composite policies (not just triggered_checks, since REQUIRE_ALL doesn't have those)
  if (violation.violation_type) {
    const cardClass = isCompliant ? 'violation-card composite compliant-card' : 'violation-card composite';

    // Get severity-based background color
    const getSeverityBackgroundColor = () => {
      if (isCompliant) return '#d4edda'; // light green for compliant
      const severity = violation.severity || 'error';
      if (severity === 'error') return '#f8d7da'; // light red for error
      if (severity === 'warning') return '#fff3cd'; // light yellow for warning
      if (severity === 'info') return '#d1ecf1'; // light blue for info
      return '#f8d7da'; // default to light red
    };

    const getSeverityTextColor = () => {
      if (isCompliant) return '#155724'; // dark green for compliant
      const severity = violation.severity || 'error';
      if (severity === 'error') return '#721c24'; // dark red for error
      if (severity === 'warning') return '#856404'; // dark yellow for warning
      if (severity === 'info') return '#0c5460'; // dark blue for info
      return '#721c24'; // default to dark red
    };

    const summaryStyle = {
      backgroundColor: getSeverityBackgroundColor(),
      color: getSeverityTextColor(),
      padding: '0.75rem',
      borderRadius: '4px',
      marginBottom: '0.5rem'
    };
    const messageStyle = {
      backgroundColor: getSeverityBackgroundColor(),
      color: getSeverityTextColor(),
      padding: '0.75rem',
      borderRadius: '4px'
    };

    return (
      <div className={cardClass}>
        <div className="violation-card-header" onClick={() => setExpanded(!expanded)}>
          <div className="violation-title">
            <span className="violation-icon">{getViolationIcon(violation.violation_type)}</span>
            <div>
              <div className="violation-policy-name">{violation.policy_name || policyName}</div>
              <div className="violation-type-badge">{violation.violation_type}</div>
              {violation.policy_description && (
                <div className="violation-policy-description">{violation.policy_description}</div>
              )}
            </div>
          </div>
          <button className="expand-btn">{expanded ? '▼' : '▶'}</button>
        </div>

        <div className="violation-summary-text" style={summaryStyle}>
          {violation.summary}
        </div>

        <div className="violation-message" style={messageStyle}>
          {violation.violation_message}
        </div>

        {expanded && (
          <div className="violation-details">
            {violation.triggered_checks && violation.triggered_checks.length > 0 && (
              <div className="check-section triggered">
                <h4>🎯 Triggered Checks</h4>
                <div className="checks-list">
                  {violation.triggered_checks.map((check, idx) => (
                    <CheckItem key={idx} check={check} type="triggered" />
                  ))}
                </div>
              </div>
            )}

            {violation.failed_triggers && violation.failed_triggers.length > 0 && (
              <div className="check-section failed-trigger">
                <h4>⭕ Triggers Not Triggered</h4>
                <div className="checks-list">
                  {violation.failed_triggers.map((check, idx) => (
                    <CheckItem key={idx} check={check} type="failed-trigger" />
                  ))}
                </div>
              </div>
            )}

            {violation.failed_requirements && violation.failed_requirements.length > 0 && (
              <div className="check-section failed">
                <h4>❌ Failed Requirements</h4>
                <div className="checks-list">
                  {violation.failed_requirements.map((check, idx) => (
                    <CheckItem key={idx} check={check} type="failed" />
                  ))}
                </div>
              </div>
            )}

            {violation.passed_requirements && violation.passed_requirements.length > 0 && (
              <div className="check-section passed">
                <h4>✓ Passed Requirements</h4>
                <div className="checks-list">
                  {violation.passed_requirements.map((check, idx) => (
                    <CheckItem key={idx} check={check} type="passed" />
                  ))}
                </div>
              </div>
            )}

            {violation.forbidden_checks && violation.forbidden_checks.length > 0 && (
              <div className="check-section forbidden">
                <h4>🚫 Forbidden Actions Detected</h4>
                <div className="checks-list">
                  {violation.forbidden_checks.map((check, idx) => (
                    <CheckItem key={idx} check={check} type="forbidden" />
                  ))}
                </div>
              </div>
            )}

            {violation.forbidden_checks_avoided && violation.forbidden_checks_avoided.length > 0 && (
              <div className="check-section avoided">
                <h4>✓ Forbidden Actions Avoided</h4>
                <div className="checks-list">
                  {violation.forbidden_checks_avoided.map((check, idx) => (
                    <CheckItem key={idx} check={check} type="avoided" />
                  ))}
                </div>
              </div>
            )}

            {violation.unevaluated_requirements && violation.unevaluated_requirements.length > 0 && (
              <div className="check-section unevaluated">
                <h4>⏸️ Requirements (Not Evaluated)</h4>
                <div className="checks-list">
                  {violation.unevaluated_requirements.map((check, idx) => (
                    <CheckItem key={idx} check={check} type="unevaluated" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Legacy violation format
  return (
    <div className="violation-card legacy">
      <div className="violation-card-header">
        <div className="violation-title">
          <span className="violation-icon">⚠️</span>
          <div>
            <div className="violation-policy-name">{policyName || 'Policy Violation'}</div>
            <div className="violation-type-legacy">{violation.violation_type || 'Unknown'}</div>
          </div>
        </div>
      </div>

      <div className="violation-message">
        {violation.description || violation.message || 'No description provided'}
      </div>

      {violation.details && (
        <div className="violation-details-legacy">
          <pre>{JSON.stringify(violation.details, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

// Check Item Component
function CheckItem({ check, type }) {
  const [showDetails, setShowDetails] = useState(false);

  const getCheckIcon = () => {
    const icons = {
      tool_call: '🔧',
      tool_response: '↩️',
      llm_tool_response: '🤖',
      response_length: '📏',
      tool_call_count: '🔢',
      llm_response_validation: '🔍',
      response_contains: '🔎',
      tool_absence: '🚫'
    };
    return icons[check.check_type] || '✓';
  };

  const getStatusBadge = () => {
    if (type === 'passed') return <span className="status-badge passed">✓ Passed</span>;
    if (type === 'failed') return <span className="status-badge failed">✗ Failed</span>;
    if (type === 'triggered') return <span className="status-badge triggered">▶ Triggered</span>;
    if (type === 'forbidden') return <span className="status-badge forbidden">⚠ Forbidden</span>;
    if (type === 'avoided') return <span className="status-badge avoided">✓ Avoided</span>;
    if (type === 'failed-trigger') return <span className="status-badge failed-trigger">⭕ Not Triggered</span>;
    if (type === 'unevaluated') return <span className="status-badge unevaluated">⏸️ Not Evaluated</span>;
    return null;
  };

  return (
    <div className={`check-item ${type}`}>
      <div className="check-item-header" onClick={() => setShowDetails(!showDetails)}>
        <div className="check-item-info">
          <span className="check-icon">{getCheckIcon()}</span>
          <div>
            <div className="check-name">{check.check_name}</div>
            <div className="check-message">{check.message}</div>
          </div>
        </div>
        <div className="check-item-actions">
          {getStatusBadge()}
          {(check.details || check.matched_items) && (
            <button className="details-btn">{showDetails ? '▼' : '▶'}</button>
          )}
        </div>
      </div>

      {showDetails && (check.details || check.matched_items || check.llm_usage) && (
        <div className="check-item-details">
          {check.llm_usage && (
            <div className="details-section llm-usage-section">
              <strong>🤖 LLM Usage:</strong>
              <div className="llm-usage-stats">
                <div className="usage-row">
                  <span className="usage-label">Provider:</span>
                  <span className="usage-value">{check.llm_usage.provider} ({check.llm_usage.model})</span>
                </div>
                {check.llm_usage.api_calls && (
                  <div className="usage-row">
                    <span className="usage-label">API Calls:</span>
                    <span className="usage-value">{check.llm_usage.api_calls}</span>
                  </div>
                )}
                <div className="usage-row">
                  <span className="usage-label">Input Tokens:</span>
                  <span className="usage-value">{check.llm_usage.total_input_tokens || check.llm_usage.input_tokens}</span>
                </div>
                <div className="usage-row">
                  <span className="usage-label">Output Tokens:</span>
                  <span className="usage-value">{check.llm_usage.total_output_tokens || check.llm_usage.output_tokens}</span>
                </div>
                <div className="usage-row">
                  <span className="usage-label">Total Tokens:</span>
                  <span className="usage-value">{check.llm_usage.total_tokens}</span>
                </div>
                <div className="usage-row cost-row">
                  <span className="usage-label">Cost:</span>
                  <span className="usage-value cost-value">${check.llm_usage.total_cost_usd || check.llm_usage.cost_usd}</span>
                </div>
              </div>
            </div>
          )}
          {check.details && (
            <div className="details-section">
              <strong>Details:</strong>
              <pre>{JSON.stringify(check.details, null, 2)}</pre>
            </div>
          )}
          {check.matched_items && check.matched_items.length > 0 && (
            <div className="details-section">
              <strong>Matched Items:</strong>
              <div className="matched-items-list">
                {check.matched_items.map((item, idx) => (
                  <div key={idx} className="matched-item">
                    {item.tool_name && <span className="tag">Tool: {item.tool_name}</span>}
                    {item.message_index !== undefined && <span className="tag">Message #{item.message_index}</span>}
                    {item.params && (
                      <div className="params-preview">
                        <pre>{JSON.stringify(item.params, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to get violation type icon
function getViolationIcon(violationType) {
  const icons = {
    IF_ANY_THEN_ALL: '🎯',
    IF_ALL_THEN_ALL: '🎯🎯',
    REQUIRE_ALL: '✓✓',
    REQUIRE_ANY: '✓',
    FORBID_ALL: '🛡️'
  };
  return icons[violationType] || '⚠️';
}

// Helper functions for severity
function getSeverityClass(severity) {
  const severities = {
    error: 'badge-danger',
    warning: 'badge-warning',
    info: 'badge-info'
  };
  return severities[severity || 'error'];
}

function getSeverityLabel(severity) {
  const severities = {
    error: 'Error',
    warning: 'Warning',
    info: 'Info'
  };
  return severities[severity || 'error'];
}

// Violation Summary Component (for compliance overview)
export function ViolationSummary({ evaluations, memoryId, onReEvaluate }) {
  const [reEvaluatingPolicies, setReEvaluatingPolicies] = useState(new Set());

  const getSeverityBadge = (severity) => {
    const severities = {
      error: { label: 'Error', class: 'badge-danger' },
      warning: { label: 'Warning', class: 'badge-warning' },
      info: { label: 'Info', class: 'badge-info' }
    };
    const severityInfo = severities[severity || 'error'];
    return <span className={`badge ${severityInfo.class}`} style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>{severityInfo.label}</span>;
  };

  const handleReEvaluatePolicy = async (policyId) => {
    if (!onReEvaluate) return;

    setReEvaluatingPolicies(prev => new Set([...prev, policyId]));
    try {
      await onReEvaluate(policyId);
    } finally {
      setReEvaluatingPolicies(prev => {
        const next = new Set(prev);
        next.delete(policyId);
        return next;
      });
    }
  };

  // Count total violation instances (failed checks across all policies)
  const totalViolations = evaluations.reduce((sum, e) => {
    if (e.is_compliant) return sum;

    return sum + e.violations.reduce((vSum, violation) => {
      // For composite policies, count failed requirements and forbidden checks
      let count = 0;
      if (violation.failed_requirements) {
        count += violation.failed_requirements.length;
      }
      if (violation.forbidden_checks) {
        count += violation.forbidden_checks.length;
      }
      // If no requirements tracked (legacy format), count as 1
      if (count === 0) {
        count = 1;
      }
      return vSum + count;
    }, 0);
  }, 0);

  const compliantPolicies = evaluations.filter(e => e.is_compliant).length;
  const nonCompliantPolicies = evaluations.length - compliantPolicies;

  return (
    <div className="violation-summary">
      <div className="tab-header">
        <h3>Compliance Summary</h3>
        <div className="tab-underline"></div>
      </div>

      <div className="summary-badge-container">
        {nonCompliantPolicies === 0 ? (
          <span className="badge badge-success-large">✓ All Policies Compliant</span>
        ) : (
          <span className="badge badge-danger-large">⚠ {nonCompliantPolicies} Policy Violations</span>
        )}
      </div>

      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-value">{evaluations.length}</div>
          <div className="stat-label">Policies Evaluated</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{compliantPolicies}</div>
          <div className="stat-label">Compliant</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-value">{nonCompliantPolicies}</div>
          <div className="stat-label">Non-Compliant</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-value">{totalViolations}</div>
          <div className="stat-label">Total Violations</div>
        </div>
      </div>

      <div className="policy-results">
        {evaluations.map((evaluation, idx) => {
          // Count actual failed checks for this evaluation
          const violationCount = evaluation.violations.reduce((sum, violation) => {
            let count = 0;
            if (violation.failed_requirements) {
              count += violation.failed_requirements.length;
            }
            if (violation.forbidden_checks) {
              count += violation.forbidden_checks.length;
            }
            // If no requirements tracked (legacy format), count as 1
            if (count === 0) {
              count = 1;
            }
            return sum + count;
          }, 0);

          return (
            <div key={idx} className={`policy-result-card ${evaluation.is_compliant ? 'compliant' : 'non-compliant'}`}>
              <div className="policy-result-header">
                <div>
                  <div className="policy-result-name">
                    {evaluation.policy_name || `Policy #${evaluation.policy_id}`}
                  </div>
                  {evaluation.policy_description && (
                    <div className="policy-result-description">{evaluation.policy_description}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {evaluation.is_compliant ? (
                    <span className="badge badge-success">✓ Compliant</span>
                  ) : (
                    <span className={`badge ${getSeverityClass(evaluation.policy_severity)}`}>
                      ✗ {violationCount} Violation(s) ({getSeverityLabel(evaluation.policy_severity)})
                    </span>
                  )}
                  {onReEvaluate && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleReEvaluatePolicy(evaluation.policy_id)}
                      disabled={reEvaluatingPolicies.has(evaluation.policy_id)}
                      title="Re-evaluate this policy"
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.85rem',
                        minWidth: '90px'
                      }}
                    >
                      {reEvaluatingPolicies.has(evaluation.policy_id) ? (
                        <>↻ Evaluating...</>
                      ) : (
                        <>↻ Re-evaluate</>
                      )}
                    </button>
                  )}
                </div>
              </div>

            {evaluation.is_compliant ? (
              evaluation.compliance_details && evaluation.compliance_details.length > 0 ? (
                <div className="policy-violations-list">
                  {evaluation.compliance_details.map((detail, dIdx) => (
                    <ViolationDisplay
                      key={dIdx}
                      violation={{ ...detail, severity: evaluation.policy_severity }}
                      policyName={evaluation.policy_name || `Policy #${evaluation.policy_id}`}
                      isCompliant={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="compliant-policy-details">
                  <h4>✓✓ All Requirements Met</h4>
                  <p>This agent instance successfully complies with all policy requirements.</p>
                </div>
              )
            ) : (
              <div className="policy-violations-list">
                {evaluation.violations.map((violation, vIdx) => (
                  <ViolationDisplay
                    key={vIdx}
                    violation={{ ...violation, severity: evaluation.policy_severity }}
                    policyName={evaluation.policy_name || `Policy #${evaluation.policy_id}`}
                    isCompliant={false}
                  />
                ))}
              </div>
            )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ViolationDisplay;
