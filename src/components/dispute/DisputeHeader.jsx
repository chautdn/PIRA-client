import {
  getDisputeStatusColor,
  getDisputeStatusText,
  getDisputeTypeColor,
  getDisputeTypeText,
  getShipmentTypeColor,
  getShipmentTypeText,
  formatDate
} from '../../utils/disputeHelpers';

const DisputeHeader = ({ dispute }) => {
  // Get product info from subOrder
  const product = dispute.subOrder?.products?.[dispute.productIndex];
  const productData = product?.product;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {dispute.title}
          </h1>
          <p className="text-sm text-gray-500">
            Mã tranh chấp: <span className="font-medium">{dispute.disputeId}</span>
          </p>
          <p className="text-sm text-gray-500">
            Tạo lúc {formatDate(dispute.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getDisputeStatusColor(dispute.status)}`}>
            {getDisputeStatusText(dispute.status)}
          </span>
        </div>
      </div>

      {/* Special notice for shipper fault disputes */}
      {dispute.type === 'DAMAGED_BY_SHIPPER' && (
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                🚚 Tranh chấp về lỗi shipper/vận chuyển
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Tranh chấp này liên quan đến hư hỏng trong quá trình vận chuyển. 
                  <strong className="font-semibold"> Admin sẽ xử lý trực tiếp với đơn vị vận chuyển</strong> để giải quyết vấn đề.
                  Cả Owner và Renter đều không chịu trách nhiệm.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Info */}
      {productData && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">📦 Sản phẩm liên quan</h3>
          <div className="flex gap-4">
            {(() => {
              // Get image URL - handle both string and object format
              const getImageUrl = () => {
                if (!productData.images?.[0]) return null;
                const firstImage = productData.images[0];
                return typeof firstImage === 'string' ? firstImage : firstImage?.url;
              };

              const imageUrl = getImageUrl();
              
              return imageUrl ? (
                <img
                  src={imageUrl}
                  alt={productData.title || productData.name}
                  className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No image</span>
                </div>
              );
            })()}
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {productData.title || productData.name}
              </p>
              <div className="flex gap-4 text-xs text-gray-600">
                <span>Giá thuê: {(product.rentalRate || productData.pricing?.dailyRate)?.toLocaleString('vi-VN')}đ</span>
                <span>Đặt cọc: {(product.depositRate || product.totalDeposit || productData.pricing?.deposit?.amount)?.toLocaleString('vi-VN')}đ</span>
                {product.quantity && <span>Số lượng: {product.quantity}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            {dispute.subOrder?.subOrderNumber || dispute.subOrder?._id?.slice(-8) || 'N/A'}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t">
        <p className="text-sm font-medium text-gray-700 mb-2">📝 Mô tả vấn đề</p>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{dispute.description}</p>
      </div>

      {/* Chi phí sửa chữa/bồi thường - chỉ hiện khi có */}
      {dispute.repairCost > 0 && (
        <div className="mt-4 p-4 bg-orange-50 border-l-4 border-orange-400 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-orange-800">
                💰 Chi phí sửa chữa/bồi thường
              </h3>
              <p className="mt-2 text-2xl font-bold text-orange-900">
                {dispute.repairCost.toLocaleString('vi-VN')} VNĐ
              </p>
              <p className="mt-1 text-xs text-orange-700">
                Số tiền owner yêu cầu để sửa chữa sản phẩm bị hư hại
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeHeader;
