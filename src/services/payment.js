import api from "./api.js";

/**
 * Service for Payment operations
 */
class PaymentService {
  // Create PayOS payment session for order
  async createOrderPaymentSession(orderData) {
    try {
      
      const response = await api.post("/payment/order", {
        amount: orderData.totalAmount,
        orderInfo: {
          orderNumber: orderData.orderNumber || `ORD-${Date.now()}`,
          description: orderData.description || `Thanh toán đơn thuê`,
          items: orderData.items || [],
        },
      });
      return response.data;
    } catch (error) {
      console.error("❌ PayOS session creation error:", error);
      throw new Error(
        error.response?.data?.message || "Không thể tạo phiên thanh toán PayOS"
      );
    }
  }

  // Process wallet payment for order
  async processWalletPayment(orderData) {
    try {
      const response = await api.post("/payment/wallet/deduct", {
        amount: orderData.totalAmount,
        orderInfo: {
          orderNumber: orderData.orderNumber || `ORD-${Date.now()}`,
          description: orderData.description || `Thanh toán đơn thuê`,
          items: orderData.items || [],
          totalDeposit: orderData.totalDeposit || 0,
          totalRental: orderData.totalRental || 0,
          totalShipping: orderData.totalShipping || 0,
        },
      });
      return response.data;
    } catch (error) {
      console.error("❌ Wallet payment error:", error);
      throw new Error(
        error.response?.data?.message || "Không thể thanh toán bằng ví"
      );
    }
  } // Get wallet balance
  async getWalletBalance() {
    try {
      const response = await api.get("/payment/wallet/balance");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể lấy số dư ví"
      );
    }
  }

  // Verify PayOS payment
  async verifyPayment(orderCode) {
    try {
      const response = await api.get(`/payment/verify/${orderCode}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể xác thực thanh toán"
      );
    }
  }

  // Get transaction history
  async getTransactionHistory(params = {}) {
    try {
      const response = await api.get("/payment/transactions", { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể lấy lịch sử giao dịch"
      );
    }
  }
}

const paymentService = new PaymentService();
export default paymentService;
