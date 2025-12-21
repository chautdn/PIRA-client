import React, { useState, useEffect } from 'react';
import { X, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ShipmentService from '../../services/shipment';
import rentalOrderService from '../../services/rentalOrder';
import { useI18n } from '../../hooks/useI18n';

export default function RenterShipmentModal({ isOpen, onClose, masterOrderId, masterOrder, onConfirmReceived }) {
  const { t } = useI18n();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Use either masterOrderId or masterOrder._id
  const orderId = masterOrderId || masterOrder?._id;

  useEffect(() => {
    if (isOpen && orderId) {
      loadShipments();
    }
  }, [isOpen, orderId]);

  const loadShipments = async () => {
    setLoading(true);
    try {
      // Lấy danh sách shipment cho đơn hàng này
      const response = await ShipmentService.getShipmentsByMasterOrder?.(orderId);
      if (response?.data) {
        // Lọc chỉ lấy DELIVERY shipments
        const deliveryShipments = response.data.filter(s => s.type === 'DELIVERY');
        setShipments(deliveryShipments);
      }
    } catch (err) {
      console.error('Error loading shipments:', err.message);
      toast.error(t('renterShipmentModal.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceived = async () => {
    if (!masterOrder?.subOrders?.[0]?._id) {
      toast.error(t('renterShipmentModal.orderNotFound'));
      return;
    }

    setConfirming(true);
    try {
      // Gọi API xác nhận đã nhận hàng cho subOrder
      const response = await rentalOrderService.renterConfirmDelivered(masterOrder.subOrders[0]._id);
      
      toast.success(t('renterShipmentModal.confirmSuccess'));
      
      // Gọi callback để cập nhật trạng thái
      if (onConfirmReceived) {
        await onConfirmReceived();
      }
      
      // Wait a moment before closing to ensure callback completes
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Error confirming shipment:', err.message);
      toast.error(err.response?.data?.message || t('renterShipmentModal.confirmError'));
    } finally {
      setConfirming(false);
    }
  };

  if (!isOpen) return null;

  const deliveryShipment = shipments[0];
  const isDelivered = deliveryShipment?.status === 'DELIVERED';
  const isPending = deliveryShipment?.status === 'PENDING';
  const isPickedUp = deliveryShipment?.status === 'PICKED_UP' || deliveryShipment?.status === 'IN_TRANSIT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Truck className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">{t('renterShipmentModal.title')}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('renterShipmentModal.loading')}</p>
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600">{t('renterShipmentModal.noShipmentInfo')}</p>
            </div>
          ) : (
            <>
              {/* Shipment Status Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 mb-6 border border-blue-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-3 h-3 rounded-full ${
                    isPending ? 'bg-yellow-500' :
                    isPickedUp ? 'bg-blue-500' :
                    isDelivered ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="font-semibold text-gray-900">
                    {isPending ? t('renterShipmentModal.pending') :
                     isPickedUp ? t('renterShipmentModal.inTransit') :
                     isDelivered ? t('renterShipmentModal.delivered') : t('renterShipmentModal.unknown')}
                  </span>
                </div>

                {/* Shipment Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('renterShipmentModal.shipmentCode')}</span>
                    <span className="font-medium text-gray-900">{deliveryShipment?.shipmentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('renterShipmentModal.type')}</span>
                    <span className="font-medium text-blue-600">{t('renterShipmentModal.deliveryType')}</span>
                  </div>
                  {deliveryShipment?.shipper && (
                    (() => {
                      const sh = deliveryShipment.shipper;
                      const displayName = sh.name || `${sh.profile?.firstName || ''} ${sh.profile?.lastName || ''}`.trim() || sh.email || 'Unknown';
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('renterShipmentModal.shipper')}</span>
                            <span className="font-medium text-gray-900">{displayName}</span>
                          </div>
                          {sh.phone && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">{t('renterShipmentModal.contact')}</span>
                              <span className="font-medium text-gray-900">{sh.phone}</span>
                            </div>
                          )}
                        </>
                      );
                    })()
                  )}
                </div>

                {/* Status Timeline */}
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="space-y-2">
                    {isPending && (
                      <div className="flex items-center space-x-2 text-yellow-700 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{t('renterShipmentModal.waitingShipperConfirm')}</span>
                      </div>
                    )}
                    {isPickedUp && (
                      <div className="flex items-center space-x-2 text-blue-700 text-sm">
                        <Truck className="w-4 h-4" />
                        <span>{t('renterShipmentModal.shipperDelivering')}</span>
                      </div>
                    )}
                    {isDelivered && (
                      <div className="flex items-center space-x-2 text-green-700 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>{t('renterShipmentModal.itemDelivered')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-xs text-blue-700">
                  💡 <strong>{t('renterShipmentModal.noteTitle')}</strong> {t('renterShipmentModal.noteMessage')}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            {t('renterShipmentModal.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
