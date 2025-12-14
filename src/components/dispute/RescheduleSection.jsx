import React, { useState } from 'react';
import { Calendar, User, Clock, CheckCircle, XCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/disputeHelpers';
import RescheduleRequestModal from './RescheduleRequestModal';
import RescheduleResponseModal from './RescheduleResponseModal';

/**
 * Component hiển thị thông tin reschedule request trong dispute detail
 */
const RescheduleSection = ({ dispute, currentUser }) => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);

  if (!dispute || dispute.type !== 'RENTER_NO_RETURN') {
    return null;
  }

  const reschedule = dispute.rescheduleRequest;
  const isRenter = currentUser?._id === dispute.respondent?._id;
  const isOwner = currentUser?._id === dispute.complainant?._id;

  // Renter chưa đề xuất reschedule
  if (!reschedule && isRenter && dispute.status === 'OPEN') {
    return (
      <>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Đề xuất lịch trả hàng mới
              </h3>
              <p className="text-gray-600 mb-4">
                Nếu bạn có lý do chính đáng (bệnh viện, công tác khẩn cấp, v.v.), 
                bạn có thể đề xuất lịch trả hàng mới. Owner sẽ xem xét và quyết định.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-yellow-800 mb-2">⚠️ Điều kiện:</p>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>Chỉ được đề xuất <strong>1 lần duy nhất</strong></li>
                  <li>Cần có lý do chính đáng và bằng chứng</li>
                  <li>Nếu được chấp nhận: Phạt <strong>10% deposit</strong> + <strong>-5 credit</strong></li>
                  <li>Nếu bị từ chối: Admin xem xét và phạt nặng hơn</li>
                </ul>
              </div>

              <button
                onClick={() => setShowRequestModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Đề xuất reschedule
              </button>
            </div>
          </div>
        </div>

        <RescheduleRequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          dispute={dispute}
        />
      </>
    );
  }

  // Đã có reschedule request
  if (reschedule) {
    const isPending = reschedule.status === 'PENDING';
    const isApproved = reschedule.status === 'APPROVED';
    const isRejected = reschedule.status === 'REJECTED';

    return (
      <>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Đề xuất Reschedule
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isPending ? 'bg-yellow-100 text-yellow-800' :
              isApproved ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {isPending && '⏳ Chờ owner phản hồi'}
              {isApproved && '✅ Đã chấp nhận'}
              {isRejected && '❌ Đã từ chối'}
            </span>
          </div>

          {/* Request Info */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start">
              <User className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Người đề xuất:</p>
                <p className="text-gray-900">{dispute.respondent?.profile?.fullName || 'Renter'}</p>
              </div>
            </div>

            <div className="flex items-start">
              <Clock className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Thời gian đề xuất:</p>
                <p className="text-gray-900">{formatDate(reschedule.requestedAt)}</p>
              </div>
            </div>

            <div className="flex items-start">
              <Calendar className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Ngày trả đề xuất:</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatDate(reschedule.proposedReturnDate)}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Lý do:</p>
              <p className="text-gray-900">{reschedule.reason}</p>
            </div>

            {reschedule.evidence?.photos && reschedule.evidence.photos.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-1" />
                  Bằng chứng đính kèm:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {reschedule.evidence.photos.map((photo, idx) => (
                    <div key={idx} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                        Ảnh {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reschedule.evidence?.notes && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-700 mb-1">Ghi chú thêm:</p>
                <p className="text-sm text-blue-900">{reschedule.evidence.notes}</p>
              </div>
            )}
          </div>

          {/* Owner Response */}
          {reschedule.ownerResponse?.decision && (
            <div className={`border-t pt-4 ${
              isApproved ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            } -mx-6 -mb-6 px-6 py-4 rounded-b-lg`}>
              <div className="flex items-start">
                {isApproved ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-semibold mb-2 ${
                    isApproved ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {isApproved ? '✅ Owner đã chấp nhận' : '❌ Owner đã từ chối'}
                  </p>
                  
                  {reschedule.ownerResponse.reason && (
                    <div className="bg-white rounded p-3 mb-3">
                      <p className="text-sm text-gray-700">
                        <strong>Phản hồi:</strong> {reschedule.ownerResponse.reason}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-600">
                    Phản hồi lúc: {formatDate(reschedule.ownerResponse.respondedAt)}
                  </p>

                  {isApproved && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">
                        <strong>Kết quả:</strong> Shipment mới đã được tạo. 
                        Renter bị phạt 10% deposit và -5 credit score.
                      </p>
                    </div>
                  )}

                  {isRejected && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                      <p className="text-sm text-orange-800">
                        <strong>Tiếp theo:</strong> Admin sẽ xem xét và đưa ra quyết định cuối cùng.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Owner Action Button */}
          {isPending && isOwner && (
            <div className="border-t pt-4">
              <button
                onClick={() => setShowResponseModal(true)}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Phản hồi đề xuất reschedule
              </button>
            </div>
          )}
        </div>

        {isOwner && (
          <RescheduleResponseModal
            isOpen={showResponseModal}
            onClose={() => setShowResponseModal(false)}
            dispute={dispute}
          />
        )}
      </>
    );
  }

  return null;
};

export default RescheduleSection;
