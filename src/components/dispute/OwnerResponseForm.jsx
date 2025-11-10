import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import disputeService from '../../services/dispute';

/**
 * Owner Response Form - Dùng cho cả TH1, TH2 và TH4
 * Owner xem bằng chứng và quyết định:
 * - Chấp nhận (accept = true): Thừa nhận lỗi
 * - Từ chối (accept = false): Không đồng ý, cung cấp lý do + ảnh
 */
const OwnerResponseForm = ({ dispute, onSuccess, onCancel }) => {
  const [response, setResponse] = useState({
    accept: null,
    reason: '',
    photos: [],
    photoFiles: []
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const isDeliveryDispute = ['WRONG_PRODUCT_DELIVERY', 'MISSING_ACCESSORIES'].includes(dispute.type);
  const isDefectDispute = dispute.type === 'DEFECTIVE_PRODUCT';

  const handlePhotoUpload = async (files) => {
    if (files.length === 0) return;

    setUploadingPhotos(true);
    try {
      // TODO: Upload to Cloudinary
      const uploadedUrls = await Promise.all(
        Array.from(files).map(async (file) => {
          await new Promise(resolve => setTimeout(resolve, 500));
          return URL.createObjectURL(file);
        })
      );

      setResponse(prev => ({
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

  const removePhoto = (index) => {
    setResponse(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
      photoFiles: prev.photoFiles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (response.accept === null) {
      toast.error('Vui lòng chọn chấp nhận hoặc từ chối');
      return;
    }

    if (!response.accept && (!response.reason || response.reason.trim().length < 20)) {
      toast.error('Vui lòng giải thích lý do từ chối (ít nhất 20 ký tự)');
      return;
    }

    try {
      setLoading(true);

      const responseData = {
        accept: response.accept,
        reason: response.reason,
        photos: response.photos
      };

      let result;
      if (isDeliveryDispute) {
        result = await disputeService.ownerResponseDelivery(dispute._id, responseData);
      } else if (isDefectDispute) {
        result = await disputeService.ownerResponseDefect(dispute._id, responseData);
      }

      if (response.accept) {
        toast.success('Đã xác nhận lỗi. Hệ thống sẽ xử lý hoàn tiền.');
      } else {
        toast.success('Đã gửi khiếu nại. Admin sẽ xem xét trong 24h.');
      }
      
      if (onSuccess) {
        onSuccess(result.metadata);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Calculate time remaining
  const timeRemaining = dispute.ownerResponseDeadline 
    ? Math.max(0, Math.floor((new Date(dispute.ownerResponseDeadline) - new Date()) / (1000 * 60 * 60)))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto"
    >
      {/* Header with timer */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Phản hồi tranh chấp
          </h2>
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium">
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Còn {timeRemaining} giờ
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {dispute.title}
        </p>
      </div>

      {/* Evidence from renter */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Bằng chứng từ khách thuê</h3>
        
        {/* Description */}
        <div className="mb-4">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{dispute.description}</p>
        </div>

        {/* Photos */}
        {dispute.renterEvidence?.photos?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-600 mb-2">Ảnh chứng minh:</p>
            <div className="grid grid-cols-3 gap-2">
              {dispute.renterEvidence.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Evidence ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90"
                  onClick={() => window.open(photo, '_blank')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Videos */}
        {dispute.renterEvidence?.videos?.length > 0 && (
          <div>
            <p className="text-xs text-gray-600 mb-2">Video:</p>
            <video
              src={dispute.renterEvidence.videos[0]}
              controls
              className="w-full max-w-md rounded-lg border border-gray-200"
            />
          </div>
        )}

        {/* Shipper photos (for delivery disputes) */}
        {dispute.shipperEvidence?.deliveryPhotos?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Ảnh sản phẩm khi giao (do shipper chụp):</p>
            <div className="grid grid-cols-4 gap-2">
              {dispute.shipperEvidence.deliveryPhotos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Delivery ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90"
                  onClick={() => window.open(photo, '_blank')}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Decision */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Quyết định của bạn <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setResponse({ ...response, accept: true })}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                response.accept === true
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  checked={response.accept === true}
                  onChange={() => {}}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Chấp nhận</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Tôi thừa nhận đây là lỗi của mình
                  </div>
                  <div className="text-xs text-red-600 mt-2">
                    → {isDefectDispute ? 'Hoàn tiền ngày còn lại + cọc, trừ 50 điểm' : 'Hoàn 100% tiền, trừ 20 điểm'}
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setResponse({ ...response, accept: false })}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                response.accept === false
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  checked={response.accept === false}
                  onChange={() => {}}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Không đồng ý</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Khách hàng sai, tôi có bằng chứng
                  </div>
                  <div className="text-xs text-blue-600 mt-2">
                    → Cần cung cấp lý do và ảnh chứng minh
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* If rejected - provide reason and photos */}
        {response.accept === false && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={response.reason}
                onChange={(e) => setResponse({ ...response, reason: e.target.value })}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Giải thích tại sao bạn không đồng ý với khiếu nại này..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Tối thiểu 20 ký tự. Admin sẽ xem xét lý do này.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh chứng minh (nếu có)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {response.photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={photo}
                      alt={`Response ${index + 1}`}
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
                  </div>
                ))}
                
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
              </div>
            </div>
          </motion.div>
        )}

        {/* Warning */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Lưu ý quan trọng</h3>
              <div className="mt-2 text-sm text-yellow-700 space-y-1">
                <p>• Nếu bạn KHÔNG PHẢN HỒI trong 24h → Tự động xử lý như chấp nhận lỗi</p>
                <p>• Nếu Admin xác định bạn SAI → Trừ 30 điểm + cảnh cáo</p>
                <p>• Quyết định của Admin là QUY ẾT ĐỊNH cuối cùng</p>
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
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400 ${
              response.accept === true
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            disabled={loading || response.accept === null}
          >
            {loading ? 'Đang gửi...' : response.accept === true ? 'Xác nhận chấp nhận' : 'Gửi khiếu nại'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default OwnerResponseForm;
