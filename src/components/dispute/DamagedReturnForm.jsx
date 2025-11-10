import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import disputeService from '../../services/dispute';

/**
 * TH5: DAMAGED_RETURN
 * Owner nhận lại sản phẩm bị hư hỏng sau khi thuê
 * Flow: Owner tạo → Renter có 24h phản hồi → Nếu không đồng ý → Admin quyết định
 */
const DamagedReturnForm = ({ order, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    description: '',
    estimatedRepairCost: '',
    photos: [],
    photoFiles: [],
    video: null,
    videoFile: null
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

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

    if (!formData.description || formData.description.trim().length < 30) {
      toast.error('Vui lòng mô tả chi tiết hư hỏng (ít nhất 30 ký tự)');
      return;
    }

    if (formData.photos.length < 3) {
      toast.error('Cần tối thiểu 3 ảnh chứng minh');
      return;
    }

    const repairCost = parseFloat(formData.estimatedRepairCost);
    if (!repairCost || repairCost <= 0) {
      toast.error('Vui lòng nhập chi phí sửa chữa ước tính');
      return;
    }

    try {
      setLoading(true);

      const disputeData = {
        subOrderId: order._id,
        description: formData.description,
        estimatedRepairCost: repairCost,
        ownerEvidence: {
          photos: formData.photos,
          videos: formData.video ? [formData.video] : []
        }
      };

      const result = await disputeService.createDamagedReturn(disputeData);

      toast.success('Đã gửi khiếu nại. Khách thuê có 24h để phản hồi.');
      
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Báo cáo sản phẩm bị hư hỏng khi trả lại
        </h2>
        <p className="text-sm text-gray-600">
          Mã đơn: <span className="font-medium">{order.orderCode}</span>
        </p>
      </div>

      {/* Warning */}
      <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-orange-800">Lưu ý quan trọng</h3>
            <div className="mt-2 text-sm text-orange-700 space-y-1">
              <p>• Cần có ảnh TRƯỚC KHI CHO THUÊ (để so sánh tình trạng)</p>
              <p>• Ảnh/video phải thấy rõ VỊ TRÍ VÀ MỨC ĐỘ hư hỏng</p>
              <p>• Khách thuê có 24H để phản hồi (chấp nhận hoặc không đồng ý)</p>
              <p>• Nếu khách KHÔNG PHẢN HỒI → Tự động trừ tiền cọc theo chi phí sửa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Process flow */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Quy trình xử lý</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-start">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
            <p>Bạn gửi khiếu nại với ảnh so sánh + chi phí sửa chữa ước tính</p>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
            <p>Khách thuê có 24h để phản hồi (chấp nhận bồi thường hoặc khiếu nại lại)</p>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
            <p>Nếu khách CHẤP NHẬN → Trừ tiền cọc theo chi phí sửa, khách bị trừ 30 điểm</p>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
            <p>Nếu khách KHÔNG ĐỒNG Ý → Admin xem xét bằng chứng 2 bên (trong 48h)</p>
          </div>
          <div className="flex items-start">
            <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">5</span>
            <p>Admin quyết định cuối cùng: Ai sai sẽ bị trừ điểm + bồi thường chi phí</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả chi tiết hư hỏng <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ví dụ: Màn hình laptop bị vỡ ở góc trên bên phải, kích thước vết nứt khoảng 5cm. Trước khi cho thuê màn hình còn nguyên vẹn (có ảnh chứng minh). Chi phí thay màn hình ước tính 3.000.000 VND..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Tối thiểu 30 ký tự. Mô tả càng chi tiết, rõ ràng càng tốt.
          </p>
        </div>

        {/* Repair cost */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chi phí sửa chữa ước tính (VND) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.estimatedRepairCost}
            onChange={(e) => setFormData({ ...formData, estimatedRepairCost: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="3000000"
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            Nên có báo giá từ cửa hàng sửa chữa. Chi phí này sẽ được trừ vào tiền cọc.
          </p>
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ảnh so sánh trước/sau (3-5 ảnh) <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Upload ảnh: Ảnh sản phẩm TRƯỚC khi cho thuê + Ảnh HIỆN TẠI sau khi nhận lại (để thấy rõ sự khác biệt)
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
            Video ghi lại hư hỏng (không bắt buộc)
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Video thể hiện toàn cảnh sản phẩm và vị trí hư hỏng. Tối đa 30 giây.
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

        {/* Tips */}
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Mẹo để tăng tỷ lệ thành công</h3>
              <div className="mt-2 text-sm text-green-700 space-y-1">
                <p>• Luôn chụp ảnh TRƯỚC khi giao sản phẩm cho khách (lưu lại làm bằng chứng)</p>
                <p>• Chụp ảnh SAU ngay khi nhận lại (timestamp càng gần càng tốt)</p>
                <p>• Có báo giá sửa chữa từ cửa hàng uy tín (càng cụ thể càng tốt)</p>
                <p>• Mô tả đầy đủ: Vị trí, kích thước, mức độ hư hỏng</p>
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
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400"
            disabled={loading || formData.photos.length < 3 || !formData.estimatedRepairCost}
          >
            {loading ? 'Đang gửi...' : 'Gửi khiếu nại'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default DamagedReturnForm;
