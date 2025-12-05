import { useState } from 'react';
import { useDispute } from '../../context/DisputeContext';
import { toast } from 'react-hot-toast';

/**
 * Modal cho Owner đưa ra quyết định cuối cùng khi Owner tạo dispute RETURN
 * Khác với OwnerFinalDecisionModal (dành cho Renter tạo dispute DELIVERY)
 */
const OwnerDisputeFinalDecisionModal = ({ isOpen, onClose, dispute }) => {
  const { submitOwnerDisputeFinalDecision } = useDispute();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decision, setDecision] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!decision.trim()) {
      toast.error('Vui lòng nhập quyết định cuối cùng');
      return;
    }

    try {
      setIsSubmitting(true);
      await submitOwnerDisputeFinalDecision(dispute._id, { decision: decision.trim() });
      toast.success('Đã đưa ra quyết định cuối cùng, chờ Renter phản hồi');
      setDecision('');
      onClose();
    } catch (error) {
      console.error('❌ Submit owner dispute decision error:', error);
      toast.error(error.message || 'Không thể gửi quyết định');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                ✅ Quyết định cuối cùng
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Sau khi đã thảo luận với Renter trong chat, hãy đưa ra quyết định cuối cùng
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <p className="text-sm text-blue-900">
              <strong>Dispute:</strong> {dispute.disputeId}
            </p>
            <p className="text-sm text-blue-900 mt-1">
              <strong>Renter:</strong> {dispute.respondent.profile?.fullName}
            </p>
            <p className="text-sm text-blue-900 mt-1">
              <strong>Vấn đề:</strong> {dispute.type}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quyết định cuối cùng <span className="text-red-500">*</span>
              </label>
              <textarea
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập quyết định cuối cùng của bạn sau khi đàm phán với Renter..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Quyết định này sẽ được gửi cho Renter để phản hồi
              </p>
            </div>

            {/* Warning */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Lưu ý:</strong> Sau khi bạn đưa ra quyết định, Renter sẽ xem và quyết định đồng ý hoặc từ chối. 
                Nếu Renter từ chối, quyết định sẽ chuyển cho bên thứ 3 xử lý cuối cùng.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !decision.trim()}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Đang gửi...' : 'Đưa ra quyết định'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OwnerDisputeFinalDecisionModal;
