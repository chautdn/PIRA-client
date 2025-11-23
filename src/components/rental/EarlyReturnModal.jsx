import React, { useState } from 'react';
import extensionService from '../../services/extension.js';

const EarlyReturnModal = ({ isOpen, onClose, subOrder, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) return alert('Vui lòng nhập lý do trả sớm');
    try {
      setProcessing(true);
      // For now call extensionService.cancelExtension as placeholder or renterCancel API
      // This should be replaced with the actual early-return API when available
      // Example: await rentalOrderService.requestEarlyReturn(subOrder._id, { reason });
      await new Promise((res) => setTimeout(res, 700));
      onSuccess && onSuccess();
      onClose && onClose();
      alert('Yêu cầu trả sớm đã được gửi');
    } catch (err) {
      console.error('Early return error', err);
      alert('Không thể gửi yêu cầu trả sớm');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">Yêu cầu trả hàng sớm</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700">Lý do</label>
            <textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="Nhập lý do muốn trả sớm..." />
          </div>
          <div className="text-sm text-gray-600">Sản phẩm: <span className="font-medium">{subOrder?.products?.length || 0} mục</span></div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border rounded">Hủy</button>
          <button onClick={handleSubmit} disabled={processing} className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50">{processing ? 'Đang gửi...' : 'Gửi yêu cầu'}</button>
        </div>
      </div>
    </div>
  );
};

export default EarlyReturnModal;
