import React, { useState } from 'react';
import { X, Calendar, FileText, Image, AlertCircle } from 'lucide-react';
import { useDispute } from '../../context/DisputeContext';

/**
 * Modal cho renter đề xuất reschedule khi có lý do chính đáng
 */
const RescheduleRequestModal = ({ isOpen, onClose, dispute }) => {
  const { proposeReschedule } = useDispute();
  const [formData, setFormData] = useState({
    proposedReturnDate: '',
    reason: '',
    evidence: {
      photos: [],
      documents: [],
      notes: ''
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.proposedReturnDate || !formData.reason) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    // Validate date (phải sau ngày hiện tại)
    const proposedDate = new Date(formData.proposedReturnDate);
    if (proposedDate <= new Date()) {
      alert('Ngày trả hàng đề xuất phải sau ngày hiện tại');
      return;
    }

    setIsSubmitting(true);
    try {
      await proposeReschedule(dispute._id, formData);
      onClose();
    } catch (error) {
      console.error('Submit reschedule error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEvidenceChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      evidence: {
        ...prev.evidence,
        [field]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Đề xuất lịch trả hàng mới
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Alert */}
        <div className="px-6 py-4 bg-yellow-50 border-l-4 border-yellow-400">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-700">
              <p className="font-medium mb-1">Lưu ý quan trọng:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Bạn chỉ được đề xuất reschedule <strong>1 lần duy nhất</strong></li>
                <li>Cần có <strong>lý do chính đáng</strong> và bằng chứng minh chứng</li>
                <li>Owner có quyền chấp nhận hoặc từ chối</li>
                <li>Nếu được chấp nhận, bạn sẽ bị phạt <strong>10% deposit</strong> và <strong>-5 credit score</strong></li>
                <li>Nếu bị từ chối, Admin sẽ xem xét và quyết định</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Proposed Return Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Ngày trả hàng đề xuất *
            </label>
            <input
              type="datetime-local"
              value={formData.proposedReturnDate}
              onChange={(e) => handleChange('proposedReturnDate', e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Chọn ngày và giờ bạn có thể trả hàng
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Lý do chính đáng *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              rows={5}
              placeholder="Ví dụ: Tôi đang nằm viện vì tai nạn, dự kiến xuất viện ngày 15/12. Tôi cam kết sẽ trả hàng ngay sau khi xuất viện..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Giải thích chi tiết lý do không thể trả hàng đúng hạn
            </p>
          </div>

          {/* Evidence Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Image className="w-4 h-4 inline mr-1" />
              Bằng chứng (ảnh/tài liệu)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files);
                // In real app, upload files and get URLs
                console.log('Selected files:', files);
                handleEvidenceChange('photos', files.map(f => f.name));
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ảnh giấy tờ bệnh viện, vé máy bay công tác, v.v.
            </p>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú thêm
            </label>
            <textarea
              value={formData.evidence.notes}
              onChange={(e) => handleEvidenceChange('notes', e.target.value)}
              rows={3}
              placeholder="Thông tin bổ sung (nếu có)..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi đề xuất'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleRequestModal;
