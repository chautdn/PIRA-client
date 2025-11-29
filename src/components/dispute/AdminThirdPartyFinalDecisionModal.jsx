import { useState } from 'react';
import { toast } from 'react-hot-toast';
import disputeApi from '../../services/dispute.Api';

const AdminThirdPartyFinalDecisionModal = ({ isOpen, onClose, dispute, onSuccess }) => {
  const [formData, setFormData] = useState({
    resolutionText: '',
    refundAmount: 0,
    penaltyAmount: 0,
    compensationAmount: 0,
    paidBy: '',
    paidTo: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.resolutionText.trim()) {
      toast.error('Vui lòng nhập quyết định cuối cùng');
      return;
    }

    // Validate financial impact
    const totalAmount = formData.refundAmount + formData.penaltyAmount + formData.compensationAmount;
    if (totalAmount > 0) {
      if (!formData.paidBy || !formData.paidTo) {
        toast.error('Vui lòng chọn người trả và người nhận tiền');
        return;
      }
      if (formData.paidBy === formData.paidTo) {
        toast.error('Người trả và người nhận không thể giống nhau');
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = {
        resolutionText: formData.resolutionText,
        financialImpact: {
          refundAmount: Number(formData.refundAmount) || 0,
          penaltyAmount: Number(formData.penaltyAmount) || 0,
          compensationAmount: Number(formData.compensationAmount) || 0,
          paidBy: formData.paidBy || undefined,
          paidTo: formData.paidTo || undefined
        }
      };

      await disputeApi.makeFinalDecision(dispute._id, payload);
      toast.success('Đã đưa ra quyết định cuối cùng thành công');
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Final decision error:', error);
      toast.error(error.response?.data?.message || 'Có lỗi khi đưa ra quyết định');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-xl font-semibold text-gray-900">
            Quyết định cuối cùng từ kết quả bên thứ 3
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

        <form onSubmit={handleSubmit} className="p-6">
          {/* Thông tin bên thứ 3 (readonly) */}
          {dispute.thirdPartyResolution?.evidence && (
            <div className="bg-purple-50 p-4 rounded-lg mb-6 border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3">Kết quả từ bên thứ 3:</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium text-purple-800">Quyết định chính thức:</p>
                  <p className="text-purple-700 bg-white p-3 rounded mt-1 whitespace-pre-wrap">
                    {dispute.thirdPartyResolution.evidence.officialDecision}
                  </p>
                </div>
                {dispute.thirdPartyResolution.evidence.photos?.length > 0 && (
                  <p className="text-purple-700">
                    📷 Có {dispute.thirdPartyResolution.evidence.photos.length} ảnh bằng chứng
                  </p>
                )}
                {dispute.thirdPartyResolution.evidence.documents?.length > 0 && (
                  <p className="text-purple-700">
                    📄 Có {dispute.thirdPartyResolution.evidence.documents.length} tài liệu đính kèm
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Quyết định cuối cùng */}
            <div>
              <label htmlFor="resolutionText" className="block text-sm font-medium text-gray-700 mb-2">
                Quyết định cuối cùng của Admin <span className="text-red-500">*</span>
              </label>
              <textarea
                id="resolutionText"
                rows={6}
                value={formData.resolutionText}
                onChange={(e) => setFormData({...formData, resolutionText: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Dựa trên kết quả từ bên thứ 3, admin đưa ra quyết định cuối cùng..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Hãy giải thích rõ ràng quyết định dựa trên kết quả từ bên thứ 3
              </p>
            </div>

            {/* Tác động tài chính */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-4">Tác động tài chính (nếu có)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label htmlFor="refundAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Số tiền hoàn lại (VNĐ)
                  </label>
                  <input
                    type="number"
                    id="refundAmount"
                    min="0"
                    step="1000"
                    value={formData.refundAmount}
                    onChange={(e) => setFormData({...formData, refundAmount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label htmlFor="penaltyAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Số tiền phạt (VNĐ)
                  </label>
                  <input
                    type="number"
                    id="penaltyAmount"
                    min="0"
                    step="1000"
                    value={formData.penaltyAmount}
                    onChange={(e) => setFormData({...formData, penaltyAmount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label htmlFor="compensationAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Số tiền bồi thường (VNĐ)
                  </label>
                  <input
                    type="number"
                    id="compensationAmount"
                    min="0"
                    step="1000"
                    value={formData.compensationAmount}
                    onChange={(e) => setFormData({...formData, compensationAmount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Người trả và người nhận */}
              {(formData.refundAmount > 0 || formData.penaltyAmount > 0 || formData.compensationAmount > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700 mb-2">
                      Người trả tiền <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="paidBy"
                      value={formData.paidBy}
                      onChange={(e) => setFormData({...formData, paidBy: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="">-- Chọn người trả --</option>
                      <option value={dispute.complainant._id}>
                        {dispute.complainant.profile?.fullName} (Người khiếu nại)
                      </option>
                      <option value={dispute.respondent._id}>
                        {dispute.respondent.profile?.fullName} (Bên bị khiếu nại)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="paidTo" className="block text-sm font-medium text-gray-700 mb-2">
                      Người nhận tiền <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="paidTo"
                      value={formData.paidTo}
                      onChange={(e) => setFormData({...formData, paidTo: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="">-- Chọn người nhận --</option>
                      <option value={dispute.complainant._id}>
                        {dispute.complainant.profile?.fullName} (Người khiếu nại)
                      </option>
                      <option value={dispute.respondent._id}>
                        {dispute.respondent.profile?.fullName} (Bên bị khiếu nại)
                      </option>
                    </select>
                  </div>

                  {/* Tổng tiền */}
                  <div className="md:col-span-2 bg-white p-3 rounded border border-gray-300">
                    <p className="text-sm font-medium text-gray-700">Tổng cộng:</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      {(
                        Number(formData.refundAmount || 0) + 
                        Number(formData.penaltyAmount || 0) + 
                        Number(formData.compensationAmount || 0)
                      ).toLocaleString('vi-VN')} VNĐ
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Cảnh báo */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Lưu ý:</strong> Quyết định này là quyết định cuối cùng và không thể thay đổi. 
                    Hãy chắc chắn bạn đã xem xét kỹ lưỡng tất cả bằng chứng và kết quả từ bên thứ 3.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                'Đưa ra quyết định cuối cùng'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminThirdPartyFinalDecisionModal;
