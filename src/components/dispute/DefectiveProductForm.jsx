import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import disputeService from '../../services/dispute';

/**
 * TH4: Renter báo sản phẩm hỏng do lỗi có sẵn
 * 
 * Flow:
 * - Renter gửi 3 ảnh + 1 video 10s
 * - Hệ thống gửi cho Owner
 * - Owner xem và phản hồi
 * - Nếu Owner đồng ý → Hoàn tiền + trừ 50 điểm Owner
 * - Nếu Owner không đồng ý → Mở dispute, Admin xử lý
 */
const DefectiveProductForm = ({ subOrder, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    description: '',
    photos: [],
    videos: [],
    photoFiles: [],
    videoFiles: []
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Upload ảnh lên Cloudinary (hoặc storage khác)
  const handlePhotoUpload = async (files) => {
    if (files.length === 0) return;

    if (formData.photos.length + files.length > 3) {
      toast.error('Chỉ được upload tối đa 3 ảnh');
      return;
    }

    setUploadingPhotos(true);
    try {
      // TODO: Implement actual upload to Cloudinary
      // For now, use placeholder
      const uploadedUrls = await Promise.all(
        Array.from(files).map(async (file) => {
          // Simulate upload delay
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

  // Upload video
  const handleVideoUpload = async (file) => {
    if (!file) return;

    if (formData.videos.length >= 1) {
      toast.error('Chỉ được upload 1 video');
      return;
    }

    // Check video duration (should be ~10s)
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = async () => {
      window.URL.revokeObjectURL(video.src);
      
      if (video.duration > 15) {
        toast.error('Video phải ngắn hơn 15 giây');
        return;
      }

      setUploadingVideo(true);
      try {
        // TODO: Implement actual upload
        await new Promise(resolve => setTimeout(resolve, 1000));
        const url = URL.createObjectURL(file);

        setFormData(prev => ({
          ...prev,
          videos: [url],
          videoFiles: [file]
        }));

        toast.success('Upload video thành công');
      } catch (error) {
        console.error('Error uploading video:', error);
        toast.error('Lỗi khi upload video');
      } finally {
        setUploadingVideo(false);
      }
    };

    video.src = URL.createObjectURL(file);
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
      photoFiles: prev.photoFiles.filter((_, i) => i !== index)
    }));
  };

  const removeVideo = () => {
    setFormData(prev => ({
      ...prev,
      videos: [],
      videoFiles: []
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.photos.length < 3) {
      toast.error('Vui lòng upload đủ 3 ảnh');
      return;
    }

    if (formData.videos.length === 0) {
      toast.error('Vui lòng upload 1 video (khoảng 10 giây)');
      return;
    }

    if (!formData.description || formData.description.trim().length < 20) {
      toast.error('Vui lòng mô tả chi tiết vấn đề (ít nhất 20 ký tự)');
      return;
    }

    try {
      setLoading(true);

      const disputeData = {
        subOrderId: subOrder._id,
        photos: formData.photos,
        videos: formData.videos,
        description: formData.description
      };

      const response = await disputeService.createDefectiveProduct(disputeData);

      toast.success('Đã gửi báo cáo lỗi. Owner sẽ được thông báo để xác nhận.');
      
      if (onSuccess) {
        onSuccess(response.metadata);
      }
    } catch (error) {
      console.error('Error creating defect report:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi báo cáo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Báo cáo sản phẩm hỏng do lỗi có sẵn
        </h2>
        <p className="text-sm text-gray-600">
          Vui lòng cung cấp đầy đủ bằng chứng: 3 ảnh + 1 video (10s) + mô tả chi tiết
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload 3 ảnh */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload 3 ảnh chứng minh lỗi <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-4">
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
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            
            {formData.photos.length < 3 && (
              <label className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handlePhotoUpload(e.target.files)}
                  className="hidden"
                  disabled={uploadingPhotos}
                />
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm text-gray-500">
                  {uploadingPhotos ? 'Đang upload...' : 'Thêm ảnh'}
                </span>
              </label>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Ảnh phải rõ ràng, thể hiện rõ lỗi của sản phẩm
          </p>
        </div>

        {/* Upload video 10s */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload 1 video (khoảng 10 giây) <span className="text-red-500">*</span>
          </label>
          {formData.videos.length === 0 ? (
            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleVideoUpload(e.target.files[0])}
                className="hidden"
                disabled={uploadingVideo}
              />
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-600">
                {uploadingVideo ? 'Đang upload...' : 'Click để upload video'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Video dài tối đa 15 giây
              </p>
            </label>
          ) : (
            <div className="relative">
              <video
                src={formData.videos[0]}
                controls
                className="w-full rounded-lg border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={removeVideo}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Mô tả chi tiết */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả chi tiết lỗi <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Mô tả cụ thể:
- Lỗi phát hiện khi nào?
- Lỗi biểu hiện như thế nào?
- Có làm gì trước khi phát hiện lỗi không?
- Bạn đã thử khắc phục chưa?"
          />
          <div className="text-xs text-gray-500 mt-1">
            Tối thiểu 20 ký tự. Mô tả càng chi tiết càng tốt.
          </div>
        </div>

        {/* Timeline info */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Quy trình xử lý
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Hệ thống gửi bằng chứng cho Owner xem</li>
                  <li>Owner có thể giải quyết trực tiếp qua chat hoặc xác nhận lỗi</li>
                  <li>Nếu Owner xác nhận lỗi → Hoàn tiền các ngày còn lại + cọc, trừ 50 điểm Owner</li>
                  <li>Nếu Owner không đồng ý → Admin xem xét và quyết định</li>
                  <li>Admin có 24h để xử lý</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin đơn hàng */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Thông tin đơn hàng</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p>Ngày bắt đầu thuê: {new Date(subOrder.rentalPeriod?.startDate).toLocaleDateString('vi-VN')}</p>
            <p>Ngày báo lỗi: {new Date().toLocaleDateString('vi-VN')}</p>
            <p>Số ngày đã sử dụng: {Math.floor((new Date() - new Date(subOrder.rentalPeriod?.startDate)) / (1000 * 60 * 60 * 24))} ngày</p>
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
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            disabled={loading || formData.photos.length < 3 || formData.videos.length === 0}
          >
            {loading ? 'Đang gửi...' : 'Gửi báo cáo lỗi'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default DefectiveProductForm;
