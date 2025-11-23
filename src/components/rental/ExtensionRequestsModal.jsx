import React, { useState, useEffect } from 'react';
import extensionService from '../../services/extension.js';

const ExtensionRequestsModal = ({ isOpen, onClose, subOrder, onSuccess }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processStatus, setProcessStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    } else {
      setRequests([]);
      setExpandedRequest(null);
      setRejectingRequest(null);
      setRejectReason('');
    }
  }, [isOpen, subOrder]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await extensionService.getOwnerExtensionRequests({ page: 1, limit: 50 });
      const all = res.requests || [];
      // Filter requests for this subOrder
      const filtered = all.filter(r => r.subOrder && (r.subOrder._id === subOrder._id || r.subOrder === subOrder._id));
      setRequests(filtered);
    } catch (err) {
      console.error('Fetch owner extension requests error', err);
      alert('Không thể lấy yêu cầu gia hạn');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Bạn có chắc muốn chấp nhận yêu cầu này?')) return;
    try {
      setProcessStatus(requestId);
      await extensionService.approveExtension(requestId);
      alert('✅ Đã chấp nhận yêu cầu gia hạn');
      onSuccess && onSuccess({ type: 'success', message: 'Đã chấp nhận yêu cầu' });
      fetchRequests();
      setExpandedRequest(null);
    } catch (err) {
      console.error('Approve error', err);
      alert('❌ Không thể chấp nhận yêu cầu: ' + (err.message || err.toString()));
    } finally {
      setProcessStatus(null);
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      setProcessStatus(requestId);
      await extensionService.rejectExtension(requestId, { rejectionReason: rejectReason });
      alert('✅ Đã từ chối yêu cầu gia hạn');
      onSuccess && onSuccess({ type: 'success', message: 'Đã từ chối yêu cầu' });
      setRejectReason('');
      setRejectingRequest(null);
      fetchRequests();
      setExpandedRequest(null);
    } catch (err) {
      console.error('Reject error', err);
      alert('❌ Không thể từ chối yêu cầu: ' + (err.message || err.toString()));
    } finally {
      setProcessStatus(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ xử lý' },
      'APPROVED': { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã chấp nhận' },
      'REJECTED': { bg: 'bg-red-100', text: 'text-red-800', label: 'Đã từ chối' },
      'CANCELLED': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Đã hủy' }
    };
    const config = statusMap[status] || statusMap['PENDING'];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Yêu cầu gia hạn - {subOrder?.subOrderNumber}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-600">Đang tải dữ liệu...</div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-600 text-lg">Không có yêu cầu gia hạn cho mục này.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req._id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Header */}
                <div 
                  className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => setExpandedRequest(expandedRequest === req._id ? null : req._id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold text-gray-900">
                          {req.renter?.profile?.fullName || req.renter?.email || 'Unknown'}
                        </h4>
                        {getStatusBadge(req.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Gửi vào: {new Date(req.requestedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600">
                        {(req.totalCost || req.extensionCost || 0).toLocaleString('vi-VN')}đ
                      </div>
                      <p className="text-xs text-gray-500">Chi phí gia hạn</p>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedRequest === req._id && (
                  <div className="p-6 border-t border-gray-200 bg-white">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {/* Thông tin thời gian */}
                      <div>
                        <p className="text-sm text-gray-600">Ngày kết thúc hiện tại</p>
                        <p className="font-semibold text-gray-900 mt-1">
                          {new Date(req.currentEndDate).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Ngày kết thúc mới</p>
                        <p className="font-semibold text-gray-900 mt-1">
                          {new Date(req.newEndDate).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Số ngày gia hạn</p>
                        <p className="font-semibold text-gray-900 mt-1">{req.extensionDays} ngày</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Giá thuê mỗi ngày</p>
                        <p className="font-semibold text-gray-900 mt-1">
                          {req.rentalRate?.toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    </div>

                    {/* Chi phí chi tiết */}
                    <div className="bg-gray-50 rounded p-4 mb-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Chi phí gia hạn:</span>
                        <span className="font-semibold">{(req.extensionCost || 0).toLocaleString('vi-VN')}đ</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Tổng cộng:</span>
                        <span className="font-bold text-lg text-orange-600">
                          {(req.totalCost || req.extensionCost || 0).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>

                    {/* Lý do */}
                    {req.extensionReason && (
                      <div className="mb-6">
                        <p className="text-sm text-gray-600">Lý do gia hạn</p>
                        <p className="mt-2 p-3 bg-gray-50 rounded text-gray-900">
                          {req.extensionReason}
                        </p>
                      </div>
                    )}

                    {/* Thông tin thanh toán */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
                      <p className="text-sm text-gray-600 mb-2">Trạng thái thanh toán</p>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          req.paymentStatus === 'PAID' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {req.paymentStatus === 'PAID' ? '✓ Đã thanh toán' : 'Chờ thanh toán'}
                        </span>
                        <span className="text-gray-600">
                          ({req.paymentMethod || 'Không xác định'})
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons - chỉ hiển thị nếu status là PENDING */}
                    {req.status === 'PENDING' && (
                      <div className="border-t pt-4">
                        {!rejectingRequest || rejectingRequest !== req._id ? (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleApprove(req._id)}
                              disabled={processStatus === req._id}
                              className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2 px-4 rounded font-medium transition"
                            >
                              {processStatus === req._id ? 'Đang xử lý...' : '✓ Chấp nhận'}
                            </button>
                            <button
                              onClick={() => setRejectingRequest(req._id)}
                              disabled={processStatus === req._id}
                              className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2 px-4 rounded font-medium transition"
                            >
                              ✕ Từ chối
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <textarea
                              rows={3}
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Nhập lý do từ chối (bắt buộc)..."
                              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setRejectingRequest(null);
                                  setRejectReason('');
                                }}
                                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded font-medium hover:bg-gray-50 transition"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={() => handleReject(req._id)}
                                disabled={processStatus === req._id || !rejectReason.trim()}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 px-4 rounded font-medium transition"
                              >
                                {processStatus === req._id ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status Message - nếu đã xử lý */}
                    {req.status !== 'PENDING' && (
                      <div className={`border-t pt-4 p-3 rounded ${
                        req.status === 'APPROVED' 
                          ? 'bg-green-50 border-l-4 border-green-500' 
                          : 'bg-red-50 border-l-4 border-red-500'
                      }`}>
                        <p className={`font-medium ${
                          req.status === 'APPROVED' 
                            ? 'text-green-800' 
                            : 'text-red-800'
                        }`}>
                          {req.status === 'APPROVED' 
                            ? '✓ Yêu cầu đã được chấp nhận'
                            : '✕ Yêu cầu đã bị từ chối'
                          }
                        </p>
                        {req.ownerResponse?.rejectionReason && (
                          <p className="text-sm mt-2">
                            Lý do: {req.ownerResponse.rejectionReason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtensionRequestsModal;
