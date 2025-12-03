import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const ExternalPaymentSection = ({ dispute, onUpdate }) => {
  const { user } = useAuth();
  const [selectedImages, setSelectedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  const isRenter = user?._id === dispute.respondent._id;
  const isOwner = user?._id === dispute.complainant._id;
  
  const externalPayment = dispute.externalPayment;
  const hasUploadedReceipt = externalPayment?.receipt?.uploadedAt;
  const isConfirmed = externalPayment?.ownerConfirmation?.confirmed;

  // Calculate deadlines
  const uploadDeadline = externalPayment?.receiptUploadDeadline 
    ? new Date(externalPayment.receiptUploadDeadline)
    : null;
  const confirmDeadline = externalPayment?.confirmationDeadline
    ? new Date(externalPayment.confirmationDeadline)
    : null;
  const now = new Date();
  
  const daysUntilUploadDeadline = uploadDeadline 
    ? Math.max(0, Math.ceil((uploadDeadline - now) / (1000 * 60 * 60 * 24)))
    : 0;
  
  const daysUntilConfirmDeadline = confirmDeadline
    ? Math.max(0, Math.ceil((confirmDeadline - now) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Tối đa 5 ảnh');
      return;
    }
    setSelectedImages(files);
  };

  const handleUploadReceipt = async () => {
    if (selectedImages.length === 0) {
      toast.error('Vui lòng chọn ảnh biên lai');
      return;
    }

    setIsUploading(true);
    try {
      // Upload images first
      const formData = new FormData();
      selectedImages.forEach(file => {
        formData.append('images', file);
      });

      const uploadResponse = await api.post('/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const imageUrls = uploadResponse.data.urls || [];

      // Submit receipt
      const response = await api.post(`/disputes/${dispute._id}/upload-payment-receipt`, {
        images: imageUrls
      });

      toast.success('Upload biên lai thành công');
      setSelectedImages([]);
      onUpdate && onUpdate(response.data.dispute);
    } catch (error) {
      console.error('Upload receipt error:', error);
      toast.error(error.response?.data?.message || 'Upload biên lai thất bại');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmPayment = async (confirmed) => {
    if (!confirmed && !rejectNote.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    setIsConfirming(true);
    try {
      const response = await api.post(`/disputes/${dispute._id}/confirm-external-payment`, {
        confirmed,
        note: confirmed ? '' : rejectNote
      });

      toast.success(confirmed ? 'Đã xác nhận nhận tiền' : 'Đã báo cáo chưa nhận tiền');
      setShowRejectModal(false);
      setRejectNote('');
      onUpdate && onUpdate(response.data.dispute);
    } catch (error) {
      console.error('Confirm payment error:', error);
      toast.error(error.response?.data?.message || 'Xác nhận thất bại');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        💰 Thanh toán ngoài hệ thống
      </h2>

      {/* Thông tin thanh toán */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Tiền cọc đã trừ:</span>
            <span className="font-semibold text-gray-900">
              {externalPayment.depositUsed?.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="flex justify-between border-t border-orange-200 pt-3">
            <span className="text-sm font-medium text-orange-800">Cần thanh toán thêm:</span>
            <span className="text-xl font-bold text-orange-600">
              {externalPayment.amount?.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      </div>

      {/* Renter Section - Upload biên lai */}
      {isRenter && !hasUploadedReceipt && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-3">📋 Hướng dẫn thanh toán</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>1. Chuyển khoản <strong>{externalPayment.amount?.toLocaleString('vi-VN')}đ</strong> cho Owner</p>
              <p>2. Thông tin nhận:</p>
              <div className="ml-4 space-y-1 bg-white border border-blue-200 rounded p-3">
                <p>• Tên: <strong>{dispute.complainant?.bankAccount?.accountHolderName || dispute.complainant?.profile?.fullName || 'N/A'}</strong></p>
                <p>• STK: <strong>{dispute.complainant?.bankAccount?.accountNumber || 'N/A'}</strong></p>
                <p>• Ngân hàng: <strong>{dispute.complainant?.bankAccount?.bankName || 'N/A'}</strong></p>
                <p>• Nội dung CK: <strong>DISPUTE_{dispute.disputeId}</strong></p>
              </div>
              <p>3. Sau khi chuyển, upload ảnh chụp màn hình giao dịch</p>
              <p className="text-red-600 font-medium mt-2">
                ⏰ Hạn: {daysUntilUploadDeadline} ngày còn lại
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh biên lai chuyển khoản (tối đa 5 ảnh)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {selectedImages.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Đã chọn {selectedImages.length} ảnh
              </p>
            )}
          </div>

          <button
            onClick={handleUploadReceipt}
            disabled={isUploading || selectedImages.length === 0}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Đang upload...' : 'Upload biên lai'}
          </button>
        </div>
      )}

      {/* Renter đã upload - Chờ xác nhận */}
      {isRenter && hasUploadedReceipt && !isConfirmed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 mb-2">
            ✅ Bạn đã upload biên lai lúc {new Date(externalPayment.receipt.uploadedAt).toLocaleString('vi-VN')}
          </p>
          <p className="text-sm text-yellow-700">
            ⏳ Chờ Owner xác nhận đã nhận tiền ({daysUntilConfirmDeadline} ngày còn lại)
          </p>
          {externalPayment.receipt.images?.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {externalPayment.receipt.images.map((img, idx) => (
                <img key={idx} src={img} alt={`Receipt ${idx + 1}`} className="w-full h-24 object-cover rounded" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Owner Section - Xác nhận */}
      {isOwner && hasUploadedReceipt && !isConfirmed && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium mb-2">
              Renter đã upload biên lai thanh toán
            </p>
            <p className="text-sm text-green-700 mb-3">
              Upload lúc: {new Date(externalPayment.receipt.uploadedAt).toLocaleString('vi-VN')}
            </p>
            {externalPayment.receipt.images?.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {externalPayment.receipt.images.map((img, idx) => (
                  <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                    <img src={img} alt={`Receipt ${idx + 1}`} className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleConfirmPayment(true)}
              disabled={isConfirming}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              ✓ Xác nhận đã nhận tiền
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isConfirming}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              ✗ Chưa nhận được tiền
            </button>
          </div>
        </div>
      )}

      {/* Owner chưa có biên lai */}
      {isOwner && !hasUploadedReceipt && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-700">
            ⏳ Chờ Renter upload biên lai thanh toán ({daysUntilUploadDeadline} ngày còn lại)
          </p>
        </div>
      )}

      {/* Đã xác nhận */}
      {isConfirmed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">
            ✅ Owner đã xác nhận nhận được thanh toán
          </p>
          <p className="text-sm text-green-700 mt-1">
            Xác nhận lúc: {new Date(externalPayment.ownerConfirmation.confirmedAt).toLocaleString('vi-VN')}
          </p>
        </div>
      )}

      {/* Modal từ chối */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Báo cáo chưa nhận được tiền</h3>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              placeholder="Nhập lý do (VD: Kiểm tra tài khoản chưa có giao dịch này...)"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={() => handleConfirmPayment(false)}
                disabled={isConfirming}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
              >
                {isConfirming ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalPaymentSection;
