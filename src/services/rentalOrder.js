import api from "./api.js";

/**
 * Service for Rental Order operations
 */
class RentalOrderService {
  // Bước 1: Tạo đơn thuê từ giỏ hàng
  async createDraftOrder(orderData) {
    try {
      console.log(
        "📤 Sending order data to backend:",
        JSON.stringify(orderData, null, 2)
      );
      const response = await api.post("/rental-orders/create-draft", orderData);
      console.log("✅ Backend response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Backend error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || "Không thể tạo đơn thuê"
      );
    }
  }

  // Bước 2: Xác nhận đơn hàng
  async confirmOrder(masterOrderId) {
    try {
      const response = await api.post(
        `/rental-orders/${masterOrderId}/confirm`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể xác nhận đơn hàng"
      );
    }
  }

  // Bước 3: Thanh toán
  async processPayment(masterOrderId, paymentData) {
    try {
      const response = await api.post(
        `/rental-orders/${masterOrderId}/payment`,
        paymentData
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Thanh toán thất bại");
    }
  }

  // Bước 4: Chủ xác nhận đơn hàng
  async ownerConfirmOrder(subOrderId, confirmationData) {
    try {
      const response = await api.post(
        `/rental-orders/sub-orders/${subOrderId}/owner-confirm`,
        confirmationData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể xác nhận đơn hàng"
      );
    }
  }

  // Bước 5: Tạo hợp đồng
  async generateContracts(masterOrderId) {
    try {
      const response = await api.post(
        `/rental-orders/${masterOrderId}/generate-contracts`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể tạo hợp đồng"
      );
    }
  }

  // Bước 6: Ký hợp đồng
  async signContract(contractId, signatureData) {
    try {
      const response = await api.post(
        `/rental-orders/contracts/${contractId}/sign`,
        signatureData
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Không thể ký hợp đồng");
    }
  }

  // Lấy đơn hàng của người thuê
  async getMyOrders(params = {}) {
    try {
      const response = await api.get("/rental-orders/my-orders", { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể lấy danh sách đơn hàng"
      );
    }
  }

  // Lấy đơn hàng của chủ cho thuê
  async getOwnerOrders(params = {}) {
    try {
      const response = await api.get("/rental-orders/owner-orders", { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể lấy danh sách đơn hàng"
      );
    }
  }

  // Lấy chi tiết đơn hàng
  async getOrderDetail(masterOrderId) {
    try {
      const response = await api.get(`/rental-orders/${masterOrderId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể lấy chi tiết đơn hàng"
      );
    }
  }

  // Hủy đơn hàng
  async cancelOrder(masterOrderId, reason) {
    try {
      const response = await api.put(`/rental-orders/${masterOrderId}/cancel`, {
        reason,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể hủy đơn hàng"
      );
    }
  }

  // Lấy danh sách hợp đồng
  async getContracts(params = {}) {
    try {
      const response = await api.get("/rental-orders/contracts", { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể lấy danh sách hợp đồng"
      );
    }
  }

  // Tính phí ship
  async calculateShipping(shippingData) {
    try {
      const response = await api.post(
        "/rental-orders/calculate-shipping",
        shippingData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể tính phí ship"
      );
    }
  }
}

export default new RentalOrderService();
