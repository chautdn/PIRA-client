import api from './api';

const extensionApi = {
  // Get owner's pending extension requests
  getOwnerRequests: async (params = {}) => {
    try {
      const response = await api.get('/extensions/owner-requests', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get renter's extension requests
  getRenterRequests: async (params = {}) => {
    try {
      const response = await api.get('/extensions/renter-requests', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get extension request detail
  getDetail: async (requestId) => {
    try {
      const response = await api.get(`/extensions/${requestId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Owner approves extension request
  approveRequest: async (requestId) => {
    try {
      const response = await api.put(`/extensions/${requestId}/approve`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Owner rejects extension request
  rejectRequest: async (requestId, data) => {
    try {
      const response = await api.put(`/extensions/${requestId}/reject`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Renter cancels extension request
  cancelRequest: async (requestId) => {
    try {
      const response = await api.put(`/extensions/${requestId}/cancel`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Request extension
  requestExtension: async (subOrderId, data) => {
    try {
      const response = await api.post(`/extensions/request`, {
        subOrderId,
        ...data
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default extensionApi;
