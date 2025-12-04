import { useState, useEffect } from 'react';
import { useDispute } from '../../context/DisputeContext';
import { toast } from 'react-hot-toast';

const AdminFinalProcessModal = ({ isOpen, onClose, dispute }) => {
  const [formData, setFormData] = useState({
    decision: '', // 'COMPLAINANT_RIGHT' or 'RESPONDENT_RIGHT'
    reasoning: '',
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
  const { processFinalAgreement } = useDispute();

  // Calculate amounts based on decision
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
    
    const startDate = new Date(product.rentalPeriod?.startDate);
    const endDate = new Date(product.rentalPeriod?.endDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;
    const dailyRental = rental / totalDays;

    if (formData.decision === 'COMPLAINANT_RIGHT') {
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

    if (!formData.decision) {
      toast.error('Vui lòng chọn quyết định');
      return;
    }

    if (!formData.reasoning.trim()) {
      toast.error('Vui lòng nhập lý do quyết định');
      return;
    }

    setIsLoading(true);
    try {
      await processFinalAgreement(dispute._id, {
        decision: formData.decision,
        reasoning: formData.reasoning,
        financialImpact: {
          refundAmount: Number(formData.refundAmount) || 0,
          penaltyAmount: Number(formData.penaltyAmount) || 0
        }
      });
      
      toast.success('Đã xử lý thỏa thuận thành công');
      onClose();
    } catch (error) {
      console.error('Error processing final agreement:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi xử lý');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Owner Decision */}
          {dispute.negotiationRoom?.finalAgreement?.ownerDecision && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Quyết định của chủ hàng:</h4>
              <p className="text-blue-800 whitespace-pre-wrap">{dispute.negotiationRoom.finalAgreement.ownerDecision}</p>
              <p className="text-sm text-blue-600 mt-2">
                ✅ Cả hai bên đã đồng ý với quyết định này
              </p>
            </div>
          )}

          {/* Decision Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quyết định cuối cùng <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.decision}
              onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Chọn bên đúng --</option>
              <option value="COMPLAINANT_RIGHT">Người thuê đúng</option>
              <option value="RESPONDENT_RIGHT">Chủ hàng đúng</option>
            </select>
          </div>

          {/* Financial Impact Preview */}
          {formData.decision && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 space-y-3">
              <h4 className="font-semibold text-yellow-900">💰 Tác động tài chính:</h4>
              
              {formData.decision === 'COMPLAINANT_RIGHT' ? (
                <div className="space-y-2 text-sm">
                  <p className="text-yellow-800">
                    <strong>✅ Người thuê đúng</strong> → Hoàn 100%
                  </p>
                  <div className="bg-white p-3 rounded space-y-1">
                    <p>• Hoàn tiền cọc: <span className="font-semibold text-green-600">{calculatedAmounts.depositRefund.toLocaleString('vi-VN')}đ</span></p>
                    <p>• Hoàn phí thuê: <span className="font-semibold text-green-600">{calculatedAmounts.rentalRefund.toLocaleString('vi-VN')}đ</span></p>
                    <p className="pt-2 border-t border-gray-200 font-bold text-green-600">
                      Tổng hoàn cho người thuê: {calculatedAmounts.totalRefundToRenter.toLocaleString('vi-VN')}đ
                    </p>
                    <p className="text-xs text-gray-600 italic">{calculatedAmounts.shippingFeeNote}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <p className="text-yellow-800">
                    <strong>⚠️ Chủ hàng đúng</strong> → Phạt người thuê 1 ngày
                  </p>
                  <div className="bg-white p-3 rounded space-y-1">
                    <p>• Hoàn tiền cọc: <span className="font-semibold text-green-600">{calculatedAmounts.depositRefund.toLocaleString('vi-VN')}đ</span></p>
                    <p>• Hoàn phí thuê: <span className="font-semibold text-green-600">{calculatedAmounts.rentalRefund.toLocaleString('vi-VN')}đ</span></p>
                    <p>• Phạt cho chủ hàng: <span className="font-semibold text-red-600">-{calculatedAmounts.ownerCompensation.toLocaleString('vi-VN')}đ</span></p>
                    <p className="pt-2 border-t border-gray-200 font-bold text-blue-600">
                      Tổng hoàn cho người thuê: {calculatedAmounts.totalRefundToRenter.toLocaleString('vi-VN')}đ
                    </p>
                    <p className="text-xs text-gray-600 italic">{calculatedAmounts.shippingFeeNote}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reasoning */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do quyết định <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reasoning}
              onChange={(e) => setFormData({ ...formData, reasoning: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nhập lý do quyết định dựa trên thỏa thuận của hai bên..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Giải thích tại sao bạn đưa ra quyết định này dựa trên thỏa thuận của hai bên
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
              type="submit"
              disabled={isLoading || !formData.decision || !formData.reasoning.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {isLoading ? 'Đang xử lý...' : 'Xác nhận quyết định'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminFinalProcessModal;