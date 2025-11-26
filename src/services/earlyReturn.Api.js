import api from "./api";

/**
 * Early Return API Service
 * Handles early return requests for rental orders
 */
const earlyReturnApi = {
  /**
   * Create early return request
   * @param {Object} data - { subOrderId, requestedReturnDate, useOriginalAddress, returnAddress, notes }
   * @returns {Promise}
   */
  create: async (data) => {
    try {
      const response = await api.post("/early-returns", data);
      return response.data;
    } catch (error) {
      console.error("❌ Create early return request error:", error);
      throw error;
    }
  },

  /**
   * Get renter's early return requests
   * @param {Object} params - { page, limit, status }
   * @returns {Promise}
   */
  getRenterRequests: async (params = {}) => {
    try {
      const response = await api.get("/early-returns/renter", { params });
      return response.data;
    } catch (error) {
      console.error("❌ Get renter requests error:", error);
      throw error;
    }
  },

  /**
   * Get owner's early return requests
   * @param {Object} params - { page, limit, status }
   * @returns {Promise}
   */
  getOwnerRequests: async (params = {}) => {
    try {
      const response = await api.get("/early-returns/owner", { params });
      return response.data;
    } catch (error) {
      console.error("❌ Get owner requests error:", error);
      throw error;
    }
  },

  /**
   * Get early return request details
   * @param {string} id - Request ID
   * @returns {Promise}
   */
  getDetails: async (id) => {
    try {
      const response = await api.get(`/early-returns/${id}`);
      return response.data;
    } catch (error) {
      console.error("❌ Get request details error:", error);
      throw error;
    }
  },

  /**
   * Confirm return received (Owner only)
   * @param {string} id - Request ID
   * @param {Object} data - { notes, qualityCheck }
   * @returns {Promise}
   */
  confirmReturn: async (id, data = {}) => {
    try {
      const response = await api.post(
        `/early-returns/${id}/confirm-return`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("❌ Confirm return error:", error);
      throw error;
    }
  },

  /**
   * Cancel early return request (Renter only)
   * @param {string} id - Request ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise}
   */
  cancel: async (id, reason) => {
    try {
      const response = await api.post(`/early-returns/${id}/cancel`, {
        reason,
      });
      return response.data;
    } catch (error) {
      console.error("❌ Cancel request error:", error);
      throw error;
    }
  },

  /**
   * Create owner review for renter (Owner only)
   * @param {string} id - Request ID
   * @param {Object} reviewData - { rating, comment, title, detailedRating, photos }
   * @returns {Promise}
   */
  createReview: async (id, reviewData) => {
    try {
      const response = await api.post(
        `/early-returns/${id}/review`,
        reviewData
      );
      return response.data;
    } catch (error) {
      console.error("❌ Create review error:", error);
      throw error;
    }
  },
};

export default earlyReturnApi;
