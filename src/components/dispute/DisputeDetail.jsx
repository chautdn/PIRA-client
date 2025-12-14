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
import WalletDepositWarning from './WalletDepositWarning';
import RescheduleSection from './RescheduleSection';
import { useAuth } from '../../hooks/useAuth';

const DisputeDetail = () => {
  const { disputeId } = useParams();
  const { currentDispute, isLoading, loadDisputeDetail } = useDispute();
  const { user } = useAuth();

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
            {currentDispute.respondentResponse?.decision && (
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

            {/* Reschedule Section - Only for RENTER_NO_RETURN */}
            {currentDispute.type === 'RENTER_NO_RETURN' && (
              <RescheduleSection dispute={currentDispute} currentUser={user} />
            )}

            {/* Admin Decision */}
            {(currentDispute.adminDecision?.decision || currentDispute.adminDecision?.reasoning) && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg shadow-md border-2 border-purple-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-purple-900">
                      Quyết định sơ bộ của Admin
                    </h2>
                    {currentDispute.adminDecision.decidedAt && (
                      <p className="text-xs text-purple-600">
                        {new Date(currentDispute.adminDecision.decidedAt).toLocaleString('vi-VN')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Decision Result */}
                {currentDispute.adminDecision.decision && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Kết luận:</p>
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                      currentDispute.adminDecision.decision === 'COMPLAINANT_RIGHT'
                        ? 'bg-green-100 text-green-800 border-2 border-green-300'
                        : 'bg-red-100 text-red-800 border-2 border-red-300'
                    }`}>
                      {currentDispute.adminDecision.decision === 'COMPLAINANT_RIGHT' 
                        ? '✓ Người khiếu nại đúng (Renter)' 
                        : '✓ Bên bị khiếu nại đúng (Owner)'}
                    </div>
                  </div>
                )}

                {/* Reasoning */}
                {currentDispute.adminDecision.reasoning && (
                  <div className="mb-4 bg-white rounded-lg p-4 border border-purple-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Lý do quyết định:</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {currentDispute.adminDecision.reasoning}
                    </p>
                  </div>
                )}

                {/* Financial Details */}
                {(() => {
                  const product = currentDispute.subOrder?.products?.[currentDispute.productIndex];
                  if (!product) return null;

                  const deposit = product.totalDeposit || 0;
                  const rental = product.totalRental || 0;
                  const shippingFee = product.totalShippingFee || 0;
                  
                  const startDate = new Date(product.rentalPeriod?.startDate);
                  const endDate = new Date(product.rentalPeriod?.endDate);
                  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;
                  const dailyRental = rental / totalDays;

                  let refundToRenter = 0;
                  let compensationToOwner = 0;
                  let penaltyNote = '';

                  if (currentDispute.adminDecision.decision === 'COMPLAINANT_RIGHT') {
                    refundToRenter = deposit + rental;
                    penaltyNote = 'Owner bị phạt';
                  } else if (currentDispute.adminDecision.decision === 'RESPONDENT_RIGHT') {
                    refundToRenter = deposit + rental - dailyRental;
                    compensationToOwner = dailyRental;
                    penaltyNote = 'Renter bị phạt';
                  }

                  return (
                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-900 mb-3">💰 Xử lý tài chính:</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">Hoàn tiền cọc cho Renter:</span>
                            <span className="font-semibold text-green-700">+{deposit.toLocaleString('vi-VN')}đ</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">Hoàn tiền thuê cho Renter:</span>
                            <span className="font-semibold text-green-700">
                              +{(currentDispute.adminDecision.decision === 'COMPLAINANT_RIGHT' ? rental : rental - dailyRental).toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                          {compensationToOwner > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700">Bồi thường cho Owner (1 ngày):</span>
                              <span className="font-semibold text-green-700">+{compensationToOwner.toLocaleString('vi-VN')}đ</span>
                            </div>
                          )}
                          <div className="border-t border-blue-300 pt-2 flex justify-between items-center">
                            <span className="font-bold text-blue-900">Tổng hoàn cho Renter:</span>
                            <span className="font-bold text-blue-900 text-lg">{refundToRenter.toLocaleString('vi-VN')}đ</span>
                          </div>
                          <p className="text-xs text-gray-600 italic mt-2">
                            ⚠️ Phí ship {shippingFee.toLocaleString('vi-VN')}đ sẽ không được hoàn lại
                          </p>
                        </div>
                      </div>

                      {/* Penalty Info */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Hình phạt:</p>
                        <div className="text-sm text-yellow-800 space-y-1">
                          <p className="font-medium">{penaltyNote}:</p>
                          <ul className="list-disc ml-5 space-y-1 text-xs">
                            <li>Bị trừ 30 điểm credit</li>
                            <li>Tăng 5 điểm loyalty (negative)</li>
                            <li>Nhận cảnh cáo lần 1 (3 lần = ban account)</li>
                          </ul>
                        </div>
                      </div>

                      {/* Reward for Winner */}
                      {currentDispute.adminDecision.decision === 'COMPLAINANT_RIGHT' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-sm font-semibold text-green-900 mb-2">🎁 Phần thưởng cho Renter:</p>
                          <ul className="list-disc ml-5 space-y-1 text-xs text-green-800">
                            <li>+5 điểm credit (nếu điểm hiện tại &lt; 100)</li>
                            <li>+5 điểm loyalty</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Admin Info */}
                {currentDispute.adminDecision.decidedBy && (
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <p className="text-xs text-gray-600">
                      Quyết định bởi: <span className="font-medium">{currentDispute.adminDecision.decidedBy.profile?.fullName || 'Admin'}</span>
                    </p>
                  </div>
                )}
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

            {/* Wallet Deposit Warning for RESPONDENT_ACCEPTED */}
            {currentDispute.status === 'RESPONDENT_ACCEPTED' && currentDispute.repairCost > 0 && (
              <WalletDepositWarning 
                dispute={currentDispute}
                depositAmount={currentDispute.subOrder?.products?.[currentDispute.productIndex]?.totalDeposit || 0}
                repairCost={currentDispute.repairCost}
              />
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
