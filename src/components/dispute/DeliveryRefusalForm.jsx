import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import disputeService from '../../services/dispute';

/**
 * TH1, TH2: Renter từ chối nhận hàng
 * - TH1: Sản phẩm không đúng như mô tả (vali móp, máy ảnh lỗi)
 * - TH2: Thiếu phụ kiện/số lượng
 * 
 * Flow:
 * - Renter từ chối nhận hàng → Chọn lý do
 * - Shipper đã chụp ảnh sản phẩm khi giao
 * - Hệ thống giữ tiền 24h
 * - Owner có 24h để phản hồi
 */
const DeliveryRefusalForm = ({ subOrder, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    type: '',
    reason: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const refusalReasons = {
    WRONG_PRODUCT_DELIVERY: {
      label: 'Sản phẩm không đúng như mô tả',
      examples: [
        'Sản phẩm bị móp méo, hư hỏng',
        'Tình trạng thực tế khác với mô tả',
        'Màu sắc/kích thước không đúng',
        'Sản phẩm có dấu hiệu đã qua sử dụng nhiều'
      ]
    },
    MISSING_ACCESSORIES: {
      label: 'Thiếu phụ kiện/số lượng',
      examples: [
        'Thiếu phụ kiện đi kèm',
        'Số lượng không đủ',
        'Thiếu sạc, dây cáp, túi đựng',
        'Không có hướng dẫn sử dụng'
      ]
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.type) {
      toast.error('Vui lòng chọn lý do từ chối');
      return;
    }

    if (!formData.reason || formData.reason.trim().length < 10) {
      toast.error('Vui lòng mô tả chi tiết lý do từ chối (ít nhất 10 ký tự)');
      return;
    }

    try {
      setLoading(true);

      const disputeData = {
        subOrderId: subOrder._id,
        type: formData.type,
        reason: `${refusalReasons[formData.type].label}: ${formData.reason}`,
        shipperPhotos: subOrder.delivery?.deliveryProof || []
      };

      const response = await disputeService.createDeliveryRefusal(disputeData);

      toast.success('Đã gửi yêu cầu từ chối nhận hàng. Chủ thuê có 24h để phản hồi.');
      
      if (onSuccess) {
        onSuccess(response.metadata);
      }
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Từ chối nhận hàng
        </h2>
        <p className="text-sm text-gray-600">
          Vui lòng chọn lý do và mô tả chi tiết vấn đề. Owner sẽ có 24 giờ để phản hồi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Chọn lý do từ chối */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Chọn lý do từ chối <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {Object.entries(refusalReasons).map(([key, { label, examples }]) => (
              <div
                key={key}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  formData.type === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setFormData({ ...formData, type: key })}
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="refusalType"
                    value={key}
                    checked={formData.type === key}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">{label}</div>
                    <div className="text-xs text-gray-500">
                      Ví dụ: {examples.slice(0, 2).join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mô tả chi tiết */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả chi tiết vấn đề <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Vui lòng mô tả cụ thể vấn đề bạn gặp phải..."
          />
          <div className="text-xs text-gray-500 mt-1">
            Tối thiểu 10 ký tự. Mô tả càng chi tiết càng giúp xử lý nhanh hơn.
          </div>
        </div>

        {/* Thông tin quan trọng */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Lưu ý quan trọng
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Hệ thống sẽ giữ tiền trong 24 giờ</li>
                  <li>Owner có 24 giờ để phản hồi</li>
                  <li>Nếu Owner thừa nhận hoặc không phản hồi → Hoàn 100% + Owner bị trừ 20 điểm</li>
                  <li>Nếu Owner khiếu nại → Admin sẽ xem xét và quyết định</li>
                  <li>Nếu bạn nói dối → Bị phạt 1 ngày phí thuê + trừ 30 điểm + cảnh cáo</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Ảnh chứng cứ từ shipper */}
        {subOrder.delivery?.deliveryProof?.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh sản phẩm khi giao (do shipper chụp)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {subOrder.delivery.deliveryProof.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Delivery proof ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Admin sẽ dùng những ảnh này để đối chiếu và xác minh
            </p>
          </div>
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
            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? 'Đang gửi...' : 'Xác nhận từ chối nhận hàng'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default DeliveryRefusalForm;
