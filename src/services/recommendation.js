import api from "./api";

const recommendationService = {
  /**
   * Track category click when user views a product
   */
  trackCategoryClick: async (categoryId) => {
    try {
      const response = await api.post("/recommendations/track-click", {
        categoryId,
      });
      return response.data;
    } catch (error) {
      console.error("Error tracking category click:", error);
      throw error;
    }
  },

  /**
   * Get all active products by a specific owner
   */
  getProductsByOwner: async (ownerId, params = {}) => {
    try {
      const response = await api.get(
        `/recommendations/owner/${ownerId}/products`,
        {
          params: {
            page: params.page || 1,
            limit: params.limit || 12,
            search: params.search || "",
            category: params.category || "",
            sort: params.sort || "createdAt",
            order: params.order || "desc",
            hotOnly: params.hotOnly || false,
            recommendedOnly: params.recommendedOnly || false,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching owner products:", error);
      throw error;
    }
  },

  /**
   * Get hot/trending products
   */
  getHotProducts: async (params = {}) => {
    try {
      const response = await api.get("/recommendations/hot", {
        params: {
          page: params.page || 1,
          limit: params.limit || 12,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching hot products:", error);
      throw error;
    }
  },

  /**
   * Get personalized recommendations for the current user
   */
  getRecommendedProducts: async (params = {}) => {
    try {
      const response = await api.get("/recommendations/for-you", {
        params: {
          page: params.page || 1,
          limit: params.limit || 12,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching recommended products:", error);
      throw error;
    }
  },

  /**
   * Get top rated and most rented products (randomized)
   */
  getTopRatedAndMostRented: async (params = {}) => {
    try {
      const response = await api.get("/recommendations/top-rated-most-rented", {
        params: {
          limit: params.limit || 12,
        },
      });
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching top rated and most rented products:",
        error
      );
      throw error;
    }
  },
};

export default recommendationService;
