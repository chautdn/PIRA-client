import { useState } from 'react';
import { useDispute } from '../../context/DisputeContext';
import { toast } from 'react-hot-toast';

const FinalAgreementModal = ({ isOpen, onClose, dispute, currentAgreement }) => {
  const { proposeAgreement, respondToAgreement } = useDispute();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    proposalText: currentAgreement?.proposalText || '',
    proposalAmount: currentAgreement?.proposalAmount || 0
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.proposalText.trim()) {
      toast.error('Vui lòng nhập nội dung thỏa thuận');
      return;
    }

    try {
      setIsSubmitting(true);
      await proposeAgreement(dispute._id, formData);
      toast.success('Đã gửi đề xuất thỏa thuận');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Không thể gửi đề xuất');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = async () => {
    if (!window.confirm('Bạn có chắc chắn đồng ý với thỏa thuận này?')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await respondToAgreement(dispute._id, true);
      toast.success('Đã chấp nhận thỏa thuận');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Không thể chấp nhận thỏa thuận');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Bạn có chắc chắn từ chối thỏa thuận này? Tranh chấp sẽ được chuyển cho bên thứ 3.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await respondToAgreement(dispute._id, false);
      toast.success('Đã từ chối thỏa thuận');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Không thể từ chối thỏa thuận');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if current user proposed the agreement
  const userProposed = currentAgreement?.proposedBy?.toString() === dispute.complainant._id?.toString()
    ? 'complainant' 
    : 'respondent';
  
  const isComplainant = dispute.complainant._id?.toString() === currentAgreement?.proposedBy?.toString();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {currentAgreement ? '✅ Thỏa thuận cuối cùng' : '📝 Đề xuất thỏa thuận'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {currentAgreement 
                  ? 'Xem và phản hồi thỏa thuận từ bên kia'
                  : 'Đưa ra thỏa thuận cuối cùng sau khi đã thảo luận trong chat'}
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

          {/* Current Agreement View (if exists) */}
          {currentAgreement ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Đề xuất từ: {isComplainant ? dispute.complainant.profile?.fullName : dispute.respondent.profile?.fullName}
                </p>
                
                {currentAgreement.proposalAmount > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">Số tiền:</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {currentAgreement.proposalAmount.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Nội dung:</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {currentAgreement.proposalText}
                  </p>
                </div>
              </div>

              {/* Response Buttons */}
              {!currentAgreement.complainantAccepted && !currentAgreement.respondentAccepted && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    Bạn có đồng ý với thỏa thuận này không?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAccept}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Đồng ý
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Từ chối
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    ⚠️ Nếu từ chối, tranh chấp sẽ chuyển cho bên thứ 3 xử lý
                  </p>
                </div>
              )}

              {(currentAgreement.complainantAccepted || currentAgreement.respondentAccepted) && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 text-center">
                    Thỏa thuận đang chờ phản hồi từ bên kia
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* New Agreement Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền (VNĐ) <span className="text-gray-400">(Tùy chọn)</span>
                </label>
                <input
                  type="number"
                  value={formData.proposalAmount}
                  onChange={(e) => setFormData({...formData, proposalAmount: Number(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập số tiền nếu có"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung thỏa thuận <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.proposalText}
                  onChange={(e) => setFormData({...formData, proposalText: e.target.value})}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mô tả chi tiết nội dung thỏa thuận cuối cùng mà hai bên đã thảo luận..."
                  required
                />
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Đây là thỏa thuận cuối cùng sau khi bạn và bên kia đã thảo luận kỹ trong chat. 
                  Bên kia sẽ phải chấp nhận hoặc từ chối thỏa thuận này.
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
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi đề xuất'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinalAgreementModal;
