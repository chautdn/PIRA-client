import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import disputeService from '../../services/dispute';

/**
 * TH6: LATE_RETURN_PENALTY
 * Khách thuê trả muộn, owner yêu cầu phạt
 * Flow: Owner tạo → Renter có 24h phản hồi → Nếu không đồng ý → Admin quyết định
 */
const LateReturnPenaltyForm = ({ order, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    lateHours: '',
    penaltyAmount: '',
    reason: '',
    evidence: []
  });
  const [loading, setLoading] = useState(false);

  // Calculate penalty based on late hours
  const calculatePenalty = (hours) => {
    const hoursNum = parseInt(hours) || 0;
    if (hoursNum <= 0) return 0;
    
    // Example: 10% rental price per hour late, max 200%
    const hourlyRate = order.price * 0.1;
    const penalty = Math.min(hourlyRate * hoursNum, order.price * 2);
    return Math.round(penalty);
  };

  const handleHoursChange = (value) => {
    const hours = parseInt(value) || '';
    setFormData(prev => ({
      ...prev,
      lateHours: value,
      penaltyAmount: hours ? calculatePenalty(hours).toString() : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hours = parseInt(formData.lateHours);
    const penalty = parseInt(formData.penaltyAmount);

    if (!hours || hours <= 0) {
      toast.error('Vui lòng nhập số giờ trả muộn');
      return;
    }

    if (!penalty || penalty <= 0) {
      toast.error('Vui lòng nhập số tiền phạt');
      return;
    }

    if (!formData.reason || formData.reason.trim().length < 20) {
      toast.error('Vui lòng giải thích lý do phạt (ít nhất 20 ký tự)');
      return;
    }

    try {
      setLoading(true);

      const disputeData = {
        subOrderId: order._id,
        lateHours: hours,
        penaltyAmount: penalty,
        reason: formData.reason,
        ownerEvidence: {
          evidence: formData.evidence
        }
      };

      const result = await disputeService.createLateReturnPenalty(disputeData);

      toast.success('Đã gửi yêu cầu phạt. Khách thuê có 24h để phản hồi.');
      
      if (onSuccess) {
        onSuccess(result.metadata);
      }
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const returnDate = new Date(order.endDate);
  const actualReturnDate = order.actualReturnDate ? new Date(order.actualReturnDate) : new Date();
  const lateHoursCalculated = Math.max(0, Math.floor((actualReturnDate - returnDate) / (1000 * 60 * 60)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Yêu cầu phạt trả muộn
        </h2>
        <p className="text-sm text-gray-600">
          Mã đơn: <span className="font-medium">{order.orderCode}</span>
        </p>
      </div>

      {/* Order info */}
      <div className="mb-6 grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-600">Ngày phải trả</p>
          <p className="font-medium text-gray-900">{returnDate.toLocaleString('vi-VN')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Ngày trả thực tế</p>
          <p className="font-medium text-gray-900">{actualReturnDate.toLocaleString('vi-VN')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Số giờ trễ</p>
          <p className="font-medium text-red-600">{lateHoursCalculated} giờ</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Giá thuê (mỗi ngày)</p>
          <p className="font-medium text-gray-900">{order.price?.toLocaleString('vi-VN')} VND</p>
        </div>
      </div>

      {/* Process flow */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Quy trình xử lý</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-start">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
            <p>Bạn gửi yêu cầu phạt với số giờ trễ và lý do</p>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
            <p>Khách thuê có 24h để phản hồi (chấp nhận phạt hoặc giải thích lý do)</p>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
            <p>Nếu khách CHẤP NHẬN hoặc KHÔNG PHẢN HỒI → Trừ tiền cọc, khách bị trừ điểm</p>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
            <p>Nếu khách KHÔNG ĐỒNG Ý (có lý do chính đáng) → Admin xem xét (trong 48h)</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Late hours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số giờ trả muộn <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.lateHours}
            onChange={(e) => handleHoursChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={lateHoursCalculated.toString()}
            min="1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Hệ thống tự động tính: {lateHoursCalculated} giờ. Bạn có thể điều chỉnh nếu cần.
          </p>
        </div>

        {/* Penalty amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số tiền phạt (VND) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.penaltyAmount}
            onChange={(e) => setFormData({ ...formData, penaltyAmount: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            Gợi ý: {calculatePenalty(formData.lateHours || lateHoursCalculated).toLocaleString('vi-VN')} VND 
            (10% giá thuê/giờ, tối đa 200% giá thuê)
          </p>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lý do yêu cầu phạt <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ví dụ: Khách thuê trả muộn 5 giờ mà không báo trước. Trong thời gian này tôi đã có lịch cho thuê khác và phải hủy, gây thiệt hại. Khách cũng không trả lời điện thoại..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Tối thiểu 20 ký tự. Giải thích tác động của việc trả muộn.
          </p>
        </div>

        {/* Evidence (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bằng chứng bổ sung (không bắt buộc)
          </label>
          <textarea
            value={formData.evidence.join('\n')}
            onChange={(e) => setFormData({ ...formData, evidence: e.target.value.split('\n').filter(l => l.trim()) })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ví dụ:&#10;- Screenshot tin nhắn nhắc trả hàng&#10;- Screenshot lịch cho thuê bị hủy&#10;- Lịch sử cuộc gọi không trả lời"
          />
          <p className="text-xs text-gray-500 mt-1">
            Mỗi dòng là một bằng chứng. Screenshot tin nhắn, cuộc gọi, email sẽ hỗ trợ tốt.
          </p>
        </div>

        {/* Important notes */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Lưu ý quan trọng</h3>
              <div className="mt-2 text-sm text-yellow-700 space-y-1">
                <p>• Phạt KHÔNG QUÁ 200% giá thuê (theo quy định)</p>
                <p>• Khách có thể KHIẾU NẠI nếu có lý do chính đáng (tai nạn, bệnh viện...)</p>
                <p>• Admin sẽ xem xét bằng chứng 2 bên nếu khách không đồng ý</p>
                <p>• Nếu khách không phản hồi trong 24h → Tự động chấp nhận phạt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Penalty calculation */}
        {formData.lateHours && formData.penaltyAmount && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
          >
            <h3 className="font-medium text-gray-900 mb-3">Tổng kết</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Số giờ trễ:</p>
                <p className="font-bold text-purple-600">{formData.lateHours} giờ</p>
              </div>
              <div>
                <p className="text-gray-600">Số tiền phạt:</p>
                <p className="font-bold text-purple-600">{parseInt(formData.penaltyAmount).toLocaleString('vi-VN')} VND</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-600">Khách thuê sẽ bị:</p>
                <ul className="list-disc list-inside text-purple-700 mt-1 space-y-1">
                  <li>Trừ {parseInt(formData.penaltyAmount).toLocaleString('vi-VN')} VND từ tiền cọc</li>
                  <li>Trừ 10 điểm tín dụng</li>
                  <li>Nhận 1 cảnh cáo (nếu tái phạm sẽ bị khóa tài khoản)</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400"
            disabled={loading || !formData.lateHours || !formData.penaltyAmount || !formData.reason}
          >
            {loading ? 'Đang gửi...' : 'Gửi yêu cầu phạt'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default LateReturnPenaltyForm;
