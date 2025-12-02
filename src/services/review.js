import { api } from "./api";

const base = "/ratings";

export const reviewService = {
  create: (formData, config = {}) => api.post(base, formData, config),
  update: (id, formData, config = {}) =>
    api.put(`${base}/${id}`, formData, config),
  remove: (id) => api.delete(`${base}/${id}`),
  reply: (id, body, config = {}) =>
    api.post(`${base}/${id}/reply`, body, config),
  replyToResponse: (id, responseId, body, config = {}) =>
    api.post(`${base}/${id}/responses/${responseId}/reply`, body, config),
  updateResponse: (id, responseId, body, config = {}) =>
    api.put(`${base}/${id}/responses/${responseId}`, body, config),
  deleteResponse: (id, responseId) =>
    api.delete(`${base}/${id}/responses/${responseId}`),
  helpful: (id, type, extra = {}) =>
    api.post(`${base}/${id}/helpful`, { type, ...extra }),
  listByProduct: (productId, params = {}) => {
    // Add a timestamp to avoid conditional caching (force fresh response)
    const p = { ...params, _ts: Date.now() };
    const config = {
      params: p,
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    };
    return api.get(`${base}/product/${productId}`, config);
  },
};
