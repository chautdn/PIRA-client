import React, { useState, useEffect } from 'react';
import extensionService from '../../services/extension.js';

const ExtensionRequestsModal = ({ isOpen, onClose, subOrder, onSuccess }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionProcessing, setActionProcessing] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (isOpen) fetchRequests();
    else setRequests([]);
  }, [isOpen, subOrder]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await extensionService.getOwnerExtensionRequests({ page: 1, limit: 50 });
      const all = res.requests || [];
      // Filter requests for this subOrder
      const filtered = all.filter(r => r.subOrder && r.subOrder._id === subOrder._id || r.subOrder === subOrder._id);
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
      setActionProcessing(requestId);
      await extensionService.approveExtension(requestId);
      onSuccess && onSuccess({ type: 'success', message: 'Đã chấp nhận yêu cầu' });
      fetchRequests();
    } catch (err) {
      console.error('Approve error', err);
      alert('Không thể chấp nhận yêu cầu');
    } finally {
      setActionProcessing(null);
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectReason.trim()) return alert('Vui lòng nhập lý do từ chối');
    try {
      setActionProcessing(requestId);
      await extensionService.rejectExtension(requestId, { rejectionReason: rejectReason });
      onSuccess && onSuccess({ type: 'success', message: 'Đã từ chối yêu cầu' });
      setRejectReason('');
      fetchRequests();
    } catch (err) {
      console.error('Reject error', err);
      alert('Không thể từ chối yêu cầu');
    } finally {
      setActionProcessing(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Yêu cầu gia hạn - {subOrder?.subOrderNumber}</h3>
          <button className="text-sm text-gray-600" onClick={onClose}>Đóng</button>
        </div>

        {loading ? (
          <div>Đang tải...</div>
        ) : requests.length === 0 ? (
          <div className="text-gray-600">Không có yêu cầu gia hạn cho mục này.</div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req._id} className="border rounded p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-gray-600">Người yêu cầu: <span className="font-medium">{req.renter?.profile?.fullName || req.renter?.email}</span></div>
                    <div className="text-sm text-gray-600">Ngày mới: <span className="font-medium">{new Date(req.newEndDate).toLocaleString('vi-VN')}</span></div>
                    <div className="text-sm text-gray-600">Ngày gửi: <span className="font-medium">{new Date(req.requestedAt).toLocaleString('vi-VN')}</span></div>
                    <div className="text-sm text-gray-600">Lý do: <span className="font-medium">{req.extensionReason || '-'}</span></div>
                    <div className="text-sm text-gray-600">Chi phí: <span className="font-medium">{(req.totalCost || req.extensionCost || 0).toLocaleString('vi-VN')}đ</span></div>
                    <div className="text-sm text-gray-600">Trạng thái thanh toán: <span className="font-medium">{req.paymentStatus || req.status}</span></div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <button onClick={() => handleApprove(req._id)} disabled={actionProcessing === req._id} className="px-3 py-1 bg-green-500 text-white rounded">{actionProcessing === req._id ? '...' : 'Chấp nhận'}</button>
                    <button onClick={() => {
                      const shouldOpen = actionProcessing !== req._id;
                      if (shouldOpen) setActionProcessing(req._id);
                    }} disabled={actionProcessing === req._id} className="px-3 py-1 bg-red-500 text-white rounded">Từ chối</button>
                  </div>
                </div>

                {actionProcessing === req._id && (
                  <div className="mt-3">
                    <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Nhập lý do từ chối..." className="w-full border rounded px-3 py-2 mb-2" />
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => { setRejectReason(''); setActionProcessing(null); }} className="px-3 py-1 border rounded">Hủy</button>
                      <button onClick={() => handleReject(req._id)} className="px-3 py-1 bg-red-600 text-white rounded">Xác nhận từ chối</button>
                    </div>
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
