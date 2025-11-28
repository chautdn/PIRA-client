import {
  getDisputeStatusColor,
  getDisputeStatusText,
  getDisputeTypeColor,
  getDisputeTypeText,
  getPriorityColor,
  getPriorityText,
  getShipmentTypeColor,
  getShipmentTypeText,
  formatDate
} from '../../utils/disputeHelpers';

const DisputeHeader = ({ dispute }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {dispute.disputeId}
          </h1>
          <p className="text-sm text-gray-500">
            Tạo lúc {formatDate(dispute.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getDisputeStatusColor(dispute.status)}`}>
            {getDisputeStatusText(dispute.status)}
          </span>
          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getPriorityColor(dispute.priority)}`}>
            {getPriorityText(dispute.priority)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Loại tranh chấp</p>
          <span className={`px-2 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getDisputeTypeColor(dispute.type)}`}>
            {getDisputeTypeText(dispute.type)}
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Loại vận chuyển</p>
          <span className={`px-2 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getShipmentTypeColor(dispute.shipmentType)}`}>
            {getShipmentTypeText(dispute.shipmentType)}
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Đơn hàng</p>
          <p className="text-sm font-medium text-gray-900">
            {dispute.rentalOrder?.orderId || 'N/A'}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-sm font-medium text-gray-700 mb-2">Mô tả</p>
        <p className="text-sm text-gray-600">{dispute.description}</p>
      </div>
    </div>
  );
};

export default DisputeHeader;
