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
      name: "Premium",
      color: "from-yellow-400 to-yellow-600",
      badge: "PREMIUM",
      icon: "👑",
      borderColor: "border-yellow-400",
      shadowColor: "shadow-yellow-200",
      features: [
        "Top position",
        "Gold badge",
        "Glow effect",
        "Highest priority",
      ],
    },
    2: {
      name: "Featured",
      color: "from-gray-300 to-gray-500",
      badge: "FEATURED",
      icon: "⭐",
      borderColor: "border-gray-400",
      shadowColor: "shadow-gray-200",
      features: [
        "High priority",
        "Silver badge",
        "Featured styling",
        "Prominent position",
      ],
    },
    3: {
      name: "Popular",
      color: "from-orange-400 to-orange-600",
      badge: "POPULAR",
      icon: "🔥",
      borderColor: "border-orange-400",
      shadowColor: "shadow-orange-100",
      features: [
        "Medium priority",
        "Bronze badge",
        "Highlighted border",
        "Good visibility",
      ],
    },
    4: {
      name: "Boosted",
      color: "from-blue-400 to-blue-600",
      badge: "BOOSTED",
      icon: "⚡",
      borderColor: "border-blue-400",
      shadowColor: "shadow-blue-100",
      features: [
        "Standard priority",
        "Basic badge",
        "Subtle highlight",
        "Better than free",
      ],
    },
    5: {
      name: "Basic",
      color: "from-green-400 to-green-600",
      badge: "BASIC",
      icon: "✨",
      borderColor: "border-green-400",
      shadowColor: "shadow-green-100",
      features: [
        "Entry priority",
        "Minimal badge",
        "Light accent",
        "Affordable option",
      ],
    },
  },

  // Tier pricing
  TIER_PRICES: {
    1: 150000,
    2: 120000,
    3: 90000,
    4: 60000,
    5: 30000,
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
