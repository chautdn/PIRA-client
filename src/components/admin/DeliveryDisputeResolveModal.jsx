import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

/**
 * Admin Modal for TH1,2 - Delivery Disputes
 * Hiển thị ảnh shipper để đối chiếu giữa owner và renter
 * Admin quyết định FAVOR_RENTER (owner sai) hoặc FAVOR_OWNER (renter nói dối)
 */
const DeliveryDisputeResolveModal = ({ dispute, onResolve, onClose }) => {
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Calculate amounts based on decision
  const calculateAmounts = () => {
    if (!dispute.subOrder) return { refund: 0, penalty: 0, creditDeduction: 0 };

    const totalAmount = dispute.subOrder.pricing?.totalAmount || 0;
    const depositAmount = dispute.subOrder.pricing?.subtotalDeposit || 0;
    const rentalDays = dispute.subOrder.rentalPeriod?.duration?.value || 1;
    const oneDayRental = (dispute.subOrder.pricing?.subtotalRental || 0) / rentalDays;

    if (decision === 'FAVOR_RENTER') {
      // Owner sai: Hoàn 100% + trừ 30 điểm owner + cảnh cáo
      return {
        refund: totalAmount,
        refundTo: 'renter',
        penalty: 0,
        creditDeduction: 30,
        creditDeductionUser: 'owner',
        warning: true,
        warningUser: 'owner'
      };
    } else if (decision === 'FAVOR_OWNER') {
      // Renter nói dối: Trừ 1 ngày phí thuê làm phạt → owner, hoàn cọc cho renter, trừ 30 điểm renter + cảnh cáo
      return {
        refund: depositAmount,
        refundTo: 'renter',
        penalty: oneDayRental,
        penaltyFrom: 'renter',
        penaltyTo: 'owner',
        creditDeduction: 30,
        creditDeductionUser: 'renter',
        warning: true,
        warningUser: 'renter'
      };
    }

    return { refund: 0, penalty: 0, creditDeduction: 0 };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!decision) {
      toast.error('Vui lòng chọn quyết định');
      return;
    }

    if (!reason || reason.trim().length < 20) {
      toast.error('Vui lòng nhập lý do chi tiết (ít nhất 20 ký tự)');
      return;
    }

    try {
      setLoading(true);

      const amounts = calculateAmounts();

      await onResolve({
        decision,
        reason,
        ...amounts
      });

      toast.success('Đã giải quyết tranh chấp thành công');
      onClose();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi giải quyết tranh chấp');
    } finally {
      setLoading(false);
    }
  };

  const amounts = calculateAmounts();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Giải quyết tranh chấp giao hàng
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                #{dispute.disputeId} - {dispute.type === 'WRONG_PRODUCT_DELIVERY' ? 'Sản phẩm không đúng mô tả' : 'Thiếu phụ kiện'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Evidence Comparison */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Shipper Photos at Owner (Pickup) */}
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ảnh sản phẩm tại Owner (shipper chụp khi pickup)
              </h3>
              {dispute.shipperEvidence?.pickupPhotos?.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {dispute.shipperEvidence.pickupPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`Pickup ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg border-2 border-blue-300 cursor-pointer hover:opacity-90"
                        onClick={() => window.open(photo, '_blank')}
                      />
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        Pickup #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">Không có ảnh pickup từ shipper</div>
              )}
              {dispute.ownerEvidence?.reason && (
                <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                  <p className="text-sm font-medium text-gray-600 mb-1">Giải thích từ Owner:</p>
                  <p className="text-sm text-gray-700">{dispute.ownerEvidence.reason}</p>
                </div>
              )}
            </div>

            {/* Shipper Photos at Renter */}
            <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ảnh sản phẩm tại Renter (shipper chụp)
              </h3>
              {dispute.shipperEvidence?.deliveryPhotos?.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {dispute.shipperEvidence.deliveryPhotos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Shipper ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg border-2 border-red-300 cursor-pointer hover:opacity-90"
                      onClick={() => window.open(photo, '_blank')}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">Không có ảnh từ shipper</div>
              )}
              {dispute.renterEvidence?.description && (
                <div className="mt-3 p-3 bg-white rounded border border-red-200">
                  <p className="text-sm text-gray-700">{dispute.renterEvidence.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dispute Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Thông tin tranh chấp</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Khách thuê:</span>
                <p className="font-medium">{dispute.renter?.profile?.fullName || dispute.renter?.firstName} ({dispute.renter?.email})</p>
              </div>
              <div>
                <span className="text-gray-600">Chủ thuê:</span>
                <p className="font-medium">{dispute.owner?.profile?.fullName || dispute.owner?.firstName} ({dispute.owner?.email})</p>
              </div>
              <div>
                <span className="text-gray-600">Tổng tiền:</span>
                <p className="font-medium">{dispute.subOrder?.pricing?.totalAmount?.toLocaleString('vi-VN')} VND</p>
              </div>
              <div>
                <span className="text-gray-600">Cọc:</span>
                <p className="font-medium">{dispute.subOrder?.pricing?.subtotalDeposit?.toLocaleString('vi-VN')} VND</p>
              </div>
            </div>
          </div>

          {/* Decision Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Decision Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quyết định của bạn <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDecision('FAVOR_RENTER')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    decision === 'FAVOR_RENTER'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      checked={decision === 'FAVOR_RENTER'}
                      onChange={() => {}}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">Renter đúng (Owner sai)</div>
                      <div className="text-xs text-gray-600 mb-2">
                        Ảnh khác nhau → Sản phẩm lỗi thật
                      </div>
                      <div className="text-xs text-green-700 space-y-0.5">
                        <div>✓ Hoàn 100% cho Renter</div>
                        <div>✓ Trừ 30 điểm Owner</div>
                        <div>✓ Cảnh cáo Owner (lần 1)</div>
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('FAVOR_OWNER')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    decision === 'FAVOR_OWNER'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      checked={decision === 'FAVOR_OWNER'}
                      onChange={() => {}}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">Owner đúng (Renter nói dối)</div>
                      <div className="text-xs text-gray-600 mb-2">
                        Ảnh giống nhau → Sản phẩm không lỗi
                      </div>
                      <div className="text-xs text-blue-700 space-y-0.5">
                        <div>✓ Phạt Renter 1 ngày thuê → Owner</div>
                        <div>✓ Hoàn cọc cho Renter</div>
                        <div>✓ Trừ 30 điểm Renter</div>
                        <div>✓ Cảnh cáo Renter (lần 1)</div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Reason */}
            {decision && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do quyết định <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Giải thích chi tiết lý do quyết định dựa trên việc đối chiếu ảnh..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tối thiểu 20 ký tự. Mô tả cụ thể sự khác biệt giữa các ảnh.
                </p>
              </motion.div>
            )}

            {/* Summary */}
            {decision && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h4 className="font-medium text-blue-900 mb-2">Tóm tắt hành động</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  {amounts.refund > 0 && (
                    <div>• Hoàn {amounts.refund.toLocaleString('vi-VN')} VND cho {amounts.refundTo === 'renter' ? 'Khách thuê' : 'Chủ thuê'}</div>
                  )}
                  {amounts.penalty > 0 && (
                    <div>• Phạt {amounts.penalty.toLocaleString('vi-VN')} VND từ {amounts.penaltyFrom === 'renter' ? 'Khách thuê' : 'Chủ thuê'} → {amounts.penaltyTo === 'owner' ? 'Chủ thuê' : 'Khách thuê'}</div>
                  )}
                  {amounts.creditDeduction > 0 && (
                    <div>• Trừ {amounts.creditDeduction} điểm tín nhiệm từ {amounts.creditDeductionUser === 'renter' ? 'Khách thuê' : 'Chủ thuê'}</div>
                  )}
                  {amounts.warning && (
                    <div>• Cảnh cáo {amounts.warningUser === 'renter' ? 'Khách thuê' : 'Chủ thuê'} (3 lần cảnh cáo = ban tài khoản)</div>
                  )}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                disabled={loading || !decision || !reason}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận giải quyết'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default DeliveryDisputeResolveModal;
