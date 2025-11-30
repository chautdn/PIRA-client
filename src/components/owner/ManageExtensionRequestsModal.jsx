import React, { useState, useEffect } from 'react';
import { X, Check, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import extensionApi from '../../services/extension.Api';
import { formatCurrency } from '../../utils/constants';

const ManageExtensionRequestsModal = ({ isOpen, onClose, onSuccess }) => {
  const [extensionRequests, setExtensionRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchExtensionRequests();
    }
  }, [isOpen]);

  const fetchExtensionRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/extensions/owner-requests?status=PENDING');
      
      const requests = response.data?.metadata?.requests || response.data?.data || [];
      setExtensionRequests(requests);
    } catch (error) {
      console.error('Error fetching extension requests:', error);
      toast.error('Không thể tải danh sách yêu cầu gia hạn');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveExtension = async (requestId) => {
    try {
      setSubmitting(true);
      await api.put(`/extensions/${requestId}/approve`);
      
      toast.success('✅ Đã xác nhận yêu cầu gia hạn');
      setShowDetailModal(false);
      setSelectedRequest(null);
      fetchExtensionRequests();
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Error approving extension:', error);
      toast.error(error.response?.data?.message || 'Không thể xác nhận yêu cầu gia hạn');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectExtension = async () => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setSubmitting(true);
      await api.put(`/extensions/${selectedRequest._id}/reject`, {
        rejectionReason: rejectReason
      });
      
      toast.success('✅ Đã từ chối yêu cầu gia hạn');
      setShowRejectModal(false);
      setRejectReason('');
      setShowDetailModal(false);
      setSelectedRequest(null);
      fetchExtensionRequests();
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Error rejecting extension:', error);
      toast.error(error.response?.data?.message || 'Không thể từ chối yêu cầu gia hạn');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateExtendDays = (currentEndDate, newEndDate) => {
    const current = new Date(currentEndDate);
    const target = new Date(newEndDate);
    const diffTime = Math.abs(target - current);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">📅 Quản lí Yêu cầu Gia hạn</h2>
              <p className="text-orange-100 mt-1">Danh sách yêu cầu gia hạn từ người thuê</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : extensionRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Không có yêu cầu gia hạn</h3>
              <p className="text-gray-600">Hiện chưa có yêu cầu gia hạn nào từ người thuê</p>
            </div>
          ) : (
            <div className="space-y-4">
              {extensionRequests.map((request) => (
                <div
                  key={request._id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-orange-400 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowDetailModal(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-bold text-gray-900">
                          Đơn #{request.masterOrder?.masterOrderNumber}
                        </h4>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                          ⏳ Chờ xác nhận
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-gray-600">Người thuê:</span>
                          <p className="font-semibold">
                            {request.renter?.profile?.firstName} {request.renter?.profile?.lastName}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-600">Yêu cầu vào:</span>
                          <p className="font-semibold">{formatDate(request.createdAt)}</p>
                        </div>

                        <div>
                          <span className="text-gray-600">Ngày kết thúc hiện tại:</span>
                          <p className="font-semibold">
                            {new Date(request.currentEndDate).toLocaleDateString('vi-VN')}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-600">Ngày kết thúc yêu cầu:</span>
                          <p className="font-semibold text-green-600">
                            {new Date(request.newEndDate).toLocaleDateString('vi-VN')}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-600">Số ngày gia hạn:</span>
                          <p className="font-bold text-orange-600">
                            {calculateExtendDays(request.currentEndDate, request.newEndDate)} ngày
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-600">Phí gia hạn:</span>
                          <p className="font-bold text-blue-600">
                            {formatCurrency(request.extensionFee)}
                          </p>
                        </div>
                      </div>

                      {request.extensionReason && (
                        <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                          <span className="text-blue-700 font-semibold">Lý do gia hạn:</span>
                          <p className="text-blue-600">{request.extensionReason}</p>
                        </div>
                      )}
                    </div>

                    <button
                      className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
                    >
                      Chi tiết →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">📋 Chi tiết Yêu cầu Gia hạn</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRequest(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Request Info */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">⏳ Thông tin yêu cầu</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã đơn:</span>
                    <span className="font-semibold">{selectedRequest.masterOrder?.masterOrderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Yêu cầu vào:</span>
                    <span className="font-semibold">{formatDate(selectedRequest.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className="font-semibold px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full">
                      Chờ xác nhận
                    </span>
                  </div>
                </div>
              </div>

              {/* Renter Info */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">👤 Thông tin người thuê</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tên:</span>
                    <span className="font-semibold">
                      {selectedRequest.renter?.profile?.firstName} {selectedRequest.renter?.profile?.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-semibold">{selectedRequest.renter?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Điện thoại:</span>
                    <span className="font-semibold">{selectedRequest.renter?.phone || 'Chưa cập nhật'}</span>
                  </div>
                </div>
              </div>

              {/* Extension Details */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">📅 Chi tiết gia hạn</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày kết thúc hiện tại:</span>
                    <span className="font-semibold">
                      {new Date(selectedRequest.currentEndDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày kết thúc mới (yêu cầu):</span>
                    <span className="font-bold text-green-600">
                      {new Date(selectedRequest.newEndDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Số ngày gia hạn:</span>
                      <span className="font-bold text-orange-600 text-lg">
                        {calculateExtendDays(selectedRequest.currentEndDate, selectedRequest.newEndDate)} ngày
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phí gia hạn (sẽ trừ ví renter):</span>
                      <span className="font-bold text-blue-600 text-lg">
                        {formatCurrency(selectedRequest.extensionFee)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason */}
              {selectedRequest.notes && (
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 mb-2">📝 Lý do gia hạn</h3>
                  <p className="text-gray-700">{selectedRequest.notes}</p>
                </div>
              )}

              {/* Master Order Info */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">📦 Thông tin đơn hàng</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã đơn chính:</span>
                    <span className="font-semibold">{selectedRequest.masterOrder?.masterOrderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng tiền đơn hàng:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(
                        (selectedRequest.masterOrder?.totalAmount || 0) +
                        (selectedRequest.masterOrder?.totalDepositAmount || 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái đơn:</span>
                    <span className="font-semibold px-2 py-1 bg-green-200 text-green-800 rounded">
                      {selectedRequest.masterOrder?.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRequest(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  Quay lại
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <XCircle className="w-5 h-5" />
                  <span>Từ chối</span>
                </button>
                <button
                  onClick={() => handleApproveExtension(selectedRequest._id)}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <Check className="w-5 h-5" />
                  <span>Xác nhận</span>
                </button>
              </div>
            </div>
          </div>

          {/* Reject Reason Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
              <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
                <div className="bg-red-600 text-white p-4 rounded-t-xl">
                  <h3 className="text-lg font-bold">❌ Từ chối Yêu cầu Gia hạn</h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-700 font-semibold">
                    Nhập lý do từ chối (sẽ gửi cho người thuê):
                  </p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Nhập lý do từ chối..."
                    className="w-full p-3 border-2 border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowRejectModal(false);
                        setRejectReason('');
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleRejectExtension}
                      disabled={!rejectReason.trim() || submitting}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                    >
                      {submitting ? '⏳...' : 'Từ chối'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageExtensionRequestsModal;
