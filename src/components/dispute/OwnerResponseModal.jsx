import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import disputeService from '../../services/dispute.js';

const OwnerResponseModal = ({ dispute, isOpen, onClose, onSuccess }) => {
  const [responseType, setResponseType] = useState(null); // 'ACKNOWLEDGE' or 'CONTEST'
  const [formData, setFormData] = useState({
    explanation: '',
    photos: []
  });
  const [loading, setLoading] = useState(false);

  const handleAcknowledge = async () => {
    if (!window.confirm('Bạn có chắc chắn thừa nhận lỗi? Hệ thống sẽ tự động hoàn tiền cho người thuê và trừ 20 điểm credit score của bạn.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await disputeService.ownerResponseDelivery(dispute._id, {
        accept: true,
        reason: 'Tôi thừa nhận có sai sót trong giao hàng.',
        photos: []
      });

      toast.success('Đã xác nhận lỗi. Hệ thống sẽ tự động xử lý hoàn tiền.');
      if (onSuccess) {
        onSuccess(response);
      }
      onClose();
    } catch (error) {
      console.error('Error acknowledging dispute:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleContest = async (e) => {
    e.preventDefault();

    if (!formData.explanation || formData.explanation.trim().length < 20) {
      toast.error('Vui lòng giải thích chi tiết lý do khiếu nại (ít nhất 20 ký tự)');
      return;
    }

    if (formData.photos.length === 0) {
      toast.error('Vui lòng tải lên ít nhất 1 ảnh bằng chứng');
      return;
    }

    try {
      setLoading(true);
      const response = await disputeService.ownerResponseDelivery(dispute._id, {
        accept: false,
        reason: formData.explanation,
        photos: formData.photos
      });

      toast.success('Đã gửi khiếu nại. Admin sẽ xem xét và giải quyết trong 48h.');
      if (onSuccess) {
        onSuccess(response);
      }
      onClose();
    } catch (error) {
      console.error('Error contesting dispute:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    // In production, upload to cloud storage and get URLs
    // For now, use file URLs
    const photoURLs = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...photoURLs]
    }));
    toast.success(`Đã thêm ${files.length} ảnh`);
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen || !dispute) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold">Phản hồi tranh chấp</h2>
              <p className="text-sm text-gray-600">ID: {dispute.disputeId}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Dispute Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <span className="font-semibold">Loại tranh chấp:</span>
                <span className="ml-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  {dispute.type}
                </span>
              </div>
              <div>
                <span className="font-semibold">Lý do từ chối của người thuê:</span>
                <p className="mt-1 text-gray-700">{dispute.description}</p>
              </div>
              {dispute.evidence?.renter?.photos?.length > 0 && (
                <div>
                  <span className="font-semibold">Ảnh bằng chứng từ shipper (tại nhà người thuê):</span>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {dispute.evidence.renter.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Evidence ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Response Selection */}
            {!responseType && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Chọn cách phản hồi:</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Acknowledge */}
                  <button
                    onClick={handleAcknowledge}
                    disabled={loading}
                    className="p-6 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all text-left space-y-3 disabled:opacity-50"
                  >
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <h4 className="font-semibold text-lg">Thừa nhận lỗi</h4>
                    <p className="text-sm text-gray-600">
                      Hệ thống sẽ tự động hoàn 100% tiền cho người thuê.
                      Bạn sẽ bị trừ 20 điểm credit score.
                    </p>
                  </button>

                  {/* Contest */}
                  <button
                    onClick={() => setResponseType('CONTEST')}
                    className="p-6 border-2 border-orange-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-left space-y-3"
                  >
                    <XCircle className="w-8 h-8 text-orange-600" />
                    <h4 className="font-semibold text-lg">Khiếu nại</h4>
                    <p className="text-sm text-gray-600">
                      Tôi không đồng ý. Sản phẩm giao đúng như mô tả.
                      Cần admin xem xét và giải quyết.
                    </p>
                  </button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Bạn có 24 giờ để phản hồi kể từ khi tranh chấp được tạo</li>
                      <li>Nếu không phản hồi, hệ thống sẽ tự động xử lý nghiêng về người thuê</li>
                      <li>Nếu chọn khiếu nại, cần cung cấp bằng chứng rõ ràng</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Contest Form */}
            {responseType === 'CONTEST' && (
              <form onSubmit={handleContest} className="space-y-6">
                <div>
                  <button
                    type="button"
                    onClick={() => setResponseType(null)}
                    className="text-sm text-gray-600 hover:text-gray-900 mb-4"
                  >
                    ← Quay lại chọn phản hồi
                  </button>
                </div>

                <div>
                  <label className="block font-semibold mb-2">
                    Giải thích chi tiết <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.explanation}
                    onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                    placeholder="Giải thích tại sao bạn không đồng ý với khiếu nại của người thuê (ít nhất 20 ký tự)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={5}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.explanation.length}/20 ký tự tối thiểu
                  </p>
                </div>

                <div>
                  <label className="block font-semibold mb-2">
                    Ảnh bằng chứng <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    Upload ảnh chụp sản phẩm khi đóng gói, ảnh từ shipper tại nhà bạn, hoặc bất kỳ bằng chứng nào chứng minh sản phẩm đúng như mô tả
                  </p>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <label className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-700 font-semibold">
                        Chọn ảnh
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      PNG, JPG, GIF tối đa 10MB
                    </p>
                  </div>

                  {formData.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {formData.photos.map((photo, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={photo}
                            alt={`Upload ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={loading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || !formData.explanation || formData.photos.length === 0}
                  >
                    {loading ? 'Đang gửi...' : 'Gửi khiếu nại'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OwnerResponseModal;
