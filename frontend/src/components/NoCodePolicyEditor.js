import React, { useState } from 'react';
import './NoCodePolicyEditor.css';

const ATOMIC_NODE_TYPES = {
  TOOL_CALL: 'tool_call',
  TOOL_RESPONSE: 'tool_response',
  LLM_VALIDATION: 'llm_validation',
  SEQUENCE: 'sequence',
  CONDITIONAL: 'conditional'
};

function NoCodePolicyEditor({ onSave, onCancel, onClose, initialPolicy = null }) {
  const [policyName, setPolicyName] = useState(initialPolicy?.name || '');
  const [policyDescription, setPolicyDescription] = useState(initialPolicy?.description || '');
  const [nodes, setNodes] = useState(initialPolicy?._nocode_nodes || []);
  const [showNodeSelector, setShowNodeSelector] = useState(false);

  const addNode = (nodeType) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: nodeType,
      config: getDefaultNodeConfig(nodeType)
    };
    setNodes([...nodes, newNode]);
    setShowNodeSelector(false);
  };

  const getDefaultNodeConfig = (nodeType) => {
    switch (nodeType) {
      case ATOMIC_NODE_TYPES.TOOL_CALL:
        return {
          tool_name: '',
          parameters: {},
          parameter_conditions: []
        };
      case ATOMIC_NODE_TYPES.TOOL_RESPONSE:
        return {
          tool_name: '',
          expect_success: true,
          response_checks: []
        };
      case ATOMIC_NODE_TYPES.LLM_VALIDATION:
        return {
          tool_name: '',
          target_parameter: '',
          validation_prompt: '',
          llm_provider: 'anthropic',
          model: 'claude-sonnet-4-5-20250929'
        };
      case ATOMIC_NODE_TYPES.SEQUENCE:
        return {
          description: '',
          nodes: []
        };
      case ATOMIC_NODE_TYPES.CONDITIONAL:
        return {
          if_node: null,
          then_node: null,
          require_before: true
        };
      default:
        return {};
    }
  };

  const updateNode = (nodeId, newConfig) => {
    setNodes(nodes.map(node =>
      node.id === nodeId ? { ...node, config: newConfig } : node
    ));
  };

  const deleteNode = (nodeId) => {
    setNodes(nodes.filter(node => node.id !== nodeId));
  };

  const moveNode = (nodeId, direction) => {
    const index = nodes.findIndex(n => n.id === nodeId);
    if (direction === 'up' && index > 0) {
      const newNodes = [...nodes];
      [newNodes[index - 1], newNodes[index]] = [newNodes[index], newNodes[index - 1]];
      setNodes(newNodes);
    } else if (direction === 'down' && index < nodes.length - 1) {
      const newNodes = [...nodes];
      [newNodes[index], newNodes[index + 1]] = [newNodes[index + 1], newNodes[index]];
      setNodes(newNodes);
    }
  };

  const addParameterCondition = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    const newCondition = { parameter: '', operator: 'gt', value: '' };
    updateNode(nodeId, {
      ...node.config,
      parameter_conditions: [...(node.config.parameter_conditions || []), newCondition]
    });
  };

  const updateParameterCondition = (nodeId, conditionIndex, field, value) => {
    const node = nodes.find(n => n.id === nodeId);
    const conditions = [...node.config.parameter_conditions];
    conditions[conditionIndex] = { ...conditions[conditionIndex], [field]: value };
    updateNode(nodeId, { ...node.config, parameter_conditions: conditions });
  };

  const deleteParameterCondition = (nodeId, conditionIndex) => {
    const node = nodes.find(n => n.id === nodeId);
    const conditions = node.config.parameter_conditions.filter((_, i) => i !== conditionIndex);
    updateNode(nodeId, { ...node.config, parameter_conditions: conditions });
  };

  const addResponseCheck = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    const newCheck = { parameter: '', expected_value: '', comparison: 'equals' };
    updateNode(nodeId, {
      ...node.config,
      response_checks: [...(node.config.response_checks || []), newCheck]
    });
  };

  const updateResponseCheck = (nodeId, checkIndex, field, value) => {
    const node = nodes.find(n => n.id === nodeId);
    const checks = [...node.config.response_checks];
    checks[checkIndex] = { ...checks[checkIndex], [field]: value };
    updateNode(nodeId, { ...node.config, response_checks: checks });
  };

  const deleteResponseCheck = (nodeId, checkIndex) => {
    const node = nodes.find(n => n.id === nodeId);
    const checks = node.config.response_checks.filter((_, i) => i !== checkIndex);
    updateNode(nodeId, { ...node.config, response_checks: checks });
  };

  const convertToBackendPolicy = () => {
    // Convert the no-code nodes to the backend policy format
    if (nodes.length === 0) {
      return null;
    }

    // For now, we'll support compound tool policies
    const conditions = [];

    nodes.forEach((node, index) => {
      if (node.type === ATOMIC_NODE_TYPES.CONDITIONAL) {
        // This is a conditional node - convert to if_then
        const ifNode = nodes.find(n => n.id === node.config.if_node);
        const thenNode = nodes.find(n => n.id === node.config.then_node);

        if (ifNode && thenNode) {
          const condition = {
            type: 'if_then',
            if_tool: ifNode.config.tool_name,
            if_params: {},
            then_tool: thenNode.config.tool_name,
            then_before: node.config.require_before
          };

          // Add parameter conditions for if_tool
          if (ifNode.config.parameter_conditions) {
            ifNode.config.parameter_conditions.forEach(pc => {
              if (pc.parameter && pc.value !== '') {
                if (!condition.if_params[pc.parameter]) {
                  condition.if_params[pc.parameter] = {};
                }
                condition.if_params[pc.parameter][pc.operator] =
                  isNaN(pc.value) ? pc.value : parseFloat(pc.value);
              }
            });
          }

          conditions.push(condition);
        }
      } else if (node.type === ATOMIC_NODE_TYPES.LLM_VALIDATION) {
        // LLM validation node - convert to llm_validate_response
        if (node.config.tool_name && node.config.target_parameter && node.config.validation_prompt) {
          conditions.push({
            type: 'llm_validate_response',
            tool_name: node.config.tool_name,
            target_parameter: node.config.target_parameter,
            validation_prompt: node.config.validation_prompt,
            llm_provider: node.config.llm_provider || 'anthropic',
            model: node.config.model || 'claude-sonnet-4-5-20250929'
          });
        }
      } else if (node.type === ATOMIC_NODE_TYPES.SEQUENCE && index < nodes.length - 1) {
        // Sequential requirement: this tool must come before the next
        const nextNode = nodes[index + 1];
        if (nextNode.type === ATOMIC_NODE_TYPES.TOOL_CALL) {
          conditions.push({
            type: 'if_then',
            if_tool: nextNode.config.tool_name,
            if_params: {},
            then_tool: node.config.tool_name,
            then_before: true
          });
        }
      }
    });

    return {
      policy_type: 'compound_tool',
      config: { conditions }
    };
  };

  const handleSave = () => {
    const backendPolicy = convertToBackendPolicy();
    if (!backendPolicy) {
      alert('Please add at least one policy node');
      return;
    }

    onSave({
      name: policyName,
      description: policyDescription,
      ...backendPolicy,
      enabled: true,
      _nocode_nodes: nodes // Store for future editing
    });
  };

  const renderToolCallNode = (node) => (
    <div className="node-config">
      <div className="form-group">
        <label>Tool Name</label>
        <input
          type="text"
          value={node.config.tool_name}
          onChange={(e) => updateNode(node.id, { ...node.config, tool_name: e.target.value })}
          placeholder="e.g., create_invoice"
        />
      </div>

      <div className="form-group">
        <label>Parameter Conditions</label>
        {node.config.parameter_conditions?.map((condition, idx) => (
          <div key={idx} className="condition-row">
            <input
              type="text"
              placeholder="Parameter name"
              value={condition.parameter}
              onChange={(e) => updateParameterCondition(node.id, idx, 'parameter', e.target.value)}
            />
            <select
              value={condition.operator}
              onChange={(e) => updateParameterCondition(node.id, idx, 'operator', e.target.value)}
            >
              <option value="gt">Greater Than</option>
              <option value="lt">Less Than</option>
              <option value="eq">Equals</option>
              <option value="gte">Greater or Equal</option>
              <option value="lte">Less or Equal</option>
            </select>
            <input
              type="text"
              placeholder="Value"
              value={condition.value}
              onChange={(e) => updateParameterCondition(node.id, idx, 'value', e.target.value)}
            />
            <button
              className="btn-icon btn-danger"
              onClick={() => deleteParameterCondition(node.id, idx)}
              title="Delete condition"
            >
              ×
            </button>
          </div>
        ))}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => addParameterCondition(node.id)}
        >
          + Add Condition
        </button>
      </div>
    </div>
  );

  const renderToolResponseNode = (node) => (
    <div className="node-config">
      <div className="form-group">
        <label>Tool Name</label>
        <input
          type="text"
          value={node.config.tool_name}
          onChange={(e) => updateNode(node.id, { ...node.config, tool_name: e.target.value })}
          placeholder="e.g., check_inventory"
        />
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={node.config.expect_success}
            onChange={(e) => updateNode(node.id, { ...node.config, expect_success: e.target.checked })}
            style={{ width: 'auto', marginRight: '0.5rem' }}
          />
          Expect Success (fail if tool returns error)
        </label>
      </div>

      <div className="form-group">
        <label>Response Parameter Checks</label>
        {node.config.response_checks?.map((check, idx) => (
          <div key={idx} className="condition-row">
            <input
              type="text"
              placeholder="Parameter path (e.g., status)"
              value={check.parameter}
              onChange={(e) => updateResponseCheck(node.id, idx, 'parameter', e.target.value)}
            />
            <select
              value={check.comparison}
              onChange={(e) => updateResponseCheck(node.id, idx, 'comparison', e.target.value)}
            >
              <option value="equals">Equals</option>
              <option value="contains">Contains</option>
              <option value="not_equals">Not Equals</option>
            </select>
            <input
              type="text"
              placeholder="Expected value"
              value={check.expected_value}
              onChange={(e) => updateResponseCheck(node.id, idx, 'expected_value', e.target.value)}
            />
            <button
              className="btn-icon btn-danger"
              onClick={() => deleteResponseCheck(node.id, idx)}
              title="Delete check"
            >
              ×
            </button>
          </div>
        ))}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => addResponseCheck(node.id)}
        >
          + Add Check
        </button>
      </div>
    </div>
  );

  const renderLLMValidationNode = (node) => (
    <div className="node-config">
      <div className="form-group">
        <label>Tool Name</label>
        <input
          type="text"
          value={node.config.tool_name}
          onChange={(e) => updateNode(node.id, { ...node.config, tool_name: e.target.value })}
          placeholder="e.g., request_human_approval"
        />
      </div>

      <div className="form-group">
        <label>Target Parameter (from tool response)</label>
        <input
          type="text"
          value={node.config.target_parameter}
          onChange={(e) => updateNode(node.id, { ...node.config, target_parameter: e.target.value })}
          placeholder="e.g., status"
        />
      </div>

      <div className="form-group">
        <label>Validation Prompt</label>
        <textarea
          rows="3"
          value={node.config.validation_prompt}
          onChange={(e) => updateNode(node.id, { ...node.config, validation_prompt: e.target.value })}
          placeholder="e.g., Validate the status indicates an approval. Look for words like 'approved', 'yes', 'go ahead'. Respond with 'compliant' if approved, 'violation' if not."
        />
      </div>

      <div className="form-group">
        <label>LLM Provider</label>
        <select
          value={node.config.llm_provider}
          onChange={(e) => updateNode(node.id, { ...node.config, llm_provider: e.target.value })}
        >
          <option value="anthropic">Anthropic</option>
          <option value="openai">OpenAI</option>
        </select>
      </div>

      <div className="form-group">
        <label>Model</label>
        <input
          type="text"
          value={node.config.model}
          onChange={(e) => updateNode(node.id, { ...node.config, model: e.target.value })}
        />
      </div>
    </div>
  );

  const renderConditionalNode = (node) => (
    <div className="node-config">
      <div className="form-group">
        <label>If this tool is called:</label>
        <select
          value={node.config.if_node || ''}
          onChange={(e) => updateNode(node.id, { ...node.config, if_node: e.target.value })}
        >
          <option value="">Select a node...</option>
          {nodes
            .filter(n => n.id !== node.id && n.type === ATOMIC_NODE_TYPES.TOOL_CALL)
            .map(n => (
              <option key={n.id} value={n.id}>
                {n.config.tool_name || `Node ${n.id}`}
              </option>
            ))}
        </select>
      </div>

      <div className="form-group">
        <label>Then this tool must be called:</label>
        <select
          value={node.config.then_node || ''}
          onChange={(e) => updateNode(node.id, { ...node.config, then_node: e.target.value })}
        >
          <option value="">Select a node...</option>
          {nodes
            .filter(n => n.id !== node.id && n.type === ATOMIC_NODE_TYPES.TOOL_CALL)
            .map(n => (
              <option key={n.id} value={n.id}>
                {n.config.tool_name || `Node ${n.id}`}
              </option>
            ))}
        </select>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={node.config.require_before}
            onChange={(e) => updateNode(node.id, { ...node.config, require_before: e.target.checked })}
            style={{ width: 'auto', marginRight: '0.5rem' }}
          />
          Require BEFORE (then_tool must be called before if_tool)
        </label>
      </div>
    </div>
  );

  const getNodeTypeLabel = (type) => {
    const labels = {
      [ATOMIC_NODE_TYPES.TOOL_CALL]: 'Tool Call',
      [ATOMIC_NODE_TYPES.TOOL_RESPONSE]: 'Tool Response Check',
      [ATOMIC_NODE_TYPES.LLM_VALIDATION]: 'LLM Validation',
      [ATOMIC_NODE_TYPES.SEQUENCE]: 'Sequence',
      [ATOMIC_NODE_TYPES.CONDITIONAL]: 'Conditional (If-Then)'
    };
    return labels[type] || type;
  };

  const getNodeIcon = (type) => {
    const icons = {
      [ATOMIC_NODE_TYPES.TOOL_CALL]: '🔧',
      [ATOMIC_NODE_TYPES.TOOL_RESPONSE]: '✓',
      [ATOMIC_NODE_TYPES.LLM_VALIDATION]: '🤖',
      [ATOMIC_NODE_TYPES.SEQUENCE]: '→',
      [ATOMIC_NODE_TYPES.CONDITIONAL]: '⚡'
    };
    return icons[type] || '◆';
  };

  return (
    <div className="modal-overlay">
      <div className="modal no-code-editor">
        <div className="modal-header">
          <h3>No-Code Policy Builder</h3>
          <button onClick={onCancel} className="btn btn-secondary">×</button>
        </div>

        <div className="no-code-editor-content">
          <div className="policy-basics">
            <div className="form-group">
              <label>Policy Name</label>
              <input
                type="text"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                placeholder="e.g., High Value Invoice Approval"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                rows="2"
                value={policyDescription}
                onChange={(e) => setPolicyDescription(e.target.value)}
                placeholder="Describe what this policy enforces..."
              />
            </div>
          </div>

          <div className="nodes-section">
            <div className="section-header">
              <h4>Policy Rules</h4>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowNodeSelector(!showNodeSelector)}
              >
                + Add Rule
              </button>
            </div>

            {showNodeSelector && (
              <div className="node-selector">
                <div className="node-type-grid">
                  <div className="node-type-card" onClick={() => addNode(ATOMIC_NODE_TYPES.TOOL_CALL)}>
                    <span className="node-icon">🔧</span>
                    <h5>Tool Call</h5>
                    <p>Check if a specific tool is called with certain parameters</p>
                  </div>
                  <div className="node-type-card" onClick={() => addNode(ATOMIC_NODE_TYPES.TOOL_RESPONSE)}>
                    <span className="node-icon">✓</span>
                    <h5>Tool Response</h5>
                    <p>Validate tool response parameters or success status</p>
                  </div>
                  <div className="node-type-card" onClick={() => addNode(ATOMIC_NODE_TYPES.LLM_VALIDATION)}>
                    <span className="node-icon">🤖</span>
                    <h5>LLM Validation</h5>
                    <p>Use AI to validate tool response values</p>
                  </div>
                  <div className="node-type-card" onClick={() => addNode(ATOMIC_NODE_TYPES.CONDITIONAL)}>
                    <span className="node-icon">⚡</span>
                    <h5>Conditional (If-Then)</h5>
                    <p>If tool A is called, then tool B must be called</p>
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowNodeSelector(false)}
                  style={{ marginTop: '1rem' }}
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="nodes-list">
              {nodes.length === 0 && (
                <div className="empty-state">
                  <p>No rules yet. Click "Add Rule" to get started.</p>
                </div>
              )}

              {nodes.map((node, index) => (
                <div key={node.id} className="policy-node">
                  <div className="node-header">
                    <div className="node-title">
                      <span className="node-icon">{getNodeIcon(node.type)}</span>
                      <span>{getNodeTypeLabel(node.type)}</span>
                      <span className="node-number">#{index + 1}</span>
                    </div>
                    <div className="node-actions">
                      <button
                        className="btn-icon"
                        onClick={() => moveNode(node.id, 'up')}
                        disabled={index === 0}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => moveNode(node.id, 'down')}
                        disabled={index === nodes.length - 1}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => deleteNode(node.id)}
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <div className="node-body">
                    {node.type === ATOMIC_NODE_TYPES.TOOL_CALL && renderToolCallNode(node)}
                    {node.type === ATOMIC_NODE_TYPES.TOOL_RESPONSE && renderToolResponseNode(node)}
                    {node.type === ATOMIC_NODE_TYPES.LLM_VALIDATION && renderLLMValidationNode(node)}
                    {node.type === ATOMIC_NODE_TYPES.CONDITIONAL && renderConditionalNode(node)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn btn-primary" disabled={!policyName || nodes.length === 0}>
            Save Policy
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoCodePolicyEditor;
