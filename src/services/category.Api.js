import api from "./api";

export const categoryApi = {
  // GET /api/categories - Get all categories
  getCategories: async () => {
    try {
      const response = await api.get("/categories");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // GET /api/categories/:id/subcategories - Get subcategories for a category
  getSubCategories: async (categoryId) => {
    try {
      const response = await api.get(`/categories/${categoryId}/subcategories`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // GET /api/categories/:id - Get single category
  getCategoryById: async (id) => {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
