import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDispute } from '../../context/DisputeContext';
import RespondDisputeModal from './RespondDisputeModal';
import UserRespondAdminDecisionModal from './UserRespondAdminDecisionModal';
import AgreementResponseModal from './AgreementResponseModal';
import ThirdPartyEvidenceModal from './ThirdPartyEvidenceModal';
import {
  canRespond,
  canRespondToAdminDecision,
  canRespondToAgreement,
  canUploadThirdPartyEvidence
} from '../../utils/disputeHelpers';

const DisputeActions = ({ dispute }) => {
  const { user } = useAuth();
  const { 
    respondToDispute, 
    respondToAdminDecision, 
    respondToAgreement,
    uploadThirdPartyEvidence 
  } = useDispute();

  const [showRespondModal, setShowRespondModal] = useState(false);
  const [showAdminResponseModal, setShowAdminResponseModal] = useState(false);
  const [showAgreementResponseModal, setShowAgreementResponseModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  // Check if it's a shipper fault dispute - users cannot respond
  const isShipperFault = dispute.type === 'DAMAGED_BY_SHIPPER';
  
  const userCanRespond = !isShipperFault && canRespond(dispute, user?._id);
  const userCanRespondToAdmin = canRespondToAdminDecision(dispute, user?._id);
  const userCanRespondToProposal = !isShipperFault && canRespondToAgreement(dispute, user?._id);
  const userCanUploadEvidence = canUploadThirdPartyEvidence(dispute, user?._id);

  const handleRespondToDispute = async (data) => {
    await respondToDispute(dispute._id, data);
    setShowRespondModal(false);
  };

  const handleAdminResponse = async (data) => {
    await respondToAdminDecision(dispute._id, data);
    setShowAdminResponseModal(false);
  };

  const handleRespondToAgreement = async (data) => {
    await respondToAgreement(dispute._id, data);
    setShowAgreementResponseModal(false);
  };

  const handleUploadEvidence = async (data) => {
    await uploadThirdPartyEvidence(dispute._id, data);
    setShowEvidenceModal(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Hành động</h2>
      
      {/* Shipper fault notice */}
      {isShipperFault && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Tranh chấp lỗi vận chuyển</h3>
              <p className="mt-1 text-sm text-blue-700">
                Admin đang xử lý với đơn vị vận chuyển. Bạn sẽ nhận được thông báo khi có kết quả.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {userCanRespond && (
          <button
            onClick={() => setShowRespondModal(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Phản hồi tranh chấp
          </button>
        )}

        {userCanRespondToAdmin && (
          <button
            onClick={() => setShowAdminResponseModal(true)}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
          >
            Phản hồi quyết định Admin
          </button>
        )}

        {userCanRespondToProposal && (
          <button
            onClick={() => setShowAgreementResponseModal(true)}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Phản hồi thỏa thuận
          </button>
        )}

        {userCanUploadEvidence && (
          <button
            onClick={() => setShowEvidenceModal(true)}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
          >
            Tải bằng chứng bên thứ 3
          </button>
        )}

        {!userCanRespond && !userCanRespondToAdmin && !userCanRespondToProposal && !userCanUploadEvidence && (
          <div className="text-center py-4 text-gray-500 text-sm">
            Không có hành động khả dụng
          </div>
        )}
      </div>

      {/* Respond to Dispute Modal */}
      <RespondDisputeModal
        isOpen={showRespondModal}
        onClose={() => setShowRespondModal(false)}
        onSubmit={handleRespondToDispute}
      />

      {/* User Respond Admin Decision Modal */}
      <UserRespondAdminDecisionModal
        isOpen={showAdminResponseModal}
        onClose={() => setShowAdminResponseModal(false)}
        onSubmit={handleAdminResponse}
        dispute={dispute}
      />

      {/* Agreement Response Modal */}
      <AgreementResponseModal
        isOpen={showAgreementResponseModal}
        onClose={() => setShowAgreementResponseModal(false)}
        onSubmit={handleRespondToAgreement}
        agreement={dispute?.negotiationRoom?.finalAgreement}
      />

      {/* Third Party Evidence Modal */}
      <ThirdPartyEvidenceModal
        isOpen={showEvidenceModal}
        onClose={() => setShowEvidenceModal(false)}
        onSubmit={handleUploadEvidence}
      />
    </div>
  );
};

export default DisputeActions;
