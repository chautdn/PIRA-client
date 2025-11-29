import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDispute } from '../../context/DisputeContext';
import RespondDisputeModal from './RespondDisputeModal';
import UserRespondAdminDecisionModal from './UserRespondAdminDecisionModal';
import ProposeAgreementModal from './ProposeAgreementModal';
import AgreementResponseModal from './AgreementResponseModal';
import ThirdPartyEvidenceModal from './ThirdPartyEvidenceModal';
import {
  canRespond,
  canRespondToAdminDecision,
  canProposeAgreement,
  canRespondToAgreement,
  canUploadThirdPartyEvidence
} from '../../utils/disputeHelpers';

const DisputeActions = ({ dispute }) => {
  const { user } = useAuth();
  const { 
    respondToDispute, 
    respondToAdminDecision, 
    proposeAgreement, 
    respondToAgreement,
    uploadThirdPartyEvidence 
  } = useDispute();

  const [showRespondModal, setShowRespondModal] = useState(false);
  const [showAdminResponseModal, setShowAdminResponseModal] = useState(false);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [showAgreementResponseModal, setShowAgreementResponseModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  const userCanRespond = canRespond(dispute, user?._id);
  const userCanRespondToAdmin = canRespondToAdminDecision(dispute, user?._id);
  const userCanPropose = canProposeAgreement(dispute, user?._id);
  const userCanRespondToProposal = canRespondToAgreement(dispute, user?._id);
  const userCanUploadEvidence = canUploadThirdPartyEvidence(dispute, user?._id);

  const handleRespondToDispute = async (data) => {
    await respondToDispute(dispute._id, data);
    setShowRespondModal(false);
  };

  const handleAdminResponse = async (data) => {
    await respondToAdminDecision(dispute._id, data);
    setShowAdminResponseModal(false);
  };

  const handleProposeAgreement = async (data) => {
    await proposeAgreement(dispute._id, data);
    setShowProposeModal(false);
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

        {userCanPropose && (
          <button
            onClick={() => setShowProposeModal(true)}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            Đề xuất thỏa thuận
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

        {!userCanRespond && !userCanRespondToAdmin && !userCanPropose && !userCanRespondToProposal && !userCanUploadEvidence && (
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

      {/* Propose Agreement Modal */}
      <ProposeAgreementModal
        isOpen={showProposeModal}
        onClose={() => setShowProposeModal(false)}
        onSubmit={handleProposeAgreement}
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
