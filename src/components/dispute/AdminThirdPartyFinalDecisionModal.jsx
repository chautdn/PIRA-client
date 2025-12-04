import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import disputeApi from '../../services/dispute.Api';

const AdminThirdPartyFinalDecisionModal = ({ isOpen, onClose, dispute, onSuccess }) => {
  const [formData, setFormData] = useState({
    decision: '', // 'COMPLAINANT_RIGHT' or 'RESPONDENT_RIGHT'
    resolutionText: '',
    refundAmount: 0,
    penaltyAmount: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedAmounts, setCalculatedAmounts] = useState({
    depositRefund: 0,
    rentalRefund: 0,
    ownerCompensation: 0,
    totalRefundToRenter: 0,
    shippingFeeNote: ''
  });

  // Calculate amounts based on decision (giống quyết định sơ bộ)
  useEffect(() => {
    if (!dispute || !formData.decision) {
      setCalculatedAmounts({
        depositRefund: 0,
        rentalRefund: 0,
        ownerCompensation: 0,
        totalRefundToRenter: 0,
        shippingFeeNote: ''
      });
      return;
    }

    const product = dispute.subOrder?.products?.[dispute.productIndex];
    if (!product) return;

    const deposit = product.totalDeposit || 0;
    const rental = product.totalRental || 0;
    const shippingFee = product.totalShippingFee || 0;
    
    // Calculate rental days
    const startDate = new Date(product.rentalPeriod?.startDate);
    const endDate = new Date(product.rentalPeriod?.endDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;
    const dailyRental = rental / totalDays;

    if (formData.decision === 'COMPLAINANT_RIGHT') {
      // Renter đúng -> Hoàn 100% deposit + 100% rental
      setCalculatedAmounts({
        depositRefund: deposit,
        rentalRefund: rental,
        ownerCompensation: 0,
        totalRefundToRenter: deposit + rental,
        shippingFeeNote: `Phí ship ${shippingFee.toLocaleString('vi-VN')}đ sẽ không được hoàn lại`
      });
      setFormData(prev => ({ 
        ...prev, 
        refundAmount: deposit + rental,
        penaltyAmount: 0
      }));
    } else if (formData.decision === 'RESPONDENT_RIGHT') {
      // Renter sai -> Hoàn 100% deposit + phạt 1 ngày thuê
      const penaltyAmount = dailyRental;
      const refundToRenter = deposit + rental - penaltyAmount;
      
      setCalculatedAmounts({
        depositRefund: deposit,
        rentalRefund: rental - penaltyAmount,
        ownerCompensation: penaltyAmount,
        totalRefundToRenter: refundToRenter,
        shippingFeeNote: `Phí ship ${shippingFee.toLocaleString('vi-VN')}đ sẽ không được hoàn lại`
      });
      setFormData(prev => ({ 
        ...prev, 
        refundAmount: refundToRenter,
        penaltyAmount: penaltyAmount
      }));
    }
  }, [formData.decision, dispute]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.decision) {
      toast.error('Vui lòng chọn quyết định');
      return;
    }

    if (!formData.resolutionText.trim()) {
      toast.error('Vui lòng nhập giải thích quyết định');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        resolutionText: formData.resolutionText,
        decision: formData.decision,
        financialImpact: {
          refundAmount: Number(formData.refundAmount) || 0,
          penaltyAmount: Number(formData.penaltyAmount) || 0
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
            {/* Chọn quyết định */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quyết định cuối cùng <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {/* Renter đúng */}
                <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.decision === 'COMPLAINANT_RIGHT' 
                    ? 'bg-green-50 border-green-500' 
                    : 'border-gray-300 hover:bg-green-50 hover:border-green-300'
                }`}>
                  <input
                    type="radio"
                    checked={formData.decision === 'COMPLAINANT_RIGHT'}
                    onChange={() => setFormData(prev => ({ ...prev, decision: 'COMPLAINANT_RIGHT' }))}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900">Người khiếu nại đúng (Renter)</span>
                    <p className="text-xs text-gray-600 mt-1">
                      Owner có lỗi → Renter được hoàn 100% tiền cọc + tiền thuê
                    </p>
                    {formData.decision === 'COMPLAINANT_RIGHT' && calculatedAmounts.totalRefundToRenter > 0 && (
                      <div className="bg-white border border-green-200 rounded p-3 mt-3 text-xs space-y-1">
                        <div className="font-medium text-green-900 mb-2">💰 Chi tiết tài chính:</div>
                        <div className="text-green-800">✓ Hoàn tiền cọc: {calculatedAmounts.depositRefund.toLocaleString('vi-VN')}đ</div>
                        <div className="text-green-800">✓ Hoàn tiền thuê: {calculatedAmounts.rentalRefund.toLocaleString('vi-VN')}đ</div>
                        <div className="font-semibold text-green-900 pt-1 border-t border-green-200 mt-2">
                          Tổng hoàn cho Renter: {calculatedAmounts.totalRefundToRenter.toLocaleString('vi-VN')}đ
                        </div>
                        {calculatedAmounts.shippingFeeNote && (
                          <div className="text-gray-600 mt-2">⚠️ {calculatedAmounts.shippingFeeNote}</div>
                        )}
                        <div className="text-green-800 mt-2">✓ Renter: +5đ credit (nếu {'<'}100) + 5đ loyalty</div>
                        <div className="text-red-800">✗ Owner: -30đ credit + 5đ loyalty + Cảnh cáo</div>
                      </div>
                    )}
                  </div>
                </label>
                
                {/* Owner đúng */}
                <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.decision === 'RESPONDENT_RIGHT' 
                    ? 'bg-red-50 border-red-500' 
                    : 'border-gray-300 hover:bg-red-50 hover:border-red-300'
                }`}>
                  <input
                    type="radio"
                    checked={formData.decision === 'RESPONDENT_RIGHT'}
                    onChange={() => setFormData(prev => ({ ...prev, decision: 'RESPONDENT_RIGHT' }))}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900">Bên bị khiếu nại đúng (Owner)</span>
                    <p className="text-xs text-gray-600 mt-1">
                      Renter có lỗi → Hoàn tiền cọc + tiền thuê - phạt 1 ngày thuê
                    </p>
                    {formData.decision === 'RESPONDENT_RIGHT' && calculatedAmounts.totalRefundToRenter > 0 && (
                      <div className="bg-white border border-red-200 rounded p-3 mt-3 text-xs space-y-1">
                        <div className="font-medium text-red-900 mb-2">💰 Chi tiết tài chính:</div>
                        <div className="text-green-800">✓ Hoàn tiền cọc: {calculatedAmounts.depositRefund.toLocaleString('vi-VN')}đ</div>
                        <div className="text-green-800">✓ Hoàn tiền thuê: {calculatedAmounts.rentalRefund.toLocaleString('vi-VN')}đ</div>
                        <div className="text-red-800">✗ Phạt Renter (1 ngày): -{calculatedAmounts.ownerCompensation.toLocaleString('vi-VN')}đ</div>
                        <div className="font-semibold text-blue-900 pt-1 border-t border-red-200 mt-2">
                          Tổng hoàn cho Renter: {calculatedAmounts.totalRefundToRenter.toLocaleString('vi-VN')}đ
                        </div>
                        {calculatedAmounts.shippingFeeNote && (
                          <div className="text-gray-600 mt-2">⚠️ {calculatedAmounts.shippingFeeNote}</div>
                        )}
                        <div className="text-green-800 mt-2">✓ Owner nhận bù: +{calculatedAmounts.ownerCompensation.toLocaleString('vi-VN')}đ</div>
                        <div className="text-red-800">✗ Renter: -30đ credit + 5đ loyalty + Cảnh cáo</div>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Giải thích quyết định */}
            <div>
              <label htmlFor="resolutionText" className="block text-sm font-medium text-gray-700 mb-2">
                Giải thích quyết định <span className="text-red-500">*</span>
              </label>
              <textarea
                id="resolutionText"
                rows={5}
                value={formData.resolutionText}
                onChange={(e) => setFormData({...formData, resolutionText: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Dựa trên kết quả từ bên thứ 3, admin đưa ra quyết định cuối cùng..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Hãy giải thích rõ ràng quyết định dựa trên bằng chứng từ bên thứ 3
              </p>
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
