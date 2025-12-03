import { useState, useEffect } from 'react';

const AdminResponseModal = ({ isOpen, onClose, onSubmit, dispute }) => {
  const [formData, setFormData] = useState({
    decision: '', // 'COMPLAINANT_RIGHT' or 'RESPONDENT_RIGHT'
    reasoning: '',
    refundAmount: 0,
    penaltyAmount: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedAmounts, setCalculatedAmounts] = useState({
    depositRefund: 0,
    rentalRefund: 0,
    ownerCompensation: 0,
    totalRefundToRenter: 0,
    shippingFeeNote: ''
  });

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
    
    // Calculate rental days
    const startDate = new Date(product.rentalPeriod?.startDate);
    const endDate = new Date(product.rentalPeriod?.endDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;
    const dailyRental = rental / totalDays;

    if (formData.decision === 'COMPLAINANT_RIGHT') {
      // Renter đúng -> Hoàn 100% deposit + 100% rental (shipping fee mất)
      setCalculatedAmounts({
        depositRefund: deposit,
        rentalRefund: rental,
        ownerCompensation: 0,
        totalRefundToRenter: deposit + rental,
        shippingFeeNote: `Phí ship ${shippingFee.toLocaleString('vi-VN')}đ sẽ không được hoàn lại`
      });
      setFormData(prev => ({ ...prev, refundAmount: deposit + rental }));
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
              <div className="space-y-3">
                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-green-50 hover:border-green-300 transition-colors">
                  <input
                    type="radio"
                    checked={formData.decision === 'COMPLAINANT_RIGHT'}
                    onChange={() => setFormData(prev => ({ ...prev, decision: 'COMPLAINANT_RIGHT' }))}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900">Người khiếu nại đúng (Renter)</span>
                    <p className="text-xs text-gray-600 mt-1 mb-2">
                      Owner có lỗi → Renter được hoàn 100% tiền cọc + tiền thuê
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded p-3 mt-2 text-xs space-y-1">
                      <div className="font-medium text-green-900 mb-2">💰 Xử lý tài chính:</div>
                      <div className="text-green-800">✓ Renter: +100% cọc + 100% tiền thuê + 5đ credit (nếu {'<'}100) + 5đ loyalty</div>
                      <div className="text-red-800">✗ Owner: -30đ credit + 5đ loyalty + Cảnh cáo lần 1</div>
                      <div className="text-gray-600 mt-1">⚠️ Phí ship sẽ không được hoàn lại</div>
                    </div>
                  </div>
                </label>
                
                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-red-50 hover:border-red-300 transition-colors">
                  <input
                    type="radio"
                    checked={formData.decision === 'RESPONDENT_RIGHT'}
                    onChange={() => setFormData(prev => ({ ...prev, decision: 'RESPONDENT_RIGHT' }))}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900">Bên bị khiếu nại đúng (Owner)</span>
                    <p className="text-xs text-gray-600 mt-1 mb-2">
                      Renter khiếu nại sai → Phạt 1 ngày thuê
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded p-3 mt-2 text-xs space-y-1">
                      <div className="font-medium text-red-900 mb-2">💰 Xử lý tài chính:</div>
                      <div className="text-green-800">✓ Renter: +100% cọc + tiền thuê (trừ 1 ngày phạt)</div>
                      <div className="text-green-800">✓ Owner: +Tiền thuê 1 ngày (từ phạt Renter)</div>
                      <div className="text-red-800">✗ Renter: -30đ credit + 5đ loyalty + Cảnh cáo lần 1</div>
                      <div className="text-gray-600 mt-1">⚠️ Phí ship sẽ không được hoàn lại</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Calculated Amounts Display */}
            {formData.decision && calculatedAmounts.totalRefundToRenter > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">📊 Chi tiết tính toán tự động:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Hoàn tiền cọc cho Renter:</span>
                    <span className="font-medium text-green-700">+{calculatedAmounts.depositRefund.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Hoàn tiền thuê cho Renter:</span>
                    <span className="font-medium text-green-700">+{calculatedAmounts.rentalRefund.toLocaleString('vi-VN')}đ</span>
                  </div>
                  {calculatedAmounts.ownerCompensation > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Bồi thường cho Owner (1 ngày):</span>
                      <span className="font-medium text-green-700">+{calculatedAmounts.ownerCompensation.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  <div className="border-t border-blue-300 pt-2 mt-2 flex justify-between">
                    <span className="font-semibold text-blue-900">Tổng hoàn cho Renter:</span>
                    <span className="font-bold text-blue-900">{calculatedAmounts.totalRefundToRenter.toLocaleString('vi-VN')}đ</span>
                  </div>
                  {calculatedAmounts.shippingFeeNote && (
                    <div className="text-xs text-gray-600 italic mt-2">
                      ℹ️ {calculatedAmounts.shippingFeeNote}
                    </div>
                  )}
                </div>
              </div>
            )}

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
                placeholder="Giải thích chi tiết lý do quyết định của bạn dựa trên bằng chứng..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Mô tả rõ ràng căn cứ và bằng chứng để đưa ra quyết định này
              </p>
            </div>

            {/* Warning about penalties */}
            {formData.decision && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <div className="text-xs text-yellow-800">
                    <p className="font-semibold mb-1">Lưu ý về hình phạt:</p>
                    {formData.decision === 'COMPLAINANT_RIGHT' ? (
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Owner sẽ bị trừ 30 điểm credit</li>
                        <li>Owner sẽ tăng 5 điểm loyalty (negative)</li>
                        <li>Owner nhận cảnh cáo lần 1 (3 lần = ban account)</li>
                      </ul>
                    ) : (
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Renter sẽ bị trừ 30 điểm credit</li>
                        <li>Renter sẽ tăng 5 điểm loyalty (negative)</li>
                        <li>Renter nhận cảnh cáo lần 1 (3 lần = ban account)</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Refund Amount - Read only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số tiền hoàn lại cho Renter
              </label>
              <input
                type="number"
                value={formData.refundAmount}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Tính toán tự động dựa trên quyết định
              </p>
            </div>

            {/* Penalty Amount - Read only */}
            {formData.decision === 'RESPONDENT_RIGHT' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tiền bồi thường cho Owner (từ phạt Renter)
                </label>
                <input
                  type="number"
                  value={formData.penaltyAmount}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Bằng tiền thuê 1 ngày (tính tự động)
                </p>
              </div>
            )}

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
