import { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const ShipperDamageResolveModal = ({ isOpen, onClose, dispute, onSuccess }) => {
  const [formData, setFormData] = useState({
    solution: '', // 'REPLACEMENT' or 'REFUND_CANCEL'
    reasoning: '',
    shipperNotes: '',
    shipperPhotos: [],
    insuranceClaim: {
      claimNumber: '',
      status: 'PENDING',
      amount: 0
    },
    refundAmount: 0,
    compensationAmount: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (formData.shipperPhotos.length + files.length > 10) {
      toast.error('Tối đa 10 ảnh');
      return;
    }

    setUploadingPhotos(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);
        
        const response = await api.post('/upload/image', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        return response.data.url;
      });

      const urls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        shipperPhotos: [...prev.shipperPhotos, ...urls]
      }));
      toast.success(`Đã tải lên ${urls.length} ảnh`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Lỗi tải ảnh');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      shipperPhotos: prev.shipperPhotos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.solution) {
      toast.error('Vui lòng chọn giải pháp xử lý');
      return;
    }
    
    if (!formData.reasoning.trim()) {
      toast.error('Vui lòng nhập lý do quyết định');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await api.post(`/disputes/${dispute._id}/admin/resolve-shipper-damage`, {
        solution: formData.solution,
        reasoning: formData.reasoning,
        shipperEvidence: {
          photos: formData.shipperPhotos,
          notes: formData.shipperNotes,
          timestamp: new Date()
        },
        insuranceClaim: formData.insuranceClaim.claimNumber ? formData.insuranceClaim : null,
        refundAmount: parseFloat(formData.refundAmount) || 0,
        compensationAmount: parseFloat(formData.compensationAmount) || 0
      });
      
      toast.success('Đã xử lý tranh chấp lỗi shipper thành công');
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Error resolving shipper damage:', error);
      toast.error(error.response?.data?.message || 'Lỗi xử lý tranh chấp');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🚚 Xử lý tranh chấp lỗi vận chuyển
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Solution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giải pháp xử lý <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    checked={formData.solution === 'REPLACEMENT'}
                    onChange={() => setFormData(prev => ({ ...prev, solution: 'REPLACEMENT' }))}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">📦 Gửi hàng thay thế</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Owner gửi sản phẩm mới, shipper pickup miễn phí. Order tiếp tục bình thường.
                    </p>
                  </div>
                </label>
                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    checked={formData.solution === 'REFUND_CANCEL'}
                    onChange={() => setFormData(prev => ({ ...prev, solution: 'REFUND_CANCEL' }))}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">💰 Hoàn tiền + Hủy đơn</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Hoàn toàn bộ tiền cho renter, bồi thường owner. Shipper chịu chi phí.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Reasoning */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do quyết định <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reasoning}
                onChange={(e) => setFormData(prev => ({ ...prev, reasoning: e.target.value }))}
                rows="4"
                placeholder="Mô tả chi tiết nguyên nhân hư hỏng, trách nhiệm shipper..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Shipper Evidence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bằng chứng từ shipper
              </label>
              
              {/* Upload Photos */}
              <div className="mb-3">
                <label className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhotos}
                    className="hidden"
                  />
                  {uploadingPhotos ? 'Đang tải...' : '📷 Tải ảnh từ shipper'}
                </label>
                <span className="ml-2 text-xs text-gray-500">
                  ({formData.shipperPhotos.length}/10 ảnh)
                </span>
              </div>

              {/* Photo Preview */}
              {formData.shipperPhotos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {formData.shipperPhotos.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Shipper evidence ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Shipper Notes */}
              <textarea
                value={formData.shipperNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, shipperNotes: e.target.value }))}
                rows="2"
                placeholder="Ghi chú từ shipper (tùy chọn)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Insurance Claim */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Thông tin bảo hiểm (nếu có)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Mã claim</label>
                  <input
                    type="text"
                    value={formData.insuranceClaim.claimNumber}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      insuranceClaim: { ...prev.insuranceClaim, claimNumber: e.target.value }
                    }))}
                    placeholder="IC-2024-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Trạng thái</label>
                  <select
                    value={formData.insuranceClaim.status}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      insuranceClaim: { ...prev.insuranceClaim, status: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="PENDING">Đang xử lý</option>
                    <option value="APPROVED">Đã duyệt</option>
                    <option value="REJECTED">Từ chối</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Số tiền bảo hiểm (đ)</label>
                  <input
                    type="number"
                    value={formData.insuranceClaim.amount}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      insuranceClaim: { ...prev.insuranceClaim, amount: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Financial Details (only for REFUND_CANCEL) */}
            {formData.solution === 'REFUND_CANCEL' && (
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Chi tiết tài chính
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Hoàn cho renter (đ)
                    </label>
                    <input
                      type="number"
                      value={formData.refundAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, refundAmount: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Bồi thường owner (đ)
                    </label>
                    <input
                      type="number"
                      value={formData.compensationAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, compensationAmount: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Platform sẽ tạm ứng và thu lại từ shipper/bảo hiểm
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || uploadingPhotos}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận xử lý'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShipperDamageResolveModal;
