import { useState } from 'react';

const UserRespondAdminDecisionModal = ({ isOpen, onClose, onSubmit, dispute }) => {
  const [accepted, setAccepted] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (accepted === null) {
      alert('Vui lòng chọn quyết định');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(accepted);
      onClose();
    } catch (error) {
      console.error('Error responding to admin decision:', error);
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
            Phản hồi quyết định Admin
          </h2>

          {dispute?.adminDecision && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="text-sm font-semibold text-purple-900 mb-3">Quyết định của Admin:</h3>
              
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Kết luận:</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {dispute.adminDecision.decision === 'COMPLAINANT_RIGHT' 
                      ? '✅ Người khiếu nại đúng' 
                      : '✅ Bên bị khiếu nại đúng'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Lý do:</p>
                  <p className="text-sm text-gray-600 mt-1">{dispute.adminDecision.reasoning}</p>
                </div>

                {dispute.adminDecision.refundAmount > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Số tiền hoàn:</p>
                    <p className="text-sm text-gray-900 mt-1 font-semibold">
                      {dispute.adminDecision.refundAmount.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                )}

                {dispute.adminDecision.penaltyAmount > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Số tiền phạt:</p>
                    <p className="text-sm text-red-600 mt-1 font-semibold">
                      {dispute.adminDecision.penaltyAmount.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-2 border-t border-purple-200 mt-3">
                  Quyết định được đưa ra bởi: {dispute.assignedAdmin?.profile?.fullName || 'Admin'}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Bạn có đồng ý với quyết định này? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: accepted === true ? '#10b981' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    checked={accepted === true}
                    onChange={() => setAccepted(true)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">Đồng ý</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Tôi chấp nhận quyết định của Admin. Tranh chấp sẽ được giải quyết theo quyết định này.
                    </p>
                  </div>
                  {accepted === true && (
                    <span className="text-green-500 ml-2">✓</span>
                  )}
                </label>

                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: accepted === false ? '#ef4444' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    checked={accepted === false}
                    onChange={() => setAccepted(false)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">Không đồng ý</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Tôi không chấp nhận quyết định. Tranh chấp sẽ chuyển sang giai đoạn đàm phán.
                    </p>
                  </div>
                  {accepted === false && (
                    <span className="text-red-500 ml-2">✗</span>
                  )}
                </label>
              </div>

              {accepted === false && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800 flex items-start">
                    <span className="mr-2">⚠️</span>
                    <span>
                      Nếu một trong hai bên không đồng ý, tranh chấp sẽ chuyển sang <strong>giai đoạn đàm phán 3 ngày</strong> 
                      để hai bên tự thỏa thuận. Nếu đàm phán thất bại, tranh chấp sẽ được chuyển cho bên thứ 3 xử lý.
                    </span>
                  </p>
                </div>
              )}
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
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                disabled={isSubmitting || accepted === null}
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

export default UserRespondAdminDecisionModal;
