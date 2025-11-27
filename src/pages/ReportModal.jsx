import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userReportService } from '../services/userReport';

const ReportModal = ({ isOpen, onClose, product, onReportSuccess }) => {
  const [formData, setFormData] = useState({
    reportType: '',
    reason: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const reportTypes = [
    { value: 'SPAM', label: 'Spam', description: 'Sản phẩm được đăng nhiều lần' },
    { value: 'INAPPROPRIATE', label: 'Nội dung không phù hợp', description: 'Hình ảnh hoặc mô tả không phù hợp' },
    { value: 'HARASSMENT', label: 'Quấy rối', description: 'Hành vi quấy rối người dùng' },
    { value: 'OTHER', label: 'Khác', description: 'Lý do khác' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reportType) {
      setError('Vui lòng chọn loại báo cáo');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const reportData = {
        reportType: formData.reportType,
        reportedItem: product._id,
        reason: formData.reason,
        description: formData.description
      };

      await userReportService.createReport(reportData);
      setSuccess(true);
      
      // Reset form
      setFormData({
        reportType: '',
        reason: '',
        description: ''
      });

      // Notify parent component
      if (onReportSuccess) {
        onReportSuccess();
      }

      // Auto close after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Report error:', error);
      
      if (error.response?.status === 400) {
        setError(error.response.data.message || 'Dữ liệu không hợp lệ');
      } else if (error.response?.status === 429) {
        setError('Bạn đã gửi quá nhiều báo cáo. Vui lòng thử lại sau.');
      } else {
        setError('Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      reportType: '',
      reason: '',
      description: ''
    });
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                🚨 Báo cáo sản phẩm
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Báo cáo sản phẩm: <span className="font-medium">{product?.title}</span>
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              className="p-6 bg-green-50 border-b border-green-200"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center text-green-800">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Báo cáo đã được gửi thành công!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Chúng tôi sẽ xem xét và xử lý báo cáo của bạn trong thời gian sớm nhất.
              </p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Report Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Loại báo cáo <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {reportTypes.map((type) => (
                  <motion.div
                    key={type.value}
                    className={`relative cursor-pointer rounded-lg border-2 p-4 ${
                      formData.reportType === type.value
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData(prev => ({ ...prev, reportType: type.value }))}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="reportType"
                        value={type.value}
                        checked={formData.reportType === type.value}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {type.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div className="mb-6">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-900 mb-2">
                Lý do cụ thể
              </label>
              <input
                type="text"
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="Nhập lý do báo cáo ngắn gọn..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.reason.length}/1000 ký tự
              </p>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
                Mô tả chi tiết
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Mô tả chi tiết về vấn đề bạn gặp phải..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/2000 ký tự
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center text-red-800">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </motion.div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <motion.button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                Hủy
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading || !formData.reportType}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  loading || !formData.reportType
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
                whileHover={!loading && formData.reportType ? { y: -1 } : {}}
                whileTap={!loading && formData.reportType ? { scale: 0.98 } : {}}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang gửi...
                  </div>
                ) : (
                  '🚨 Gửi báo cáo'
                )}
              </motion.button>
            </div>
          </form>

          {/* Info Footer */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-2xl">
            <p className="text-xs text-gray-600">
              <span className="font-medium">📋 Lưu ý:</span> Báo cáo sai sự thật có thể bị xử phạt. 
              Chúng tôi sẽ xem xét báo cáo của bạn trong vòng 24-48 giờ.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReportModal;