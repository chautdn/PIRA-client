import React, { useState } from 'react';
import { X, Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useDispute } from '../../context/DisputeContext';
import { formatDate } from '../../utils/disputeHelpers';

/**
 * Modal cho owner phản hồi reschedule request từ renter
 */
const RescheduleResponseModal = ({ isOpen, onClose, dispute }) => {
  const { respondToReschedule } = useDispute();
  const [decision, setDecision] = useState(null); // 'APPROVED' | 'REJECTED'
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !dispute?.rescheduleRequest) return null;

  const reschedule = dispute.rescheduleRequest;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!decision) {
      alert('Vui lòng chọn quyết định');
      return;
    }

    if (decision === 'REJECTED' && !reason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    setIsSubmitting(true);
    try {
      await respondToReschedule(dispute._id, {
        decision,
        reason: reason.trim()
      });
      onClose();
    } catch (error) {
      console.error('Respond to reschedule error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Phản hồi đề xuất reschedule
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Reschedule Info */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="space-y-3">
            <div className="flex items-start">
              <Calendar className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Ngày trả đề xuất:</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatDate(reschedule.proposedReturnDate)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Lý do:</p>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-900">{reschedule.reason}</p>
              </div>
            </div>

            {reschedule.evidence?.photos && reschedule.evidence.photos.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Bằng chứng:</p>
                <div className="grid grid-cols-3 gap-2">
                  {reschedule.evidence.photos.map((photo, idx) => (
                    <div key={idx} className="aspect-square bg-gray-200 rounded-lg">
                      {/* Placeholder for evidence images */}
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                        Ảnh {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reschedule.evidence?.notes && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Ghi chú thêm:</p>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">{reschedule.evidence.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Decision Info */}
        <div className="px-6 py-4 bg-blue-50 border-l-4 border-blue-400">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Hướng dẫn quyết định:</p>
              <div className="space-y-2">
                <div>
                  <p className="font-semibold">✅ Nếu CHẤP NHẬN:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Shipment mới sẽ được tạo tự động</li>
                    <li>Renter bị phạt <strong>10% deposit</strong> và <strong>-5 credit</strong></li>
                    <li>Bạn nhận được tiền phạt</li>
                    <li>Dispute sẽ được đóng</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">❌ Nếu TỪ CHỐI:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Admin sẽ xem xét và quyết định</li>
                    <li>Bạn cần đưa ra lý do từ chối hợp lý</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Decision Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quyết định của bạn *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDecision('APPROVED')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  decision === 'APPROVED'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${
                  decision === 'APPROVED' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <p className={`font-semibold ${
                  decision === 'APPROVED' ? 'text-green-700' : 'text-gray-600'
                }`}>
                  Chấp nhận
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Đồng ý với đề xuất
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECTED')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  decision === 'REJECTED'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <XCircle className={`w-8 h-8 mx-auto mb-2 ${
                  decision === 'REJECTED' ? 'text-red-600' : 'text-gray-400'
                }`} />
                <p className={`font-semibold ${
                  decision === 'REJECTED' ? 'text-red-700' : 'text-gray-600'
                }`}>
                  Từ chối
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Không đồng ý
                </p>
              </button>
            </div>
          </div>

          {/* Reason (required if rejected) */}
          {decision === 'REJECTED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="Ví dụ: Thời gian đề xuất quá xa, tôi không thể chờ thêm. Lý do của bạn không đủ chính đáng..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>
          )}

          {decision === 'APPROVED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Ghi chú cho renter (nếu có)..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !decision}
              className={`px-6 py-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                decision === 'APPROVED'
                  ? 'bg-green-600 hover:bg-green-700'
                  : decision === 'REJECTED'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-400'
              }`}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận quyết định'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleResponseModal;
