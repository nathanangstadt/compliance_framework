import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Agent Memory API
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
};

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

export default api;
