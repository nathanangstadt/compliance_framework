import React, { useState, useEffect } from 'react';
import { policyAPI } from '../services/api';

function PolicyEditor({ policy, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    policy_type: 'response_length',
    enabled: true,
    config: {}
  });

  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (policy) {
      setFormData({
        name: policy.name,
        description: policy.description || '',
        policy_type: policy.policy_type,
        enabled: policy.enabled,
        config: policy.config
      });
    }
  }, [policy]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setFormData(prev => ({
      ...prev,
      policy_type: newType,
      config: getDefaultConfig(newType)
    }));
  };

  const getDefaultConfig = (type) => {
    switch (type) {
      case 'response_length':
        return { max_tokens: 1000 };
      case 'tool_call':
        return { tool_name: '', parameters: {} };
      case 'tool_response':
        return { tool_name: '', expect_success: true };
      case 'compound_tool':
        return { conditions: [] };
      case 'llm_eval':
        return {
          evaluation_prompt: '',
          message_filter: {},
          llm_provider: 'anthropic',
          model: 'claude-sonnet-4-5-20250929'
        };
      default:
        return {};
    }
  };

  const handleConfigChange = (path, value) => {
    setFormData(prev => {
      const newConfig = { ...prev.config };
      const keys = path.split('.');
      let current = newConfig;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return { ...prev, config: newConfig };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (policy) {
        await policyAPI.update(policy.id, formData);
      } else {
        await policyAPI.create(formData);
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderConfigEditor = () => {
    switch (formData.policy_type) {
      case 'response_length':
        return (
          <div className="form-group">
            <label>Maximum Tokens</label>
            <input
              type="number"
              value={formData.config.max_tokens || 1000}
              onChange={(e) => handleConfigChange('max_tokens', parseInt(e.target.value))}
            />
          </div>
        );

      case 'tool_call':
        return (
          <>
            <div className="form-group">
              <label>Tool Name</label>
              <input
                type="text"
                value={formData.config.tool_name || ''}
                onChange={(e) => handleConfigChange('tool_name', e.target.value)}
                placeholder="e.g., create_order"
              />
            </div>
            <div className="form-group">
              <label>Parameter Conditions (JSON)</label>
              <textarea
                rows="4"
                value={JSON.stringify(formData.config.parameters || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const params = JSON.parse(e.target.value);
                    handleConfigChange('parameters', params);
                  } catch (err) {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder={'{\n  "amount": {"gt": 1000}\n}'}
              />
              <small>Use {"gt"} for greater than, {"eq"} for equals</small>
            </div>
          </>
        );

      case 'tool_response':
        return (
          <>
            <div className="form-group">
              <label>Tool Name</label>
              <input
                type="text"
                value={formData.config.tool_name || ''}
                onChange={(e) => handleConfigChange('tool_name', e.target.value)}
                placeholder="e.g., create_order"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.config.expect_success !== false}
                  onChange={(e) => handleConfigChange('expect_success', e.target.checked)}
                  style={{ width: 'auto', marginRight: '0.5rem' }}
                />
                Expect Success (fail if tool returns error)
              </label>
            </div>
          </>
        );

      case 'compound_tool':
        return (
          <div className="form-group">
            <label>Conditions (JSON)</label>
            <textarea
              rows="8"
              value={JSON.stringify(formData.config.conditions || [], null, 2)}
              onChange={(e) => {
                try {
                  const conditions = JSON.parse(e.target.value);
                  handleConfigChange('conditions', conditions);
                } catch (err) {
                  // Invalid JSON, ignore
                }
              }}
              placeholder={`[\n  {\n    "type": "if_then",\n    "if_tool": "create_invoice",\n    "if_params": {"amount": {"gt": 1000}},\n    "then_tool": "request_approval",\n    "then_before": true\n  }\n]`}
            />
            <small>Define if-then conditions for tool call sequences</small>
          </div>
        );

      case 'llm_eval':
        return (
          <>
            <div className="form-group">
              <label>Evaluation Prompt</label>
              <textarea
                rows="4"
                value={formData.config.evaluation_prompt || ''}
                onChange={(e) => handleConfigChange('evaluation_prompt', e.target.value)}
                placeholder="Analyze this message and determine if it contains PII data. Respond with 'violation' if PII is found."
              />
            </div>
            <div className="form-group">
              <label>Message Filter (JSON - optional)</label>
              <textarea
                rows="3"
                value={JSON.stringify(formData.config.message_filter || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const filter = JSON.parse(e.target.value);
                    handleConfigChange('message_filter', filter);
                  } catch (err) {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder={'{\n  "role": "assistant"\n}'}
              />
            </div>
            <div className="form-group">
              <label>LLM Provider</label>
              <select
                value={formData.config.llm_provider || 'anthropic'}
                onChange={(e) => handleConfigChange('llm_provider', e.target.value)}
              >
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>
            <div className="form-group">
              <label>Model</label>
              <input
                type="text"
                value={formData.config.model || 'claude-sonnet-4-5-20250929'}
                onChange={(e) => handleConfigChange('model', e.target.value)}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{policy ? 'Edit Policy' : 'Create Policy'}</h3>
          <button onClick={onClose} className="btn btn-secondary">×</button>
        </div>

        {error && <div className="error">Error: {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Policy Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Maximum Response Length"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              placeholder="Optional description of what this policy enforces"
            />
          </div>

          <div className="form-group">
            <label>Policy Type</label>
            <select
              name="policy_type"
              value={formData.policy_type}
              onChange={handleTypeChange}
              disabled={!!policy}
            >
              <option value="response_length">Response Length</option>
              <option value="tool_call">Tool Call</option>
              <option value="tool_response">Tool Response</option>
              <option value="compound_tool">Compound Tool</option>
              <option value="llm_eval">LLM Evaluation</option>
            </select>
          </div>

          {renderConfigEditor()}

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="enabled"
                checked={formData.enabled}
                onChange={handleChange}
                style={{ width: 'auto', marginRight: '0.5rem' }}
              />
              Enabled
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PolicyEditor;
