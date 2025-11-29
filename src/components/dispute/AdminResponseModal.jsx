import { useState } from 'react';

const AdminResponseModal = ({ isOpen, onClose, onSubmit, dispute }) => {
  const [formData, setFormData] = useState({
    decision: '', // 'COMPLAINANT_RIGHT' or 'RESPONDENT_RIGHT'
    reasoning: '',
    refundAmount: 0,
    penaltyAmount: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.decision) {
      alert('Vui lòng chọn quyết định');
      return;
    }
    
    if (!formData.reasoning.trim()) {
      alert('Vui lòng nhập lý do quyết định');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        decisionText: formData.decision,
        reasoning: formData.reasoning,
        refundAmount: parseFloat(formData.refundAmount) || 0,
        penaltyAmount: parseFloat(formData.penaltyAmount) || 0
      });
      onClose();
    } catch (error) {
      console.error('Error submitting admin decision:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Đưa ra quyết định sơ bộ
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Decision */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quyết định <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    checked={formData.decision === 'COMPLAINANT_RIGHT'}
                    onChange={() => setFormData(prev => ({ ...prev, decision: 'COMPLAINANT_RIGHT' }))}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Người khiếu nại đúng</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Bên bị khiếu nại có lỗi, cần bồi thường/xử lý theo quy định
                    </p>
                  </div>
                </label>
                <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    checked={formData.decision === 'RESPONDENT_RIGHT'}
                    onChange={() => setFormData(prev => ({ ...prev, decision: 'RESPONDENT_RIGHT' }))}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Bên bị khiếu nại đúng</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Khiếu nại không có căn cứ, bên bị khiếu nại không có lỗi
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Reasoning */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do quyết định <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reasoning}
                onChange={(e) => setFormData(prev => ({ ...prev, reasoning: e.target.value }))}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Giải thích chi tiết lý do quyết định của bạn..."
                required
              />
            </div>

            {/* Refund Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số tiền hoàn lại (nếu có)
              </label>
              <input
                type="number"
                value={formData.refundAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, refundAmount: e.target.value }))}
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Số tiền sẽ được hoàn lại cho bên bị thiệt hại
              </p>
            </div>

            {/* Penalty Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số tiền phạt (nếu có)
              </label>
              <input
                type="number"
                value={formData.penaltyAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, penaltyAmount: e.target.value }))}
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Phạt vi phạm (nếu có lỗi nghiêm trọng)
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang gửi...' : 'Xác nhận'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminResponseModal;
