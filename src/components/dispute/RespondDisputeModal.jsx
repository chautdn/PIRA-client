import { useState } from 'react';

const RespondDisputeModal = ({ isOpen, onClose, onSubmit }) => {
  const [decision, setDecision] = useState(''); // 'ACCEPTED' or 'REJECTED'
  const [reason, setReason] = useState('');
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!decision) {
      alert('Vui lòng chọn quyết định');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        decision,
        reason,
        evidence: {
          description: reason,
          images
        }
      });
      onClose();
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    // In real app, upload images and get URLs
    // For now, just store file names
    setImages(files.map(f => URL.createObjectURL(f)));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Phản hồi tranh chấp
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Accept/Reject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quyết định <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={decision === 'ACCEPTED'}
                    onChange={() => setDecision('ACCEPTED')}
                    className="mr-2"
                  />
                  <span className="text-sm">Chấp nhận</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={decision === 'REJECTED'}
                    onChange={() => setDecision('REJECTED')}
                    className="mr-2"
                  />
                  <span className="text-sm">Từ chối</span>
                </label>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập lý do quyết định của bạn..."
                required
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hình ảnh bằng chứng
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {images.length > 0 && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {images.map((img, idx) => (
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

            {/* Actions */}
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
                {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RespondDisputeModal;
