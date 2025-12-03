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
   * Update early return request (Renter only)
   * @param {string} id - Request ID
   * @param {Object} data - { requestedReturnDate, returnAddress, notes }
   * @returns {Promise}
   */
  update: async (id, data) => {
    try {
      const response = await api.put(`/early-returns/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("❌ Update request error:", error);
      throw error;
    }
  },

  /**
   * Delete early return request (Renter only)
   * Restores original return date in SubOrder
   * @param {string} id - Request ID
   * @returns {Promise}
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/early-returns/${id}`);
      return response.data;
    } catch (error) {
      console.error("❌ Delete request error:", error);
      throw error;
    }
  },

  /**
   * Calculate additional fee BEFORE creating request
   * @param {Object} data - { subOrderId, newAddress }
   * @returns {Promise}
   */
  calculateAdditionalFee: async (data) => {
    try {
      const response = await api.post("/early-returns/calculate-fee", data);
      return response.data;
    } catch (error) {
      console.error("❌ Calculate fee error:", error);
      throw error;
    }
  },

  /**
   * Pay upfront shipping fee BEFORE creating request
   * @param {Object} data - { subOrderId, amount, paymentMethod, addressInfo }
   * @returns {Promise}
   */
  payUpfrontShippingFee: async (data) => {
    try {
      const response = await api.post(
        "/early-returns/pay-upfront-shipping",
        data
      );
      return response.data;
    } catch (error) {
      console.error("❌ Pay upfront shipping error:", error);
      throw error;
    }
  },

  /**
   * Update return address and calculate additional shipping fee
   * @param {string} id - Request ID
   * @param {Object} data - { returnAddress }
   * @returns {Promise}
   */
  updateAddress: async (id, data) => {
    try {
      const response = await api.put(`/early-returns/${id}/address`, data);
      return response.data;
    } catch (error) {
      console.error("❌ Update address error:", error);
      throw error;
    }
  },

  /**
   * Pay additional shipping fee
   * @param {string} id - Request ID
   * @param {Object} data - { paymentMethod: 'wallet' | 'payos' }
   * @returns {Promise}
   */
  payAdditionalShipping: async (id, data) => {
    try {
      const response = await api.post(
        `/early-returns/${id}/pay-additional-shipping`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("❌ Pay additional shipping error:", error);
      throw error;
    }
  },

  /**
   * Verify additional shipping payment (for PayOS)
   * @param {string} orderCode - PayOS order code
   * @returns {Promise}
   */
  verifyAdditionalShippingPayment: async (orderCode) => {
    try {
      const response = await api.get(
        `/early-returns/verify-additional-shipping/${orderCode}`
      );
      return response.data;
    } catch (error) {
      console.error("❌ Verify payment error:", error);
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
