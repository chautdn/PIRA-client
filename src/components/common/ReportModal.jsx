import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userReportService } from '../../services/userReport';

const ReportModal = ({ isOpen, onClose, product, user }) => {
  const [formData, setFormData] = useState({
    reportType: '',
    reason: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const reportTypes = [
    { value: 'SPAM', label: '🚫 Sản phẩm spam', description: 'Sản phẩm được đăng nhiều lần hoặc nội dung spam' },
    { value: 'INAPPROPRIATE', label: '⚠️ Nội dung không phù hợp', description: 'Hình ảnh hoặc mô tả không phù hợp' },
    { value: 'HARASSMENT', label: '😡 Quấy rối', description: 'Hành vi quấy rối hoặc ngôn từ không phù hợp' },
    { value: 'OTHER', label: '📝 Khác', description: 'Lý do khác (vui lòng mô tả cụ thể)' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reportType) {
      setError('Vui lòng chọn loại báo cáo');
      return;
    }

    if (!formData.reason.trim()) {
      setError('Vui lòng nhập lý do báo cáo');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const reportData = {
        reportType: formData.reportType,
        reportedItem: product._id,
        reason: formData.reason.trim(),
        description: formData.description.trim()
      };

      await userReportService.createReport(reportData);
      setSuccess(true);
      
      // Auto close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('Report submission error:', err);
      
      if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Dữ liệu không hợp lệ');
      } else if (err.response?.status === 429) {
        setError('Bạn đã gửi quá nhiều báo cáo. Vui lòng thử lại sau.');
      } else {
        setError('Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ reportType: '', reason: '', description: '' });
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          {success ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Gửi báo cáo thành công!
              </h3>
              <p className="text-gray-600">
                Chúng tôi sẽ xem xét báo cáo của bạn và phản hồi sớm nhất.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Báo cáo sản phẩm</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Báo cáo "{product?.title}" của {product?.owner?.fullName}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <span className="text-gray-500 text-xl">×</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6">
                {/* Report Types */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Loại báo cáo <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {reportTypes.map((type) => (
                      <label
                        key={type.value}
                        className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.reportType === type.value
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="reportType"
                          value={type.value}
                          checked={formData.reportType === type.value}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="flex items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-1">
                              {type.label}
                            </div>
                            <div className="text-sm text-gray-600">
                              {type.description}
                            </div>
                          </div>
                          <div className={`ml-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            formData.reportType === type.value
                              ? 'border-red-500 bg-red-500'
                              : 'border-gray-300'
                          }`}>
                            {formData.reportType === type.value && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Lý do cụ thể <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    placeholder="Nhập lý do báo cáo..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    maxLength={1000}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.reason.length}/1000 ký tự
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Mô tả chi tiết (không bắt buộc)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả thêm về vấn đề..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                    maxLength={2000}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/2000 ký tự
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center">
                      <span className="text-red-500 mr-2">⚠️</span>
                      <span className="text-red-700 text-sm font-medium">{error}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.reportType || !formData.reason.trim()}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Đang gửi...
                      </>
                    ) : (
                      'Gửi báo cáo'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReportModal;