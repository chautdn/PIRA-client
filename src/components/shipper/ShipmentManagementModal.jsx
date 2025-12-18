import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import ShipmentService from '../../services/shipment';
import { formatCurrency } from '../../utils/constants';
import { X, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ShipmentManagementModal({ shipment, isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [cannotPickupLoading, setCannotPickupLoading] = useState(false);
  const [cannotContactRenterLoading, setCannotContactRenterLoading] = useState(false);
  const [acceptShipmentLoading, setAcceptShipmentLoading] = useState(false);
  
  const [pickupImages, setPickupImages] = useState([]);
  const [deliveryImages, setDeliveryImages] = useState([]);
  const [proofData, setProofData] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(shipment?.status || 'PENDING');
  
  // State for renter rejection
  const [showRenterRejectDialog, setShowRenterRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('PRODUCT_DAMAGED'); // PRODUCT_DAMAGED or NO_CONTACT
  const [rejectNotes, setRejectNotes] = useState('');
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const loadProofDataFn = async (shipmentId) => {
    try {
      if (!shipmentId) return;
      const data = await ShipmentService.getProof(shipmentId);
      setProofData(data.data || data);
      setPickupImages(data.data?.imagesBeforeDelivery || []);
      setDeliveryImages(data.data?.imagesAfterDelivery || []);
    } catch (err) {
      setProofData(null);
      setPickupImages([]);
      setDeliveryImages([]);
    }
  };

  // Load proof data when modal opens
  useEffect(() => {
    if (isOpen && shipment?._id) {
      setCurrentStatus(shipment.status);
      loadProofDataFn(shipment._id);
    }
  }, [isOpen, shipment?._id]);

  const handlePickupImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    // Chỉ thêm vào list để preview, chưa upload
    setPickupImages(prev => [...prev, ...files]);
  };

  const handleConfirmPickup = async () => {
    try {
      if (pickupImages.length === 0) {
        toast.error('Vui lòng tải lên ít nhất 1 ảnh pickup');
        return;
      }

      setPickupLoading(true);

      const formData = new FormData();
      pickupImages.forEach(file => {
        // Handle both File objects and URLs
        if (typeof file === 'string') {
          // URL - already uploaded, skip
          return;
        }
        formData.append('images', file);
      });

      // Upload only new files
      if (formData.has('images')) {
        await ShipmentService.uploadProof(shipment._id, formData);
      }

      // Mark as IN_TRANSIT (picked up)
      await ShipmentService.pickupShipment(shipment._id);

      // Update current status immediately
      setCurrentStatus('IN_TRANSIT');

      // Reload proof data
      await loadProofDataFn(shipment._id);
      onSuccess?.();
      toast.success('✅ Đã xác nhận pickup thành công!');
    } catch (err) {
      toast.error(err.message || 'Lỗi khi upload pickup');
    } finally {
      setPickupLoading(false);
    }
  };

  const handleDeliveryImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    // Chỉ thêm vào list để preview, chưa upload
    setDeliveryImages(prev => [...prev, ...files]);
  };

  const handleConfirmDelivery = async () => {
    try {
      if (deliveryImages.length === 0) {
        toast.error('Vui lòng tải lên ít nhất 1 ảnh delivery');
        return;
      }

      setDeliveryLoading(true);

      const formData = new FormData();
      deliveryImages.forEach(file => {
        // Handle both File objects and URLs
        if (typeof file === 'string') {
          // URL - already uploaded, skip
          return;
        }
        formData.append('images', file);
      });

      // Upload only new files
      if (formData.has('images')) {
        await ShipmentService.uploadProof(shipment._id, formData);
      }

      // Mark as DELIVERED
      await ShipmentService.deliverShipment(shipment._id);

      // Update current status immediately
      setCurrentStatus('DELIVERED');

      // Reload proof data
      await loadProofDataFn(shipment._id);
      onSuccess?.();
      toast.success('✅ Đã hoàn tất vận chuyển!');
    } catch (err) {
      toast.error(err.message || 'Lỗi khi upload delivery');
    } finally {
      setDeliveryLoading(false);
    }
  };

  const handleCannotPickup = async () => {
    setConfirmAction({
      type: 'cannotPickup',
      title: 'Không thể nhận hàng từ chủ?',
      message: 'Shipment sẽ bị hủy, owner sẽ bị trừ 20 điểm creditScore, và người thuê sẽ được hoàn lại tiền (không hoàn phí ship).',
      confirmText: 'Xác nhận',
      cancelText: 'Hủy'
    });
    setShowConfirmModal(true);
  };

  const executeCannotPickup = async () => {
    try {
      setCannotPickupLoading(true);

      // Call API to report owner no-show
      await ShipmentService.ownerNoShow(shipment._id, { notes: '' });

      // Show success toast
      toast.success('✅ Đã ghi nhận chủ không có mặt để giao hàng!', {
        duration: 3,
        position: 'top-right'
      });

      // Update status
      setCurrentStatus('CANCELLED');
      
      // Close modal after 1.5s
      setTimeout(() => {
        onClose?.();
        onSuccess?.();
      }, 1500);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi ghi nhận owner no-show');
    } finally {
      setCannotPickupLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleCannotPickupRenter = async () => {
    setConfirmAction({
      type: 'cannotContactRenter',
      title: 'Không liên lạc được với người thuê?',
      message: 'Shipment sẽ bị ghi nhận là trả hàng thất bại, chủ hàng sẽ mở tranh chấp để giải quyết.',
      confirmText: 'Xác nhận',
      cancelText: 'Hủy'
    });
    setShowConfirmModal(true);
  };

  const executeCannotContactRenter = async () => {
    try {
      setCannotContactRenterLoading(true);
      setError('');

      // Call API to report return failed
      await ShipmentService.returnFailed(shipment._id, { notes: '' });

      // Show success toast
      toast.success('✅ Đã ghi nhận không liên lạc được với renter!', {
        duration: 3,
        position: 'top-right'
      });

      // Update status
      setCurrentStatus('CANCELLED');
      
      // Close modal after 1.5s
      setTimeout(() => {
        onClose?.();
        onSuccess?.();
      }, 1500);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi ghi nhận không liên lạc được renter');
    } finally {
      setCannotContactRenterLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleConfirmAction = async () => {
    if (confirmAction?.type === 'cannotPickup') {
      await executeCannotPickup();
    } else if (confirmAction?.type === 'cannotContactRenter') {
      await executeCannotContactRenter();
    }
  }

  const handleRenterReject = async () => {
    if (!rejectNotes.trim()) {
      toast.error('Vui lòng nhập lý do renter không nhận hàng');
      return;
    }

    try {
      setLoading(true);

      const reason = rejectReason === 'PRODUCT_DAMAGED' ? 'Sản phẩm có lỗi' : 'Không liên lạc được với renter';

      // Call API to reject delivery with reason
      await ShipmentService.rejectDelivery(shipment._id, {
        reason: rejectReason,
        notes: rejectNotes
      });

      // Show success toast with reason
      const toastMessage = rejectReason === 'PRODUCT_DAMAGED' 
        ? '✅ Đã ghi nhận sản phẩm có lỗi!'
        : '✅ Đã ghi nhận renter không nhận hàng!';
      
      toast.success(toastMessage, {
        duration: 3,
        position: 'top-right'
      });

      // Close dialog and update status
      setShowRenterRejectDialog(false);
      setRejectReason('PRODUCT_DAMAGED');
      setRejectNotes('');
      setCurrentStatus(rejectReason === 'PRODUCT_DAMAGED' ? 'DELIVERY_FAILED' : 'FAILED');
      
      // Close modal after 1.5s
      setTimeout(() => {
        onClose?.();
        onSuccess?.();
      }, 1500);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi ghi nhận renter không nhận hàng');
    } finally {
      setLoading(false);
    }
  };

  const removePickupImage = (index) => {
    setPickupImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeDeliveryImage = (index) => {
    setDeliveryImages(prev => prev.filter((_, i) => i !== index));
  };

  // Check if shipment can be accepted based on scheduled date
  const canAcceptShipment = () => {
    if (!shipment) return false;
    
    let scheduledDate = null;
    if (shipment.scheduledAt) {
      scheduledDate = new Date(shipment.scheduledAt);
    } else {
      const rentalPeriod = shipment.subOrder?.rentalPeriod || shipment.subOrder?.masterOrder?.rentalPeriod;
      if (rentalPeriod) {
        if (shipment.type === 'DELIVERY' && rentalPeriod.startDate) {
          scheduledDate = new Date(rentalPeriod.startDate);
        } else if (shipment.type === 'RETURN' && rentalPeriod.endDate) {
          scheduledDate = new Date(rentalPeriod.endDate);
        }
      }
    }

    if (!scheduledDate) return true; // Allow if no date found

    scheduledDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return today >= scheduledDate;
  };

  // Get scheduled date string for display
  const getScheduledDateString = () => {
    let scheduledDate = null;
    if (shipment.scheduledAt) {
      scheduledDate = new Date(shipment.scheduledAt);
    } else {
      const rentalPeriod = shipment.subOrder?.rentalPeriod || shipment.subOrder?.masterOrder?.rentalPeriod;
      if (rentalPeriod) {
        if (shipment.type === 'DELIVERY' && rentalPeriod.startDate) {
          scheduledDate = new Date(rentalPeriod.startDate);
        } else if (shipment.type === 'RETURN' && rentalPeriod.endDate) {
          scheduledDate = new Date(rentalPeriod.endDate);
        }
      }
    }
    return scheduledDate ? scheduledDate.toLocaleDateString('vi-VN') : null;
  };

  const handleAcceptShipment = async () => {
    if (!canAcceptShipment()) {
      const dateStr = getScheduledDateString();
      toast.error(`⏰ Chưa đến ngày giao hàng! Bạn chỉ có thể nhận đơn từ 00:00 ngày ${dateStr}`);
      return;
    }

    try {
      setAcceptShipmentLoading(true);
      
      await ShipmentService.acceptShipment(shipment._id);
      
      toast.success('✅ Đã nhận đơn hàng thành công!');
      
      // Update status immediately
      setCurrentStatus('SHIPPER_CONFIRMED');
      
      // Refresh data
      setTimeout(() => {
        onSuccess?.();
      }, 1000);
    } catch (err) {
      const errorMsg = err.message || 'Lỗi khi nhận đơn hàng';
      toast.error(errorMsg);
    } finally {
      setAcceptShipmentLoading(false);
    }
  };

  // Check if pickup already uploaded (status is IN_TRANSIT or DELIVERED)
  // Allow functionality even for CANCELLED, DELIVERY_FAILED, FAILED to document the shipment
  const pickupUploaded = ['IN_TRANSIT', 'DELIVERED'].includes(currentStatus);

  // Check if delivery already uploaded (status is DELIVERED)
  const deliveryUploaded = currentStatus === 'DELIVERED';
  
  // Check if shipment is in a final failed state but still allow documentation
  const isFailedState = ['CANCELLED', 'DELIVERY_FAILED', 'FAILED'].includes(currentStatus);
  const canStillDocument = isFailedState || ['SHIPPER_CONFIRMED', 'PENDING', 'IN_TRANSIT'].includes(currentStatus);

  if (!isOpen || !shipment) {
    return null;
  }

  const ownerName = shipment?.subOrder?.owner?.profile?.fullName ||
                    shipment?.subOrder?.owner?.profile?.firstName ||
                    'Chủ hàng';
  
  const renterName = shipment?.subOrder?.masterOrder?.renter?.profile?.fullName ||
                     shipment?.subOrder?.masterOrder?.renter?.profile?.firstName ||
                     'Người thuê';

  const renterPhone = shipment?.subOrder?.masterOrder?.renter?.phone || 'N/A';
  const ownerPhone = shipment?.subOrder?.owner?.phone || 'N/A';
  
  // Determine if this is a return shipment
  const isReturnShipment = shipment?.type === 'RETURN';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-4xl sm:w-full h-[90vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
          style={{ maxWidth: '100vw', touchAction: 'pan-y' }}
          initial={{ opacity: 0, scale: 1, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 shadow-md">
            <div className="min-w-0 flex-1 pr-2 overflow-hidden">
              <p className="text-blue-100 text-[10px] xs:text-xs sm:text-sm truncate font-semibold break-all">ID: {shipment.shipmentId}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 shrink-0 rounded-full bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-colors touch-manipulation"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 xs:p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 pb-32" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Info banner based on status */}
            {currentStatus === 'PENDING' && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4 rounded-lg text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">Đơn hàng chờ xác nhận</h3>
                    <p className="text-sm text-blue-800">
                      Nhấn nút <strong>"Xác nhận nhận đơn"</strong> trong phần Thông tin đơn hàng bên dưới để bắt đầu vận chuyển.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {currentStatus !== 'PENDING' && currentStatus !== 'SHIPPER_CONFIRMED' && currentStatus !== 'IN_TRANSIT' && currentStatus !== 'DELIVERED' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 rounded-lg text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="font-bold text-yellow-900 mb-1">Chú ý</h3>
                    <p className="text-sm text-yellow-800">
                      Shipment này đang ở trạng thái <strong>{currentStatus}</strong>. 
                      Bạn chỉ có thể quản lí vận chuyển khi shipment ở trạng thái <strong>SHIPPER_CONFIRMED</strong> hoặc <strong>IN_TRANSIT</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Top Section - Order & Renter & Owner Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 max-w-full overflow-hidden">
              {/* Order Info */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 sm:p-4 border border-slate-200 max-w-full overflow-hidden">
                <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <span className="text-base sm:text-lg">📋</span> Thông tin đơn hàng
                </h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm break-words">
                  <div>
                    <span className="text-gray-600 block">Mã shipment:</span>
                    <span className="font-semibold text-gray-900 break-all">{shipment.shipmentId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block">Loại:</span>
                    <span className="font-semibold text-gray-900">
                      {shipment.type === 'DELIVERY' ? '📦 Giao hàng' : '🔄 Nhận trả'}
                    </span>
                  </div>
                  
                  {/* Products */}
                  {shipment?.subOrder?.products && shipment.subOrder.products.length > 0 && (
                    <div>
                      <span className="text-gray-600 block mb-2">Sản phẩm:</span>
                      <div className="space-y-2">
                        {shipment.subOrder.products.map((item, idx) => {
                          return (
                          <div key={idx} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-gray-200">
                            {item.product?.images?.[0]?.url && (
                              <img
                                src={item.product.images[0].url}
                                alt={item.product?.title || 'Product'}
                                className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-md flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-2">
                                {item.product?.title || 'Sản phẩm'}
                              </p>
                              <p className="text-[10px] xs:text-xs text-gray-500 mt-0.5">
                                Số lượng: <span className="font-semibold text-gray-700">{item.quantity}</span>
                              </p>
                            </div>
                          </div>
                        )})}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-gray-600 block">Phí vận chuyển:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(shipment.fee || 0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block mb-1">Trạng thái:</span>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                      currentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      currentStatus === 'SHIPPER_CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                      currentStatus === 'IN_TRANSIT' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {currentStatus}
                    </span>
                  </div>
                  
                  {/* Accept Button for PENDING shipments */}
                  {currentStatus === 'PENDING' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      {canAcceptShipment() ? (
                        <button
                          onClick={handleAcceptShipment}
                          disabled={acceptShipmentLoading}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 active:from-green-700 active:to-emerald-700 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 touch-manipulation"
                        >
                          {acceptShipmentLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Đang xử lý...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={16} />
                              <span>Nhận đơn</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 text-center">
                          <p className="text-yellow-800 font-semibold text-xs sm:text-sm mb-1">
                            ⏰ Chưa đến ngày giao hàng
                          </p>
                          <p className="text-yellow-700 text-[10px] xs:text-xs">
                            Bạn có thể nhận đơn từ 00:00 ngày <strong>{getScheduledDateString()}</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Owner Info */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 sm:p-4 border border-blue-200 max-w-full overflow-hidden">
                <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <span className="text-base sm:text-lg">👤</span> Thông tin chủ sở hữu
                </h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm break-words">
                  <div>
                    <span className="text-gray-600 block text-[10px] xs:text-xs mb-0.5 sm:mb-1 font-medium">Tên chủ sở hữu</span>
                    <span className="font-semibold text-gray-900 text-xs sm:text-sm">{ownerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[10px] xs:text-xs mb-0.5 sm:mb-1 font-medium">Số điện thoại</span>
                    <a href={`tel:${ownerPhone}`} className="font-semibold text-blue-600 hover:underline text-xs sm:text-sm">
                      {ownerPhone}
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[10px] xs:text-xs mb-0.5 sm:mb-1 font-medium">Địa chỉ giao/nhận</span>
                    <div className="font-semibold text-gray-900 text-[10px] xs:text-xs leading-relaxed">
                      {shipment.fromAddress?.streetAddress && <div>{shipment.fromAddress.streetAddress}</div>}
                      {shipment.fromAddress?.ward && <div>{shipment.fromAddress.ward}</div>}
                      {shipment.fromAddress?.district && <div>{shipment.fromAddress.district}</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Renter Info */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 sm:p-4 border border-orange-200 max-w-full overflow-hidden">
                <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <span className="text-base sm:text-lg">👤</span> Thông tin người thuê
                </h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm break-words">
                  <div>
                    <span className="text-gray-600 block text-[10px] xs:text-xs mb-0.5 sm:mb-1 font-medium">Tên người thuê</span>
                    <span className="font-semibold text-gray-900 text-xs sm:text-sm">{renterName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[10px] xs:text-xs mb-0.5 sm:mb-1 font-medium">Số điện thoại</span>
                    <a href={`tel:${renterPhone}`} className="font-semibold text-blue-600 hover:underline text-xs sm:text-sm">
                      {renterPhone}
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[10px] xs:text-xs mb-0.5 sm:mb-1 font-medium">Địa chỉ giao/nhận</span>
                    <div className="font-semibold text-gray-900 text-[10px] xs:text-xs leading-relaxed">
                      {shipment.toAddress?.streetAddress && <div>{shipment.toAddress.streetAddress}</div>}
                      {shipment.toAddress?.ward && <div>{shipment.toAddress.ward}</div>}
                      {shipment.toAddress?.district && <div>{shipment.toAddress.district}</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-3 sm:pt-4 max-w-full overflow-hidden">
              {/* Section 1: Pickup Images */}
              <div className="mb-4 sm:mb-6 max-w-full">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 border-l-4 border-blue-500 max-w-full overflow-hidden">
                  <h3 className="font-bold text-blue-900 mb-1.5 sm:mb-2 flex items-center gap-2 text-sm sm:text-base break-words">
                    <span className="text-base sm:text-lg flex-shrink-0">📸</span> 
                    <span className="break-words">
                    {isReturnShipment 
                      ? `Chụp ảnh lúc nhận hàng từ ${renterName}` 
                      : `Chụp ảnh lúc nhận hàng từ ${ownerName}`}
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-800 break-words">
                    {isReturnShipment
                      ? 'Tải lên ảnh chứng minh khi nhận hàng trả từ người thuê (tối thiểu 1 ảnh)'
                      : 'Tải lên ảnh chứng minh khi nhận hàng từ chủ hàng (tối thiểu 1 ảnh)'}
                  </p>
                </div>

                <div className="bg-white rounded-lg border-2 border-dashed border-blue-300 p-6">
                  {pickupImages.length === 0 && !pickupUploaded && canStillDocument && (
                    <label className="block cursor-pointer">
                      <div className="flex flex-col items-center justify-center py-6">
                        <Upload className="text-blue-500 mb-2" size={32} />
                        <p className="text-sm font-semibold text-gray-700">Nhấn để tải ảnh lên</p>
                        <p className="text-xs text-gray-500 mt-1">hoặc kéo thả ảnh vào đây</p>
                        <p className="text-xs text-gray-400 mt-2">Tối thiểu 1 ảnh</p>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePickupImageUpload}
                        disabled={loading}
                        className="hidden"
                      />
                    </label>
                  )}

                  {pickupImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {pickupImages.map((file, idx) => (
                        <div key={idx} className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-[4/3]">
                          <img
                            src={typeof file === 'string' ? file : URL.createObjectURL(file)}
                            alt={`pickup-${idx}`}
                            className="w-full h-full object-contain rounded-lg shadow-sm"
                          />
                          {!pickupUploaded && !deliveryUploaded && canStillDocument && (
                            <button
                              onClick={() => removePickupImage(idx)}
                              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              ✕
                            </button>
                          )}
                          <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded max-w-[90%] truncate">
                            {typeof file === 'string' ? '✓' : '●'} {idx + 1}
                          </div>
                        </div>
                      ))}
                      {!pickupUploaded && !deliveryUploaded && canStillDocument && (
                        <label className="border-2 border-dashed border-blue-300 rounded-lg aspect-[4/3] flex items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors">
                          <div className="text-center">
                            <Upload className="text-blue-400 mx-auto mb-0.5 sm:mb-1" size={18} />
                            <span className="text-[10px] xs:text-xs text-blue-600 font-semibold">Thêm</span>
                          </div>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handlePickupImageUpload}
                            disabled={loading}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>

                {/* Pickup Status */}
                <div className="mt-3 sm:mt-4">
                  {pickupUploaded ? (
                    <div className="bg-green-50 border border-green-300 rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                      <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
                      <div>
                        <p className="font-bold text-green-900 text-xs sm:text-sm">Đã xác nhận pickup</p>
                        <p className="text-[10px] xs:text-xs sm:text-sm text-green-700">Status: IN_TRANSIT</p>
                      </div>
                    </div>
                  ) : canStillDocument ? (
                    <div className="space-y-2 sm:space-y-3">
                      <button
                        onClick={handleConfirmPickup}
                        disabled={pickupImages.length === 0 || pickupLoading || isFailedState}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                          pickupImages.length > 0 && !pickupLoading
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {pickupLoading ? (
                          <>
                            <CheckCircle2 size={18} className="flex-shrink-0" /> ⏳ Đang xử lý...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={18} className="flex-shrink-0" /> 
                            <span className="truncate">
                            {isReturnShipment 
                              ? `Xác nhận đã nhận hàng từ ${renterName}`
                              : `Xác nhận đã nhận hàng từ ${ownerName}`}
                            </span>
                          </>
                        )}
                      </button>
                      
                      {/* Button: Cannot Pickup */}
                      {currentStatus === 'SHIPPER_CONFIRMED' && !isReturnShipment && (
                        <button
                          onClick={handleCannotPickup}
                          disabled={cannotPickupLoading}
                          className="w-full px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm border-2 border-red-400 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-1.5 sm:gap-2"
                        >
                          {cannotPickupLoading ? (
                            <>⏳ Đang xử lý...</>
                          ) : (
                            <>
                              <AlertCircle size={16} className="flex-shrink-0" /> <span className="text-[10px] xs:text-xs truncate">Không thể nhận hàng từ {ownerName}</span>
                            </>
                          )}
                        </button>
                      )}
                      
                      {/* Button: Cannot Contact Renter for RETURN pickup */}
                      {currentStatus === 'SHIPPER_CONFIRMED' && isReturnShipment && (
                        <button
                          onClick={handleCannotPickupRenter}
                          disabled={cannotContactRenterLoading}
                          className="w-full px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm border-2 border-red-400 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-1.5 sm:gap-2"
                        >
                          {cannotContactRenterLoading ? (
                            <>⏳ Đang xử lý...</>
                          ) : (
                            <>
                              <AlertCircle size={16} className="flex-shrink-0" /> <span className="text-[10px] xs:text-xs truncate">Không thể liên lạc được với renter</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ) : null}
                  {isFailedState && (
                    <div className="bg-orange-50 border border-orange-300 rounded-lg p-3 sm:p-4 mt-2">
                      <p className="text-xs sm:text-sm text-orange-700">
                        ℹ️ Đơn hàng đã bị hủy/thất bại. Bạn vẫn có thể tải ảnh lên để lưu trữ nhưng không thể thay đổi trạng thái.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Delivery Images */}
              <div className="mb-4 sm:mb-6 max-w-full">
                <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 border-l-4 border-green-500 max-w-full overflow-hidden">
                  <h3 className="font-bold text-green-900 mb-1.5 sm:mb-2 flex items-center gap-2 text-sm sm:text-base break-words">
                    <span className="text-base sm:text-lg flex-shrink-0">📸</span> 
                    <span className="break-words">
                    {isReturnShipment 
                      ? `Chụp ảnh lúc giao hàng tới ${ownerName}` 
                      : `Chụp ảnh lúc giao hàng tời ${renterName}`}
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-green-800 break-words">
                    {isReturnShipment
                      ? 'Tải lên ảnh chứng minh khi giao hàng cho chủ hàng (tối thiểu 1 ảnh)'
                      : 'Tải lên ảnh chứng minh khi giao hàng cho người thuê (tối thiểu 1 ảnh)'}
                  </p>
                </div>

                <div className="bg-white rounded-lg border-2 border-dashed border-green-300 p-3 sm:p-4">
                  {deliveryImages.length === 0 && !deliveryUploaded && (pickupUploaded || isFailedState) && (
                    <label className="block cursor-pointer">
                      <div className="flex flex-col items-center justify-center py-4 sm:py-6">
                        <Upload className="text-green-500 mb-1.5 sm:mb-2" size={28} />
                        <p className="text-xs sm:text-sm font-semibold text-gray-700">Nhấn để tải ảnh lên</p>
                        <p className="text-[10px] xs:text-xs text-gray-500 mt-0.5 sm:mt-1">hoặc kéo thả ảnh vào đây</p>
                        <p className="text-[10px] xs:text-xs text-gray-400 mt-1.5 sm:mt-2">Tối thiểu 1 ảnh</p>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleDeliveryImageUpload}
                        disabled={loading || !pickupUploaded}
                        className="hidden"
                      />
                    </label>
                  )}

                  {!pickupUploaded && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">⏳ Hãy hoàn thành bước pickup trước</p>
                    </div>
                  )}

                  {deliveryImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                      {deliveryImages.map((file, idx) => (
                        <div key={idx} className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-[4/3]">
                          <img
                            src={typeof file === 'string' ? file : URL.createObjectURL(file)}
                            alt={`delivery-${idx}`}
                            className="w-full h-full object-contain rounded-lg shadow-sm"
                          />
                          {!deliveryUploaded && canStillDocument && (
                            <button
                              onClick={() => removeDeliveryImage(idx)}
                              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs sm:text-sm z-10"
                            >
                              ✕
                            </button>
                          )}
                          <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] xs:text-xs px-1.5 sm:px-2 py-0.5 rounded max-w-[90%] truncate">
                            {typeof file === 'string' ? '✓' : '●'} {idx + 1}
                          </div>
                        </div>
                      ))}
                      {!deliveryUploaded && (pickupUploaded || isFailedState) && canStillDocument && (
                        <label className="border-2 border-dashed border-green-300 rounded-lg aspect-[4/3] flex items-center justify-center cursor-pointer hover:bg-green-50 transition-colors">
                          <div className="text-center">
                            <Upload className="text-green-400 mx-auto mb-0.5 sm:mb-1" size={18} />
                            <span className="text-[10px] xs:text-xs text-green-600 font-semibold">Thêm</span>
                          </div>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleDeliveryImageUpload}
                            disabled={loading || !pickupUploaded}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>

                {/* Delivery Status */}
                <div className="mt-3 sm:mt-4">
                  {deliveryUploaded ? (
                    <div className="bg-green-50 border border-green-300 rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                      <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
                      <div>
                        <p className="font-bold text-green-900 text-xs sm:text-sm">Đã hoàn tất vận chuyển</p>
                        <p className="text-[10px] xs:text-xs sm:text-sm text-green-700">Status: DELIVERED</p>
                      </div>
                    </div>
                  ) : !pickupUploaded ? (
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3 opacity-50">
                      <AlertCircle className="text-gray-500 flex-shrink-0" size={20} />
                      <div>
                        <p className="font-bold text-gray-700 text-xs sm:text-sm">Chờ pickup</p>
                        <p className="text-[10px] xs:text-xs sm:text-sm text-gray-600">Hoàn thành pickup trước</p>
                      </div>
                    </div>
                  ) : canStillDocument ? (
                    <div className="space-y-2 sm:space-y-3">
                      <button
                        onClick={handleConfirmDelivery}
                        disabled={deliveryImages.length === 0 || deliveryLoading || isFailedState}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                          deliveryImages.length > 0 && !deliveryLoading
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {deliveryLoading ? (
                          <>
                            <CheckCircle2 size={18} className="flex-shrink-0" /> ⏳ Đang xử lý...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={18} className="flex-shrink-0" /> 
                            <span className="truncate">
                            {isReturnShipment 
                              ? `Xác nhận ${ownerName} đã nhận hàng`
                              : `Xác nhận ${renterName} đã nhận hàng`}
                            </span>
                          </>
                        )}
                      </button>

                      {/* Button: Renter không nhận hàng (only for DELIVERY) */}
                      {!isReturnShipment && (
                        <button
                          onClick={() => setShowRenterRejectDialog(true)}
                          disabled={loading}
                          className="w-full px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm border-2 border-orange-400 text-orange-600 hover:bg-orange-50 transition-all flex items-center justify-center gap-1.5 sm:gap-2"
                        >
                          <AlertCircle size={16} className="flex-shrink-0" /> <span className="text-[10px] xs:text-xs truncate">Renter không nhận hàng</span>
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Dialog: Renter Rejection */}
            <AnimatePresence>
              {showRenterRejectDialog && (
                <motion.div
                  className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <div className="bg-gradient-to-r from-orange-600 to-red-600 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                      <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                        <AlertCircle size={20} /> Renter không nhận hàng
                      </h3>
                      <button
                        onClick={() => setShowRenterRejectDialog(false)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                      {/* Reason Selection */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                          Lý do renter không nhận hàng:
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition"
                            style={{ borderColor: rejectReason === 'PRODUCT_DAMAGED' ? '#2563eb' : '#d1d5db' }}>
                            <input
                              type="radio"
                              name="reject_reason"
                              value="PRODUCT_DAMAGED"
                              checked={rejectReason === 'PRODUCT_DAMAGED'}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="w-4 h-4"
                            />
                            <span className="text-gray-700 font-medium text-xs sm:text-sm">🔨 Sản phẩm có lỗi</span>
                          </label>
                          <label className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition"
                            style={{ borderColor: rejectReason === 'NO_CONTACT' ? '#2563eb' : '#d1d5db' }}>
                            <input
                              type="radio"
                              name="reject_reason"
                              value="NO_CONTACT"
                              checked={rejectReason === 'NO_CONTACT'}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="w-4 h-4"
                            />
                            <span className="text-gray-700 font-medium text-xs sm:text-sm">📞 Không liên lạc được với renter</span>
                          </label>
                        </div>
                      </div>

                      {/* Notes Input */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                          Ghi chú chi tiết:
                        </label>
                        <textarea
                          value={rejectNotes}
                          onChange={(e) => setRejectNotes(e.target.value)}
                          placeholder="Nhập chi tiết lý do..."
                          className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm"
                          rows={3}
                          disabled={loading}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
                        <button
                          onClick={() => setShowRenterRejectDialog(false)}
                          disabled={loading}
                          className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold text-xs sm:text-sm hover:bg-gray-50 transition disabled:opacity-50"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleRenterReject}
                          disabled={loading || !rejectNotes.trim()}
                          className="flex-1 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg font-semibold text-xs sm:text-sm hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? '⏳ Đang xử lý...' : 'Xác nhận'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirmation Modal */}
            <AnimatePresence>
              {showConfirmModal && confirmAction && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
                  onClick={() => !cannotPickupLoading && !cannotContactRenterLoading && setShowConfirmModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                          <AlertCircle className="text-white" size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-white">{confirmAction.title}</h3>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-5">
                      <p className="text-gray-700 leading-relaxed">
                        {confirmAction.message}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 flex gap-3">
                      <button
                        onClick={() => setShowConfirmModal(false)}
                        disabled={cannotPickupLoading || cannotContactRenterLoading}
                        className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {confirmAction.cancelText}
                      </button>
                      <button
                        onClick={handleConfirmAction}
                        disabled={cannotPickupLoading || cannotContactRenterLoading}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {(cannotPickupLoading || cannotContactRenterLoading) ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Đang xử lý...
                          </>
                        ) : (
                          confirmAction.confirmText
                        )}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
