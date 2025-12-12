import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, XCircle, Package } from 'lucide-react';
import rentalOrderService from '../../services/rentalOrder';

/**
 * Modal cho người thuê quyết định khi chủ xác nhận một phần sản phẩm
 * Lựa chọn A: Hủy toàn bộ (hoàn 100%)
 * Lựa chọn B: Tiếp tục với phần được xác nhận (hoàn phần bị từ chối)
 */
const RenterPartialDecisionModal = ({ isOpen, onClose, subOrder, onDecisionMade }) => {
  const [loading, setLoading] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  if (!isOpen || !subOrder) return null;

  // Tính toán thông tin các sản phẩm
  const confirmedProducts = subOrder.products?.filter(p => p.productStatus === 'CONFIRMED') || [];
  const rejectedProducts = subOrder.products?.filter(p => p.productStatus === 'REJECTED') || [];

  // ✅ NEW: Recalculate batches from products (don't trust deliveryBatches in DB)
  const recalculateBatchesFromProducts = () => {
    if (!subOrder.products || subOrder.products.length === 0) {
      return [];
    }

    // Group products by delivery date
    const batchMap = new Map();
    
    subOrder.products.forEach(productItem => {
      const deliveryDate = productItem.rentalPeriod?.startDate
        ? new Date(productItem.rentalPeriod.startDate).toISOString().split('T')[0]
        : null;
      
      if (!deliveryDate) return;

      if (!batchMap.has(deliveryDate)) {
        batchMap.set(deliveryDate, {
          deliveryDate,
          products: [],
          confirmedProducts: [],
          rejectedProducts: []
        });
      }

      const batch = batchMap.get(deliveryDate);
      batch.products.push(productItem._id);

      if (productItem.productStatus === 'CONFIRMED') {
        batch.confirmedProducts.push(productItem._id);
      } else if (productItem.productStatus === 'REJECTED') {
        batch.rejectedProducts.push(productItem._id);
      }
    });

    return Array.from(batchMap.values());
  };

  // ✅ Calculate shipping refund for REJECTED products only
  // Logic: If batch has ≥1 CONFIRMED → keep fee (refund = 0)
  //        If batch has ALL REJECTED → refund 100%
  const calculateShippingRefundForRejected = () => {
    const recalculatedBatches = recalculateBatchesFromProducts();
    
    if (recalculatedBatches.length === 0 || !subOrder.deliveryBatches) {
      return 0;
    }

    let totalRefund = 0;

    recalculatedBatches.forEach(recalcBatch => {
      // Check if this batch has ANY confirmed product
      const hasConfirmed = recalcBatch.confirmedProducts.length > 0;

      if (!hasConfirmed) {
        // ALL products in this batch are REJECTED → Refund 100%
        const matchingBatch = subOrder.deliveryBatches.find(
          db => db.deliveryDate === recalcBatch.deliveryDate
        );
        
        if (matchingBatch) {
          const batchFee = matchingBatch.shippingFee?.finalFee || 0;
          totalRefund += batchFee;
    
        }
      } else {
        // Has at least 1 CONFIRMED → Keep fee (no refund)
        const matchingBatch = subOrder.deliveryBatches.find(
          db => db.deliveryDate === recalcBatch.deliveryDate
        );
        if (matchingBatch) {
          console.log(`📦 Batch ${recalcBatch.deliveryDate}: Has CONFIRMED → Keep fee ${matchingBatch.shippingFee?.finalFee || 0}`);
        }
      }
    });

    return totalRefund;
  };

  // Tính toán số tiền
  const calculateTotals = (products, includeShipping = true) => {
    // Calculate rental and deposit from products
    const deposit = products.reduce((sum, p) => sum + (p.totalDeposit || 0), 0);
    const rental = products.reduce((sum, p) => sum + (p.totalRental || 0), 0);
    
    // ✅ For CONFIRMED products: Calculate shipping fees from batches that have confirmed products
    // ✅ For REJECTED products: Shipping refund is 0 if batch has any confirmed product
    let shipping = 0;
    
    if (includeShipping) {
      if (products === confirmedProducts) {
        // Calculate shipping for CONFIRMED products
        // Include all batches that have at least 1 confirmed product
        const recalculatedBatches = recalculateBatchesFromProducts();
        recalculatedBatches.forEach(batch => {
          if (batch.confirmedProducts.length > 0) {
            const matchingBatch = subOrder.deliveryBatches?.find(
              db => db.deliveryDate === batch.deliveryDate
            );
            if (matchingBatch) {
              shipping += matchingBatch.shippingFee?.finalFee || 0;
            }
          }
        });
      } else if (products === rejectedProducts) {
        // ✅ For REJECTED products: Use the refund calculation
        shipping = calculateShippingRefundForRejected();
      }
    }
    
    return {
      deposit,
      rental,
      shipping,
      total: deposit + rental + shipping
    };
  };

  const confirmedTotals = calculateTotals(confirmedProducts);
  const rejectedTotals = calculateTotals(rejectedProducts);
  
  // For "Cancel All" option - calculate total shipping from all batches
  const allProducts = subOrder.products || [];
  const allTotals = {
    deposit: allProducts.reduce((sum, p) => sum + (p.totalDeposit || 0), 0),
    rental: allProducts.reduce((sum, p) => sum + (p.totalRental || 0), 0),
    shipping: (subOrder.deliveryBatches || []).reduce((sum, batch) => sum + (batch.shippingFee.finalFee || 0), 0),
    total: 0
  };
  allTotals.total = allTotals.deposit + allTotals.rental + allTotals.shipping;
  

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleCancelAll = async () => {
    if (!cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn');
      return;
    }

    // Xác nhận trước khi hủy
    if (!window.confirm('Bạn có chắc chắn muốn HỦY TOÀN BỘ đơn hàng này? Hành động này không thể hoàn tác.')) {
      return;
    }

    setLoading(true);
    try {
      const result = await rentalOrderService.renterCancelPartialOrder(subOrder._id, cancelReason);
      onDecisionMade('CANCELLED', result);
      onClose();
    } catch (error) {
      alert(error.message || 'Không thể hủy đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptPartial = async () => {
    // Xác nhận trước khi tiếp tục
    if (!window.confirm('Bạn xác nhận TIẾP TỤC với các sản phẩm đã được chủ xác nhận?')) {
      return;
    }

    setLoading(true);
    try {
      const result = await rentalOrderService.renterAcceptPartialOrder(subOrder._id);
      onDecisionMade('ACCEPTED', result);
      // Close modal - parent will redirect to confirmation-summary
      onClose();
    } catch (error) {
      alert(error.message || 'Không thể chấp nhận đơn hàng');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">
              Chủ đã xác nhận một phần đơn hàng
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Thông báo */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              <strong>Chủ chỉ xác nhận {confirmedProducts.length}/{subOrder.products?.length || 0} sản phẩm.</strong>
              {' '}Bạn có 2 lựa chọn:
            </p>
            <ul className="mt-2 text-xs text-orange-700 space-y-1 ml-4">
              <li>• Lựa chọn A: Hủy toàn bộ đơn hàng và nhận lại 100% tiền</li>
              <li>• Lựa chọn B: Tiếp tục với phần đã xác nhận, nhận hoàn tiền cho phần bị từ chối</li>
            </ul>
          </div>

          {/* Thống kê sản phẩm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sản phẩm được xác nhận */}
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">
                  Sản phẩm được xác nhận ({confirmedProducts.length})
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                {confirmedProducts.map((p, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      {p.product?.title || p.product?.name} x{p.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sản phẩm bị từ chối */}
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-900">
                  Sản phẩm bị từ chối ({rejectedProducts.length})
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                {rejectedProducts.map((p, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      {p.product?.title || p.product?.name} x{p.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lựa chọn A: Hủy toàn bộ */}
          <div
            className={`border-2 rounded-lg p-5 cursor-pointer transition-all ${
              selectedChoice === 'CANCEL_ALL'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-red-300'
            }`}
            onClick={() => setSelectedChoice('CANCEL_ALL')}
          >
            <div className="flex items-start gap-4">
              <input
                type="radio"
                checked={selectedChoice === 'CANCEL_ALL'}
                onChange={() => setSelectedChoice('CANCEL_ALL')}
                className="mt-1"
              />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Lựa chọn A: Hủy toàn bộ đơn hàng
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Bạn sẽ nhận lại 100% tất cả các khoản đã thanh toán
                </p>
                
                <div className="bg-white rounded p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tiền cọc:</span>
                    <span className="font-semibold text-green-600">
                      +{formatCurrency(allTotals.deposit)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí thuê:</span>
                    <span className="font-semibold text-green-600">
                      +{formatCurrency(allTotals.rental)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="font-semibold text-green-600">
                      +{formatCurrency(allTotals.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t pt-2">
                    <span>Tổng hoàn:</span>
                    <span className="text-green-600">
                      +{formatCurrency(allTotals.total)}
                    </span>
                  </div>
                </div>

                {selectedChoice === 'CANCEL_ALL' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lý do hủy đơn: <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Vui lòng nhập lý do..."
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows={3}
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lựa chọn B: Tiếp tục */}
          <div
            className={`border-2 rounded-lg p-5 cursor-pointer transition-all ${
              selectedChoice === 'CONTINUE_PARTIAL'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => setSelectedChoice('CONTINUE_PARTIAL')}
          >
            <div className="flex items-start gap-4">
              <input
                type="radio"
                checked={selectedChoice === 'CONTINUE_PARTIAL'}
                onChange={() => setSelectedChoice('CONTINUE_PARTIAL')}
                className="mt-1"
              />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Lựa chọn B: Tiếp tục ký hợp đồng
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Chấp nhận thuê phần chủ đã xác nhận, hoàn tiền cho phần bị từ chối
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Tiền giữ lại */}
                  <div className="bg-blue-100 rounded p-3">
                    <p className="text-xs text-blue-800 font-semibold mb-2">
                      Tiền giữ lại (phần được xác nhận):
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Cọc:</span>
                        <span className="font-semibold">{formatCurrency(confirmedTotals.deposit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Thuê:</span>
                        <span className="font-semibold">{formatCurrency(confirmedTotals.rental)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Ship:</span>
                        <span className="font-semibold">{formatCurrency(confirmedTotals.shipping)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-blue-300 pt-1">
                        <span>Tổng:</span>
                        <span>{formatCurrency(confirmedTotals.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tiền hoàn lại */}
                  <div className="bg-white rounded p-3">
                    <p className="text-xs text-green-800 font-semibold mb-2">
                      Tiền hoàn lại (phần bị từ chối):
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cọc:</span>
                        <span className="font-semibold text-green-600">
                          +{formatCurrency(rejectedTotals.deposit)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Thuê:</span>
                        <span className="font-semibold text-green-600">
                          +{formatCurrency(rejectedTotals.rental)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ship:</span>
                        <span className="font-semibold text-green-600">
                          +{formatCurrency(rejectedTotals.shipping)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-gray-300 pt-1">
                        <span>Tổng:</span>
                        <span className="text-green-600">
                          +{formatCurrency(rejectedTotals.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Đóng (có thể mở lại)'}
            </button>
            
            {selectedChoice === 'CANCEL_ALL' && (
              <button
                onClick={handleCancelAll}
                disabled={loading || !cancelReason.trim()}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang hủy đơn...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Xác nhận hủy đơn (hoàn 100%)
                  </>
                )}
              </button>
            )}
            
            {selectedChoice === 'CONTINUE_PARTIAL' && (
              <button
                onClick={handleAcceptPartial}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Tiếp tục ký hợp đồng
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenterPartialDecisionModal;
