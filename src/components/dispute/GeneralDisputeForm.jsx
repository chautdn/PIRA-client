import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import disputeService from '../../services/dispute';

/**
 * General Dispute Form - Cho các trường hợp không thuộc 7 case đặc biệt
 * Ví dụ: Tranh chấp về phụ kiện, tranh chấp về chất lượng dịch vụ, v.v.
 */
const GeneralDisputeForm = ({ order, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'OTHER',
    description: '',
    photos: [],
    photoFiles: [],
    video: null,
    videoFile: null,
    requestedResolution: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const disputeTypes = [
    { value: 'OTHER', label: 'Khác', description: 'Vấn đề không thuộc các loại trên' },
    { value: 'QUALITY_ISSUE', label: 'Chất lượng không như mô tả', description: 'Sản phẩm không đúng với mô tả ban đầu' },
    { value: 'ACCESSORY_MISSING', label: 'Thiếu phụ kiện', description: 'Thiếu phụ kiện đi kèm' },
    { value: 'HYGIENE_ISSUE', label: 'Vệ sinh không đảm bảo', description: 'Sản phẩm bẩn, có mùi' },
    { value: 'TECHNICAL_ISSUE', label: 'Lỗi kỹ thuật', description: 'Sản phẩm không hoạt động đúng' },
    { value: 'PRICING_DISPUTE', label: 'Tranh chấp giá cả', description: 'Phí không đúng với thỏa thuận' },
    { value: 'COMMUNICATION', label: 'Vấn đề giao tiếp', description: 'Owner/Renter không phản hồi' }
  ];

  const handlePhotoUpload = async (files) => {
    if (files.length === 0) return;
    if (formData.photos.length + files.length > 5) {
      toast.error('Tối đa 5 ảnh');
      return;
    }

    setUploadingPhotos(true);
    try {
      // TODO: Upload to Cloudinary
      const uploadedUrls = await Promise.all(
        Array.from(files).map(async (file) => {
          await new Promise(resolve => setTimeout(resolve, 500));
          return URL.createObjectURL(file);
        })
      );

      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...uploadedUrls],
        photoFiles: [...prev.photoFiles, ...Array.from(files)]
      }));

      toast.success('Upload ảnh thành công');
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Lỗi khi upload ảnh');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleVideoUpload = async (file) => {
    if (!file) return;

    const video = document.createElement('video');
    video.preload = 'metadata';

    return new Promise((resolve) => {
      video.onloadedmetadata = async function() {
        window.URL.revokeObjectURL(video.src);
        
        if (video.duration > 30) {
          toast.error('Video không được quá 30 giây');
          resolve();
          return;
        }

        setUploadingVideo(true);
        try {
          // TODO: Upload to Cloudinary
          await new Promise(resolve => setTimeout(resolve, 1000));
          const videoUrl = URL.createObjectURL(file);

          setFormData(prev => ({
            ...prev,
            video: videoUrl,
            videoFile: file
          }));

          toast.success('Upload video thành công');
        } catch (error) {
          console.error('Error uploading video:', error);
          toast.error('Lỗi khi upload video');
        } finally {
          setUploadingVideo(false);
          resolve();
        }
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
      photoFiles: prev.photoFiles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || formData.title.trim().length < 10) {
      toast.error('Vui lòng nhập tiêu đề (ít nhất 10 ký tự)');
      return;
    }

    if (!formData.description || formData.description.trim().length < 30) {
      toast.error('Vui lòng mô tả chi tiết vấn đề (ít nhất 30 ký tự)');
      return;
    }

    if (!formData.requestedResolution || formData.requestedResolution.trim().length < 20) {
      toast.error('Vui lòng nêu rõ yêu cầu giải quyết (ít nhất 20 ký tự)');
      return;
    }

    try {
      setLoading(true);

      const disputeData = {
        type: 'GENERAL',
        description: `${formData.title}\n\n${formData.description}\n\nYêu cầu: ${formData.requestedResolution}`,
        evidence: [...formData.photos, ...(formData.video ? [formData.video] : [])],
        orderId: order?._id || null,
        reportedAgainst: null // Có thể thêm logic chọn người bị báo cáo nếu cần
      };

      const result = await disputeService.createGeneralDispute(disputeData);

      toast.success('Đã gửi khiếu nại. Admin sẽ xem xét trong 48h.');
      
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

  const selectedType = disputeTypes.find(t => t.value === formData.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Tạo tranh chấp
        </h2>
        {order?.orderCode && (
          <p className="text-sm text-gray-600">
            Mã đơn: <span className="font-medium">{order.orderCode}</span>
          </p>
        )}
      </div>

      {/* Info */}
      <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Hướng dẫn</h3>
            <div className="mt-2 text-sm text-blue-700 space-y-1">
              <p>• Chọn loại tranh chấp phù hợp nhất với tình huống của bạn</p>
              <p>• Mô tả chi tiết vấn đề và cung cấp bằng chứng (ảnh/video)</p>
              <p>• Nêu rõ bạn muốn giải quyết như thế nào (hoàn tiền, đổi sản phẩm, v.v.)</p>
              <p>• Admin sẽ xem xét và trả lời trong vòng 48 giờ</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dispute type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Loại tranh chấp <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {disputeTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, type: type.value })}
                className={`p-3 border-2 rounded-lg text-left transition-all ${
                  formData.type === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    checked={formData.type === type.value}
                    onChange={() => {}}
                    className="mt-1 mr-2"
                  />
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{type.label}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{type.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tiêu đề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ví dụ: Sản phẩm không hoạt động như mô tả"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">
            Tóm tắt ngắn gọn vấn đề của bạn (10-100 ký tự)
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả chi tiết <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Ví dụ (cho ${selectedType?.label}):\n\n${
              formData.type === 'QUALITY_ISSUE' 
                ? 'Trong mô tả sản phẩm ghi là laptop mới 99%, nhưng khi nhận thấy nhiều vết xước trên vỏ, bàn phím bị mất 2 phím...'
                : formData.type === 'ACCESSORY_MISSING'
                ? 'Theo mô tả sản phẩm phải đi kèm: Chuột, bàn phím, tai nghe. Nhưng khi nhận chỉ có chuột và bàn phím, không có tai nghe...'
                : formData.type === 'HYGIENE_ISSUE'
                ? 'Sản phẩm khi nhận có mùi khó chịu, bẩn, có vết bẩn không rõ nguồn gốc. Trong mô tả ghi sản phẩm đã được vệ sinh...'
                : 'Mô tả chi tiết vấn đề bạn gặp phải...'
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Tối thiểu 30 ký tự. Bao gồm: Vấn đề gì? Khi nào xảy ra? Bạn đã làm gì?
          </p>
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ảnh chứng minh (0-5 ảnh)
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Upload ảnh minh họa vấn đề của bạn
          </p>
          <div className="grid grid-cols-5 gap-2">
            {formData.photos.map((photo, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-0.5 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
            
            {formData.photos.length < 5 && (
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handlePhotoUpload(e.target.files)}
                  className="hidden"
                  disabled={uploadingPhotos}
                />
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs text-gray-500 mt-1">
                  {uploadingPhotos ? 'Đang upload...' : 'Thêm ảnh'}
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Video (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video minh họa (không bắt buộc)
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Video giúp admin hiểu rõ hơn về vấn đề. Tối đa 30 giây.
          </p>
          {formData.video ? (
            <div className="relative">
              <video
                src={formData.video}
                controls
                className="w-full max-w-md rounded-lg border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, video: null, videoFile: null })}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <label className="w-full max-w-md border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleVideoUpload(e.target.files[0])}
                className="hidden"
                disabled={uploadingVideo}
              />
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-600 mt-2">
                {uploadingVideo ? 'Đang upload video...' : 'Click để chọn video (tối đa 30s)'}
              </span>
            </label>
          )}
        </div>

        {/* Requested resolution */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Yêu cầu giải quyết <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.requestedResolution}
            onChange={(e) => setFormData({ ...formData, requestedResolution: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ví dụ: Tôi yêu cầu được hoàn lại 50% tiền thuê vì chất lượng sản phẩm không như mô tả. Hoặc tôi muốn được đổi sang sản phẩm khác cùng giá trị..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Tối thiểu 20 ký tự. Nêu rõ bạn muốn gì: Hoàn tiền? Bao nhiêu %? Đổi sản phẩm? Giảm giá?
          </p>
        </div>

        {/* Tips */}
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Mẹo để tranh chấp được xử lý nhanh</h3>
              <div className="mt-2 text-sm text-green-700 space-y-1">
                <p>• Cung cấp bằng chứng rõ ràng, khách quan</p>
                <p>• Nêu yêu cầu cụ thể, hợp lý (tránh yêu cầu quá đáng)</p>
                <p>• Thái độ lịch sự, không phản cảm, xúc phạm</p>
                <p>• Có thể tham khảo ý kiến của bên kia trước khi gửi tranh chấp</p>
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
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? 'Đang gửi...' : 'Gửi tranh chấp'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default GeneralDisputeForm;
