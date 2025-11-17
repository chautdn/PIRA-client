import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import disputeService from '../../services/dispute';
import DeliveryDisputeResolveModal from '../../components/admin/DeliveryDisputeResolveModal';
import BoomDisputeResolveModal from '../../components/admin/BoomDisputeResolveModal';

const DisputeManagement = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: ''
  });
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveData, setResolveData] = useState({
    decision: '',
    reason: '',
    refundAmount: 0,
    penaltyAmount: 0
  });

  // Helper to get user name from different name formats
  const getUserName = (user) => {
    if (!user) return 'N/A';
    if (user.profile?.fullName) return user.profile.fullName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.email) return user.email.split('@')[0];
    return 'N/A';
  };

  const disputeTypes = {
    'DELIVERY_REFUSAL': 'Shipper từ chối giao',
    'DELIVERY_REFUSAL_RETURN': 'Shipper từ chối nhận trả',
    'DELIVERY_BOOM': '🚫 Renter không nhận hàng (Boom)',
    'WRONG_PRODUCT_DELIVERY': 'Giao sai sản phẩm',
    'MISSING_ACCESSORIES': 'Thiếu phụ kiện',
    'SHIPPER_DAMAGE': 'Shipper làm hỏng',
    'DEFECTIVE_PRODUCT': 'Sản phẩm lỗi',
    'DAMAGED_RETURN': 'Trả hàng bị hư',
    'LATE_RETURN_PENALTY': 'Phạt trả muộn',
    'OWNER_NOT_RECEIVE': 'Owner không nhận hàng',
    'GENERAL': 'Khiếu nại chung',
    'OTHER': 'Khác'
  };

  const disputeStatuses = {
    'PENDING': { label: 'Chờ xử lý', color: 'yellow' },
    'OWNER_RESPONSE_REQUIRED': { label: 'Chờ Owner phản hồi', color: 'orange' },
    'PENDING_OWNER_RESPONSE': { label: 'Chờ Owner', color: 'yellow' },
    'PENDING_ADMIN_REVIEW': { label: 'Chờ Admin', color: 'orange' },
    'UNDER_REVIEW': { label: 'Đang xem xét', color: 'blue' },
    'IN_REVIEW': { label: 'Đang xử lý', color: 'blue' },
    'RESOLVED': { label: 'Đã giải quyết', color: 'green' },
    'REJECTED': { label: 'Từ chối', color: 'red' },
    'CLOSED': { label: 'Đã đóng', color: 'gray' }
  };

  useEffect(() => {
    loadDisputes();
  }, [filters]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const response = await disputeService.getAllDisputes(filters);
      console.log('Admin Disputes Response:', response);
      console.log('Full response structure:', JSON.stringify(response, null, 2));
      
      // API response structure: { status, message, data, metadata }
      // data and metadata contain the same result object
      const result = response?.data || response?.metadata || {};
      console.log('Result object:', result);
      console.log('Result keys:', Object.keys(result));
      console.log('Result.disputes:', result?.disputes);
      console.log('Result.pagination:', result?.pagination);
      
      // Result might be { disputes: [...], total, page, ... } or just an array
      const disputesData = result?.disputes || result?.docs || (Array.isArray(result) ? result : []);
      console.log('Extracted disputes:', disputesData);
      console.log('Disputes count:', disputesData?.length);
      
      setDisputes(Array.isArray(disputesData) ? disputesData : []);
    } catch (error) {
      console.error('Error loading disputes:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Không thể tải danh sách tranh chấp');
      // Mock data for testing
      setDisputes([
        {
          _id: '1',
          disputeId: 'DIS001',
          type: 'DEFECTIVE_PRODUCT',
          status: 'PENDING_ADMIN_REVIEW',
          title: 'Sản phẩm bị lỗi khi nhận',
          description: 'Laptop bị vỡ màn hình',
          renter: { name: 'Nguyễn Văn A', email: 'a@test.com' },
          owner: { name: 'Trần Văn B', email: 'b@test.com' },
          subOrder: { orderCode: 'ORD123' },
          createdAt: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (customData) => {
    // If called from specialized modal (TH1,2), use custom data
    // If called from generic modal, use resolveData state
    const dataToSend = customData || resolveData;

    if (!dataToSend.decision) {
      toast.error('Vui lòng chọn quyết định');
      return;
    }

    if (!dataToSend.reason || dataToSend.reason.length < 20) {
      toast.error('Vui lòng nhập lý do (ít nhất 20 ký tự)');
      return;
    }

    try {
      await disputeService.adminResolve(selectedDispute._id, dataToSend);
      toast.success('Đã giải quyết tranh chấp thành công');
      setShowResolveModal(false);
      setResolveData({
        decision: '',
        reason: '',
        refundAmount: 0,
        penaltyAmount: 0
      });
      loadDisputes();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
      throw error; // Re-throw for specialized modal to handle
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      yellow: 'bg-yellow-100 text-yellow-800',
      orange: 'bg-orange-100 text-orange-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return colors[disputeStatuses[status]?.color] || colors.gray;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Tranh chấp</h1>
          <p className="text-gray-600">Xem và giải quyết các tranh chấp</p>
        </div>
        <button
          onClick={loadDisputes}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              {Object.entries(disputeStatuses).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại tranh chấp</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              {Object.entries(disputeTypes).map(([key, val]) => (
                <option key={key} value={key}>{val}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Mã dispute, email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Disputes List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : disputes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">Không có tranh chấp nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <motion.div
              key={dispute._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        #{dispute.disputeId}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>
                        {disputeStatuses[dispute.status]?.label}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {disputeTypes[dispute.type]}
                      </span>
                    </div>
                    {dispute.title && <p className="text-gray-900 font-medium mb-1">{dispute.title}</p>}
                    <p className="text-sm text-gray-600 mb-3">
                      {dispute.description ? 
                        (dispute.description.length > 150 ? dispute.description.substring(0, 150) + '...' : dispute.description)
                        : 'Không có mô tả'}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Người báo cáo:</span>
                        <p className="font-medium">
                          {getUserName(dispute.reportedBy || dispute.renter)}
                          <span className="text-xs text-gray-500 ml-1">
                            ({(dispute.reportedBy || dispute.renter)?.role || ''})
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Bị báo cáo:</span>
                        <p className="font-medium">
                          {getUserName(dispute.reportedAgainst || dispute.owner)}
                          <span className="text-xs text-gray-500 ml-1">
                            ({(dispute.reportedAgainst || dispute.owner)?.role || ''})
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Mã đơn:</span>
                        <p className="font-medium">{dispute.subOrder?.orderCode || dispute.order?.orderCode || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Ngày tạo:</span>
                        <p className="font-medium">{new Date(dispute.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      console.log('🔍 [DisputeManagement] Selected dispute:', dispute);
                      console.log('🔍 [DisputeManagement] Dispute type:', dispute.type);
                      console.log('🔍 [DisputeManagement] Is TH1/TH2?', ['WRONG_PRODUCT_DELIVERY', 'MISSING_ACCESSORIES'].includes(dispute.type));
                      setSelectedDispute(dispute);
                      setShowResolveModal(true);
                    }}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Xem & Xử lý
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Resolve Modal - Conditional rendering based on dispute type */}
      {showResolveModal && selectedDispute && (
        <>
          {/* DELIVERY_BOOM: Boom Orders - Use BoomDisputeResolveModal */}
          {selectedDispute.type === 'DELIVERY_BOOM' ? (
            <BoomDisputeResolveModal
              dispute={selectedDispute}
              onResolve={handleResolve}
              onClose={() => setShowResolveModal(false)}
            />
          ) : (
            /* TH1, TH2: Delivery Disputes - Use specialized modal */
            ['DELIVERY_REFUSAL', 'DELIVERY_REFUSAL_RETURN', 'WRONG_PRODUCT_DELIVERY', 'MISSING_ACCESSORIES'].includes(selectedDispute.type) ? (
              <DeliveryDisputeResolveModal
                dispute={selectedDispute}
                onResolve={handleResolve}
                onClose={() => setShowResolveModal(false)}
              />
            ) : (
            /* Generic Resolve Modal for other dispute types */
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Giải quyết tranh chấp #{selectedDispute.disputeId}
                    </h2>
                    <button
                      onClick={() => setShowResolveModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

              {/* Dispute Details */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Thông tin tranh chấp</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Loại:</span> {disputeTypes[selectedDispute.type]}</p>
                  <p><span className="font-medium">Mô tả:</span> {selectedDispute.description}</p>
                  <p><span className="font-medium">Khách thuê:</span> {selectedDispute.renter?.name} ({selectedDispute.renter?.email})</p>
                  <p><span className="font-medium">Owner:</span> {selectedDispute.owner?.name} ({selectedDispute.owner?.email})</p>
                </div>
              </div>

              {/* Resolution Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quyết định <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={resolveData.decision}
                    onChange={(e) => setResolveData({ ...resolveData, decision: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn quyết định --</option>
                    <option value="RENTER_WIN">Khách thuê đúng</option>
                    <option value="OWNER_WIN">Owner đúng</option>
                    <option value="PARTIAL_REFUND">Hoàn một phần</option>
                    <option value="REJECT">Từ chối tranh chấp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do quyết định <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={resolveData.reason}
                    onChange={(e) => setResolveData({ ...resolveData, reason: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Giải thích chi tiết lý do quyết định..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Tối thiểu 20 ký tự</p>
                </div>

                {resolveData.decision && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số tiền hoàn (VND)
                      </label>
                      <input
                        type="number"
                        value={resolveData.refundAmount}
                        onChange={(e) => setResolveData({ ...resolveData, refundAmount: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số tiền phạt (VND)
                      </label>
                      <input
                        type="number"
                        value={resolveData.penaltyAmount}
                        onChange={(e) => setResolveData({ ...resolveData, penaltyAmount: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Quyết định này sẽ ảnh hưởng đến điểm tín dụng và ví của các bên liên quan. Hãy xem xét kỹ!
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleResolve}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Xác nhận giải quyết
                </button>
              </div>
            </div>
          </motion.div>
        </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default DisputeManagement;
