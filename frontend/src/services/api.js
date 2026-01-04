import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Session (Agent Memory) API
export const memoryAPI = {
  list: (agentId) => api.get(`/api/memories/${agentId}/`),
  get: (agentId, id) => api.get(`/api/memories/${agentId}/${id}`),
  create: (data) => api.post('/api/memories', data),
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/memories/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => api.delete(`/api/memories/${id}`),
  resolve: (agentId, id, resolvedBy = null, notes = null) =>
    api.post(`/api/memories/${agentId}/${id}/resolve`, {
      resolved_by: resolvedBy,
      resolution_notes: notes
    }),
  unresolve: (agentId, id) => api.post(`/api/memories/${agentId}/${id}/unresolve`),
};

// Alias for Session API (preferred terminology)
export const sessionAPI = memoryAPI;

// Policy API
export const policyAPI = {
  list: (agentId) => api.get(`/api/policies/${agentId}/`),
  get: (agentId, id) => api.get(`/api/policies/${agentId}/${id}`),
  create: (agentId, data) => api.post(`/api/policies/${agentId}/`, data),
  update: (agentId, id, data) => api.put(`/api/policies/${agentId}/${id}`, data),
  delete: (agentId, id) => api.delete(`/api/policies/${agentId}/${id}`),
};

// Compliance API
export const complianceAPI = {
  evaluate: (agentId, memoryId, policyIds = null) =>
    api.post(`/api/compliance/${agentId}/evaluate`, {
      memory_id: memoryId,
      policy_ids: policyIds
    }),
  getSummary: (agentId) => api.get(`/api/compliance/${agentId}/summary`),
  getMemoryEvaluations: (agentId, memoryId) => api.get(`/api/compliance/${agentId}/memory/${memoryId}`),
  processBatch: (agentId, memoryIds, refreshVariants = true) =>
    api.post(`/api/compliance/${agentId}/process-batch`, {
      memory_ids: memoryIds,
      refresh_variants: refreshVariants
    }),
  reset: (agentId) => api.delete(`/api/compliance/${agentId}/reset`),
};

// Agent Variants API
export const agentVariantsAPI = {
  list: (agentId, refresh = false) => api.get(`/api/agent-variants/${agentId}/`, { params: { refresh } }),
  get: (agentId, id) => api.get(`/api/agent-variants/${agentId}/${id}`),
  getTransitions: (agentId, variantId = null) => {
    const params = variantId ? { variant_id: variantId } : {};
    return api.get(`/api/agent-variants/${agentId}/transitions`, { params });
  },
  refresh: (agentId) => api.post(`/api/agent-variants/${agentId}/refresh`),
};

// Agents API
export const agentsAPI = {
  list: () => api.get('/api/agents/'),
  get: (agentId) => api.get(`/api/agents/${agentId}`),
  delete: (agentId) => api.delete(`/api/agents/${agentId}`),
  create: (data) => api.post('/api/agents/', data),
  generateSessions: (agentId, data) => api.post(`/api/agents/${agentId}/generate-sessions`, data),
};

// Jobs API (Async Processing)
export const jobsAPI = {
  submit: (agentId, memoryIds, policyIds = null, refreshVariants = true) =>
    api.post('/api/jobs/submit', {
      agent_id: agentId,
      memory_ids: memoryIds,
      policy_ids: policyIds,
      refresh_variants: refreshVariants
    }),
  getStatus: (jobId) => api.get(`/api/jobs/${jobId}/status`),
  getResult: (jobId) => api.get(`/api/jobs/${jobId}/result`),
  list: (status = null, limit = 10) =>
    api.get('/api/jobs/', { params: { status, limit } }),
  delete: (jobId) => api.delete(`/api/jobs/${jobId}`),

  // Helper: Poll until job completes
  pollUntilComplete: async (jobId, onProgress, intervalMs = 500, maxAttempts = 600) => {
    let attempts = 0;
    while (attempts < maxAttempts) {
      const response = await api.get(`/api/jobs/${jobId}/status`);
      const status = response.data;

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
      attempts++;
    }
    throw new Error('Job polling timeout');
  }
};

export default api;
