import { formatDate } from '../../utils/disputeHelpers';

const DisputeParties = ({ dispute }) => {
  // Determine roles based on shipmentType
  // DELIVERY: Renter complains (about delivery issue) -> Renter is complainant, Owner is respondent
  // RETURN: Owner complains (about return issue) -> Owner is complainant, Renter is respondent
  const complainantRole = dispute.shipmentType === 'DELIVERY' ? 'Người thuê' : 'Chủ hàng';
  const respondentRole = dispute.shipmentType === 'DELIVERY' ? 'Chủ hàng' : 'Người thuê';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Các bên liên quan</h2>
      
      <div className="space-y-4">
        {/* Complainant */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                Người khiếu nại
              </p>
              <p className="text-sm text-blue-700">
                {dispute.complainant?.profile?.fullName || dispute.complainant?.fullName || 'N/A'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {dispute.complainant?.email || 'N/A'}
              </p>
            </div>
            <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded">
              {complainantRole}
            </span>
          </div>
        </div>

        {/* Respondent */}
        <div className="p-4 bg-orange-50 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-orange-900 mb-1">
                Bên bị khiếu nại
              </p>
              <p className="text-sm text-orange-700">
                {dispute.respondent?.profile?.fullName || dispute.respondent?.fullName || 'N/A'}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                {dispute.respondent?.email || 'N/A'}
              </p>
            </div>
            <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded">
              {respondentRole}
            </span>
          </div>
        </div>

        {/* Reviewed by admin if exists */}
        {dispute.adminDecision?.reviewedBy && (
          <div className="p-4 bg-purple-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-purple-900 mb-1">
                Admin xem xét
              </p>
              <p className="text-sm text-purple-700">
                {dispute.adminDecision.reviewedBy.fullName || 'N/A'}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {formatDate(dispute.adminDecision.reviewDate)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisputeParties;
