import React, { useState } from 'react';
import { agentsAPI } from '../services/api';
import { useToast } from './Toast';

function CreateAgentModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    agent_name: '',
    description: '',
    tools: '',
    business_identifiers: '',
    ensure_tools: '',
    generate_policies: false,
    llm_provider: 'anthropic',
    model: 'claude-sonnet-4-5-20250929'
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.agent_name || !formData.description) {
      toast.error('Please fill in required fields', 'Validation Error');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        agent_name: formData.agent_name,
        description: formData.description,
        tools: formData.tools || null,
        business_identifiers: formData.business_identifiers || null,
        ensure_tools: formData.ensure_tools ? formData.ensure_tools.split(',').map(t => t.trim()).filter(Boolean) : null,
        generate_policies: formData.generate_policies,
        llm_provider: formData.llm_provider,
        model: formData.model
      };

      const response = await agentsAPI.create(payload);
      const successMsg = formData.generate_policies && response.data.policies_created > 0
        ? `Agent "${response.data.agent_name}" created with ${response.data.policies_created} policies`
        : `Agent "${response.data.agent_name}" created successfully`;
      toast.success(successMsg, 'Agent Created');
      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      toast.error(errorMsg, 'Error Creating Agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <h3>Create New Agent</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.938rem' }}>
          Describe your agent's workflow in natural language. The LLM will generate tools, business identifiers, and optionally suggest policies.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Agent Name *</label>
            <input
              type="text"
              value={formData.agent_name}
              onChange={(e) => setFormData({...formData, agent_name: e.target.value})}
              placeholder="e.g., Order Processing Agent"
              required
            />
          </div>

          <div className="form-group">
            <label>Use Case Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe what this agent does, the workflow it follows, tools it might need, and any business rules...&#10;&#10;Example: 'An agent that processes customer orders, validates inventory, calculates pricing with discounts, requests approval for high-value orders, and sends confirmation emails.'"
              rows={5}
              required
              style={{ fontSize: '0.938rem', lineHeight: '1.5' }}
            />
            <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.813rem', display: 'block', marginTop: '0.25rem' }}>
              Be as specific or general as you like. You can mention specific tools or let the LLM decide.
            </small>
          </div>

          <div className="form-group">
            <label>Tool Requirements (optional)</label>
            <input
              type="text"
              value={formData.ensure_tools}
              onChange={(e) => setFormData({...formData, ensure_tools: e.target.value})}
              placeholder="e.g., check_financial_system, validate_compliance (comma-separated)"
            />
            <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.813rem', display: 'block', marginTop: '0.25rem' }}>
              Specific tools that must be included. The LLM will generate additional tools based on your description.
            </small>
          </div>

          <div className="form-group">
            <label>Business Identifiers (optional)</label>
            <input
              type="text"
              value={formData.business_identifiers}
              onChange={(e) => setFormData({...formData, business_identifiers: e.target.value})}
              placeholder="e.g., customer ID, order number, location, invoice ID"
            />
            <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.813rem', display: 'block', marginTop: '0.25rem' }}>
              Business data fields to track. Leave blank to auto-generate based on use case.
            </small>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.generate_policies}
                onChange={(e) => setFormData({...formData, generate_policies: e.target.checked})}
                style={{ width: 'auto', margin: 0 }}
              />
              <span>Generate suggested policies for this agent</span>
            </label>
            <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.813rem', display: 'block', marginLeft: '1.5rem', marginTop: '0.25rem' }}>
              The LLM will create compliance policies based on the agent's workflow. You can edit them after creation.
            </small>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: '8px'
          }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>LLM Provider</label>
              <select
                value={formData.llm_provider}
                onChange={(e) => setFormData({
                  ...formData,
                  llm_provider: e.target.value
                })}
              >
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                placeholder={formData.llm_provider === 'anthropic' ? 'claude-sonnet-4-5-20250929' : 'gpt-4o'}
              />
              <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.813rem', display: 'block', marginTop: '0.25rem' }}>
                Same format as policy LLM config (free text). Set any valid model for the chosen provider.
              </small>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating Agent...' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAgentModal;
