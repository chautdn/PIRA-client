import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock, Scale, DollarSign } from 'lucide-react';

/**
 * Component hiển thị quyết định của admin và cho phép renter/owner accept/reject
 * Hiển thị trong DisputeTracking page
 */
const PartyResponseSection = ({ dispute, userRole, onRespond }) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!dispute.adminDecision) {
    return null;
  }

  const { adminDecision, partyResponses, responseDeadline, status } = dispute;
  
  // Xác định user hiện tại là renter hay owner
  const isRenter = userRole === 'RENTER';
  const isOwner = userRole === 'OWNER';
  
  const userResponse = isRenter ? partyResponses?.renter : partyResponses?.owner;
  const otherResponse = isRenter ? partyResponses?.owner : partyResponses?.renter;

  // Tính thời gian còn lại
  const deadline = new Date(responseDeadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  const isExpired = now > deadline;

  const handleAccept = async () => {
    try {
      setSubmitting(true);
      setError('');
      await onRespond({ accept: true });
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onRespond({ accept: false, rejectionReason });
      setShowRejectForm(false);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  // Nếu đã phản hồi hoặc hết hạn
  if (userResponse?.status !== 'PENDING' || isExpired || status === 'RESOLVED' || status === 'PENDING_LEGAL') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Quyết định của Admin
        </h3>

        {/* Admin Decision */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Scale className="text-blue-600 flex-shrink-0" size={24} />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">
                {adminDecision.decision}
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                {adminDecision.reasoning}
              </p>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Bên thắng:</span>{' '}
                  <span className={`font-semibold ${
                    adminDecision.favoredParty === 'RENTER' ? 'text-green-600' :
                    adminDecision.favoredParty === 'OWNER' ? 'text-blue-600' :
                    'text-amber-600'
                  }`}>
                    {adminDecision.favoredParty === 'RENTER' ? 'Renter' :
                     adminDecision.favoredParty === 'OWNER' ? 'Owner' :
                     'Một phần (cả 2)'}
                  </span>
                </p>
                {adminDecision.refundAmount > 0 && (
                  <p>
                    <span className="font-medium">Số tiền hoàn:</span>{' '}
                    <span className="text-green-600 font-semibold">
                      {adminDecision.refundAmount.toLocaleString()} VNĐ
                    </span>
                  </p>
                )}
                {adminDecision.penaltyAmount > 0 && (
                  <p>
                    <span className="font-medium">Số tiền phạt:</span>{' '}
                    <span className="text-red-600 font-semibold">
                      {adminDecision.penaltyAmount.toLocaleString()} VNĐ
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Response Status */}
        <div className="grid grid-cols-2 gap-4">
          {/* Your Response */}
          <div className={`p-4 rounded-lg border-2 ${
            userResponse?.status === 'ACCEPTED' ? 'bg-green-50 border-green-300' :
            userResponse?.status === 'REJECTED' ? 'bg-red-50 border-red-300' :
            'bg-gray-50 border-gray-300'
          }`}>
            <p className="text-sm font-medium text-gray-600 mb-2">
              {isRenter ? 'Phản hồi của bạn (Renter)' : 'Phản hồi của bạn (Owner)'}
            </p>
            <div className="flex items-center gap-2">
              {userResponse?.status === 'ACCEPTED' ? (
                <>
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="font-semibold text-green-700">Đồng ý</span>
                </>
              ) : userResponse?.status === 'REJECTED' ? (
                <>
                  <XCircle className="text-red-600" size={20} />
                  <span className="font-semibold text-red-700">Từ chối</span>
                </>
              ) : isExpired ? (
                <>
                  <Clock className="text-gray-500" size={20} />
                  <span className="text-gray-600">Hết hạn (coi như đồng ý)</span>
                </>
              ) : (
                <>
                  <Clock className="text-gray-500" size={20} />
                  <span className="text-gray-600">Chưa phản hồi</span>
                </>
              )}
            </div>
            {userResponse?.rejectionReason && (
              <p className="text-xs text-red-700 mt-2">
                Lý do: {userResponse.rejectionReason}
              </p>
            )}
          </div>

          {/* Other Party Response */}
          <div className={`p-4 rounded-lg border-2 ${
            otherResponse?.status === 'ACCEPTED' ? 'bg-green-50 border-green-300' :
            otherResponse?.status === 'REJECTED' ? 'bg-red-50 border-red-300' :
            'bg-gray-50 border-gray-300'
          }`}>
            <p className="text-sm font-medium text-gray-600 mb-2">
              {isRenter ? 'Phản hồi Owner' : 'Phản hồi Renter'}
            </p>
            <div className="flex items-center gap-2">
              {otherResponse?.status === 'ACCEPTED' ? (
                <>
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="font-semibold text-green-700">Đồng ý</span>
                </>
              ) : otherResponse?.status === 'REJECTED' ? (
                <>
                  <XCircle className="text-red-600" size={20} />
                  <span className="font-semibold text-red-700">Từ chối</span>
                </>
              ) : isExpired ? (
                <>
                  <Clock className="text-gray-500" size={20} />
                  <span className="text-gray-600">Hết hạn (coi như đồng ý)</span>
                </>
              ) : (
                <>
                  <Clock className="text-gray-500" size={20} />
                  <span className="text-gray-600">Đang chờ...</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Final Status */}
        {status === 'RESOLVED' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium flex items-center gap-2">
              <CheckCircle size={20} />
              Tranh chấp đã được giải quyết - Quyết định đã được thực thi
            </p>
          </div>
        )}

        {status === 'PENDING_LEGAL' && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 font-medium flex items-center gap-2">
              <AlertTriangle size={20} />
              Có bên từ chối - Tranh chấp đã chuyển sang giải quyết pháp lý
            </p>
          </div>
        )}
      </div>
    );
  }

  // Hiển thị form accept/reject
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Quyết định của Admin - Vui lòng phản hồi
        </h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
          daysLeft <= 2 ? 'bg-red-100 text-red-700' :
          daysLeft <= 4 ? 'bg-amber-100 text-amber-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          <Clock size={16} />
          <span className="text-sm font-medium">
            Còn {daysLeft} ngày
          </span>
        </div>
      </div>

      {/* Admin Decision */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Scale className="text-blue-600 flex-shrink-0" size={24} />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-2">
              {adminDecision.decision}
            </h4>
            <p className="text-sm text-blue-800 mb-3">
              {adminDecision.reasoning}
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-blue-900 mb-1">Bên thắng</p>
                <p className={`font-semibold ${
                  adminDecision.favoredParty === 'RENTER' ? 'text-green-600' :
                  adminDecision.favoredParty === 'OWNER' ? 'text-blue-600' :
                  'text-amber-600'
                }`}>
                  {adminDecision.favoredParty === 'RENTER' ? 'Renter' :
                   adminDecision.favoredParty === 'OWNER' ? 'Owner' :
                   'Một phần'}
                </p>
              </div>
              {adminDecision.refundAmount > 0 && (
                <div>
                  <p className="font-medium text-blue-900 mb-1">Hoàn tiền</p>
                  <p className="text-green-600 font-semibold">
                    {adminDecision.refundAmount.toLocaleString()} VNĐ
                  </p>
                </div>
              )}
              {adminDecision.penaltyAmount > 0 && (
                <div>
                  <p className="font-medium text-blue-900 mb-1">Tiền phạt</p>
                  <p className="text-red-600 font-semibold">
                    {adminDecision.penaltyAmount.toLocaleString()} VNĐ
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="text-red-600 flex-shrink-0" size={18} />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Reject Form */}
      {showRejectForm ? (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lý do từ chối <span className="text-red-500">*</span>
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            placeholder="Vui lòng cho biết lý do bạn không đồng ý với quyết định này..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Nếu bạn từ chối, tranh chấp sẽ chuyển sang giải quyết pháp lý
          </p>
        </div>
      ) : null}

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-2">Lưu ý quan trọng:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Nếu bạn <strong>đồng ý</strong>: Quyết định sẽ được thực thi ngay khi bên kia cũng đồng ý</li>
              <li>Nếu bạn <strong>từ chối</strong>: Tranh chấp sẽ chuyển sang giải quyết pháp lý (cần bằng chứng từ cơ quan có thẩm quyền)</li>
              <li>Nếu không phản hồi trong {daysLeft} ngày: Hệ thống sẽ tự động coi như bạn đồng ý</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {!showRejectForm ? (
          <>
            <button
              onClick={() => setShowRejectForm(true)}
              disabled={submitting}
              className="flex-1 px-6 py-3 border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              <XCircle size={20} />
              Từ chối quyết định
            </button>
            <button
              onClick={handleAccept}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} />
              {submitting ? 'Đang xử lý...' : 'Đồng ý quyết định'}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setShowRejectForm(false);
                setRejectionReason('');
                setError('');
              }}
              disabled={submitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleReject}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-medium"
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PartyResponseSection;
