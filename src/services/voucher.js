import api from "./api";

const voucherService = {
  // Get user's vouchers
  async getUserVouchers(includeUsed = false) {
    try {
      const response = await api.get("/vouchers", {
        params: { includeUsed },
      });
      return response.data;
    } catch (error) {
      console.error("Error getting user vouchers:", error);
      throw error;
    }
  },

  // Get loyalty points balance
  async getLoyaltyPoints() {
    try {
      const response = await api.get("/vouchers/loyalty-points");
      return response.data;
    } catch (error) {
      console.error("Error getting loyalty points:", error);
      throw error;
    }
  },

  // Redeem voucher with loyalty points
  async redeemVoucher(requiredPoints) {
    try {
      const response = await api.post("/vouchers/redeem", {
        requiredPoints,
      });
      return response.data;
    } catch (error) {
      console.error("Error redeeming voucher:", error);
      throw error;
    }
  },

  // Validate voucher code
  async validateVoucher(code) {
    try {
      const response = await api.post("/vouchers/validate", {
        code,
      });
      return response.data;
    } catch (error) {
      console.error("Error validating voucher:", error);
      throw error;
    }
  },
};

export default voucherService;
