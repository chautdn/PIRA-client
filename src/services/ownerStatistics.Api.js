import api from "./api";

export const ownerStatisticsApi = {
  /**
   * Lấy thống kê tổng quan của owner
   * GET /api/owner/statistics/overview
   */
  getOverviewStatistics: async () => {
    try {
      const response = await api.get("/owner/statistics/overview");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Lấy thống kê sản phẩm chi tiết
   * GET /api/owner/statistics/products
   * @param {Object} params - Query parameters
   * @param {string} params.status - AVAILABLE, RENTED, UNAVAILABLE
   * @param {string} params.category - Category ID
   * @param {string} params.startDate - ISO 8601 date
   * @param {string} params.endDate - ISO 8601 date
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.sort - Sort field
   * @param {string} params.order - asc or desc
   */
  getProductStatistics: async (params = {}) => {
    try {
      const response = await api.get("/owner/statistics/products", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Lấy thống kê đơn hàng chi tiết
   * GET /api/owner/statistics/orders
   * @param {Object} params - Query parameters
   * @param {string} params.status - Order status
   * @param {string} params.startDate - ISO 8601 date
   * @param {string} params.endDate - ISO 8601 date
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.sort - Sort field
   * @param {string} params.order - asc or desc
   */
  getOrderStatistics: async (params = {}) => {
    try {
      const response = await api.get("/owner/statistics/orders", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Lấy thống kê doanh thu theo thời gian
   * GET /api/owner/statistics/revenue
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - ISO 8601 date
   * @param {string} params.endDate - ISO 8601 date
   * @param {string} params.groupBy - day, week, month, year
   */
  getRevenueStatistics: async (params = {}) => {
    try {
      const response = await api.get("/owner/statistics/revenue", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Lấy top sản phẩm có doanh thu cao nhất
   * GET /api/owner/statistics/top-products
   * @param {number} limit - Number of top products (default: 10)
   */
  getTopRevenueProducts: async (limit = 10) => {
    try {
      const response = await api.get("/owner/statistics/top-products", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Lấy danh sách sản phẩm đang cho thuê
   * GET /api/owner/statistics/currently-rented
   */
  getCurrentlyRentedProducts: async () => {
    try {
      const response = await api.get("/owner/statistics/currently-rented");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default ownerStatisticsApi;
