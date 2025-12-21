import { useState } from 'react';
import { AlertCircle, X, Camera, FileText } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CreateRenterNoReturnDisputeModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  subOrder,
  product,
  productIndex,
  shipment 
}) => {
  const [formData, setFormData] = useState({
    title: 'Renter không trả hàng',
    description: '',
    shipperReport: shipment?.tracking?.notes || '',
    images: [],
    videos: []
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const uploadImages = async (files) => {
    if (!files || files.length === 0) return [];
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await api.post('/upload/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.urls || [];
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Không thể upload ảnh');
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 10) {
      toast.error('Tối đa 10 ảnh');
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...files]);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files.map(f => ({
        file: f,
        url: URL.createObjectURL(f)
      }))]
    }));
  };

  const removeImage = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      toast.error('Vui lòng mô tả chi tiết tình huống');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let imageUrls = [];
      
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        toast.loading('Đang upload ảnh...', { id: 'upload-images' });
        imageUrls = await uploadImages(selectedFiles);
        toast.success(`Upload ${imageUrls.length} ảnh thành công!`, { id: 'upload-images' });
        setIsUploading(false);
      }

      // Thêm ảnh từ shipment nếu có
      const shipmentPhotos = shipment?.tracking?.photos || [];
      const allPhotos = [...imageUrls, ...shipmentPhotos];

      const submitData = {
        subOrderId: subOrder._id,
        productId: product.product._id,
        productIndex: productIndex,
        shipmentId: shipment?._id,
        shipmentType: 'RETURN',
        type: 'RENTER_NO_RETURN',
        title: formData.title,
        description: formData.description,
        evidence: {
          photos: allPhotos,
          videos: [],
          shipperReport: formData.shipperReport,
          shipmentInfo: {
            shipmentId: shipment?._id,
            shipperId: shipment?.shipper?._id,
            failedAt: shipment?.tracking?.failedAt || new Date(),
            failureReason: shipment?.tracking?.failureReason
          }
        }
      };

      await onSubmit(submitData);
      onClose();
      
      // Reset form
      setFormData({
        title: 'Renter không trả hàng',
        description: '',
        shipperReport: '',
        images: [],
        videos: []
      });
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error creating RENTER_NO_RETURN dispute:', error);
      toast.error(error.response?.data?.message || 'Tạo tranh chấp thất bại');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Tạo tranh chấp: Renter không trả hàng
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Shipper báo cáo không thể lấy hàng từ renter
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Warning Alert */}
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-800 mb-1">
                  ⚠️ Lưu ý quan trọng
                </p>
                <ul className="text-yellow-700 space-y-1 list-disc list-inside">
                  <li>Renter sẽ có <strong>48 giờ</strong> để giải thích hoặc đề xuất lịch trả hàng mới</li>
                  <li>Nếu renter có lý do chính đáng → Phạt <strong>giá thuê 1 ngày × số ngày trễ</strong> (trừ từ cọc)</li>
                  <li>Không phản hồi trong 48h → Tự động chuyển cơ quan công an</li>
                  <li>Quá 7 ngày không trả = Chiếm đoạt → Báo cơ quan công an</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông tin đơn hàng</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Mã SubOrder:</p>
                <p className="font-medium text-gray-900">{subOrder.subOrderNumber}</p>
              </div>
              <div>
                <p className="text-gray-600">Sản phẩm:</p>
                <p className="font-medium text-gray-900">{product.product.title}</p>
              </div>
              <div>
                <p className="text-gray-600">Trạng thái SubOrder:</p>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                  {subOrder.status === 'RETURN_OVERDUE' ? 'Quá hạn trả' 
                    : subOrder.status === 'IN_RETURN' ? 'Đang trả hàng'
                    : subOrder.status === 'ACTIVE' ? 'Đang thuê'
                    : subOrder.status === 'COMPLETED' ? 'Hoàn thành'
                    : subOrder.status}
                </span>
              </div>
              <div>
                <p className="text-gray-600">Trạng thái sản phẩm:</p>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                  {product.productStatus === 'NOT_RETURNED' ? 'Chưa trả'
                    : product.productStatus === 'RETURNED' ? 'Đã trả'
                    : product.productStatus === 'RENTING' ? 'Đang thuê'
                    : product.productStatus === 'RETURN_PENDING' ? 'Chờ trả'
                    : product.productStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Shipper Report */}
            {formData.shipperReport && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-900">Báo cáo từ shipper</h3>
                </div>
                <p className="text-sm text-blue-800">{formData.shipperReport}</p>
              </div>
            )}

            {/* Shipment Photos */}
            {shipment?.tracking?.photos && shipment.tracking.photos.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Camera className="w-4 h-4 inline mr-1" />
                  Ảnh từ shipper ({shipment.tracking.photos.length})
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {shipment.tracking.photos.map((photo, idx) => (
                    <div key={idx} className="relative aspect-square">
                      <img
                        src={photo}
                        alt={`Shipment ${idx + 1}`}
                        className="w-full h-full object-cover rounded-lg border-2 border-blue-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả chi tiết tình huống <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Ví dụ:&#10;- Shipper đến địa chỉ lúc 14:00 ngày 12/12/2025&#10;- Gọi điện 3 lần nhưng renter không nghe máy&#10;- Không có người tại nhà&#10;- Hàng xóm xác nhận renter vẫn còn ở địa chỉ này"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Càng chi tiết càng tốt để admin và renter hiểu rõ tình hình
              </p>
            </div>

            {/* Additional Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh bổ sung (nếu có) - Tối đa 10 ảnh
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {formData.images.length > 0 && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative aspect-square group">
                      <img
                        src={img.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isUploading}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isUploading ? 'Đang upload...' : 'Đang tạo...'}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>Tạo tranh chấp</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRenterNoReturnDisputeModal;
