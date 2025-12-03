import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispute } from '../../context/DisputeContext';
import DisputeHeader from './DisputeHeader';
import DisputeParties from './DisputeParties';
import DisputeEvidence from './DisputeEvidence';
import DisputeTimeline from './DisputeTimeline';
import DisputeActions from './DisputeActions';
import NegotiationRoom from './NegotiationRoom';
import ThirdPartySection from './ThirdPartySection';

const DisputeDetail = () => {
  const { disputeId } = useParams();
  const { currentDispute, isLoading, loadDisputeDetail } = useDispute();

  useEffect(() => {
    if (disputeId) {
      loadDisputeDetail(disputeId);
    }
  }, [disputeId, loadDisputeDetail]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentDispute) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Không tìm thấy tranh chấp</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <DisputeHeader dispute={currentDispute} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Complainant Evidence */}
            <DisputeEvidence 
              evidence={currentDispute.evidence}
              title="Bằng chứng người khiếu nại"
            />

            {/* Respondent Response */}
            {currentDispute.respondentResponse && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Phản hồi từ bên bị khiếu nại
                </h2>
                
                {/* Decision and Reason */}
                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Quyết định</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      currentDispute.respondentResponse.decision === 'ACCEPTED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {currentDispute.respondentResponse.decision === 'ACCEPTED' ? 'Chấp nhận' : 'Từ chối'}
                    </span>
                  </div>
                  
                  {currentDispute.respondentResponse.reason && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Lý do</p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {currentDispute.respondentResponse.reason}
                      </p>
                    </div>
                  )}

                  {currentDispute.respondentResponse.respondedAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Thời gian phản hồi</p>
                      <p className="text-sm text-gray-600">
                        {new Date(currentDispute.respondentResponse.respondedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Evidence */}
                {currentDispute.respondentResponse.evidence && (
                  <DisputeEvidence 
                    evidence={currentDispute.respondentResponse.evidence}
                    title="Bằng chứng bổ sung"
                  />
                )}
              </div>
            )}

            {/* Admin Decision */}
            {currentDispute.adminDecision?.comments && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Quyết định của Admin
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Nhận xét</p>
                    <p className="text-sm text-gray-600">{currentDispute.adminDecision.comments}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Quyết định</p>
                    <p className="text-sm text-gray-600">{currentDispute.adminDecision.decision}</p>
                  </div>
                  {currentDispute.adminDecision.refundAmount && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Số tiền hoàn</p>
                      <p className="text-sm text-gray-600">
                        {currentDispute.adminDecision.refundAmount.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Negotiation Room */}
            {(currentDispute.status === 'IN_NEGOTIATION' || 
              currentDispute.status === 'NEGOTIATION_AGREED' ||
              currentDispute.status === 'NEGOTIATION_NEEDED' ||
              currentDispute.status === 'AGREED_AWAITING_ADMIN' ||
              currentDispute.status === 'THIRD_PARTY_ESCALATED') && (
              <NegotiationRoom dispute={currentDispute} />
            )}

            {/* Third Party Resolution */}
            {(currentDispute.status === 'THIRD_PARTY_ESCALATED' || 
              currentDispute.status === 'THIRD_PARTY_EVIDENCE_UPLOADED' ||
              currentDispute.thirdPartyResolution) && (
              <ThirdPartySection dispute={currentDispute} />
            )}

            {/* Timeline */}
            <DisputeTimeline dispute={currentDispute} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <DisputeParties dispute={currentDispute} />
            <DisputeActions dispute={currentDispute} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputeDetail;
