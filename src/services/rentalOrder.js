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

  // Bước 1b: Tạo đơn thuê với thanh toán (renter pays upfront)
  async createPaidOrder(orderData) {
    try {
      console.log(
        "📤 Sending paid order data to backend:",
        JSON.stringify(orderData, null, 2)
      );
      const response = await api.post("/rental-orders/create-paid", orderData);
      console.log("✅ Backend response for paid order:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Backend error for paid order:",
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message || "Không thể tạo đơn thuê với thanh toán"
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

  // Cập nhật phương thức thanh toán
  async updatePaymentMethod(masterOrderId, paymentMethod) {
    try {
      const response = await api.put(
        `/rental-orders/${masterOrderId}/payment-method`,
        { paymentMethod }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Không thể cập nhật phương thức thanh toán"
      );
    }
  }

  // Ký hợp đồng
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

  // Tính phí ship chi tiết cho từng product
  async calculateProductShipping(shippingData) {
    try {
      const response = await api.post(
        "/rental-orders/calculate-product-shipping",
        shippingData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể tính phí ship cho sản phẩm"
      );
    }
  }

  // Cập nhật phí ship cho SubOrder
  async updateSubOrderShipping(subOrderId, shippingData) {
    try {
      const response = await api.put(
        `/rental-orders/suborders/${subOrderId}/shipping`,
        shippingData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể cập nhật phí ship"
      );
    }
  }

  // Lấy danh sách sản phẩm đang được thuê (active rentals) cho chủ sản phẩm
  async getOwnerActiveRentals(params = {}) {
    try {
      const response = await api.get("/rental-orders/owner-active-rentals", {
        params,
      });
      console.log("✅ Owner active rentals response:", response.data);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Không thể lấy danh sách sản phẩm đang cho thuê"
      );
    }
  }

  // Calculate deposit for current cart
  async calculateDeposit() {
    try {
      console.log("📤 Calculating deposit from cart...");
      const response = await api.get("/rental-orders/calculate-deposit");
      console.log("✅ Deposit calculation response:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Deposit calculation error:",
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message || "Không thể tính toán tiền cọc"
      );
    }
  }

  // Get product availability calendar
  async getProductAvailabilityCalendar(productId, startDate, endDate) {
    try {
      console.log(
        `📤 Getting availability calendar for product ${productId}...`
      );
      console.log(`📅 Date range: ${startDate} to ${endDate}`);

      const response = await api.get(
        `/rental-orders/products/${productId}/availability-calendar`,
        {
          params: { startDate, endDate },
        }
      );

      console.log("✅ Availability calendar response:", response.data);
      console.log("🔍 Response structure check:", {
        status: response.data.status,
        hasData: !!response.data.data,
        hasMetadata: !!response.data.data?.metadata,
        hasCalendar: !!response.data.data?.metadata?.calendar,
        calendarLength: response.data.data?.metadata?.calendar?.length,
      });

      return response.data;
    } catch (error) {
      console.error(
        "❌ Availability calendar error:",
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message || "Không thể lấy lịch availability"
      );
    }
  }

  // ============================================================================
  // PARTIAL CONFIRMATION APIs (Xác nhận một phần)
  // ============================================================================

  /**
   * Owner xác nhận một phần sản phẩm trong SubOrder
   * @param {string} subOrderId - ID của SubOrder
   * @param {string[]} confirmedProductIds - Mảng _id của các product item được xác nhận
   */
  async partialConfirmSubOrder(subOrderId, confirmedProductIds) {
    try {
      console.log("📤 Partial confirm SubOrder:", {
        subOrderId,
        confirmedProductIds,
      });
      const response = await api.post(
        `/rental-orders/suborders/${subOrderId}/partial-confirm`,
        { confirmedProductIds }
      );
      console.log("✅ Partial confirm response:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Partial confirm error:",
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message || "Không thể xác nhận đơn hàng"
      );
    }
  }

  /**
   * Lấy danh sách SubOrder cần xác nhận của owner
   * @param {number} page - Trang hiện tại
   * @param {number} limit - Số lượng items per page
   */
  async getOwnerPendingConfirmation(page = 1, limit = 10) {
    try {
      const response = await api.get(
        `/rental-orders/owner/pending-confirmation?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể lấy danh sách đơn hàng"
      );
    }
  }

  /**
   * Lấy chi tiết SubOrder để owner xác nhận
   * @param {string} subOrderId - ID của SubOrder
   */
  async getSubOrderForConfirmation(subOrderId) {
    try {
      const response = await api.get(
        `/rental-orders/suborders/${subOrderId}/for-confirmation`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể lấy chi tiết đơn hàng"
      );
    }
  }

  /**
   * Lấy tổng quan confirmation của MasterOrder (cho renter)
   * @param {string} masterOrderId - ID của MasterOrder
   */
  async getConfirmationSummary(masterOrderId) {
    try {
      const response = await api.get(
        `/rental-orders/${masterOrderId}/confirmation-summary`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể lấy tổng quan xác nhận"
      );
    }
  }

  /**
   * Renter từ chối SubOrder đã được partial confirm và yêu cầu hoàn tiền
   * @param {string} subOrderId - ID của SubOrder
   * @param {object} data - { reason: string }
   */
  async renterRejectSubOrder(subOrderId, data) {
    try {
      const response = await api.post(
        `/rental-orders/suborders/${subOrderId}/renter-reject`,
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể từ chối SubOrder"
      );
    }
  }

  /**
   * Lấy chi tiết hợp đồng
   * @param {string} contractId - ID của hợp đồng
   */
  async getContractDetail(contractId) {
    try {
      const response = await api.get(`/rental-orders/contracts/${contractId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể lấy chi tiết hợp đồng"
      );
    }
  }

  /**
   * Ký hợp đồng
   * @param {string} contractId - ID của hợp đồng
   * @param {object} signData - { signature, agreementConfirmed, signatureMethod }
   */
  async signContract(contractId, signData) {
    try {
      const response = await api.post(
        `/rental-orders/contracts/${contractId}/sign`,
        signData
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Không thể ký hợp đồng");
    }
  }
}

export default new RentalOrderService();
