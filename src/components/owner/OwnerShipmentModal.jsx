import React, { useState, useEffect } from 'react';
import { X, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ShipmentService from '../../services/shipment';
import rentalOrderService from '../../services/rentalOrder';

export default function OwnerShipmentModal({ isOpen, onClose, subOrder, masterOrder, onConfirmReceived }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (isOpen && masterOrder?._id && subOrder?._id) {
      console.log('Modal opened, loading shipments...');
      loadShipments();
    }
  }, [isOpen, masterOrder?._id, subOrder?._id]);

  const loadShipments = async () => {
    setLoading(true);
    try {
      console.log('📦 Loading shipments for subOrder:', subOrder?._id);
      console.log('📦 SubOrder shipments:', subOrder?.shipments);
      console.log('📦 MasterOrder shipments:', masterOrder?.shipments);
      
      // Thử lấy shipment từ subOrder hoặc masterOrder
      let shipmentList = [];
      
      if (subOrder?.shipments && Array.isArray(subOrder.shipments)) {
        shipmentList = subOrder.shipments;
      } else if (masterOrder?.shipments && Array.isArray(masterOrder.shipments)) {
        shipmentList = masterOrder.shipments;
      }
      
      console.log('📦 All shipments from order object:', shipmentList);
      
      // Nếu không có từ order, thử từ API
      if (shipmentList.length === 0 && masterOrder?._id) {
        try {
          const response = await ShipmentService.getShipmentsByMasterOrder(masterOrder._id);
          console.log('📦 Shipments from API - full response:', response);
          
          // API trả về { status: 'success', data: [...] }
          if (response?.data && Array.isArray(response.data)) {
            shipmentList = response.data;
          } else if (Array.isArray(response)) {
            shipmentList = response;
          }
        } catch (apiErr) {
          console.warn('API call failed:', apiErr.message);
        }
      }
      
      console.log('📦 All shipments combined:', shipmentList);
      
      // Lọc RETURN shipments (hàng được trả về từ người thuê) cho subOrder này
      const returnShipments = shipmentList.filter(s => {
        const isReturnType = s.type === 'RETURN';
        const isForThisSubOrder = !s.subOrder || s.subOrder === subOrder?._id || s.subOrder?._id === subOrder?._id;
        console.log(`📦 Checking shipment ${s._id}:`, {
          shipmentNumber: s.shipmentNumber,
          type: s.type, 
          isReturn: isReturnType, 
          forThisSubOrder: isForThisSubOrder,
          status: s.status,
          shipper: s.shipper?.name || s.shipper
        });
        return isReturnType && isForThisSubOrder;
      });
      
      console.log('📦 Filtered return shipments for this owner:', returnShipments);
      console.log('📦 Total shipments to display:', returnShipments.length);
      setShipments(returnShipments);
    } catch (err) {
      console.error('Error loading shipments:', err);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceived = async () => {
    if (!subOrder?._id) {
      toast.error('Không tìm thấy thông tin đơn hàng');
      return;
    }

    setConfirming(true);
    try {
      await rentalOrderService.ownerConfirmDelivered(subOrder._id);
      toast.success('✅ Đã xác nhận nhận hàng. Cọc sẽ được trả cho khách thuê');
      
      if (onConfirmReceived) {
        await onConfirmReceived();
      }
      
      onClose();
    } catch (err) {
      console.error('Error confirming shipment:', err.message);
      toast.error(err.response?.data?.message || 'Không thể xác nhận đã nhận hàng');
    } finally {
      setConfirming(false);
    }
  };

  if (!isOpen) return null;

  const returnShipment = shipments[0];
  // Owner can confirm if shipment is DELIVERED or IN_TRANSIT (already picked up by shipper)
  const canConfirm = returnShipment?.status === 'DELIVERED' || returnShipment?.status === 'IN_TRANSIT';
  const isDelivered = returnShipment?.status === 'DELIVERED';

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'PICKED_UP': return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'IN_TRANSIT': return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'DELIVERED': return 'bg-green-100 text-green-800 border border-green-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'PENDING': return '⏳ Chờ lấy hàng trả';
      case 'PICKED_UP': return '📦 Đã lấy hàng trả';
      case 'IN_TRANSIT': return '🚚 Đang giao hàng trả';
      case 'DELIVERED': return '✅ Đã nhận hàng trả';
      default: return '❓ Không xác định';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center space-x-3">
            <Truck className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Quản lí hàng trả về</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải thông tin vận chuyển...</p>
            </div>
          ) : shipments.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <p className="text-gray-700 font-semibold mb-2">Chưa có thông tin hàng trả về</p>
              <p className="text-sm text-gray-600 mb-4">
                Vui lòng nhấn button "Yêu cầu vận chuyển" ở bảng trên để tạo đơn vận chuyển hàng trả
              </p>
              <p className="text-xs text-gray-500 bg-white rounded p-2">
                Sau khi khách thuê gửi yêu cầu trả hàng, thông tin vận chuyển sẽ hiển thị ở đây
              </p>
            </div>
          ) : (
            <>
              {/* Shipment Status Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className={`w-5 h-5 ${isDelivered ? 'text-green-600' : 'text-blue-600'}`} />
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(returnShipment?.status)}`}>
                    {getStatusText(returnShipment?.status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {returnShipment?.shipmentNumber && (
                    <div>
                      <span className="text-gray-600">Mã shipment:</span>
                      <span className="ml-2 font-medium text-gray-900">{returnShipment.shipmentNumber}</span>
                    </div>
                  )}
                  
                  {returnShipment?.shipper?.name && (
                    <div>
                      <span className="text-gray-600">Shipper:</span>
                      <span className="ml-2 font-medium text-gray-900">{returnShipment.shipper.name}</span>
                    </div>
                  )}

                  {returnShipment?.shipper?.phone && (
                    <div>
                      <span className="text-gray-600">SĐT:</span>
                      <span className="ml-2 font-medium text-gray-900">{returnShipment.shipper.phone}</span>
                    </div>
                  )}

                  {returnShipment?.estimatedDeliveryDate && (
                    <div>
                      <span className="text-gray-600">Ngày giao dự kiến:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {new Date(returnShipment.estimatedDeliveryDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}

                  {returnShipment?.actualDeliveryDate && (
                    <div>
                      <span className="text-gray-600">Ngày giao thực tế:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {new Date(returnShipment.actualDeliveryDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}

                  {returnShipment?.fromAddress?.streetAddress && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-gray-600 font-medium mb-1">📍 Địa chỉ lấy hàng (từ renter):</p>
                      <p className="text-sm text-gray-700">
                        {returnShipment.fromAddress.streetAddress}
                        {returnShipment.fromAddress.ward && `, ${returnShipment.fromAddress.ward}`}
                        {returnShipment.fromAddress.district && `, ${returnShipment.fromAddress.district}`}
                        {returnShipment.fromAddress.city && `, ${returnShipment.fromAddress.city}`}
                      </p>
                    </div>
                  )}

                  {returnShipment?.toAddress?.streetAddress && (
                    <div className="mt-3">
                      <p className="text-gray-600 font-medium mb-1">📍 Địa chỉ giao hàng (cho owner):</p>
                      <p className="text-sm text-gray-700">
                        {returnShipment.toAddress.streetAddress}
                        {returnShipment.toAddress.ward && `, ${returnShipment.toAddress.ward}`}
                        {returnShipment.toAddress.district && `, ${returnShipment.toAddress.district}`}
                        {returnShipment.toAddress.city && `, ${returnShipment.toAddress.city}`}
                      </p>
                    </div>
                  )}

                  {returnShipment?.contactInfo?.name && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-gray-600 font-medium mb-1">👤 Thông tin liên hệ:</p>
                      <p className="text-sm text-gray-700">{returnShipment.contactInfo.name}</p>
                      {returnShipment.contactInfo.phone && (
                        <p className="text-sm text-gray-700">{returnShipment.contactInfo.phone}</p>
                      )}
                      {returnShipment.contactInfo.notes && (
                        <p className="text-sm text-gray-600 italic mt-1">"{returnShipment.contactInfo.notes}"</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {isDelivered && subOrder?.status !== 'COMPLETED' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <span className="font-semibold">ℹ️ Ghi chú:</span> Hàng trả đã được giao. Xác nhận để trả cọc cho khách thuê.
                  </p>
                </div>
              )}

              {canConfirm && !isDelivered && subOrder?.status !== 'COMPLETED' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">ℹ️ Ghi chú:</span> Hàng đang được vận chuyển. Bạn có thể xác nhận khi đã nhận hàng.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
          
          {isDelivered && subOrder?.status !== 'COMPLETED' && (
            <button
              onClick={handleConfirmReceived}
              disabled={confirming}
              className={`px-6 py-2 rounded-lg text-white font-medium transition-colors ${
                confirming
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {confirming ? '⏳ Đang xác nhận...' : '✅ Đã nhận hàng trả'}
            </button>
          )}

          {canConfirm && !isDelivered && subOrder?.status !== 'COMPLETED' && (
            <button
              onClick={handleConfirmReceived}
              disabled={confirming}
              className={`px-6 py-2 rounded-lg text-white font-medium transition-colors ${
                confirming
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {confirming ? '⏳ Đang xác nhận...' : '✅ Xác nhận đã nhận hàng trả'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
