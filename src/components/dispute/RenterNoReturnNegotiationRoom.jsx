import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDispute } from '../../context/DisputeContext';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/disputeHelpers';

/**
 * Negotiation Room đặc biệt cho RENTER_NO_RETURN
 * Chỉ cho phép đàm phán NGÀY TRẢ HÀNG, không phải số tiền bồi thường
 */
const RenterNoReturnNegotiationRoom = ({ dispute }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { finalizeRescheduleAgreement, escalateToThirdParty } = useDispute();
  
  const [agreedDate, setAgreedDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);

  const negotiation = dispute.negotiationRoom;
  
  // RENTER_NO_RETURN: complainant = Owner, respondent = Renter
  const isOwner = user?._id === dispute.complainant._id;
  const isRenter = user?._id === dispute.respondent._id;
  
  // Calculate time remaining
  const deadline = new Date(negotiation?.deadline);
  const now = new Date();
  const hoursRemaining = Math.max(0, Math.floor((deadline - now) / (1000 * 60 * 60)));
  const isExpired = hoursRemaining === 0;

  // Lấy thông tin người còn lại
  const otherParty = isOwner ? dispute.respondent : dispute.complainant;
  const otherPartyRole = isOwner ? 'Renter' : 'Owner';
  const otherPartyName = otherParty?.profile?.fullName || otherPartyRole;

  // Ngày reschedule ban đầu bị từ chối
  const originalProposedDate = dispute.rescheduleRequest?.proposedReturnDate;
  const rejectionReason = dispute.rescheduleRequest?.ownerResponse?.reason;

  const handleOpenChat = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return;
    }

    try {
      const chatRoomId = negotiation?.chatRoomId?._id || negotiation?.chatRoomId;
      
      if (!chatRoomId) {
        toast.error('Phòng chat chưa được tạo');
        return;
      }
      
      navigate(`/chat/${chatRoomId}?refetch=true`);
    } catch (error) {
      console.error('Error opening chat:', error);
      toast.error('Không thể mở chat');
    }
  };

  const handleFinalizeDate = async () => {
    if (!agreedDate) {
      toast.error('Vui lòng chọn ngày trả hàng');
      return;
    }

    const selectedDate = new Date(agreedDate);
    if (selectedDate <= new Date()) {
      toast.error('Ngày trả hàng phải sau ngày hiện tại');
      return;
    }

    if (!window.confirm(`Xác nhận thỏa thuận ngày trả hàng: ${new Date(agreedDate).toLocaleDateString('vi-VN')}?\n\nSau khi xác nhận:\n- Shipment mới sẽ được tạo\n- Renter sẽ bị phạt: giá thuê 1 ngày × số ngày trễ (trừ từ cọc)`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      await finalizeRescheduleAgreement(dispute._id, agreedDate);
      toast.success('Đã thỏa thuận ngày trả hàng thành công!');
    } catch (error) {
      console.error('Finalize date error:', error);
      toast.error(error.message || 'Không thể hoàn tất thỏa thuận');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEscalate = async () => {
    if (!window.confirm('Bạn có chắc muốn chuyển qua công an xử lý?\n\nSau khi chuyển:\n- Admin sẽ chia sẻ thông tin 2 bên\n- Tiền cọc sẽ được chuyển vào ví của bạn\n- 2 bên tự giải quyết bên ngoài hệ thống\n- Hệ thống không can thiệp thêm')) {
      return;
    }

    try {
      setIsEscalating(true);
      await escalateToThirdParty(dispute._id, {
        reason: 'Không thể thỏa thuận ngày trả hàng - Chuyển công an'
      });
      toast.success('Đã chuyển cho công an xử lý. Admin sẽ chia sẻ thông tin cho 2 bên.');
    } catch (error) {
      console.error('Escalate error:', error);
      toast.error(error.message || 'Không thể chuyển cho công an');
    } finally {
      setIsEscalating(false);
    }
  };

  if (!negotiation) {
    return null;
  }

  // Lấy ngày trả hàng gốc từ subOrder
  const productItem = dispute.subOrder?.products?.[dispute.productIndex];
  const originalReturnDate = productItem?.rentalPeriod?.endDate 
    ? new Date(productItem.rentalPeriod.endDate) 
    : null;
  
  // Tính ngày tối đa (7 ngày từ ngày trả hàng gốc)
  const maxAllowedDate = originalReturnDate 
    ? new Date(originalReturnDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    : null;

  // Tính ngày min cho date picker (ngày mai)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  const maxDate = maxAllowedDate ? maxAllowedDate.toISOString().split('T')[0] : '';

  // Lấy giá thuê 1 ngày để hiển thị
  const dailyRentalPrice = productItem?.product?.rentalPrices?.perDay || 
    (productItem?.totalRental && productItem?.rentalPeriod?.startDate && productItem?.rentalPeriod?.endDate
      ? productItem.totalRental / Math.ceil((new Date(productItem.rentalPeriod.endDate) - new Date(productItem.rentalPeriod.startDate)) / (1000 * 60 * 60 * 24))
      : 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">📅 Thỏa thuận ngày trả hàng</h2>
          <p className="text-sm text-gray-600 mt-1">
            Bạn và {otherPartyName} có 3 ngày để thỏa thuận ngày trả hàng mới
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isExpired 
            ? 'bg-red-100 text-red-800' 
            : hoursRemaining < 24 
            ? 'bg-amber-100 text-amber-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {isExpired ? '⏰ Đã hết hạn' : `⏰ Còn ${hoursRemaining}h`}
        </div>
      </div>

      <div className="space-y-4">
        {/* Timeline Info */}
        <div className="text-sm text-gray-600 space-y-1 p-3 bg-gray-50 rounded">
          <p>🕐 Bắt đầu: {formatDate(negotiation.startedAt)}</p>
          <p>⏰ Hết hạn: {formatDate(negotiation.deadline)}</p>
        </div>

        {/* Original Proposal Info */}
        {originalProposedDate && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="font-medium text-orange-800 mb-2">📋 Đề xuất ban đầu bị từ chối</h3>
            <div className="space-y-2 text-sm">
              <p className="text-orange-700">
                <strong>Ngày đề xuất:</strong> {formatDate(originalProposedDate)}
              </p>
              {rejectionReason && (
                <p className="text-orange-700">
                  <strong>Lý do từ chối:</strong> {rejectionReason}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Chat Section */}
        {!isExpired && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="mb-3">
              <h4 className="font-semibold text-gray-900 mb-1">💬 Chat thương lượng</h4>
              <p className="text-sm text-gray-600">
                Thảo luận với {otherPartyName} để tìm ngày trả hàng phù hợp cho cả 2 bên
              </p>
            </div>
            {negotiation?.chatRoomId ? (
              <button
                onClick={handleOpenChat}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Vào phòng chat
              </button>
            ) : (
              <p className="text-sm text-yellow-800 text-center p-2 bg-yellow-50 rounded">
                ⚠️ Phòng chat chưa được tạo
              </p>
            )}
          </div>
        )}

        {/* Finalize Date Section - Cả 2 bên đều có thể finalize */}
        {!isExpired && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-800 mb-3">✅ Xác nhận ngày trả hàng đã thỏa thuận</h3>
            <p className="text-sm text-green-700 mb-3">
              Sau khi cả 2 bên đã đồng ý qua chat, chọn ngày và xác nhận bên dưới:
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="date"
                  min={minDate}
                  max={maxDate}
                  value={agreedDate}
                  onChange={(e) => setAgreedDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {originalReturnDate && maxAllowedDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Ngày trả gốc: {originalReturnDate.toLocaleDateString('vi-VN')} | 
                    Tối đa: {maxAllowedDate.toLocaleDateString('vi-VN')} (trong vòng 7 ngày)
                  </p>
                )}
              </div>
              <button
                onClick={handleFinalizeDate}
                disabled={isSubmitting || !agreedDate}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium"
              >
                {isSubmitting ? 'Đang xử lý...' : '✓ Xác nhận ngày'}
              </button>
            </div>

            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <p className="font-medium mb-1">💰 Cách tính tiền phạt:</p>
              <p>Phạt = Giá thuê/ngày × Số ngày trễ</p>
              {dailyRentalPrice > 0 && (
                <p className="mt-1">Giá thuê: {dailyRentalPrice.toLocaleString('vi-VN')}đ/ngày</p>
              )}
              <p className="mt-1">Phần deposit còn lại sẽ hoàn về ví renter.</p>
            </div>
          </div>
        )}

        {/* Escalate to Police */}
        {!isExpired && isOwner && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-medium text-red-800 mb-2">🚨 Không thể thỏa thuận?</h3>
            <p className="text-sm text-red-700 mb-3">
              Nếu renter không hợp tác, bạn có thể chuyển qua công an xử lý. Admin sẽ chia sẻ thông tin 2 bên, tiền cọc sẽ được chuyển vào ví của bạn.
            </p>
            <button
              onClick={handleEscalate}
              disabled={isEscalating}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium"
            >
              {isEscalating ? 'Đang xử lý...' : '🚔 Chuyển cho công an'}
            </button>
          </div>
        )}

        {/* Expired Message */}
        {isExpired && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium mb-2">
              ⚠️ Thời gian thỏa thuận đã hết!
            </p>
            <p className="text-sm text-red-700">
              Hệ thống sẽ tự động chuyển tranh chấp cho công an xử lý. 
              Tiền cọc sẽ được chuyển vào ví owner, 2 bên tự giải quyết bên ngoài.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          <p className="font-medium mb-1">⚠️ Lưu ý quan trọng:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Ngày trả hàng mới phải trong vòng <strong>7 ngày</strong> kể từ ngày trả hàng gốc</li>
            <li>Tiền phạt = Giá thuê/ngày × Số ngày trễ (trừ từ deposit)</li>
            <li>Phần deposit còn lại sẽ hoàn về ví renter</li>
            <li>Nếu hết thời gian mà chưa thỏa thuận → Chuyển công an, deposit chuyển owner</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RenterNoReturnNegotiationRoom;
