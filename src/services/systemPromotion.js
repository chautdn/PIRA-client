import api from "./api";

const systemPromotionService = {
  // Get active system promotion (Public)
  getActive: async () => {
    try {
      const response = await api.get("/system-promotions/active");
      return response.data;
    } catch (error) {
      console.error("Error fetching active promotion:", error);
      throw error;
    }
  },

  // Get all system promotions (Admin)
  getAll: async (params = {}) => {
    try {
      const response = await api.get("/system-promotions", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching promotions:", error);
      throw error;
    }
  },

  // Get promotion by ID (Admin)
  getById: async (id) => {
    try {
      const response = await api.get(`/system-promotions/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching promotion:", error);
      throw error;
    }
  },

  // Create system promotion (Admin)
  create: async (data) => {
    try {
      const response = await api.post("/system-promotions", data);
      return response.data;
    } catch (error) {
      console.error("Error creating promotion:", error);
      throw error;
    }
  },

  // Update system promotion (Admin)
  update: async (id, data) => {
    try {
      const response = await api.put(`/system-promotions/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating promotion:", error);
      throw error;
    }
  },

  // Deactivate system promotion (Admin)
  deactivate: async (id) => {
    try {
      const response = await api.delete(`/system-promotions/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deactivating promotion:", error);
      throw error;
    }
  },

  // Calculate discount preview (Authenticated)
  calculateDiscount: async (shippingFee, orderTotal = 0) => {
    try {
      const response = await api.post("/system-promotions/calculate-discount", {
        shippingFee,
        orderTotal,
      });
      return response.data;
    } catch (error) {
      console.error("Error calculating discount:", error);
      throw error;
    }
  },
};

export default systemPromotionService;
