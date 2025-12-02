import api from "./api";

export const ownerProductApi = {
  // GET /api/owner/products - Get all products for the owner with pagination
  getOwnerProducts: async (params) => {
    try {
      const response = await api.get("/owner-products", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // POST /api/owner/products - Create new product
  createOwnerProduct: async (productData) => {
    try {
      const response = await api.post("/owner-products", productData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // GET /api/owner/products/:id - Get single product by ID for the owner
  getOwnerProductById: async (id) => {
    try {
      const response = await api.get(`/owner-products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // PUT /api/owner/products/:id - Update product by ID for the owner
  updateOwnerProduct: async (id, productData) => {
    try {
      const response = await api.put(`/owner-products/${id}`, productData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // DELETE /api/owner/products/:id - Delete product by ID for the owner
  deleteOwnerProduct: async (id) => {
    try {
      const response = await api.delete(`/owner-products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // PUT /api/owner/products/:id/featured - Update featured status for a product
  updateFeaturedStatus: async (id, featuredTier, duration) => {
    try {
      const response = await api.put(`/owner-products/${id}/featured`, {
        featuredTier,
        duration,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // POST /api/owner/products/:id/upload-images - Upload additional images
  uploadImages: async (id, images) => {
    try {
      const formData = new FormData();
      images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await api.post(
        `/owner-products/${id}/upload-images`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // DELETE /api/owner/products/:id/images/:imageId - Delete specific image
  deleteImage: async (productId, imageId) => {
    try {
      const response = await api.delete(
        `/owner-products/${productId}/images/${imageId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // GET /api/owner/products/:id/rental-status - Check rental status
  checkRentalStatus: async (productId) => {
    try {
      const response = await api.get(
        `/owner-products/${productId}/rental-status`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // PUT /api/owner/products/:id/hide - Hide product
  hideProduct: async (productId) => {
    try {
      const response = await api.put(`/owner-products/${productId}/hide`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // PUT /api/owner/products/:id/unhide - Unhide product
  unhideProduct: async (productId) => {
    try {
      const response = await api.put(`/owner-products/${productId}/unhide`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // DELETE /api/owner/products/:id/soft-delete - Soft delete product
  softDeleteProduct: async (productId) => {
    try {
      const response = await api.delete(
        `/owner-products/${productId}/soft-delete`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // PUT /api/owner/products/:id/safe-update - Update safe fields only
  updateProductSafeFields: async (productId, updateData) => {
    try {
      const response = await api.put(
        `/owner-products/${productId}/safe-update`,
        updateData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // === RENTAL ORDER MANAGEMENT ===

  // GET /api/rental-orders/owner-suborders - Get SubOrders for owner
  getSubOrders: async (params) => {
    try {
      const response = await api.get("/rental-orders/owner-suborders", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // POST /api/rental-orders/suborders/:id/confirm - Confirm SubOrder
  confirmSubOrder: async (subOrderId) => {
    try {
      const response = await api.post(
        `/rental-orders/suborders/${subOrderId}/confirm`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // POST /api/rental-orders/suborders/:id/reject - Reject SubOrder
  rejectSubOrder: async (subOrderId, data) => {
    try {
      const response = await api.post(
        `/rental-orders/suborders/${subOrderId}/reject`,
        data
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // POST /api/rental-orders/suborders/:id/create-contract - Create contract
  createContract: async (subOrderId, contractData) => {
    try {
      const response = await api.post(
        `/rental-orders/suborders/${subOrderId}/create-contract`,
        contractData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // GET /api/owner-products/rental-requests - Get rental requests for owner
  getRentalRequests: async (params) => {
    try {
      const response = await api.get("/owner-products/rental-requests", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // GET /api/owner-products/rental-requests/:subOrderId - Get single rental request detail
  getSubOrderDetail: async (subOrderId) => {
    try {
      const response = await api.get(`/owner-products/rental-requests/${subOrderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // POST /api/owner-products/rental-requests/:subOrderId/items/:itemIndex/confirm
  confirmProductItem: async (subOrderId, itemIndex) => {
    try {
      const response = await api.post(
        `/owner-products/rental-requests/${subOrderId}/items/${itemIndex}/confirm`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // POST /api/owner-products/rental-requests/:subOrderId/items/:itemIndex/reject
  rejectProductItem: async (subOrderId, itemIndex, reason) => {
    try {
      const response = await api.post(
        `/owner-products/rental-requests/${subOrderId}/items/${itemIndex}/reject`,
        { reason }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // GET /api/owner-products/:productId/can-edit-pricing - Check if pricing can be edited
  canEditPricing: async (productId) => {
    try {
      const response = await api.get(
        `/owner-products/${productId}/can-edit-pricing`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // PUT /api/owner-products/:productId/pricing - Update product pricing
  updatePricing: async (productId, pricingData) => {
    try {
      const response = await api.put(
        `/owner-products/${productId}/pricing`,
        pricingData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
