import { useState } from 'react';
import { getDisputeTypesForShipment } from '../../utils/disputeHelpers';

const CreateDisputeModal = ({ isOpen, onClose, onSubmit, rentalOrder }) => {
  const [formData, setFormData] = useState({
    shipmentType: 'DELIVERY',
    type: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    images: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        rentalOrderId: rentalOrder._id,
        ...formData,
        evidence: {
          description: formData.description,
          images: formData.images
        }
      });
      onClose();
    } catch (error) {
      console.error('Error creating dispute:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    // In real app, upload images and get URLs
    setFormData(prev => ({
      ...prev,
      images: files.map(f => URL.createObjectURL(f))
    }));
  };

  const disputeTypes = getDisputeTypesForShipment(formData.shipmentType);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Tạo tranh chấp mới
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Shipment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại vận chuyển <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.shipmentType}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  shipmentType: e.target.value,
                  type: '' // Reset type when shipment changes
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="DELIVERY">Giao hàng</option>
                <option value="RETURN">Trả hàng</option>
              </select>
            </div>

            {/* Dispute Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại tranh chấp <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Chọn loại tranh chấp</option>
                {disputeTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
                <option value="OTHER">Khác</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                maxLength="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tóm tắt vấn đề..."
                required
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mức độ ưu tiên
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
                <option value="URGENT">Khẩn cấp</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mô tả chi tiết về vấn đề..."
                required
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hình ảnh bằng chứng
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {formData.images.length > 0 && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {formData.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
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
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang tạo...' : 'Tạo tranh chấp'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateDisputeModal;
