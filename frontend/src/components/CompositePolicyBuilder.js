import React, { useState } from 'react';
import './CompositePolicyBuilder.css';

// Check type metadata with icons, descriptions, and form fields
const CHECK_TYPES = {
  tool_call: {
    icon: '🔧',
    name: 'Tool Call',
    description: 'Detect when a specific tool is called with certain parameters',
    color: '#4CAF50',
    fields: [
      { name: 'tool_name', label: 'Tool Name', type: 'tool', required: true, placeholder: 'e.g., create_invoice' },
      { name: 'params', label: 'Parameter Conditions', type: 'params', help: 'Optional: Add conditions for tool parameters' }
    ],
    example: 'Detect when create_invoice is called with total > 1000'
  },
  tool_response: {
    icon: '↩️',
    name: 'Tool Response',
    description: 'Validate the response/output from a tool',
    color: '#2196F3',
    fields: [
      { name: 'tool_name', label: 'Tool Name', type: 'tool', required: true, placeholder: 'e.g., get_customer' },
      { name: 'parameter', label: 'Response Field', type: 'text', required: true, placeholder: 'e.g., status' },
      { name: 'expected_value', label: 'Expected Value', type: 'text', placeholder: 'Optional' }
    ],
    example: 'Check that get_customer returns status = "active"'
  },
  llm_tool_response: {
    icon: '🤖',
    name: 'AI Validated Tool Response',
    description: 'Use AI to semantically validate a tool response parameter',
    color: '#9C27B0',
    fields: [
      { name: 'tool_name', label: 'Tool Name', type: 'tool', required: true, placeholder: 'e.g., request_human_approval' },
      { name: 'parameter', label: 'Response Field', type: 'text', required: true, placeholder: 'e.g., status' },
      { name: 'validation_prompt', label: 'Validation Prompt', type: 'textarea', required: true, placeholder: 'Tell the AI what to check for...' },
      { name: 'llm_provider', label: 'AI Provider', type: 'select', options: [
        { value: 'openai', label: 'OpenAI GPT' },
        { value: 'anthropic', label: 'Anthropic Claude' }
      ], defaultValue: 'openai' },
      { name: 'model', label: 'Model', type: 'text', placeholder: 'gpt-4o' }
    ],
    example: 'Validate that approval status actually means "approved" (not rejected)'
  },
  response_length: {
    icon: '📏',
    name: 'Response Length',
    description: 'Set minimum, maximum, or range constraints on response token count',
    color: '#FF9800',
    fields: [
      { name: 'min_tokens', label: 'Minimum Tokens', type: 'number', placeholder: '10' },
      { name: 'max_tokens', label: 'Maximum Tokens', type: 'number', placeholder: '500' }
    ],
    example: 'Response must be between 10-500 tokens, or just set max at 500'
  },
  tool_call_count: {
    icon: '🔢',
    name: 'Tool Call Count',
    description: 'Limit how many times a tool can be called',
    color: '#F44336',
    fields: [
      { name: 'tool_name', label: 'Tool Name', type: 'tool', required: true, placeholder: 'e.g., request_human_approval' },
      { name: 'min_count', label: 'Minimum Count', type: 'number', placeholder: 'Optional' },
      { name: 'max_count', label: 'Maximum Count', type: 'number', placeholder: 'Optional' }
    ],
    example: 'Limit human approval requests to max 2 per conversation'
  },
  llm_response_validation: {
    icon: '🔍',
    name: 'AI Validated Agent Response',
    description: 'Use AI to validate the entire assistant response',
    color: '#673AB7',
    fields: [
      { name: 'validation_prompt', label: 'Validation Prompt', type: 'textarea', required: true, placeholder: 'What should the AI check in the response?' },
      { name: 'llm_provider', label: 'AI Provider', type: 'select', options: [
        { value: 'openai', label: 'OpenAI GPT' },
        { value: 'anthropic', label: 'Anthropic Claude' }
      ], defaultValue: 'openai' },
      { name: 'model', label: 'Model', type: 'text', placeholder: 'gpt-4o' }
    ],
    example: 'Check response for PII, inappropriate tone, or factual errors'
  },
  response_contains: {
    icon: '🔎',
    name: 'Agent Response',
    description: 'Check if response contains or avoids specific keywords',
    color: '#009688',
    fields: [
      { name: 'must_contain', label: 'Must Contain (comma-separated)', type: 'text', placeholder: 'e.g., approved, confirmed' },
      { name: 'must_not_contain', label: 'Must NOT Contain (comma-separated)', type: 'text', placeholder: 'e.g., rejected, denied' }
    ],
    example: 'Response must contain "approved" and not contain "rejected"'
  },
  tool_absence: {
    icon: '🚫',
    name: 'Tool Call Absence',
    description: 'Ensure a specific tool is NOT called',
    color: '#E91E63',
    fields: [
      { name: 'tool_name', label: 'Forbidden Tool Name', type: 'tool', required: true, placeholder: 'e.g., delete_customer' }
    ],
    example: 'Forbid calling delete_customer tool'
  }
};

