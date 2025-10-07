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
};
