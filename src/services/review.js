import axios from 'axios';

const base = '/api/ratings';

export const reviewService = {
  create: (formData, config = {}) => axios.post(base, formData, config),
  update: (id, formData, config = {}) => axios.put(`${base}/${id}`, formData, config),
  remove: (id) => axios.delete(`${base}/${id}`),
  reply: (id, body, config = {}) => axios.post(`${base}/${id}/reply`, body, config),
  replyToResponse: (id, responseId, body, config = {}) => axios.post(`${base}/${id}/responses/${responseId}/reply`, body, config),
  updateResponse: (id, responseId, body, config = {}) => axios.put(`${base}/${id}/responses/${responseId}`, body, config),
  deleteResponse: (id, responseId) => axios.delete(`${base}/${id}/responses/${responseId}`),
  helpful: (id, type, extra = {}) => axios.post(`${base}/${id}/helpful`, { type, ...extra }),
  listByProduct: (productId, params = {}) => {
    // Add a timestamp to avoid conditional caching (force fresh response)
    const p = { ...params, _ts: Date.now() };
    const config = { params: p, headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } };
    return axios.get(`${base}/product/${productId}`, config);
  },
};
