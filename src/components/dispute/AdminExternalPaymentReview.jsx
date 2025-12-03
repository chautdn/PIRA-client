import { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const AdminExternalPaymentReview = ({ dispute, onUpdate }) => {
  const [reasoning, setReasoning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'approve' or 'reject'

  const externalPayment = dispute.externalPayment;
  const ownerNote = externalPayment?.ownerConfirmation?.note || '';
  const receiptImages = externalPayment?.receipt?.images || [];

  const handleOpenModal = (type) => {
    setModalType(type);
    setShowModal(true);
    setReasoning('');
  };

  const handleSubmit = async () => {
    if (!reasoning.trim()) {
      toast.error('Vui lòng nhập lý do quyết định');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post(
        `/disputes/${dispute._id}/admin-review-external-payment`,
        {
          approved: modalType === 'approve',
          reasoning
        }
      );

      toast.success(
        modalType === 'approve' 
          ? 'Đã xác nhận thanh toán hợp lệ' 
          : 'Đã từ chối biên lai, yêu cầu renter upload lại'
      );
      setShowModal(false);
      setReasoning('');
      onUpdate && onUpdate(response.data.dispute);
    } catch (error) {
      console.error('Admin review error:', error);
      toast.error(error.response?.data?.message || 'Xử lý thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          🔍 Admin: Xem xét thanh toán ngoài
        </h2>
        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
          Đang chờ xử lý
        </span>
      </div>

      {/* Thông tin thanh toán */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-3">📋 Thông tin thanh toán</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Tiền cọc đã trừ:</span>
            <span className="font-semibold text-gray-900">
              {externalPayment.depositUsed?.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Renter cần trả thêm:</span>
            <span className="font-semibold text-orange-600">
              {externalPayment.amount?.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="flex justify-between border-t border-blue-200 pt-2">
            <span className="font-medium text-gray-900">Tổng chi phí sửa:</span>
            <span className="font-bold text-gray-900">
              {dispute.repairCost?.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      </div>

      {/* Biên lai Renter upload */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">📸 Biên lai Renter đã upload</h3>
        {receiptImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {receiptImages.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img}
                  alt={`Receipt ${idx + 1}`}
                  className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-500 transition"
                  onClick={() => window.open(img, '_blank')}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition rounded-lg flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                    🔍 Xem lớn
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Chưa có biên lai</p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Upload lúc: {new Date(externalPayment.receipt?.uploadedAt).toLocaleString('vi-VN')}
        </p>
      </div>

      {/* Lý do Owner từ chối */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-red-900 mb-2">⚠️ Owner báo cáo chưa nhận tiền</h3>
        <p className="text-sm text-red-800">
          <strong>Lý do:</strong> {ownerNote || 'Không có lý do cụ thể'}
        </p>
        <p className="text-xs text-gray-600 mt-2">
          Thời gian: {new Date(externalPayment.ownerConfirmation?.confirmedAt).toLocaleString('vi-VN')}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => handleOpenModal('approve')}
          className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
        >
          ✅ Xác nhận thanh toán hợp lệ
        </button>
        <button
          onClick={() => handleOpenModal('reject')}
          className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
        >
          ❌ Từ chối biên lai
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {modalType === 'approve' ? '✅ Xác nhận thanh toán' : '❌ Từ chối biên lai'}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do quyết định <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={
                  modalType === 'approve'
                    ? 'Ví dụ: Sau khi kiểm tra lại với owner, xác nhận renter đã chuyển khoản đúng số tiền vào tài khoản owner...'
                    : 'Ví dụ: Biên lai không rõ ràng, không có thông tin giao dịch, hoặc số tiền không khớp...'
                }
              />
            </div>

            {modalType === 'approve' && (
              <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                <p className="text-sm text-green-800">
                  ✅ Dispute sẽ được <strong>GIẢI QUYẾT</strong> (RESOLVED)
                </p>
              </div>
            )}

            {modalType === 'reject' && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4">
                <p className="text-sm text-orange-800">
                  ⚠️ Renter sẽ phải <strong>UPLOAD LẠI</strong> biên lai (3 ngày)
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !reasoning.trim()}
                className={`flex-1 px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 ${
                  modalType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExternalPaymentReview;
