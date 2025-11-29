/**
 * Dispute utility functions
 */

// Status colors
export const getDisputeStatusColor = (status) => {
  const colors = {
    OPEN: 'bg-yellow-100 text-yellow-800',
    RESPONDENT_ACCEPTED: 'bg-green-100 text-green-800',
    RESPONDENT_REJECTED: 'bg-red-100 text-red-800',
    ADMIN_REVIEWING: 'bg-blue-100 text-blue-800',
    ADMIN_DECISION_MADE: 'bg-purple-100 text-purple-800',
    BOTH_ACCEPTED: 'bg-green-100 text-green-800',
    NEGOTIATION_NEEDED: 'bg-orange-100 text-orange-800',
    IN_NEGOTIATION: 'bg-indigo-100 text-indigo-800',
    NEGOTIATION_AGREED: 'bg-green-100 text-green-800',
    NEGOTIATION_FAILED: 'bg-red-100 text-red-800',
    THIRD_PARTY_ESCALATED: 'bg-purple-100 text-purple-800',
    THIRD_PARTY_EVIDENCE_UPLOADED: 'bg-blue-100 text-blue-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Status text
export const getDisputeStatusText = (status) => {
  const texts = {
    OPEN: 'Chờ phản hồi',
    RESPONDENT_ACCEPTED: 'Đã chấp nhận',
    RESPONDENT_REJECTED: 'Đã từ chối',
    ADMIN_REVIEWING: 'Admin đang xem xét',
    ADMIN_DECISION_MADE: 'Admin đã quyết định',
    BOTH_ACCEPTED: 'Cả 2 bên đồng ý',
    NEGOTIATION_NEEDED: 'Cần đàm phán',
    IN_NEGOTIATION: 'Đang đàm phán',
    NEGOTIATION_AGREED: 'Đã thỏa thuận',
    NEGOTIATION_FAILED: 'Đàm phán thất bại',
    THIRD_PARTY_ESCALATED: 'Chuyển bên thứ 3',
    THIRD_PARTY_EVIDENCE_UPLOADED: 'Đã có kết quả',
    RESOLVED: 'Đã giải quyết',
    CLOSED: 'Đã đóng'
  };
  return texts[status] || status;
};

// Type colors
export const getDisputeTypeColor = (type) => {
  const colors = {
    PRODUCT_NOT_AS_DESCRIBED: 'bg-orange-100 text-orange-800',
    MISSING_ITEMS: 'bg-red-100 text-red-800',
    DAMAGED_BY_SHIPPER: 'bg-red-100 text-red-800',
    DELIVERY_FAILED_RENTER: 'bg-yellow-100 text-yellow-800',
    PRODUCT_DEFECT: 'bg-orange-100 text-orange-800',
    DAMAGED_ON_RETURN: 'bg-red-100 text-red-800',
    LATE_RETURN: 'bg-yellow-100 text-yellow-800',
    RETURN_FAILED_OWNER: 'bg-yellow-100 text-yellow-800',
    OTHER: 'bg-gray-100 text-gray-800'
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

// Type text
export const getDisputeTypeText = (type) => {
  const texts = {
    PRODUCT_NOT_AS_DESCRIBED: 'Không đúng mô tả',
    MISSING_ITEMS: 'Thiếu hàng',
    DAMAGED_BY_SHIPPER: 'Shipper làm hỏng',
    DELIVERY_FAILED_RENTER: 'Renter không nhận hàng',
    PRODUCT_DEFECT: 'Sản phẩm lỗi',
    DAMAGED_ON_RETURN: 'Hư hỏng khi trả',
    LATE_RETURN: 'Trả hàng trễ',
    RETURN_FAILED_OWNER: 'Owner không nhận hàng',
    OTHER: 'Khác'
  };
  return texts[type] || type;
};

// Priority colors
export const getPriorityColor = (priority) => {
  const colors = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800'
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
};

// Priority text
export const getPriorityText = (priority) => {
  const texts = {
    LOW: 'Thấp',
    MEDIUM: 'Trung bình',
    HIGH: 'Cao',
    URGENT: 'Khẩn cấp'
  };
  return texts[priority] || priority;
};

// Shipment type colors
export const getShipmentTypeColor = (type) => {
  const colors = {
    DELIVERY: 'bg-blue-100 text-blue-800',
    RETURN: 'bg-green-100 text-green-800'
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

// Shipment type text
export const getShipmentTypeText = (type) => {
  const texts = {
    DELIVERY: 'Giao hàng',
    RETURN: 'Trả hàng'
  };
  return texts[type] || type;
};

// Format date
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format currency
export const formatCurrency = (amount) => {
  if (!amount) return '0đ';
  return `${amount.toLocaleString('vi-VN')}đ`;
};

// Calculate time remaining
export const getTimeRemaining = (deadline) => {
  if (!deadline) return null;
  
  const now = new Date();
  const end = new Date(deadline);
  const diff = end - now;
  
  if (diff <= 0) {
    return 'Đã hết hạn';
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days} ngày ${hours} giờ`;
  } else if (hours > 0) {
    return `${hours} giờ ${minutes} phút`;
  } else {
    return `${minutes} phút`;
  }
};

// Check if user can respond
export const canRespond = (dispute, userId) => {
  if (!dispute || !userId) return false;
  
  if (dispute.status === 'OPEN' && dispute.respondent?._id === userId) {
    return true;
  }
  
  return false;
};

// Check if user can respond to admin decision
export const canRespondToAdminDecision = (dispute, userId) => {
  if (!dispute || !userId) return false;
  
  if (dispute.status !== 'ADMIN_DECISION_MADE') return false;
  
  const isComplainant = dispute.complainant?._id === userId;
  const isRespondent = dispute.respondent?._id === userId;
  
  if (!isComplainant && !isRespondent) return false;
  
  if (isComplainant && dispute.adminDecision?.complainantAccepted !== null) return false;
  if (isRespondent && dispute.adminDecision?.respondentAccepted !== null) return false;
  
  return true;
};

// Check if user can propose agreement
export const canProposeAgreement = (dispute, userId) => {
  if (!dispute || !userId) return false;
  
  if (dispute.status !== 'IN_NEGOTIATION') return false;
  
  const isComplainant = dispute.complainant?._id === userId;
  const isRespondent = dispute.respondent?._id === userId;
  
  return isComplainant || isRespondent;
};

// Check if user can respond to agreement
export const canRespondToAgreement = (dispute, userId) => {
  if (!dispute || !userId) return false;
  
  if (dispute.status !== 'IN_NEGOTIATION') return false;
  if (!dispute.negotiationRoom?.finalAgreement?.proposedBy) return false;
  
  const isComplainant = dispute.complainant?._id === userId;
  const isRespondent = dispute.respondent?._id === userId;
  const isProposer = dispute.negotiationRoom.finalAgreement.proposedBy === userId;
  
  if (isProposer) return false; // Người đề xuất không thể respond chính mình
  
  return isComplainant || isRespondent;
};

// Check if user can upload third party evidence
export const canUploadThirdPartyEvidence = (dispute, userId) => {
  if (!dispute || !userId) return false;
  
  if (dispute.status !== 'THIRD_PARTY_ESCALATED') return false;
  if (dispute.thirdPartyResolution?.evidence?.uploadedBy) return false; // Đã upload rồi
  
  const isComplainant = dispute.complainant?._id === userId;
  const isRespondent = dispute.respondent?._id === userId;
  
  return isComplainant || isRespondent;
};

// Get dispute types for shipment type
export const getDisputeTypesForShipment = (shipmentType) => {
  if (shipmentType === 'DELIVERY') {
    return [
      { value: 'PRODUCT_NOT_AS_DESCRIBED', label: 'Sản phẩm không đúng mô tả' },
      { value: 'MISSING_ITEMS', label: 'Thiếu phụ kiện/số lượng' },
      { value: 'DAMAGED_BY_SHIPPER', label: 'Shipper làm hỏng hàng' },
      { value: 'DELIVERY_FAILED_RENTER', label: 'Người nhận không nhận hàng' }
    ];
  } else if (shipmentType === 'RETURN') {
    return [
      { value: 'DAMAGED_ON_RETURN', label: 'Sản phẩm hư hỏng khi trả' },
      { value: 'LATE_RETURN', label: 'Trả hàng trễ' },
      { value: 'RETURN_FAILED_OWNER', label: 'Owner không nhận hàng' }
    ];
  }
  return [];
};

export default {
  getDisputeStatusColor,
  getDisputeStatusText,
  getDisputeTypeColor,
  getDisputeTypeText,
  getPriorityColor,
  getPriorityText,
  getShipmentTypeColor,
  getShipmentTypeText,
  formatDate,
  formatCurrency,
  getTimeRemaining,
  canRespond,
  canRespondToAdminDecision,
  canProposeAgreement,
  canRespondToAgreement,
  canUploadThirdPartyEvidence,
  getDisputeTypesForShipment
};
