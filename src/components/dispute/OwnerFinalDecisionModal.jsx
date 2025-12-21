import { useState } from 'react';
import { useDispute } from '../../context/DisputeContext';
import { toast } from 'react-hot-toast';
import { getDisputeTypeText } from '../../utils/disputeHelpers';

const OwnerFinalDecisionModal = ({ isOpen, onClose, dispute }) => {
  const { submitOwnerFinalDecision } = useDispute();
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
      const result = await submitOwnerFinalDecision(dispute._id, { decision: decision.trim() });
      toast.success('Đã đưa ra quyết định cuối cùng, chờ Renter phản hồi');
      setDecision('');
      onClose();
    } catch (error) {
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
              <strong>Renter:</strong> {
                dispute.shipmentType === 'RETURN' 
                  ? dispute.respondent.profile?.fullName 
                  : dispute.complainant.profile?.fullName
              }
            </p>
            <p className="text-sm text-blue-900 mt-1">
              <strong>Vấn đề:</strong> {getDisputeTypeText(dispute.type)}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ví dụ: Sau khi thảo luận, chúng tôi quyết định hoàn tiền 500,000đ cho renter do sản phẩm có vấn đề nhỏ..."
                required
              />
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Lưu ý:</strong> Sau khi bạn đưa ra quyết định, Renter sẽ xem và quyết định đồng ý hoặc từ chối. 
                Nếu Renter đồng ý, quyết định sẽ được gửi đến Admin để xử lý cuối cùng.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !decision.trim()}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Đang gửi...' : '📝 Đưa ra quyết định'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OwnerFinalDecisionModal;