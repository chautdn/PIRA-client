import { useState } from 'react';
import { AlertCircle, X, Calendar, FileText, Camera, Clock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const RespondRenterNoReturnModal = ({ 
  isOpen, 
  onClose, 
  dispute,
  onProposeReschedule
}) => {
  // Chỉ có 1 option: bắt buộc phải đề xuất reschedule
  const [formData, setFormData] = useState({
    proposedReturnDate: '',
    reason: '',
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
    
    // Bắt buộc phải có ngày trả và lý do
    if (!formData.proposedReturnDate || !formData.reason) {
      toast.error('Vui lòng điền đầy đủ ngày trả và lý do');
      return;
    }
    
    // Validate date is in future
    const proposedDate = new Date(formData.proposedReturnDate);
    if (proposedDate <= new Date()) {
      toast.error('Ngày trả phải sau ngày hiện tại');
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

      // Gửi đề xuất reschedule (bắt buộc)
      await onProposeReschedule(dispute._id, {
        proposedReturnDate: formData.proposedReturnDate,
        reason: formData.reason,
        evidence: {
          photos: imageUrls,
          additionalInfo: formData.reason
        }
      });

      onClose();
      
      // Reset form
      setFormData({
        proposedReturnDate: '',
        reason: '',
        images: [],
        videos: []
      });
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error responding to RENTER_NO_RETURN dispute:', error);
      toast.error(error.response?.data?.message || 'Phản hồi thất bại');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  // Calculate deadline (48h from dispute creation)
  const deadline = dispute?.createdAt 
    ? new Date(new Date(dispute.createdAt).getTime() + 48 * 60 * 60 * 1000)
    : null;
  
  const timeRemaining = deadline 
    ? Math.max(0, deadline.getTime() - Date.now())
    : 0;
  
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Phản hồi tranh chấp
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Renter không trả hàng - Mã: {dispute?.disputeId}
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

          {/* Countdown Timer */}
          {timeRemaining > 0 && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-red-800 mb-1">
                    ⏰ Thời gian còn lại: {hoursRemaining}h {minutesRemaining}m
                  </p>
                  <p className="text-red-700">
                    Bạn cần phản hồi trong vòng 48 giờ. Nếu không phản hồi, hệ thống sẽ tự động phạt 50-100% tiền cọc.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dispute Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Nội dung tranh chấp</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">Tiêu đề:</p>
                <p className="font-medium text-gray-900">{dispute?.title}</p>
              </div>
              <div>
                <p className="text-gray-600">Mô tả từ owner:</p>
                <p className="text-gray-900">{dispute?.description}</p>
              </div>
              {dispute?.evidence?.shipperReport && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs text-blue-700 font-semibold mb-1">Báo cáo từ shipper:</p>
                  <p className="text-sm text-blue-900">{dispute.evidence.shipperReport}</p>
                </div>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-red-800 mb-2">
                  ⚠️ Hình phạt và quy trình:
                </p>
                <ul className="text-red-700 space-y-2 list-disc list-inside">
                  <li><strong>Đề xuất lịch mới + Owner chấp nhận:</strong> Phạt 10% cọc + -5 điểm tín dụng</li>
                  <li><strong>Owner từ chối lịch bạn đề xuất:</strong> 2 bên sẽ thương lượng ngày khác trong phòng chat</li>
                  <li><strong>Không phản hồi trong 48h:</strong> Tự động escalate lên công an</li>
                  <li><strong>Không thương lượng được trong 7 ngày:</strong> Báo công an - Phạt 100% cọc + 100% giá trị sản phẩm + Blacklist vĩnh viễn</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Instruction */}
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-green-800 mb-1">
                  📅 Đề xuất lịch trả hàng mới (Bắt buộc)
                </p>
                <p className="text-green-700">
                  Bạn cần đề xuất ngày trả hàng khác và cung cấp lý do chính đáng (ốm đau, công tác...) kèm bằng chứng. 
                  Owner sẽ xem xét và quyết định chấp nhận hoặc thương lượng ngày khác.
                </p>
              </div>
            </div>
          </div>

          {/* Form - Direct Reschedule (No Options) */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Reschedule Form - Always shown */}
            <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày trả hàng đề xuất <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.proposedReturnDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, proposedReturnDate: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do chính đáng <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ví dụ:&#10;- Bị ốm đột xuất, có giấy bác sĩ xác nhận&#10;- Đi công tác gấp, có xác nhận từ công ty&#10;- Tai nạn giao thông, có biên bản cảnh sát&#10;&#10;Lưu ý: Cần có bằng chứng (ảnh giấy tờ) để được chấp nhận!"
                    required
                  />
                  <p className="text-xs text-green-700 mt-2">
                    💡 Owner sẽ xem xét và quyết định chấp nhận hay từ chối
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Camera className="w-4 h-4 inline mr-1" />
                    Bằng chứng (giấy bác sĩ, xác nhận công ty...) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  {formData.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative aspect-square group">
                          <img
                            src={img.url}
                            alt={`Evidence ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg border border-green-200"
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
                className="px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-white bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isUploading ? 'Đang upload...' : 'Đang gửi...'}</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Gửi đề xuất reschedule</span>
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

export default RespondRenterNoReturnModal;
