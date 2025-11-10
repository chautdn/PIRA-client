import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import disputeService from '../../services/dispute';

/**
 * TH3: SHIPPER_DAMAGE
 * Shipper làm hỏng sản phẩm trong quá trình giao nhận
 * Flow: Renter tạo → Auto chuyển Admin (shipper có trách nhiệm)
 */
const ShipperDamageForm = ({ order, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    description: '',
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

    // Check video duration
    const video = document.createElement('video');
    video.preload = 'metadata';

    return new Promise((resolve) => {
      video.onloadedmetadata = async function() {
        window.URL.revokeObjectURL(video.src);
        
        if (video.duration > 20) {
          toast.error('Video không được quá 20 giây');
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

    if (!formData.video) {
      toast.error('Cần có video ghi lại tình trạng hư hỏng');
      return;
    }

    try {
      setLoading(true);

      const disputeData = {
        subOrderId: order._id,
        description: formData.description,
        renterEvidence: {
          photos: formData.photos,
          videos: [formData.video]
        }
      };

      const result = await disputeService.createShipperDamage(disputeData);

      toast.success('Đã gửi khiếu nại. Admin sẽ xử lý trong 48h.');
      
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
          Báo cáo shipper làm hỏng sản phẩm
        </h2>
        <p className="text-sm text-gray-600">
          Mã đơn: <span className="font-medium">{order.orderCode}</span>
        </p>
      </div>

      {/* Warning */}
      <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Điều kiện quan trọng</h3>
            <div className="mt-2 text-sm text-red-700 space-y-1">
              <p>• Cần có VIDEO ghi lại TOÀN BỘ quá trình NHẬN HÀNG từ shipper</p>
              <p>• Video phải thấy rõ SHIPPER + SẢN PHẨM BỊ HƯ HỎNG</p>
              <p>• Ảnh chụp TRƯỚC và SAU khi nhận (so sánh ảnh shipper chụp trước khi giao)</p>
              <p>• Nếu không đủ bằng chứng → Admin có thể TỪ CHỐI khiếu nại</p>
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
            <p>Bạn gửi khiếu nại với video + ảnh chứng minh</p>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
            <p>Admin xem xét bằng chứng và xác minh với shipper (trong 48h)</p>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
            <p>Nếu xác nhận lỗi shipper → Shipper chịu trách nhiệm bồi thường 100% giá trị sản phẩm</p>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
            <p>Bạn nhận lại tiền cọc + tiền thuê đã trả, shipper bị trừ điểm tín dụng</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả chi tiết tình trạng hư hỏng <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ví dụ: Khi nhận hàng từ shipper, tôi phát hiện màn hình laptop bị vỡ, trong khi ảnh shipper chụp trước khi giao còn nguyên vẹn. Video quay lại cho thấy shipper đã làm rơi thùng hàng xuống đất..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Tối thiểu 30 ký tự. Càng chi tiết càng tốt.
          </p>
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ảnh chứng minh (3-5 ảnh) <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Upload ảnh: Ảnh shipper chụp trước khi giao + Ảnh sản phẩm sau khi nhận (để so sánh)
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

        {/* Video */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video ghi lại quá trình nhận hàng <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Video phải thấy rõ shipper, sản phẩm, và tình trạng hư hỏng. Tối đa 20 giây.
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
                {uploadingVideo ? 'Đang upload video...' : 'Click để chọn video (tối đa 20s)'}
              </span>
            </label>
          )}
        </div>

        {/* Tips */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Mẹo để Admin dễ chấp nhận</h3>
              <div className="mt-2 text-sm text-yellow-700 space-y-1">
                <p>• Video nên quay LÚC MỚI NHẬN từ shipper (timestamp càng sát càng tốt)</p>
                <p>• Chụp ảnh bao bì/hộp đựng có dấu hiệu va đập</p>
                <p>• So sánh với ảnh shipper chụp trước khi giao</p>
                <p>• Ghi rõ thời gian, địa điểm nhận hàng</p>
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
            disabled={loading || formData.photos.length < 3 || !formData.video}
          >
            {loading ? 'Đang gửi...' : 'Gửi khiếu nại'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ShipperDamageForm;
