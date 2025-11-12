import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import disputeService from '../services/dispute';
import { useAuth } from '../hooks/useAuth';

// Import dispute forms
import DeliveryRefusalForm from '../components/dispute/DeliveryRefusalForm';
import DefectiveProductForm from '../components/dispute/DefectiveProductForm';
import ShipperDamageForm from '../components/dispute/ShipperDamageForm';
import DamagedReturnForm from '../components/dispute/DamagedReturnForm';
import LateReturnPenaltyForm from '../components/dispute/LateReturnPenaltyForm';
import OwnerNotReceiveForm from '../components/dispute/OwnerNotReceiveForm';
import OwnerResponseForm from '../components/dispute/OwnerResponseForm';
import OwnerResponseModal from '../components/dispute/OwnerResponseModal';
import GeneralDisputeForm from '../components/dispute/GeneralDisputeForm';

const DisputeTracking = () => {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDisputeType, setSelectedDisputeType] = useState('');
  const [showOwnerResponse, setShowOwnerResponse] = useState(false);
  const [respondingDispute, setRespondingDispute] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: ''
  });

  // Load disputes
  useEffect(() => {
    loadDisputes();
  }, [filters]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const response = await disputeService.getMyDisputes(filters);
      console.log('My Disputes Response:', response);
      
      // API response structure: { status, message, data, metadata }
      const result = response?.data || response?.metadata || {};
      console.log('Result object:', result);
      
      // Result might be { disputes: [...], total, page, ... } or just an array
      const disputesData = result?.disputes || result?.docs || (Array.isArray(result) ? result : []);
      console.log('Extracted my disputes:', disputesData);
      
      setDisputes(Array.isArray(disputesData) ? disputesData : []);
    } catch (error) {
      console.error('Error loading disputes:', error);
      toast.error('Không thể tải danh sách tranh chấp');
    } finally {
      setLoading(false);
    }
  };

  // Dispute types for creation
  const disputeTypes = [
    { value: 'DELIVERY_REFUSAL', label: 'TH1: Shipper từ chối giao hàng', icon: '🚫' },
    { value: 'DELIVERY_REFUSAL_RETURN', label: 'TH2: Shipper từ chối nhận hàng trả', icon: '↩️' },
    { value: 'SHIPPER_DAMAGE', label: 'TH3: Shipper làm hư hỏng', icon: '💔' },
    { value: 'DEFECTIVE_PRODUCT', label: 'TH4: Sản phẩm lỗi', icon: '⚠️' },
    { value: 'DAMAGED_RETURN', label: 'TH5: Trả hàng bị hư', icon: '🔨' },
    { value: 'LATE_RETURN_PENALTY', label: 'TH6: Phạt trả muộn', icon: '⏰' },
    { value: 'OWNER_NOT_RECEIVE', label: 'TH7: Chủ không nhận hàng', icon: '📦' },
    { value: 'GENERAL', label: 'Khiếu nại chung', icon: '📝' }
  ];

  // Status colors and labels
  const statusConfig = {
    PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
    OWNER_RESPONSE_REQUIRED: { label: 'Chờ chủ phản hồi', color: 'bg-orange-100 text-orange-800', icon: '💬' },
    UNDER_REVIEW: { label: 'Đang xem xét', color: 'bg-blue-100 text-blue-800', icon: '🔍' },
    RESOLVED: { label: 'Đã giải quyết', color: 'bg-green-100 text-green-800', icon: '✅' },
    REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-800', icon: '❌' }
  };

  // Render dispute form based on type
  const renderDisputeForm = () => {
    const commonProps = {
      onSuccess: () => {
        setShowCreateForm(false);
        setSelectedDisputeType('');
        loadDisputes();
      },
      onCancel: () => {
        setShowCreateForm(false);
        setSelectedDisputeType('');
      }
    };

    switch (selectedDisputeType) {
      case 'DELIVERY_REFUSAL':
      case 'DELIVERY_REFUSAL_RETURN':
        return <DeliveryRefusalForm {...commonProps} type={selectedDisputeType} />;
      case 'DEFECTIVE_PRODUCT':
        return <DefectiveProductForm {...commonProps} />;
      case 'SHIPPER_DAMAGE':
        return <ShipperDamageForm {...commonProps} />;
      case 'DAMAGED_RETURN':
        return <DamagedReturnForm {...commonProps} />;
      case 'LATE_RETURN_PENALTY':
        return <LateReturnPenaltyForm {...commonProps} />;
      case 'OWNER_NOT_RECEIVE':
        return <OwnerNotReceiveForm {...commonProps} />;
      case 'GENERAL':
        return <GeneralDisputeForm {...commonProps} />;
      default:
        return null;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format money
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⚖️ Quản Lý Tranh Chấp</h1>
          <p className="text-gray-600">Theo dõi và quản lý các tranh chấp của bạn</p>
        </div>

        {/* Actions & Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Create Button */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span className="text-xl">➕</span>
              <span>Tạo Tranh Chấp Mới</span>
            </button>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý</option>
                <option value="OWNER_RESPONSE_REQUIRED">Chờ chủ phản hồi</option>
                <option value="UNDER_REVIEW">Đang xem xét</option>
                <option value="RESOLVED">Đã giải quyết</option>
                <option value="REJECTED">Từ chối</option>
              </select>

              {/* Search */}
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
              />
            </div>
          </div>
        </div>

        {/* Dispute List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        ) : disputes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có tranh chấp nào</h3>
            <p className="text-gray-600 mb-6">Bạn chưa tạo tranh chấp nào. Tạo tranh chấp mới nếu cần hỗ trợ.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Tạo Tranh Chấp Đầu Tiên
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {disputes.map((dispute) => {
              const status = statusConfig[dispute.status] || statusConfig.PENDING;
              const disputeType = disputeTypes.find(t => t.value === dispute.type);
              
              // Debug ALL disputes and user data
              console.log('🔍 Dispute:', dispute.disputeId, {
                type: dispute.type,
                status: dispute.status,
                owner: dispute.owner,
                renter: dispute.renter,
                deadline: dispute.ownerResponseDeadline
              });
              console.log('👤 Current user:', user);
              
              // Debug owner response button visibility
              const isOwner = dispute.owner?._id?.toString() === user?.id?.toString();
              const isRightStatus = dispute.status === 'PENDING' || dispute.status === 'PENDING_OWNER_RESPONSE';
              const isRightType = dispute.type === 'WRONG_PRODUCT_DELIVERY' || dispute.type === 'MISSING_ACCESSORIES';
              const isBeforeDeadline = dispute.ownerResponseDeadline ? new Date(dispute.ownerResponseDeadline) > new Date() : true;
              
              const shouldShowOwnerResponse = isOwner && isRightStatus && isRightType && isBeforeDeadline;
              
              console.log('🔘 Button visibility check for', dispute.disputeId, {
                isOwner,
                isRightStatus,
                isRightType,
                isBeforeDeadline,
                shouldShow: shouldShowOwnerResponse
              });
              
              if (shouldShowOwnerResponse) {
                console.log('✅ Should show owner response button for dispute:', dispute.disputeId);
              }
              
              return (
                <motion.div
                  key={dispute._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{disputeType?.icon || '📝'}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {disputeType?.label || dispute.type}
                          </h3>
                          <p className="text-sm text-gray-500">ID: {dispute.disputeId}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                        <span>📅 {formatDate(dispute.createdAt)}</span>
                        {dispute.order && (
                          <span>📦 Đơn hàng: {dispute.order.orderNumber || dispute.order}</span>
                        )}
                        {dispute.reportedBy?.role && (
                          <span>👤 Người tạo: {dispute.reportedBy.role === 'RENTER' ? 'Người thuê' : 'Chủ sản phẩm'}</span>
                        )}
                      </div>

                      {dispute.description && (
                        <p className="mt-3 text-gray-700">{dispute.description}</p>
                      )}

                      {dispute.resolution && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="font-semibold text-green-900 mb-2">✅ Kết quả giải quyết:</p>
                          <p className="text-green-800">{dispute.resolution.decision}</p>
                          {dispute.resolution.reason && (
                            <p className="text-sm text-green-700 mt-1">Lý do: {dispute.resolution.reason}</p>
                          )}
                          {dispute.resolution.refundAmount > 0 && (
                            <p className="text-sm text-green-700 mt-1">
                              Hoàn tiền: {formatMoney(dispute.resolution.refundAmount)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                      
                      {/* Owner Response Deadline Warning */}
                      {isOwner && (dispute.status === 'PENDING_OWNER_RESPONSE') && dispute.ownerResponseDeadline && (
                        <div className="text-xs text-right">
                          {isBeforeDeadline ? (
                            <span className="text-orange-600 font-medium">
                              ⏰ Hạn phản hồi: {formatDate(dispute.ownerResponseDeadline)}
                            </span>
                          ) : (
                            <span className="text-red-600 font-bold">
                              ⚠️ Quá hạn phản hồi!
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Owner Response Button */}
                      {shouldShowOwnerResponse && (
                        <button
                          onClick={() => {
                            console.log('🔘 Owner response button clicked for:', dispute.disputeId);
                            setRespondingDispute(dispute);
                            setShowOwnerResponse(true);
                          }}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-sm"
                        >
                          ⚡ Phản hồi ngay
                        </button>
                      )}
                      
                      <button
                        onClick={() => setSelectedDispute(dispute)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Xem chi tiết →
                      </button>
                    </div>
                  </div>

                  {/* Evidence preview */}
                  {dispute.evidence?.length > 0 && (
                    <div className="mt-4 flex gap-2 overflow-x-auto">
                      {dispute.evidence.slice(0, 5).map((evidence, idx) => (
                        <img
                          key={idx}
                          src={evidence}
                          alt={`Evidence ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                      ))}
                      {dispute.evidence.length > 5 && (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 text-sm">
                          +{dispute.evidence.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Create Dispute Modal */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => {
                if (!selectedDisputeType) {
                  setShowCreateForm(false);
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {!selectedDisputeType ? (
                  <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Chọn loại tranh chấp</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {disputeTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setSelectedDisputeType(type.value)}
                          className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-4xl">{type.icon}</span>
                            <div>
                              <h3 className="font-semibold text-gray-900">{type.label}</h3>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8">
                    {renderDisputeForm()}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dispute Detail Modal */}
        <AnimatePresence>
          {selectedDispute && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedDispute(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Chi tiết tranh chấp</h2>
                    <button
                      onClick={() => setSelectedDispute(null)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Thông tin cơ bản</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <p><span className="font-medium">Mã tranh chấp:</span> {selectedDispute.disputeId}</p>
                        <p><span className="font-medium">Loại:</span> {disputeTypes.find(t => t.value === selectedDispute.type)?.label}</p>
                        <p><span className="font-medium">Trạng thái:</span> {statusConfig[selectedDispute.status]?.label}</p>
                        <p><span className="font-medium">Ngày tạo:</span> {formatDate(selectedDispute.createdAt)}</p>
                      </div>
                    </div>

                    {/* Description */}
                    {selectedDispute.description && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Mô tả</h3>
                        <p className="bg-gray-50 rounded-lg p-4">{selectedDispute.description}</p>
                      </div>
                    )}

                    {/* Evidence */}
                    {selectedDispute.evidence?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Bằng chứng ({selectedDispute.evidence.length})</h3>
                        <div className="grid grid-cols-3 gap-4">
                          {selectedDispute.evidence.map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`Evidence ${idx + 1}`}
                              className="w-full h-48 object-cover rounded-lg border border-gray-200"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resolution */}
                    {selectedDispute.resolution && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Kết quả giải quyết</h3>
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200 space-y-2">
                          <p><span className="font-medium">Quyết định:</span> {selectedDispute.resolution.decision}</p>
                          {selectedDispute.resolution.reason && (
                            <p><span className="font-medium">Lý do:</span> {selectedDispute.resolution.reason}</p>
                          )}
                          {selectedDispute.resolution.refundAmount > 0 && (
                            <p><span className="font-medium">Hoàn tiền:</span> {formatMoney(selectedDispute.resolution.refundAmount)}</p>
                          )}
                          {selectedDispute.resolution.penaltyAmount > 0 && (
                            <p><span className="font-medium">Phạt:</span> {formatMoney(selectedDispute.resolution.penaltyAmount)}</p>
                          )}
                          {selectedDispute.resolution.resolvedAt && (
                            <p><span className="font-medium">Ngày giải quyết:</span> {formatDate(selectedDispute.resolution.resolvedAt)}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <button
                        onClick={() => setSelectedDispute(null)}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Owner Response Modal */}
        <OwnerResponseModal
          dispute={respondingDispute}
          isOpen={showOwnerResponse}
          onClose={() => {
            setShowOwnerResponse(false);
            setRespondingDispute(null);
          }}
          onSuccess={() => {
            loadDisputes(); // Reload disputes
            setShowOwnerResponse(false);
            setRespondingDispute(null);
          }}
        />
      </div>
    </div>
  );
};

export default DisputeTracking;
