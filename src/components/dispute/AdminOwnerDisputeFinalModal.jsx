import { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const AdminOwnerDisputeFinalModal = ({ isOpen, onClose, dispute, onUpdate }) => {
  const [selectedDecision, setSelectedDecision] = useState('');
  const [compensationAmount, setCompensationAmount] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Kiểm tra nguồn: đàm phán hoặc bên thứ 3
  const isFromNegotiation = dispute.status === 'NEGOTIATION_AGREED';
  const ownerDecision = dispute.negotiationRoom?.finalAgreement?.ownerDecision || '';
  
  // Lấy thông tin từ bên thứ 3 (nếu có)
  const thirdPartyDecision = dispute.thirdPartyResolution?.evidence?.officialDecision || '';
  const thirdPartyDocs = dispute.thirdPartyResolution?.evidence?.documents || [];

  const handleSubmit = async () => {
    if (!selectedDecision) {
      toast.error('Vui lòng chọn quyết định');
      return;
    }

    if (selectedDecision === 'COMPLAINANT_RIGHT' && !compensationAmount) {
      toast.error('Vui lòng nhập số tiền bồi thường');
      return;
    }

    if (!reasoning.trim()) {
      toast.error('Vui lòng nhập lý do quyết định');
      return;
    }

    const amount = parseFloat(compensationAmount);
    if (selectedDecision === 'COMPLAINANT_RIGHT' && (isNaN(amount) || amount <= 0)) {
      toast.error('Số tiền bồi thường không hợp lệ');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post(`/disputes/${dispute._id}/admin-final-decision-owner-dispute`, {
        decision: selectedDecision,
        compensationAmount: selectedDecision === 'COMPLAINANT_RIGHT' ? amount : 0,
        reasoning
      });

      toast.success('Đã đưa ra quyết định cuối cùng');
      onUpdate && onUpdate(response.data.dispute);
      onClose();
    } catch (error) {
      console.error('Submit decision error:', error);
      toast.error(error.response?.data?.message || 'Xử lý thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {isFromNegotiation ? 'Xử lý kết quả đàm phán' : 'Quyết định cuối cùng từ kết quả bên thứ 3'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quyết định của Owner (nếu từ đàm phán) */}
          {isFromNegotiation && ownerDecision && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">💬 Quyết định của chủ hàng:</h4>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">
                {ownerDecision}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                ✅ Cả hai bên đã đồng ý với quyết định này
              </p>
            </div>
          )}

          {/* Quyết định cuối cùng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quyết định cuối cùng <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                selectedDecision === 'COMPLAINANT_RIGHT' 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 hover:border-red-300'
              }`}>
                <input
                  type="radio"
                  name="decision"
                  value="COMPLAINANT_RIGHT"
                  checked={selectedDecision === 'COMPLAINANT_RIGHT'}
                  onChange={(e) => setSelectedDecision(e.target.value)}
                  className="mt-1"
                />
                <div className="ml-3 flex-1">
                  <p className="font-medium text-gray-900">Người khiếu nại đúng (Owner)</p>
                  <p className="text-sm text-gray-600 mt-1 mb-3">
                    Renter có lỗi → Renter phải bồi thường cho owner
                  </p>
                  
                  {selectedDecision === 'COMPLAINANT_RIGHT' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số tiền bồi thường (VNĐ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={compensationAmount ? Number(compensationAmount).toLocaleString('vi-VN') : ''}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                          setCompensationAmount(rawValue);
                        }}
                        placeholder="Nhập số tiền bồi thường..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Dựa trên kết quả từ bên thứ 3, nhập số tiền renter cần bồi thường
                      </p>
                    </div>
                  )}
                </div>
              </label>

              <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                selectedDecision === 'RESPONDENT_RIGHT' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-green-300'
              }`}>
                <input
                  type="radio"
                  name="decision"
                  value="RESPONDENT_RIGHT"
                  checked={selectedDecision === 'RESPONDENT_RIGHT'}
                  onChange={(e) => setSelectedDecision(e.target.value)}
                  className="mt-1"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Bên bị khiếu nại đúng (Renter)</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Owner không có lý do chính đáng → Renter được hoàn 100% tiền cọc
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    (Tiền thuê không hoàn vì renter đã sử dụng sản phẩm)
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Giải thích quyết định */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giải thích quyết định <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={isFromNegotiation 
                ? "Dựa trên thỏa thuận đàm phán của hai bên, admin đưa ra quyết định..." 
                : "Dựa trên kết quả từ bên thứ 3, admin đưa ra quyết định..."
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              {isFromNegotiation 
                ? 'Hãy giải thích rõ ràng quyết định dựa trên thỏa thuận của hai bên'
                : 'Hãy giải thích rõ ràng quyết định dựa trên bằng chứng từ bên thứ 3'
              }
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Quyết định này là quyết định cuối cùng và không thể thay đổi. 
                  {isFromNegotiation 
                    ? ' Hãy chắc chắn bạn đã xem xét kỹ lưỡng thỏa thuận của hai bên.'
                    : ' Hãy chắc chắn bạn đã xem xét kỹ lưỡng tất cả bằng chứng từ bên thứ 3.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc muốn từ chối bằng chứng này? Dispute sẽ quay lại trạng thái THIRD_PARTY_ESCALATED')) {
                  onClose();
                  // Trigger reject modal in parent
                  window.dispatchEvent(new CustomEvent('openRejectEvidenceModal'));
                }
              }}
              disabled={isSubmitting}
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium disabled:opacity-50"
            >
              Từ chối bằng chứng
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedDecision || !reasoning.trim()}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Đưa ra quyết định cuối cùng'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOwnerDisputeFinalModal;
