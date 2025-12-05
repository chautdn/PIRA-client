import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDispute } from '../../context/DisputeContext';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/disputeHelpers';
import OwnerFinalDecisionModal from './OwnerFinalDecisionModal';
import OwnerDisputeFinalDecisionModal from './OwnerDisputeFinalDecisionModal';
import chatService from '../../services/chat';

const NegotiationRoom = ({ dispute }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { respondToOwnerDecision, escalateToThirdParty } = useDispute();
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);

  const negotiation = dispute.negotiationRoom;
  const finalAgreement = negotiation?.finalAgreement;
  
  const isComplainant = user?._id === dispute.complainant._id;
  const isRespondent = user?._id === dispute.respondent._id;
  
  // Xác định vai trò Owner/Renter dựa trên shipmentType
  // DELIVERY: complainant = Renter, respondent = Owner
  // RETURN: complainant = Owner, respondent = Renter
  const isOwner = dispute.shipmentType === 'DELIVERY' ? isRespondent : isComplainant;
  const isRenter = dispute.shipmentType === 'DELIVERY' ? isComplainant : isRespondent;
  
  // Chỉ owner mới có thể đưa ra quyết định cuối
  const canMakeFinalDecision = isOwner;

  // Calculate time remaining
  const deadline = new Date(negotiation?.deadline);
  const now = new Date();
  const hoursRemaining = Math.max(0, Math.floor((deadline - now) / (1000 * 60 * 60)));
  const isExpired = hoursRemaining === 0;

  const handleOpenChat = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return;
    }

    try {
      // Negotiation room đã có sẵn chatRoomId do admin tạo
      const chatRoomId = negotiation?.chatRoomId?._id || negotiation?.chatRoomId;
      
      if (!chatRoomId) {
        console.error('Chat room not found:', { negotiation, dispute });
        toast.error('Phòng chat chưa được tạo. Vui lòng liên hệ admin.');
        return;
      }
      
      // Navigate trực tiếp đến chat room
      navigate(`/chat/${chatRoomId}?refetch=true`);
    } catch (error) {
      console.error('Error opening chat:', error);
      toast.error('Không thể mở chat. Vui lòng thử lại.');
    }
  };

  const handleRespondToOwnerDecision = async (accepted) => {
    const message = accepted 
      ? 'Bạn có chắc đồng ý với quyết định của Owner? Quyết định sẽ được gửi cho Admin.'
      : 'Bạn có chắc từ chối quyết định của Owner? Tranh chấp sẽ chuyển cho bên thứ 3.';
    
    if (!window.confirm(message)) {
      return;
    }
    
    try {
      setIsResponding(true);
      await respondToOwnerDecision(dispute._id, accepted);
      const successMessage = accepted 
        ? 'Đã đồng ý với quyết định - Gửi cho Admin xử lý'
        : 'Đã từ chối quyết định - Chuyển cho bên thứ 3 giải quyết';
      toast.success(successMessage);
    } catch (error) {
      console.error('Respond to owner decision error:', error);
      toast.error(error.message || 'Không thể phản hồi quyết định');
    } finally {
      setIsResponding(false);
    }
  };

  const handleEscalateToThirdParty = async () => {
    if (!window.confirm('Bạn có chắc muốn chuyển tranh chấp cho bên thứ 3? Quyết định này không thể hoàn tác.')) {
      return;
    }

    try {
      setIsEscalating(true);
      await escalateToThirdParty(dispute._id, {
        reason: 'Không thể thỏa thuận trong thời gian quy định'
      });
      toast.success('Đã chuyển tranh chấp cho bên thứ 3');
    } catch (error) {
      console.error('Escalate to third party error:', error);
      toast.error(error.message || 'Không thể chuyển cho bên thứ 3');
    } finally {
      setIsEscalating(false);
    }
  };

  if (!negotiation) {
    return null;
  }

  // Debug log
  console.log('🔍 NegotiationRoom - Full negotiation data:', JSON.stringify(negotiation, null, 2));
  console.log('🔍 NegotiationRoom - Final agreement:', JSON.stringify(finalAgreement, null, 2));
  console.log('🔍 NegotiationRoom - Owner decision:', finalAgreement?.ownerDecision);

  // Lấy tên người còn lại (không phải user)
  const otherParty = isComplainant ? dispute.respondent : dispute.complainant;
  const otherPartyRole = dispute.shipmentType === 'DELIVERY' 
    ? (isComplainant ? 'Owner' : 'Renter')
    : (isComplainant ? 'Renter' : 'Owner');
  const otherPartyName = otherParty.profile?.fullName || otherPartyRole;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">💬 Phòng đàm phán</h2>
          <p className="text-sm text-gray-600 mt-1">
            Bạn và {otherPartyName} có 3 ngày để thỏa thuận
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

        {/* Current Agreement Status */}
        {finalAgreement?.ownerDecision ? (
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="text-md font-semibold text-blue-900 mb-3">📋 Quyết định từ Owner</h3>
            
            <div className="space-y-2 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Quyết định cuối cùng:</p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap p-3 bg-white rounded border">
                  {finalAgreement.ownerDecision}
                </p>
              </div>
              
              <div className="text-xs text-gray-500">
                Đưa ra lúc: {formatDate(finalAgreement.decidedAt)}
              </div>
            </div>

            {/* Response Section - Renter phản hồi */}
            {isRenter && (
              dispute.shipmentType === 'DELIVERY' 
                ? finalAgreement.complainantAccepted === null 
                : finalAgreement.respondentAccepted === null
            ) && (
              <div className="pt-3 border-t border-blue-200">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Bạn có đồng ý với quyết định này không?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRespondToOwnerDecision(true)}
                    disabled={isResponding}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    ✅ Đồng ý
                  </button>
                  <button
                    onClick={() => handleRespondToOwnerDecision(false)}
                    disabled={isResponding}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    ❌ Từ chối
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Nếu đồng ý, sẽ gửi cho Admin xử lý. Nếu từ chối, chuyển cho bên thứ 3.
                </p>
              </div>
            )}

            {/* Response Status - Chỉ hiển thị khi Renter đã phản hồi */}
            {(dispute.shipmentType === 'DELIVERY' 
              ? finalAgreement.complainantAccepted !== null 
              : finalAgreement.respondentAccepted !== null
            ) && (
              <div className="pt-3 border-t border-blue-200">
                {(dispute.shipmentType === 'DELIVERY' 
                  ? finalAgreement.complainantAccepted 
                  : finalAgreement.respondentAccepted
                ) ? (
                  <div className="p-3 bg-green-100 border border-green-300 rounded">
                    <p className="text-sm text-green-800 text-center font-semibold">
                      ✅ Renter đã đồng ý! Đã gửi cho Admin xử lý cuối cùng.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-red-100 border border-red-300 rounded">
                    <p className="text-sm text-red-800 text-center font-semibold">
                      ❌ Renter đã từ chối. Chuyển cho bên thứ 3 xử lý.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <p className="text-gray-500 mb-1">Chưa có quyết định cuối cùng</p>
            <p className="text-sm text-gray-400">
              Sau khi thảo luận trong chat, Owner sẽ đưa ra quyết định cuối cùng
            </p>
          </div>
        )}

        {/* Chat Button */}
        {!isExpired && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="mb-3">
              <h4 className="font-semibold text-gray-900 mb-1">💬 Chat đàm phán</h4>
              <p className="text-sm text-gray-600">
                Thảo luận với {otherPartyName} để tìm ra giải pháp
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
                Vào phòng chat ngay
              </button>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-center">
                <p className="text-sm text-yellow-800 mb-2">
                  ⚠️ Phòng chat chưa được tạo. Vui lòng liên hệ admin để tạo phòng chat.
                </p>
                <p className="text-xs text-yellow-700">
                  Dispute ID: {dispute.disputeId}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {!isExpired && !finalAgreement?.ownerDecision && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Owner Final Decision Button */}
            {canMakeFinalDecision && (
              <button
                onClick={() => setShowDecisionModal(true)}
                className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Đưa ra quyết định cuối
              </button>
            )}

            {/* Escalate to Third Party Button */}
            <button
              onClick={handleEscalateToThirdParty}
              disabled={isEscalating}
              className="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {isEscalating ? 'Đang xử lý...' : 'Chuyển qua bên thứ 3'}
            </button>
          </div>
        )}

        {/* Warning about third party */}
        {!isExpired && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800">
              ⚠️ <strong>Lưu ý:</strong> Nếu không thỏa thuận được trong {hoursRemaining}h hoặc chuyển cho bên thứ 3, 
              tranh chấp sẽ do bên thứ 3 quyết định cuối cùng.
            </p>
          </div>
        )}

        {/* Expired Message */}
        {isExpired && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              ⚠️ Thời gian đàm phán đã hết. Tranh chấp sẽ được chuyển cho bên thứ 3 xử lý.
            </p>
          </div>
        )}
      </div>

      {/* Owner Final Decision Modal - chọn modal phù hợp */}
      {dispute.shipmentType === 'RETURN' ? (
        <OwnerDisputeFinalDecisionModal
          isOpen={showDecisionModal}
          onClose={() => setShowDecisionModal(false)}
          dispute={dispute}
        />
      ) : (
        <OwnerFinalDecisionModal
          isOpen={showDecisionModal}
          onClose={() => setShowDecisionModal(false)}
          dispute={dispute}
        />
      )}
    </div>
  );
};

export default NegotiationRoom;