// Violation logic types with descriptions
const VIOLATION_LOGIC_TYPES = {
  IF_ANY_THEN_ALL: {
    icon: '🎯',
    name: 'If Any → Then All',
    description: 'If ANY trigger fires, then ALL requirements must pass',
    example: 'IF high-value invoice created, THEN approval must be requested AND granted',
    needsTriggers: true,
    needsRequirements: true
  },
  IF_ALL_THEN_ALL: {
    icon: '🎯🎯',
    name: 'If All → Then All',
    description: 'If ALL triggers fire, then ALL requirements must pass',
    example: 'IF creating invoice AND customer is new, THEN credit check AND approval required',
    needsTriggers: true,
    needsRequirements: true
  },
  REQUIRE_ALL: {
    icon: '✓✓',
    name: 'Require All',
    description: 'ALL specified checks must pass (simple AND)',
    example: 'Transaction must have validation AND logging AND audit trail',
    needsRequirements: true
  },
  REQUIRE_ANY: {
    icon: '✓',
    name: 'Require Any',
    description: 'At least ONE check must pass (simple OR)',
    example: 'Payment must use credit card OR ACH OR wire transfer',
    needsRequirements: true
  },
  FORBID_ALL: {
    icon: '🛡️',
    name: 'Forbid All',
    description: 'NONE of the forbidden checks should pass (unless authorized)',
    example: 'Must NOT access sensitive data UNLESS authorization is granted',
    needsForbidden: true,
    needsRequirements: false  // Requirements are optional for authorization
  }
};

