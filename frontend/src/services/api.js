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
  list: () => api.get('/api/memories/'),
  get: (id) => api.get(`/api/memories/${id}`),
  create: (data) => api.post('/api/memories', data),
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/memories/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => api.delete(`/api/memories/${id}`),
  resolve: (id, resolvedBy = null, notes = null) =>
    api.post(`/api/memories/${id}/resolve`, {
      resolved_by: resolvedBy,
      resolution_notes: notes
    }),
  unresolve: (id) => api.post(`/api/memories/${id}/unresolve`),
};

// Alias for Session API (preferred terminology)
export const sessionAPI = memoryAPI;

// Policy API
export const policyAPI = {
  list: () => api.get('/api/policies'),
  get: (id) => api.get(`/api/policies/${id}`),
  create: (data) => api.post('/api/policies', data),
  update: (id, data) => api.put(`/api/policies/${id}`, data),
  delete: (id) => api.delete(`/api/policies/${id}`),
};

// Compliance API
export const complianceAPI = {
  evaluate: (memoryId, policyIds = null) =>
    api.post('/api/compliance/evaluate', {
      memory_id: memoryId,
      policy_ids: policyIds
    }),
  getSummary: () => api.get('/api/compliance/summary'),
  getMemoryEvaluations: (memoryId) => api.get(`/api/compliance/memory/${memoryId}`),
  processBatch: (memoryIds, refreshVariants = true) =>
    api.post('/api/compliance/process-batch', {
      memory_ids: memoryIds,
      refresh_variants: refreshVariants
    }),
  reset: () => api.delete('/api/compliance/reset'),
};

// Agent Variants API
export const agentVariantsAPI = {
  list: (refresh = false) => api.get('/api/agent-variants/', { params: { refresh } }),
  get: (id) => api.get(`/api/agent-variants/${id}`),
  getTransitions: (variantId = null) => {
    const params = variantId ? { variant_id: variantId } : {};
    return api.get('/api/agent-variants/transitions/', { params });
  },
  refresh: () => api.post('/api/agent-variants/refresh/'),
};

// Jobs API (Async Processing)
export const jobsAPI = {
  submit: (memoryIds, policyIds = null, refreshVariants = true) =>
    api.post('/api/jobs/submit', {
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
