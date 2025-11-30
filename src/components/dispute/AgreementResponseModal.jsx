import { useState } from 'react';
import { formatCurrency } from '../../utils/disputeHelpers';

const AgreementResponseModal = ({ isOpen, onClose, onSubmit, agreement }) => {
  const [accept, setAccept] = useState(true);
  const [counterOffer, setCounterOffer] = useState({
    refundAmount: '',
    terms: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (accept) {
        await onSubmit({ accept: true });
      } else {
        // If rejecting, can optionally provide counter offer
        await onSubmit({ 
          accept: false,
          counterOffer: counterOffer.refundAmount ? {
            refundAmount: parseFloat(counterOffer.refundAmount),
            terms: counterOffer.terms
          } : undefined
        });
      }
      onClose();
    } catch (error) {
      console.error('Error responding to agreement:', error);
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
            Phản hồi thỏa thuận
          </h2>

          {/* Display current agreement */}
          {agreement && (
            <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-sm font-medium text-indigo-900 mb-2">Đề xuất hiện tại:</p>
              <div className="space-y-2">
                {agreement.refundAmount && (
                  <div className="flex justify-between">
                    <span className="text-sm text-indigo-700">Số tiền hoàn:</span>
                    <span className="text-sm font-semibold text-indigo-900">
                      {formatCurrency(agreement.refundAmount)}
                    </span>
                  </div>
                )}
                {agreement.terms && (
                  <div>
                    <p className="text-sm text-indigo-700 mb-1">Điều khoản:</p>
                    <p className="text-sm text-indigo-900 whitespace-pre-line">
                      {agreement.terms}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Accept/Reject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quyết định của bạn
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={accept === true}
                    onChange={() => setAccept(true)}
                    className="mr-2"
                  />
                  <span className="text-sm">Chấp nhận</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={accept === false}
                    onChange={() => setAccept(false)}
                    className="mr-2"
                  />
                  <span className="text-sm">Từ chối & Đề xuất lại</span>
                </label>
              </div>
            </div>

            {/* Counter offer if rejected */}
            {accept === false && (
              <div className="border-t pt-4 space-y-4">
                <p className="text-sm font-medium text-gray-700">Đề xuất của bạn:</p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số tiền hoàn trả (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={counterOffer.refundAmount}
                    onChange={(e) => setCounterOffer(prev => ({ ...prev, refundAmount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nhập số tiền..."
                    min="0"
                    step="1000"
                  />
                  {counterOffer.refundAmount && (
                    <p className="text-xs text-gray-500 mt-1">
                      = {formatCurrency(parseFloat(counterOffer.refundAmount))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Điều khoản thỏa thuận
                  </label>
                  <textarea
                    value={counterOffer.terms}
                    onChange={(e) => setCounterOffer(prev => ({ ...prev, terms: e.target.value }))}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Mô tả điều khoản..."
                  />
                </div>
              </div>
            )}

            {/* Info */}
            {accept && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  ✅ Khi chấp nhận, tranh chấp sẽ được giải quyết theo thỏa thuận này.
                </p>
              </div>
            )}

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
                className={`px-4 py-2 text-sm text-white rounded-md disabled:opacity-50 ${
                  accept 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang gửi...' : (accept ? 'Chấp nhận' : 'Gửi đề xuất')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AgreementResponseModal;
