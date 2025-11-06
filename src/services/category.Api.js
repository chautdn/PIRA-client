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

  // GET /api/categories/parents - Get only parent categories
  getParentCategories: async () => {
    try {
      const response = await api.get("/categories/parents");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // GET /api/categories/subcategories/:parentId - Get subcategories for a parent category
  getSubCategories: async (parentId) => {
    try {
      const response = await api.get(`/categories/subcategories/${parentId}`);
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
