import { useState } from 'react';
import { useDispute } from '../../context/DisputeContext';
import { toast } from 'react-hot-toast';

const AdminFinalProcessModal = ({ isOpen, onClose, dispute }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { processFinalAgreement } = useDispute();

  if (!isOpen) return null;

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await processFinalAgreement(dispute._id, {
        decision: 'APPROVE_AGREEMENT',
        reasoning: 'Phê duyệt thỏa thuận đã được cả hai bên đồng ý'
      });
      
      toast.success('Đã phê duyệt thỏa thuận thành công');
      onClose();
    } catch (error) {
      console.error('Error processing final agreement:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi xử lý');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Xử lý kết quả đàm phán
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
          {/* Hiển thị thông tin đàm phán */}
          {dispute.negotiationRoom?.finalAgreement?.ownerDecision && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Quyết định của chủ sở hữu:</h4>
              <p className="text-blue-800">{dispute.negotiationRoom.finalAgreement.ownerDecision}</p>
              <p className="text-sm text-blue-600 mt-2">
                Cả hai bên đã đồng ý với quyết định này
              </p>
            </div>
          )}

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-green-800">
              Cả hai bên đã thỏa thuận với nhau. Admin chỉ cần phê duyệt để hoàn tất quá trình giải quyết tranh chấp.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleApprove}
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {isLoading ? 'Đang xử lý...' : 'Phê duyệt thỏa thuận'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFinalProcessModal;