import React, { createContext, useContext, useState, useCallback } from 'react';
import disputeApi from '../services/dispute.Api';
import { toast } from 'react-hot-toast';

const DisputeContext = createContext();

export const useDispute = () => {
  const context = useContext(DisputeContext);
  if (!context) {
    throw new Error('useDispute must be used within DisputeProvider');
  }
  return context;
};

export const DisputeProvider = ({ children }) => {
  const [disputes, setDisputes] = useState([]);
  const [currentDispute, setCurrentDispute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);

  // Load disputes của user
  const loadMyDisputes = useCallback(async (filters = {}) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.getMyDisputes(filters);
      setDisputes(response.data?.disputes || []);
      return response.data?.disputes;
    } catch (error) {
      console.error('❌ Load disputes error:', error);
      toast.error(error.response?.data?.message || 'Không thể tải danh sách disputes');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load chi tiết dispute
  const loadDisputeDetail = useCallback(async (disputeId) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.getDisputeDetail(disputeId);
      setCurrentDispute(response.data?.dispute);
      return response.data?.dispute;
    } catch (error) {
      console.error('Load dispute detail error:', error);
      toast.error(error.response?.data?.message || 'Không thể tải chi tiết dispute');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Tạo dispute mới
  const createDispute = useCallback(async (data) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.createDispute(data);
      return response.data?.dispute;
    } catch (error) {
      console.error('Create dispute error:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo dispute');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Respondent phản hồi dispute
  const respondToDispute = useCallback(async (disputeId, data) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.respondToDispute(disputeId, data);
      toast.success(response.message || 'Phản hồi thành công');
      await loadDisputeDetail(disputeId); // Reload detail
      return response.data?.dispute;
    } catch (error) {
      console.error('Respond to dispute error:', error);
      toast.error(error.response?.data?.message || 'Không thể phản hồi dispute');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail]);

  // Phản hồi quyết định admin
  const respondToAdminDecision = useCallback(async (disputeId, accepted) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.respondToAdminDecision(disputeId, accepted);
      toast.success(response.message || 'Phản hồi thành công');
      await loadDisputeDetail(disputeId);
      return response.data?.dispute;
    } catch (error) {
      console.error('Respond to admin decision error:', error);
      toast.error(error.response?.data?.message || 'Không thể phản hồi');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail]);

  // Đề xuất thỏa thuận
  const proposeAgreement = useCallback(async (disputeId, data) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.proposeAgreement(disputeId, data);
      toast.success('Đã đề xuất thỏa thuận');
      await loadDisputeDetail(disputeId);
      return response.data?.dispute;
    } catch (error) {
      console.error('Propose agreement error:', error);
      toast.error(error.response?.data?.message || 'Không thể đề xuất thỏa thuận');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail]);

  // Phản hồi thỏa thuận
  const respondToAgreement = useCallback(async (disputeId, accepted) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.respondToAgreement(disputeId, accepted);
      toast.success(response.message || 'Phản hồi thành công');
      await loadDisputeDetail(disputeId);
      return response.data?.dispute;
    } catch (error) {
      console.error('Respond to agreement error:', error);
      toast.error(error.response?.data?.message || 'Không thể phản hồi thỏa thuận');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail]);

  // Owner đưa ra quyết định cuối cùng
  const submitOwnerFinalDecision = useCallback(async (disputeId, data) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.submitOwnerFinalDecision(disputeId, data);
      toast.success(response.message || 'Đã đưa ra quyết định cuối cùng');
      await loadDisputeDetail(disputeId);
      return response.data?.dispute;
    } catch (error) {
      console.error('Submit owner final decision error:', error);
      toast.error(error.response?.data?.message || 'Không thể gửi quyết định cuối cùng');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail, currentDispute]);

  // Owner đưa ra quyết định cuối cùng khi Owner tạo dispute RETURN
  const submitOwnerDisputeFinalDecision = useCallback(async (disputeId, data) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.submitOwnerDisputeFinalDecision(disputeId, data);
      toast.success(response.message || 'Đã đưa ra quyết định cuối cùng');
      await loadDisputeDetail(disputeId);
      return response.data?.dispute;
    } catch (error) {
      console.error('Submit owner dispute final decision error:', error);
      toast.error(error.response?.data?.message || 'Không thể gửi quyết định cuối cùng');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail]);

  // Renter phản hồi quyết định của owner
  const respondToOwnerDecision = useCallback(async (disputeId, accepted) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.respondToOwnerDecision(disputeId, accepted);
      toast.success(response.message || 'Phản hồi thành công');
      await loadDisputeDetail(disputeId);
      return response.data?.dispute;
    } catch (error) {
      console.error('Respond to owner decision error:', error);
      toast.error(error.response?.data?.message || 'Không thể phản hồi quyết định');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail]);

  // Admin xử lý kết quả đàm phán cuối cùng
  const processFinalAgreement = useCallback(async (disputeId, data) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.processFinalAgreement(disputeId, data);
      toast.success(response.message || 'Xử lý kết quả đàm phán thành công');
      await loadDisputeDetail(disputeId);
      return response.data?.dispute;
    } catch (error) {
      console.error('Process final agreement error:', error);
      toast.error(error.response?.data?.message || 'Không thể xử lý kết quả đàm phán');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail]);

  // Admin chia sẻ thông tin shipper cho cả hai bên
  const shareShipperInfo = useCallback(async (disputeId) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.shareShipperInfo(disputeId);
      toast.success(response.message || 'Chia sẻ thông tin shipper thành công');
      await loadDisputeDetail(disputeId);
      return response.data?.dispute;
    } catch (error) {
      console.error('Share shipper info error:', error);
      toast.error(error.response?.data?.message || 'Không thể chia sẻ thông tin shipper');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail]);

  // Upload evidence third party
  const uploadThirdPartyEvidence = useCallback(async (disputeId, data) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.uploadThirdPartyEvidence(disputeId, data);
      toast.success('Upload bằng chứng thành công');
      await loadDisputeDetail(disputeId);
      return response.data?.dispute;
    } catch (error) {
      console.error('Upload evidence error:', error);
      toast.error(error.response?.data?.message || 'Không thể upload bằng chứng');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail]);

  // Admin: Load all disputes
  const loadAllDisputes = useCallback(async (filters = {}) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.getAllDisputes(filters);
      setDisputes(response.disputes || []);
      return response.disputes;
    } catch (error) {
      console.error('Load all disputes error:', error);
      toast.error(error.response?.data?.message || 'Không thể tải disputes');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Admin: Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const response = await disputeApi.getStatistics();
      setStatistics(response.statistics);
      return response.statistics;
    } catch (error) {
      console.error('Load statistics error:', error);
      toast.error(error.response?.data?.message || 'Không thể tải thống kê');
      return null;
    }
  }, []);

  // Admin: Review dispute
  const adminReview = useCallback(async (disputeId, data) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.adminReview(disputeId, data);
      toast.success('Đã đưa ra quyết định');
      await loadDisputeDetail(disputeId);
      return response.dispute;
    } catch (error) {
      console.error('Admin review error:', error);
      toast.error(error.response?.data?.message || 'Không thể xem xét dispute');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail]);

  // Admin: Create negotiation room
  const createNegotiationRoom = useCallback(async (disputeId) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.createNegotiationRoom(disputeId);
      toast.success('Đã tạo phòng đàm phán');
      await loadDisputeDetail(disputeId);
      return response.dispute;
    } catch (error) {
      console.error('Create negotiation room error:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo phòng đàm phán');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail]);

  // Admin: Finalize negotiation
  const finalizeNegotiation = useCallback(async (disputeId) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.finalizeNegotiation(disputeId);
      toast.success('Đã chốt thỏa thuận');
      await loadDisputeDetail(disputeId);
      return response.dispute;
    } catch (error) {
      console.error('Finalize negotiation error:', error);
      toast.error(error.response?.data?.message || 'Không thể chốt thỏa thuận');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail]);

  // Admin: Escalate to third party
  const escalateToThirdParty = useCallback(async (disputeId, data) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.escalateToThirdParty(disputeId, data);
      toast.success('Đã chuyển sang bên thứ 3');
      await loadDisputeDetail(disputeId);
      return response.dispute;
    } catch (error) {
      console.error('Escalate to third party error:', error);
      toast.error(error.response?.data?.message || 'Không thể chuyển bên thứ 3');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail]);

  // Admin: Make final decision
  const makeFinalDecision = useCallback(async (disputeId, data) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.makeFinalDecision(disputeId, data);
      toast.success('Đã đưa ra quyết định cuối cùng');
      await loadDisputeDetail(disputeId);
      return response.dispute;
    } catch (error) {
      console.error('Make final decision error:', error);
      toast.error(error.response?.data?.message || 'Không thể đưa ra quyết định');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail]);

  // Renter đề xuất reschedule
  const proposeReschedule = useCallback(async (disputeId, data) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.proposeReschedule(disputeId, data);
      toast.success('Đã gửi đề xuất reschedule');
      await loadDisputeDetail(disputeId);
      return response.data?.dispute;
    } catch (error) {
      console.error('Propose reschedule error:', error);
      toast.error(error.response?.data?.message || 'Không thể gửi đề xuất reschedule');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail]);

  // Owner phản hồi reschedule
  const respondToReschedule = useCallback(async (disputeId, data) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.respondToReschedule(disputeId, data);
      toast.success(response.message || 'Phản hồi thành công');
      await loadDisputeDetail(disputeId);
      return response.data?.dispute;
    } catch (error) {
      console.error('Respond to reschedule error:', error);
      toast.error(error.response?.data?.message || 'Không thể phản hồi reschedule');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail]);

  // Finalize reschedule agreement - Xác nhận ngày trả hàng đã thỏa thuận
  const finalizeRescheduleAgreement = useCallback(async (disputeId, agreedDate) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.finalizeRescheduleAgreement(disputeId, agreedDate);
      toast.success(response.message || 'Đã thỏa thuận ngày trả hàng thành công');
      await loadDisputeDetail(disputeId);
      return response.data?.dispute;
    } catch (error) {
      console.error('Finalize reschedule agreement error:', error);
      toast.error(error.response?.data?.message || 'Không thể hoàn tất thỏa thuận');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail]);

  // Xử lý penalty RENTER_NO_RETURN
  const processRenterNoReturn = useCallback(async (disputeId, data) => {
    try {
      setIsLoading(true);
      const response = await disputeApi.processRenterNoReturn(disputeId, data);
      toast.success('Đã xử lý penalty');
      await loadDisputeDetail(disputeId);
      return response.data?.dispute;
    } catch (error) {
      console.error('Process renter no return error:', error);
      toast.error(error.response?.data?.message || 'Không thể xử lý penalty');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDisputeDetail]);

  const value = {
    disputes,
    currentDispute,
    isLoading,
    statistics,
    setCurrentDispute,
    
    // User actions
    loadMyDisputes,
    loadDisputeDetail,
    createDispute,
    respondToDispute,
    respondToAdminDecision,
    proposeAgreement,
    respondToAgreement,
    submitOwnerFinalDecision,
    submitOwnerDisputeFinalDecision,
    respondToOwnerDecision,
    processFinalAgreement,
    shareShipperInfo,
    uploadThirdPartyEvidence,
    
    // Reschedule actions (RENTER_NO_RETURN)
    proposeReschedule,
    respondToReschedule,
    finalizeRescheduleAgreement,
    processRenterNoReturn,
    
    // Admin actions
    loadAllDisputes,
    loadStatistics,
    adminReview,
    createNegotiationRoom,
    finalizeNegotiation,
    escalateToThirdParty,
    makeFinalDecision
  };

  return (
    <DisputeContext.Provider value={value}>
      {children}
    </DisputeContext.Provider>
  );
};
