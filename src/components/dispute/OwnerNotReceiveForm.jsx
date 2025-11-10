import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import disputeService from '../../services/dispute';

/**
 * TH7: OWNER_NOT_RECEIVE
 * Owner không nhận lại được sản phẩm (khách không trả)
 * Flow: Owner tạo → Auto chuyển Admin → Admin xác minh → Khách bị phạt nặng
 */
const OwnerNotReceiveForm = ({ order, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    description: '',
    contactAttempts: [''],
    lastKnownLocation: '',
    policeReportFiled: false,
    policeReportNumber: ''
  });
  const [loading, setLoading] = useState(false);

  const addContactAttempt = () => {
    setFormData(prev => ({
      ...prev,
      contactAttempts: [...prev.contactAttempts, '']
    }));
  };

  const updateContactAttempt = (index, value) => {
    const newAttempts = [...formData.contactAttempts];
    newAttempts[index] = value;
    setFormData(prev => ({
      ...prev,
      contactAttempts: newAttempts
    }));
  };

  const removeContactAttempt = (index) => {
    setFormData(prev => ({
      ...prev,
      contactAttempts: prev.contactAttempts.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description || formData.description.trim().length < 50) {
      toast.error('Vui lòng mô tả chi tiết tình huống (ít nhất 50 ký tự)');
      return;
    }

    const validAttempts = formData.contactAttempts.filter(a => a.trim().length > 0);
    if (validAttempts.length < 2) {
      toast.error('Cần ít nhất 2 lần liên lạc với khách');
      return;
    }

    if (!formData.lastKnownLocation || formData.lastKnownLocation.trim().length < 10) {
      toast.error('Vui lòng cung cấp vị trí cuối cùng biết về khách/sản phẩm');
      return;
    }

    try {
      setLoading(true);

      const disputeData = {
        subOrderId: order._id,
        description: formData.description,
        ownerEvidence: {
          contactAttempts: validAttempts,
          lastKnownLocation: formData.lastKnownLocation,
          policeReportFiled: formData.policeReportFiled,
          policeReportNumber: formData.policeReportNumber || undefined
        }
      };

      const result = await disputeService.createOwnerNotReceive(disputeData);

      toast.success('Đã gửi khiếu nại. Admin sẽ xử lý khẩn cấp trong 24h.');
      
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

  const expectedReturnDate = new Date(order.endDate);
  const daysOverdue = Math.max(0, Math.floor((new Date() - expectedReturnDate) / (1000 * 60 * 60 * 24)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-red-600 mb-2">
          Báo cáo không nhận lại được sản phẩm
        </h2>
        <p className="text-sm text-gray-600">
          Mã đơn: <span className="font-medium">{order.orderCode}</span>
        </p>
        <div className="mt-2 inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
          Quá hạn {daysOverdue} ngày
        </div>
      </div>

      {/* Critical warning */}
      <div className="mb-6 bg-red-50 border-l-4 border-red-600 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Đây là tranh chấp NGHIÊM TRỌNG nhất</h3>
            <div className="mt-2 text-sm text-red-700 space-y-1">
              <p>• Chỉ tạo tranh chấp này khi đã HẾT CÁCH liên lạc với khách</p>
              <p>• Khách sẽ bị BỒI THƯỜNG 200% giá trị sản phẩm + KHÓA TÀI KHOẢN VĨNh VIỄN</p>
              <p>• Nếu bạn BÁO SAI → Bạn sẽ bị XỬ PHẠT nghiêm khắc</p>
              <p>• Nên báo cảnh sát trước khi tạo tranh chấp này</p>
            </div>
          </div>
        </div>
      </div>

      {/* Process flow */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Quy trình xử lý</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-start">
            <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
            <p>Bạn gửi khiếu nại với bằng chứng đã cố gắng liên lạc</p>
          </div>
          <div className="flex items-start">
            <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
            <p>Admin XÁC MINH KHẨN CẤP trong 24h (gọi điện, kiểm tra thông tin)</p>
          </div>
          <div className="flex items-start">
            <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
            <p>Nếu xác nhận khách cố ý không trả → KHÓA TÀI KHOẢN + BỒI THƯỜNG 200%</p>
          </div>
          <div className="flex items-start">
            <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
            <p>Hệ thống chuyển khoản bồi thường cho bạn + Thêm vào BLACKLIST</p>
          </div>
          <div className="flex items-start">
            <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">5</span>
            <p>Nếu cần, admin sẽ hỗ trợ làm việc với cơ quan chức năng</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả chi tiết tình huống <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Ví dụ: Khách thuê đã quá hạn trả 7 ngày. Tôi đã gọi điện 10 lần nhưng không ai nhấc máy. Nhắn tin Zalo, Facebook không được trả lời. Đã đến địa chỉ đăng ký nhưng không có ai ở đó. Tôi nghi ngờ khách đã cố ý bỏ trốn với sản phẩm..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Tối thiểu 50 ký tự. Mô tả càng chi tiết càng tốt.
          </p>
        </div>

        {/* Contact attempts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lịch sử liên lạc với khách <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Ghi lại TẤT CẢ các lần bạn đã cố gắng liên lạc (thời gian, phương thức, kết quả)
          </p>
          <div className="space-y-2">
            {formData.contactAttempts.map((attempt, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={attempt}
                  onChange={(e) => updateContactAttempt(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder={`Lần ${index + 1}: Ví dụ: 20/01/2024 10:30 - Gọi điện không ai nghe, để lại voicemail`}
                />
                {formData.contactAttempts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeContactAttempt(index)}
                    className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addContactAttempt}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-red-400 hover:text-red-600 transition-colors"
            >
              + Thêm lần liên lạc
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Cần ít nhất 2 lần liên lạc. Càng nhiều càng tốt.
          </p>
        </div>

        {/* Last known location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vị trí cuối cùng biết về khách/sản phẩm <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.lastKnownLocation}
            onChange={(e) => setFormData({ ...formData, lastKnownLocation: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Địa chỉ đăng ký: 123 Nguyễn Văn A, Quận 1, TP.HCM. Đã đến kiểm tra nhưng không có ai. Hàng xóm nói người thuê đã dọn đi 3 ngày trước..."
          />
        </div>

        {/* Police report */}
        <div>
          <label className="flex items-center mb-3">
            <input
              type="checkbox"
              checked={formData.policeReportFiled}
              onChange={(e) => setFormData({ ...formData, policeReportFiled: e.target.checked })}
              className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              Tôi đã báo cảnh sát
            </span>
          </label>

          {formData.policeReportFiled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số biên bản/hồ sơ cảnh sát
              </label>
              <input
                type="text"
                value={formData.policeReportNumber}
                onChange={(e) => setFormData({ ...formData, policeReportNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Ví dụ: BB-123456-20240120"
              />
              <p className="text-xs text-green-600 mt-1">
                ✓ Việc báo cảnh sát sẽ giúp quá trình xử lý nhanh hơn
              </p>
            </motion.div>
          )}
        </div>

        {/* Compensation info */}
        <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
          <h3 className="font-medium text-gray-900 mb-3">Quyền lợi của bạn</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p>Nhận BỒI THƯỜNG 200% giá trị sản phẩm từ tiền cọc + ví khách</p>
            </div>
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p>Khách bị KHÓA TÀI KHOẢN vĩnh viễn, không thể đăng ký lại</p>
            </div>
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p>Admin hỗ trợ làm việc với cảnh sát nếu cần</p>
            </div>
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p>Thông tin khách sẽ được lưu vào BLACKLIST toàn hệ thống</p>
            </div>
          </div>
        </div>

        {/* Warning before submit */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Trước khi gửi, hãy chắc chắn:</h3>
              <div className="mt-2 text-sm text-yellow-700 space-y-1">
                <p>✓ Đã thử MỌI CÁCH liên lạc với khách (điện thoại, tin nhắn, email, mạng xã hội)</p>
                <p>✓ Đã kiểm tra địa chỉ đăng ký của khách</p>
                <p>✓ Đã chờ đợi thời gian hợp lý (ít nhất 3-5 ngày sau hạn trả)</p>
                <p>✓ Tất cả thông tin bạn cung cấp là CHÍNH XÁC và TRUNG THỰC</p>
              </div>
            </div>
          </div>
        </div>

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
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? 'Đang gửi...' : 'Gửi khiếu nại nghiêm trọng'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default OwnerNotReceiveForm;
