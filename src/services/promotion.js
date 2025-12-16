import api from "./api";

const promotionService = {
  // Get pricing calculation
  calculatePricing: async (tier, duration) => {
    try {
      const response = await api.get("/product-promotions/pricing", {
        params: { tier, duration },
      });
      return response.data.metadata;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to calculate pricing"
      );
    }
  },

  // Create promotion
  createPromotion: async (data) => {
    try {
      const response = await api.post("/product-promotions", data);
      return response.data.metadata;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to create promotion"
      );
    }
  },

  // Get user's promotions
  getMyPromotions: async (page = 1, status = "all") => {
    try {
      const response = await api.get("/product-promotions/my-promotions", {
        params: { page, limit: 10, status },
      });
      return response.data.metadata;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to get promotions"
      );
    }
  },

  // Get promotion by ID
  getPromotionById: async (promotionId) => {
    try {
      const response = await api.get(`/product-promotions/${promotionId}`);
      return response.data.metadata;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to get promotion"
      );
    }
  },

  // Get tier information
  getTierInfo: async () => {
    try {
      const response = await api.get("/product-promotions/tiers");
      return response.data.metadata;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to get tier info"
      );
    }
  },

  // Tier configuration for UI
  TIER_CONFIG: {
    1: {
      name: "Gói 1",
      color: "from-yellow-400 to-yellow-600",
      badge: "GÓI 1",
      borderColor: "border-yellow-400",
      shadowColor: "shadow-yellow-200",
      features: [
        "Vị trí đầu tiên",
        "Huy hiệu vàng",
        "Hiệu ứng phát sáng",
        "Độ ưu tiên cao nhất",
      ],
    },
    2: {
      name: "Gói 2",
      color: "from-gray-300 to-gray-500",
      badge: "GÓI 2",
      borderColor: "border-gray-400",
      shadowColor: "shadow-gray-200",
      features: [
        "Độ ưu tiên cao",
        "Huy hiệu bạc",
        "Thiết kế nổi bật",
        "Vị trí ưu việt",
      ],
    },
    3: {
      name: "Gói 3",
      color: "from-orange-400 to-orange-600",
      badge: "GÓI 3",
      borderColor: "border-orange-400",
      shadowColor: "shadow-orange-100",
      features: [
        "Độ ưu tiên trung bình",
        "Huy hiệu đồng",
        "Viền tô sáng",
        "Khả năng hiển thị tốt",
      ],
    },
    4: {
      name: "Gói 4",
      color: "from-blue-400 to-blue-600",
      badge: "GÓI 4",
      borderColor: "border-blue-400",
      shadowColor: "shadow-blue-100",
      features: [
        "Độ ưu tiên tiêu chuẩn",
        "Huy hiệu cơ bản",
        "Làm nổi bật nhẹ",
        "Tùy chọn giá rẻ",
      ],
    },
    5: {
      name: "Gói 5",
      color: "from-green-400 to-green-600",
      badge: "GÓI 5",
      borderColor: "border-green-400",
      shadowColor: "shadow-green-100",
      features: [
        "Độ ưu tiên cơ bản",
        "Huy hiệu tối thiểu",
        "Nhấn nhẹ",
        "Tốt hơn miễn phí",
      ],
    },
  },

  // Tier pricing
  TIER_PRICES: {
    1: 25000,
    2: 20000,
    3: 15000,
    4: 10000,
    5: 5000,
  },

  // Discount configuration
  DISCOUNT_CONFIG: {
    minDays: 3,
    percentage: 10,
  },

  // Format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  },

  // Format date
  formatDate: (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },

  // Calculate days remaining
  getDaysRemaining: (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  },

  // Check if promotion is active
  isPromotionActive: (promotion) => {
    if (!promotion || !promotion.isActive) return false;
    const now = new Date();
    const end = new Date(promotion.endDate);
    return now <= end;
  },
};

export default promotionService;