function CompositePolicyBuilder({ onSave, onClose, initialPolicy = null, availableTools = [] }) {
  const [policyName, setPolicyName] = useState(initialPolicy?.name || '');
  const [policyDescription, setPolicyDescription] = useState(initialPolicy?.description || '');
  const [severity, setSeverity] = useState(initialPolicy?.severity || 'error');

  // Separate trigger checks and requirement checks
  const [triggerChecks, setTriggerChecks] = useState(() => {
    if (!initialPolicy?.config) return [];
    const triggers = initialPolicy.config.violation_logic?.triggers || [];
    return (initialPolicy.config.checks || []).filter(c => triggers.includes(c.id));
  });

  const [requirementChecks, setRequirementChecks] = useState(() => {
    if (!initialPolicy?.config) return [];
    const requirements = initialPolicy.config.violation_logic?.requirements || [];
    return (initialPolicy.config.checks || []).filter(c => requirements.includes(c.id));
  });

  const [forbiddenChecks, setForbiddenChecks] = useState(() => {
    if (!initialPolicy?.config) return [];
    const forbidden = initialPolicy.config.violation_logic?.forbidden || [];
    return (initialPolicy.config.checks || []).filter(c => forbidden.includes(c.id));
  });

  const [violationLogicType, setViolationLogicType] = useState(
    initialPolicy?.config?.violation_logic?.type || 'IF_ANY_THEN_ALL'
  );

  const [showCheckSelector, setShowCheckSelector] = useState(null); // 'trigger', 'requirement', 'forbidden', or null
  const [editingCheck, setEditingCheck] = useState(null);
  const [editingCheckRole, setEditingCheckRole] = useState(null); // Which list the check belongs to

  const addCheck = (checkType, role) => {
    const newCheck = {
      id: `check_${Date.now()}`,
      name: '',
      type: checkType,
      ...getDefaultCheckConfig(checkType)
    };
    setEditingCheck(newCheck);
    setEditingCheckRole(role);
    setShowCheckSelector(null);
  };

  const getDefaultCheckConfig = (checkType) => {
    const defaults = {};
    CHECK_TYPES[checkType]?.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue;
      } else if (field.type === 'params') {
        defaults[field.name] = {};
      }
    });
    return defaults;
  };

  const saveCheck = (check, role) => {
    const targetList = role === 'trigger' ? triggerChecks :
                       role === 'requirement' ? requirementChecks :
                       forbiddenChecks;
    const setTargetList = role === 'trigger' ? setTriggerChecks :
                          role === 'requirement' ? setRequirementChecks :
                          setForbiddenChecks;

    if (targetList.find(c => c.id === check.id)) {
      // Update existing
      setTargetList(targetList.map(c => c.id === check.id ? check : c));
    } else {
      // Add new
      setTargetList([...targetList, check]);
    }
    setEditingCheck(null);
    setEditingCheckRole(null);
  };

  const deleteCheck = (checkId, role) => {
    if (role === 'trigger') {
      setTriggerChecks(triggerChecks.filter(c => c.id !== checkId));
    } else if (role === 'requirement') {
      setRequirementChecks(requirementChecks.filter(c => c.id !== checkId));
    } else if (role === 'forbidden') {
      setForbiddenChecks(forbiddenChecks.filter(c => c.id !== checkId));
    }
  };

  const editCheck = (check, role) => {
    setEditingCheck(check);
    setEditingCheckRole(role);
  };

  const handleSave = () => {
    // Combine all checks with their IDs
    const allChecks = [...triggerChecks, ...requirementChecks, ...forbiddenChecks];

    const violationLogic = {
      type: violationLogicType,
      triggers: triggerChecks.map(c => c.id),
      requirements: requirementChecks.map(c => c.id),
      forbidden: forbiddenChecks.map(c => c.id)
    };

    const policyData = {
      name: policyName,
      description: policyDescription,
      policy_type: 'composite',
      enabled: initialPolicy?.enabled !== undefined ? initialPolicy.enabled : true,
      severity: severity,
      config: {
        checks: allChecks,
        violation_logic: violationLogic
      }
    };
    onSave(policyData);
  };

  const isValid = () => {
    if (!policyName.trim()) return false;

    const logicType = VIOLATION_LOGIC_TYPES[violationLogicType];
    if (logicType.needsTriggers && triggerChecks.length === 0) return false;
    if (logicType.needsRequirements && requirementChecks.length === 0) return false;
    if (logicType.needsForbidden && forbiddenChecks.length === 0) return false;

    return true;
  };

  const logicType = VIOLATION_LOGIC_TYPES[violationLogicType];

  return (
    <div className="modal-overlay">
      <div className="composite-policy-builder">
        <div className="builder-header">
          <h2>{initialPolicy ? 'Edit Policy' : 'Create New Policy'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="builder-content">
          {/* Step 1: Basic Info */}
          <section className="builder-section">
            <h3>1. Basic Information</h3>
            <div className="form-group">
              <label>Policy Name *</label>
              <input
                type="text"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                placeholder="e.g., High Value Invoice Approval"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={policyDescription}
                onChange={(e) => setPolicyDescription(e.target.value)}
                placeholder="Describe what this policy does..."
                className="form-input"
                rows="2"
              />
            </div>
            <div className="form-group">
              <label>Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="form-input"
              >
                <option value="error">Error - Blocks deployment/critical issue</option>
                <option value="warning">Warning - Should be addressed</option>
                <option value="info">Info - Informational only</option>
              </select>
            </div>
          </section>

          {/* Step 2: Select Logic Type */}
          <section className="builder-section">
            <h3>2. Policy Type</h3>
            <div className="form-group">
              <div className="logic-type-selector">
                {Object.entries(VIOLATION_LOGIC_TYPES).map(([key, logic]) => (
                  <div
                    key={key}
                    className={`logic-type-card ${violationLogicType === key ? 'selected' : ''}`}
                    onClick={() => setViolationLogicType(key)}
                  >
                    <div className="logic-icon">{logic.icon}</div>
                    <div className="logic-name">{logic.name}</div>
                    <div className="logic-description">{logic.description}</div>
                    <div className="logic-example">Example: {logic.example}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Step 3: Define Trigger Checks (if needed) */}
          {logicType.needsTriggers && (
            <section className="builder-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>🎯 Triggers (When should this policy be checked?)</h3>
                  <p className="section-help">Define checks that trigger this policy evaluation</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCheckSelector('trigger')}>
                  + Add Trigger
                </button>
              </div>

              {triggerChecks.length === 0 ? (
                <div className="empty-state-small">
                  <p>No trigger checks defined yet. Add your first trigger.</p>
                </div>
              ) : (
                <div className="checks-list">
                  {triggerChecks.map((check) => (
                    <CheckCard
                      key={check.id}
                      check={check}
                      onEdit={() => editCheck(check, 'trigger')}
                      onDelete={() => deleteCheck(check.id, 'trigger')}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Step 4: Define Requirement Checks (if needed) */}
          {logicType.needsRequirements && (
            <section className="builder-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>✅ Requirements (What must be true?)</h3>
                  <p className="section-help">
                    {violationLogicType === 'FORBID_ALL'
                      ? 'Optional: Define authorization checks that allow forbidden actions'
                      : 'Define checks that must pass when triggered'}
                  </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCheckSelector('requirement')}>
                  + Add Requirement
                </button>
              </div>

              {requirementChecks.length === 0 ? (
                <div className="empty-state-small">
                  <p>
                    {violationLogicType === 'FORBID_ALL'
                      ? 'No authorization checks defined (forbidden actions are always blocked).'
                      : 'No requirement checks defined yet. Add your first requirement.'}
                  </p>
                </div>
              ) : (
                <div className="checks-list">
                  {requirementChecks.map((check) => (
                    <CheckCard
                      key={check.id}
                      check={check}
                      onEdit={() => editCheck(check, 'requirement')}
                      onDelete={() => deleteCheck(check.id, 'requirement')}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Step 5: Define Forbidden Checks (if needed) */}
          {logicType.needsForbidden && (
            <section className="builder-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>🚫 Forbidden (What should NOT happen?)</h3>
                  <p className="section-help">Define checks that should NOT pass</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCheckSelector('forbidden')}>
                  + Add Forbidden
                </button>
              </div>

              {forbiddenChecks.length === 0 ? (
                <div className="empty-state-small">
                  <p>No forbidden checks defined yet. Add your first forbidden check.</p>
                </div>
              ) : (
                <div className="checks-list">
                  {forbiddenChecks.map((check) => (
                    <CheckCard
                      key={check.id}
                      check={check}
                      onEdit={() => editCheck(check, 'forbidden')}
                      onDelete={() => deleteCheck(check.id, 'forbidden')}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="builder-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-success"
            onClick={handleSave}
            disabled={!isValid()}
          >
            {initialPolicy ? 'Update Policy' : 'Create Policy'}
          </button>
        </div>

        {/* Check Selector Modal */}
        {showCheckSelector && (
          <CheckSelectorModal
            onSelect={(checkType) => addCheck(checkType, showCheckSelector)}
            onClose={() => setShowCheckSelector(null)}
            role={showCheckSelector}
          />
        )}

        {/* Check Editor Modal */}
        {editingCheck && (
          <CheckEditorModal
            check={editingCheck}
            availableTools={availableTools}
            onSave={(check) => saveCheck(check, editingCheckRole)}
            onClose={() => {
              setEditingCheck(null);
              setEditingCheckRole(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Check Card Component
function CheckCard({ check, onEdit, onDelete }) {
  const checkType = CHECK_TYPES[check.type];

  return (
    <div className="check-card" style={{ borderLeftColor: checkType.color }}>
      <div className="check-header">
        <div className="check-icon" style={{ backgroundColor: checkType.color }}>
          {checkType.icon}
        </div>
        <div className="check-info">
          <div className="check-name">{check.name || 'Unnamed Check'}</div>
          <div className="check-type">{checkType.name}</div>
        </div>
        <div className="check-actions">
          <button className="btn-icon" onClick={onEdit} title="Edit">✏️</button>
          <button className="btn-icon" onClick={onDelete} title="Delete">🗑️</button>
        </div>
      </div>
      <div className="check-config-preview">
        {check.tool_name && <span className="config-tag">Tool: {check.tool_name}</span>}
        {check.max_tokens && <span className="config-tag">Max: {check.max_tokens} tokens</span>}
        {check.parameter && <span className="config-tag">Field: {check.parameter}</span>}
      </div>
    </div>
  );
}

// Check Selector Modal
function CheckSelectorModal({ onSelect, onClose, role }) {
  const roleLabel = role === 'trigger' ? 'Trigger' :
                    role === 'requirement' ? 'Requirement' :
                    'Forbidden';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content check-selector" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Select {roleLabel} Type</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="check-types-grid">
          {Object.entries(CHECK_TYPES).map(([key, checkType]) => (
            <div
              key={key}
              className="check-type-card"
              onClick={() => onSelect(key)}
              style={{ borderTopColor: checkType.color }}
            >
              <div className="check-type-icon" style={{ backgroundColor: checkType.color }}>
                {checkType.icon}
              </div>
              <div className="check-type-name">{checkType.name}</div>
              <div className="check-type-description">{checkType.description}</div>
              <div className="check-type-example">Example: {checkType.example}</div>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// Check Editor Modal
function CheckEditorModal({ check, onSave, onClose, availableTools = [] }) {
  const [editedCheck, setEditedCheck] = useState({ ...check });
  const [showParamInput, setShowParamInput] = useState(false);
  const [newParamName, setNewParamName] = useState('');
  const [customToolSelection, setCustomToolSelection] = useState(() => {
    const initial = {};
    const toolNames = (availableTools || []).map(t => t.toString());
    CHECK_TYPES[check.type]?.fields
      ?.filter(f => f.type === 'tool')
      .forEach(f => {
        const val = check[f.name];
        if (val && toolNames.length && !toolNames.includes(val)) {
          initial[f.name] = true;
        }
      });
    return initial;
  });
  const checkType = CHECK_TYPES[check.type];

  // Keep local state in sync if user opens a different check
  React.useEffect(() => {
    setEditedCheck({ ...check });
    const toolNames = (availableTools || []).map(t => t.toString());
    const initial = {};
    CHECK_TYPES[check.type]?.fields
      ?.filter(f => f.type === 'tool')
      .forEach(f => {
        const val = check[f.name];
        if (val && toolNames.length && !toolNames.includes(val)) {
          initial[f.name] = true;
        }
      });
    setCustomToolSelection(initial);
  }, [check, availableTools]);

  const updateField = (fieldName, value) => {
    setEditedCheck({ ...editedCheck, [fieldName]: value });
  };

  const addParamCondition = () => {
    if (!newParamName.trim()) return;
    const params = editedCheck.params || {};
    params[newParamName.trim()] = { gt: 0 };
    setEditedCheck({ ...editedCheck, params });
    setNewParamName('');
    setShowParamInput(false);
  };

  const updateParamCondition = (paramName, operator, value) => {
    const params = { ...editedCheck.params };
    params[paramName] = { [operator]: value };
    setEditedCheck({ ...editedCheck, params });
  };

  const deleteParamCondition = (paramName) => {
    const params = { ...editedCheck.params };
    delete params[paramName];
    setEditedCheck({ ...editedCheck, params });
  };

  const isValid = () => {
    if (!editedCheck.name?.trim()) return false;

    for (const field of checkType.fields) {
      if (field.required && !editedCheck[field.name]) {
        return false;
      }
    }
    return true;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content check-editor" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="check-type-icon" style={{ backgroundColor: checkType.color }}>
              {checkType.icon}
            </div>
            <div>
              <h3>{checkType.name}</h3>
              <p className="modal-subtitle">{checkType.description}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Check Name *</label>
            <input
              type="text"
              value={editedCheck.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Give this check a descriptive name..."
              className="form-input"
            />
          </div>

          {checkType.fields.map((field) => (
            <div key={field.name} className="form-group">
              <label>
                {field.label} {field.required && '*'}
              </label>
              {field.help && <div className="field-help">{field.help}</div>}

              {field.type === 'text' && (
                <input
                  type="text"
                  value={editedCheck[field.name] || ''}
                  onChange={(e) => updateField(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="form-input"
                />
              )}

              {field.type === 'number' && (
                <input
                  type="number"
                  value={editedCheck[field.name] || ''}
                  onChange={(e) => updateField(field.name, parseInt(e.target.value) || '')}
                  placeholder={field.placeholder}
                  className="form-input"
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  value={editedCheck[field.name] || ''}
                  onChange={(e) => updateField(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="form-input"
                  rows="4"
                />
              )}

              {field.type === 'select' && (
                <select
                  value={editedCheck[field.name] || field.defaultValue}
                  onChange={(e) => updateField(field.name, e.target.value)}
                  className="form-input"
                >
                  {field.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}

              {field.type === 'tool' && (
                <>
                  {Array.isArray(availableTools) && availableTools.length > 0 ? (
                    <>
                      <select
                        value={
                          customToolSelection[field.name]
                            ? '__custom'
                            : (editedCheck[field.name] || '')
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__custom') {
                            setCustomToolSelection(prev => ({ ...prev, [field.name]: true }));
                            if (!editedCheck[field.name]) {
                              updateField(field.name, '');
                            }
                          } else {
                            setCustomToolSelection(prev => ({ ...prev, [field.name]: false }));
                            updateField(field.name, val);
                          }
                        }}
                        className="form-input"
                      >
                        <option value="">Select a tool</option>
                        {availableTools.map(tool => (
                          <option key={tool} value={tool}>{tool}</option>
                        ))}
                        <option value="__custom">Other / custom tool</option>
                      </select>
                      {(customToolSelection[field.name] ||
                        (editedCheck[field.name] &&
                          !availableTools.includes(editedCheck[field.name]))) && (
                        <input
                          type="text"
                          value={editedCheck[field.name] || ''}
                          onChange={(e) => updateField(field.name, e.target.value)}
                          placeholder={field.placeholder || 'Enter tool name'}
                          className="form-input"
                          style={{ marginTop: '0.5rem' }}
                        />
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      value={editedCheck[field.name] || ''}
                      onChange={(e) => updateField(field.name, e.target.value)}
                      placeholder={field.placeholder || 'e.g., create_invoice'}
                      className="form-input"
                    />
                  )}
                </>
              )}

              {field.type === 'params' && (
                <div className="params-editor">
                  {Object.entries(editedCheck.params || {}).map(([paramName, condition]) => (
                    <div key={paramName} className="param-condition">
                      <input
                        type="text"
                        value={paramName}
                        disabled
                        className="form-input param-name"
                      />
                      <select
                        value={Object.keys(condition)[0]}
                        onChange={(e) => updateParamCondition(paramName, e.target.value, Object.values(condition)[0])}
                        className="form-input param-operator"
                      >
                        <option value="gt">&gt;</option>
                        <option value="gte">≥</option>
                        <option value="lt">&lt;</option>
                        <option value="lte">≤</option>
                        <option value="eq">=</option>
                        <option value="contains">contains</option>
                      </select>
                      <input
                        type="text"
                        value={Object.values(condition)[0]}
                        onChange={(e) => updateParamCondition(paramName, Object.keys(condition)[0], e.target.value)}
                        className="form-input param-value"
                      />
                      <button
                        className="btn-icon"
                        onClick={() => deleteParamCondition(paramName)}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}

                  {showParamInput ? (
                    <div className="param-condition new-param">
                      <input
                        type="text"
                        value={newParamName}
                        onChange={(e) => setNewParamName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addParamCondition()}
                        placeholder="Parameter name (e.g., total)"
                        className="form-input"
                        autoFocus
                      />
                      <button className="btn btn-success" onClick={addParamCondition}>
                        Add
                      </button>
                      <button className="btn btn-secondary" onClick={() => {
                        setShowParamInput(false);
                        setNewParamName('');
                      }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-secondary" onClick={() => setShowParamInput(true)}>
                      + Add Parameter Condition
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="form-group">
            <label>Custom Violation Message (Optional)</label>
            <input
              type="text"
              value={editedCheck.violation_message || ''}
              onChange={(e) => updateField('violation_message', e.target.value)}
              placeholder="Custom message when this check fails..."
              className="form-input"
            />
            <div className="field-help">
              You can use variables like ${'{'}params.total{'}'} or ${'{'}actual_tokens{'}'}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-success"
            onClick={() => onSave(editedCheck)}
            disabled={!isValid()}
          >
            Save Check
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompositePolicyBuilder;
