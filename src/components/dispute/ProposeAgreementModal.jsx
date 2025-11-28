import { useState } from 'react';
import { formatCurrency } from '../../utils/disputeHelpers';

const ProposeAgreementModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    refundAmount: '',
    terms: '',
    deadline: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        refundAmount: parseFloat(formData.refundAmount),
        terms: formData.terms,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined
      });
      onClose();
      // Reset form
      setFormData({ refundAmount: '', terms: '', deadline: '' });
    } catch (error) {
      console.error('Error proposing agreement:', error);
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
            Đề xuất thỏa thuận
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Refund Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số tiền hoàn trả (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.refundAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, refundAmount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nhập số tiền..."
                min="0"
                step="1000"
                required
              />
              {formData.refundAmount && (
                <p className="text-xs text-gray-500 mt-1">
                  = {formatCurrency(parseFloat(formData.refundAmount))}
                </p>
              )}
            </div>

            {/* Terms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Điều khoản thỏa thuận <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.terms}
                onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                rows="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Mô tả chi tiết điều khoản thỏa thuận...&#10;Ví dụ:&#10;- Hoàn 50% tiền thuê&#10;- Renter giữ sản phẩm&#10;- Owner không khiếu nại thêm"
                required
              />
            </div>

            {/* Deadline (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời hạn phản hồi (tùy chọn)
              </label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nếu không chọn, mặc định là 3 ngày từ khi đề xuất
              </p>
            </div>

            {/* Info box */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-indigo-900 mb-1">
                    Lưu ý về đàm phán
                  </p>
                  <ul className="text-xs text-indigo-700 space-y-1">
                    <li>• Bên kia có thể chấp nhận hoặc từ chối đề xuất của bạn</li>
                    <li>• Nếu từ chối, bạn có thể đề xuất lại</li>
                    <li>• Thời gian đàm phán tối đa là 3 ngày</li>
                    <li>• Nếu không đạt được thỏa thuận, tranh chấp sẽ chuyển cho bên thứ 3</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
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
                className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang gửi...' : 'Đề xuất'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProposeAgreementModal;
