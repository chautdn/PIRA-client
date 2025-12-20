import { useState } from 'react';
import { getDisputeTypesForShipment } from '../../utils/disputeHelpers';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CreateDisputeModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  subOrder,           // SubOrder object
  product,            // Selected product from subOrder.products
  productIndex,       // Index of the product in products array
  shipment = null     // Optional shipment (delivery or return)
}) => {
  const [formData, setFormData] = useState({
    shipmentType: 'DELIVERY',
    type: '',
    title: '',
    description: '',
    repairCost: 0, // Chi phí sửa chữa cho DAMAGED_ON_RETURN
    images: [],
    videos: []
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
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
      throw new Error('Failed to upload images');
    }
  };

  const uploadVideos = async (files) => {
    if (!files || files.length === 0) return [];
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('videos', file);
    });

    try {
      const response = await api.post('/upload/videos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.videos || [];
    } catch (error) {
      console.error('Upload video error:', error);
      throw new Error('Failed to upload videos');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let imageUrls = [];
      let videoResults = [];
      
      setIsUploading(true);
      
      if (selectedFiles.length > 0) {
        toast.loading('Đang upload ảnh...', { id: 'upload-images' });
        imageUrls = await uploadImages(selectedFiles);
        toast.success(`Upload ${imageUrls.length} ảnh thành công!`, { id: 'upload-images' });
      }
      
      if (selectedVideos.length > 0) {
        toast.loading('Đang upload video...', { id: 'upload-videos' });
        videoResults = await uploadVideos(selectedVideos);
        toast.success(`Upload ${videoResults.length} video thành công!`, { id: 'upload-videos' });
      }
      
      setIsUploading(false);

      // Xác định shipmentId dựa trên shipmentType
      let shipmentId = null;
      if (formData.shipmentType === 'DELIVERY' && product?.deliveryShipment) {
        shipmentId = product.deliveryShipment._id || product.deliveryShipment;
      } else if (formData.shipmentType === 'RETURN' && product?.returnShipment) {
        shipmentId = product.returnShipment._id || product.returnShipment;
      } else if (shipment) {
        shipmentId = shipment._id || shipment;
      }

      const submitData = {
        subOrderId: subOrder._id,
        productId: product?.product?._id || product?.product,
        productIndex: productIndex,
        shipmentId: shipmentId,
        shipmentType: formData.shipmentType,
        type: formData.type,
        title: formData.title,
        description: formData.description,
        evidence: {
          photos: imageUrls,
          videos: videoResults.map(v => v.url),
          additionalInfo: formData.description
        }
      };

      // Thêm repairCost nếu là DAMAGED_ON_RETURN
      if (formData.type === 'DAMAGED_ON_RETURN' && formData.repairCost > 0) {
        submitData.repairCost = parseFloat(formData.repairCost);
      }

      console.log('[CreateDisputeModal] Submitting dispute data:', submitData);

      await onSubmit(submitData);
      onClose();
      setFormData({
        shipmentType: 'DELIVERY',
        type: '',
        title: '',
        description: '',
        repairCost: 0,
        images: [],
        videos: []
      });
      setSelectedFiles([]);
      setSelectedVideos([]);
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast.error(error.message || 'Tạo tranh chấp thất bại');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      toast.error('Tối đa 10 ảnh');
      return;
    }
    setSelectedFiles(files);
    setFormData(prev => ({
      ...prev,
      images: files.map(f => URL.createObjectURL(f))
    }));
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      toast.error('Tối đa 3 video');
      return;
    }
    
    // Check file size
    const maxSize = 50 * 1024 * 1024; // 50MB
    const oversizedFiles = files.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast.error('Mỗi video tối đa 50MB');
      return;
    }
    
    setSelectedVideos(files);
    setFormData(prev => ({
      ...prev,
      videos: files.map(f => ({
        name: f.name,
        size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
        url: URL.createObjectURL(f)
      }))
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại vận chuyển <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.shipmentType}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  shipmentType: e.target.value,
                  type: ''
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="DELIVERY">Giao hàng</option>
                <option value="RETURN">Trả hàng</option>
              </select>
            </div>

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

            {/* Chi phí sửa chữa - chỉ hiện khi DAMAGED_ON_RETURN */}
            {formData.type === 'DAMAGED_ON_RETURN' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chi phí sửa chữa/bồi thường (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.repairCost ? Number(formData.repairCost).toLocaleString('vi-VN') : ''}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                    setFormData(prev => ({ ...prev, repairCost: rawValue }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Nhập chi phí ước tính..."
                  required
                />
                <p className="text-xs text-orange-700 mt-2">
                  💡 Nhập chi phí sửa chữa hoặc bồi thường mà bạn yêu cầu từ renter
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hình ảnh bằng chứng (Tối đa 10 ảnh)
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video bằng chứng (Tối đa 3 video, mỗi video tối đa 50MB)
              </label>
              <input
                type="file"
                multiple
                accept="video/*"
                onChange={handleVideoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {formData.videos.length > 0 && (
                <div className="mt-2 space-y-2">
                  {formData.videos.map((video, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{video.name}</p>
                        <p className="text-xs text-gray-500">{video.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
