import api from './api';

const disputeService = {
  // ========== GENERAL CREATE API ==========
  
  /**
   * Tạo dispute chung (không cần subOrder)
   */
  createGeneralDispute: async (data) => {
    const response = await api.post('/disputes', data);
    return response.data;
  },

  // ========== RENTER APIs ==========
  
  /**
   * TH1, TH2: Renter từ chối nhận hàng
   */
  createDeliveryRefusal: async (data) => {
    const response = await api.post('/disputes/delivery-refusal', data);
    return response.data;
  },

  /**
   * TH4: Renter báo sản phẩm hỏng do lỗi có sẵn
   */
  createDefectiveProduct: async (data) => {
    const response = await api.post('/disputes/defective-product', data);
    return response.data;
  },

  /**
   * Upload evidence (photos/videos)
   */
  uploadEvidence: async (disputeId, data) => {
    const response = await api.post(`/disputes/${disputeId}/evidence`, data);
    return response.data;
  },

  /**
   * Lấy danh sách disputes của user
   */
  getMyDisputes: async (params = {}) => {
    const response = await api.get('/disputes/my-disputes', { params });
    return response.data;
  },

  // ========== OWNER APIs ==========

  /**
   * Owner phản hồi tranh chấp giao hàng (TH1, TH2)
   */
  ownerResponseDelivery: async (disputeId, data) => {
    const response = await api.post(`/disputes/${disputeId}/owner-response`, data);
    return response.data;
  },

  /**
   * Owner phản hồi báo lỗi sản phẩm (TH4)
   */
  ownerResponseDefect: async (disputeId, data) => {
    const response = await api.post(`/disputes/${disputeId}/defect-response`, data);
    return response.data;
  },

  // ========== SHIPPER APIs ==========

  /**
   * TH3: Shipper báo cáo làm hỏng hàng
   */
  createShipperDamage: async (data) => {
    const response = await api.post('/disputes/shipper-damage', data);
    return response.data;
  },

  /**
   * TH7: Owner không nhận trả hàng
   */
  createOwnerNotReceive: async (data) => {
    const response = await api.post('/disputes/owner-not-receive', data);
    return response.data;
  },

  /**
   * Update thông tin sửa chữa
   */
  updateRepairInfo: async (disputeId, data) => {
    const response = await api.patch(`/disputes/${disputeId}/repair`, data);
    return response.data;
  },

  // ========== ADMIN APIs ==========

  /**
   * Admin: Lấy tất cả disputes
   */
  getAllDisputes: async (params = {}) => {
    const response = await api.get('/disputes', { params });
    return response.data;
  },

  /**
   * Admin: Giải quyết dispute
   */
  adminResolve: async (disputeId, data) => {
    const response = await api.post(`/disputes/${disputeId}/resolve`, data);
    return response.data;
  },

  // ========== COMMON APIs ==========

  /**
   * Lấy chi tiết một dispute
   */
  getDisputeById: async (disputeId) => {
    const response = await api.get(`/disputes/${disputeId}`);
    return response.data;
  },

  /**
   * Check if dispute exists for subOrder
   */
  checkDisputeExists: async (subOrderId) => {
    const response = await api.get(`/disputes/check/${subOrderId}`);
    return response.data;
  }
};

export default disputeService;
