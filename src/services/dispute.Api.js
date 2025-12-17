import api from './api';

/**
 * Dispute API Service
 */
const disputeApi = {
  // ========== USER APIs ==========
  
  /**
   * Tạo dispute mới
   */
  createDispute: async (data) => {
    const response = await api.post('/disputes', data);
    return response.data;
  },

  /**
   * Lấy danh sách disputes của user
   */
  getMyDisputes: async (params = {}) => {
    const response = await api.get('/disputes/my-disputes', { params });
    return response.data;
  },

  /**
   * Lấy chi tiết dispute
   */
  getDisputeDetail: async (disputeId) => {
    const response = await api.get(`/disputes/${disputeId}`);
    return response.data;
  },

  /**
   * Respondent phản hồi dispute
   */
  respondToDispute: async (disputeId, data) => {
    const response = await api.post(`/disputes/${disputeId}/respond`, data);
    return response.data;
  },

  /**
   * Phản hồi quyết định của admin
   */
  respondToAdminDecision: async (disputeId, accepted) => {
    const response = await api.post(`/disputes/${disputeId}/admin-decision/respond`, { accepted });
    return response.data;
  },

  // ========== NEGOTIATION APIs ==========

  /**
   * Lấy thông tin negotiation room
   */
  getNegotiationRoom: async (disputeId) => {
    const response = await api.get(`/disputes/${disputeId}/negotiation`);
    return response.data;
  },

  /**
   * Đề xuất thỏa thuận
   */
  proposeAgreement: async (disputeId, data) => {
    const response = await api.post(`/disputes/${disputeId}/negotiation/propose`, data);
    return response.data;
  },

  /**
   * Phản hồi thỏa thuận
   */
  respondToAgreement: async (disputeId, accepted) => {
    const response = await api.post(`/disputes/${disputeId}/negotiation/respond`, { accepted });
    return response.data;
  },

  /**
   * Owner đưa ra quyết định cuối cùng (Renter tạo dispute DELIVERY)
   */
  submitOwnerFinalDecision: async (disputeId, data) => {
    const response = await api.post(`/disputes/${disputeId}/negotiation/owner-decision`, data);
    return response.data;
  },

  /**
   * Owner đưa ra quyết định cuối cùng (Owner tạo dispute RETURN)
   */
  submitOwnerDisputeFinalDecision: async (disputeId, data) => {
    const response = await api.post(`/disputes/${disputeId}/negotiation/owner-dispute-decision`, data);
    return response.data;
  },

  /**
   * Renter phản hồi quyết định của owner
   */
  respondToOwnerDecision: async (disputeId, accepted) => {
    const response = await api.post(`/disputes/${disputeId}/negotiation/respond-owner-decision`, { accepted });
    return response.data;
  },

  /**
   * Admin xử lý kết quả đàm phán cuối cùng
   */
  processFinalAgreement: async (disputeId, data) => {
    const response = await api.post(`/disputes/${disputeId}/admin/process-final-agreement`, data);
    return response.data;
  },

  // ========== THIRD PARTY APIs ==========

  /**
   * Lấy thông tin third party
   */
  getThirdPartyInfo: async (disputeId) => {
    const response = await api.get(`/disputes/${disputeId}/third-party`);
    return response.data;
  },

  /**
   * Upload bằng chứng third party
   */
  uploadThirdPartyEvidence: async (disputeId, data) => {
    const response = await api.post(`/disputes/${disputeId}/third-party/evidence`, data);
    return response.data;
  },

  /**
   * Upload bằng chứng từ bên thứ 3
   */
  uploadThirdPartyEvidence: async (disputeId, data) => {
    const response = await api.post(`/disputes/${disputeId}/third-party/upload-evidence`, data);
    return response.data;
  },

  // ========== ADMIN APIs ==========

  /**
   * Lấy tất cả disputes (Admin)
   */
  getAllDisputes: async (params = {}) => {
    const response = await api.get('/disputes/admin/all', { params });
    return response.data;
  },

  /**
   * Lấy thống kê (Admin)
   */
  getStatistics: async () => {
    const response = await api.get('/disputes/admin/statistics');
    return response.data;
  },

  /**
   * Admin xem xét và quyết định
   */
  adminReview: async (disputeId, data) => {
    const response = await api.post(`/disputes/${disputeId}/admin/review`, data);
    return response.data;
  },

  /**
   * Tạo negotiation room (Admin)
   */
  createNegotiationRoom: async (disputeId) => {
    const response = await api.post(`/disputes/${disputeId}/admin/negotiation/create`);
    return response.data;
  },

  /**
   * Admin chốt thỏa thuận
   */
  finalizeNegotiation: async (disputeId) => {
    const response = await api.post(`/disputes/${disputeId}/admin/negotiation/finalize`);
    return response.data;
  },

  /**
   * Kiểm tra negotiation timeout (Admin)
   */
  checkNegotiationTimeout: async (disputeId) => {
    const response = await api.post(`/disputes/${disputeId}/admin/negotiation/check-timeout`);
    return response.data;
  },

  /**
   * Chuyển third party (User)
   */
  escalateToThirdParty: async (disputeId, data) => {
    const response = await api.post(`/disputes/${disputeId}/escalate-third-party`, data);
    return response.data;
  },

  /**
   * Quyết định cuối từ third party (Admin)
   */
  makeFinalDecision: async (disputeId, data) => {
    const response = await api.post(`/disputes/${disputeId}/admin/third-party/final-decision`, data);
    return response.data;
  },

  /**
   * Admin từ chối bằng chứng bên thứ 3
   */
  adminRejectThirdPartyEvidence: async (disputeId, data) => {
    const response = await api.post(`/disputes/${disputeId}/admin/third-party/reject-evidence`, data);
    return response.data;
  },

  /**
   * Admin chia sẻ thông tin shipper cho cả hai bên
   */
  shareShipperInfo: async (disputeId) => {
    const response = await api.post(`/disputes/${disputeId}/admin/share-shipper-info`);
    return response.data;
  },

  /**
   * Cập nhật priority (Admin)
   */
  updatePriority: async (disputeId, priority) => {
    const response = await api.patch(`/disputes/${disputeId}/admin/priority`, { priority });
    return response.data;
  },

  /**
   * Assign admin (Admin)
   */
  assignAdmin: async (disputeId, adminId) => {
    const response = await api.patch(`/disputes/${disputeId}/admin/assign`, { adminId });
    return response.data;
  },

  /**
   * Lấy tất cả disputes (Admin)
   */
  adminGetAllDisputes: async (params = {}) => {
    const response = await api.get('/disputes/admin/all', { params });
    return response.data;
  },

  /**
   * Lấy thống kê disputes (Admin)
   */
  adminGetStatistics: async () => {
    const response = await api.get('/disputes/admin/statistics');
    return response.data;
  },

  // ========== RESCHEDULE APIs (RENTER_NO_RETURN) ==========

  /**
   * Renter đề xuất reschedule
   */
  proposeReschedule: async (disputeId, data) => {
    const response = await api.post(`/disputes/${disputeId}/reschedule/propose`, data);
    return response.data;
  },

  /**
   * Owner phản hồi reschedule request
   */
  respondToReschedule: async (disputeId, data) => {
    const response = await api.post(`/disputes/${disputeId}/reschedule/respond`, data);
    return response.data;
  },

  /**
   * Finalize reschedule agreement - Xác nhận ngày trả hàng đã thỏa thuận
   */
  finalizeRescheduleAgreement: async (disputeId, agreedDate) => {
    const response = await api.post(`/disputes/${disputeId}/finalize-agreement`, { agreedDate });
    return response.data;
  },

  /**
   * Xử lý penalty cho RENTER_NO_RETURN
   */
  processRenterNoReturn: async (disputeId, data) => {
    const response = await api.post(`/disputes/${disputeId}/process-renter-no-return`, data);
    return response.data;
  }
};

export default disputeApi;
