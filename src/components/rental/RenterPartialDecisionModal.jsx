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

  // Tính toán số tiền
  const calculateTotals = (products) => {
    return products.reduce((acc, p) => ({
      deposit: acc.deposit + (p.totalDeposit || 0),
      rental: acc.rental + (p.totalRental || 0),
      shipping: acc.shipping + (p.totalShippingFee || 0),
      total: acc.total + (p.totalDeposit || 0) + (p.totalRental || 0) + (p.totalShippingFee || 0)
    }), { deposit: 0, rental: 0, shipping: 0, total: 0 });
  };

  const confirmedTotals = calculateTotals(confirmedProducts);
  const rejectedTotals = calculateTotals(rejectedProducts);
  const allTotals = calculateTotals(subOrder.products || []);

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
      console.error('Error cancelling order:', error);
      alert(error.message || 'Không thể hủy đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptPartial = async () => {
    // Xác nhận trước khi tiếp tục
    if (!window.confirm('Bạn xác nhận TIẾP TỤC với các sản phẩm đã được chủ xác nhận? Bạn sẽ được chuyển đến trang ký hợp đồng.')) {
      return;
    }

    setLoading(true);
    try {
      const result = await rentalOrderService.renterAcceptPartialOrder(subOrder._id);
      onDecisionMade('ACCEPTED', result);
      // Modal will close and page will redirect to contract
      onClose();
    } catch (error) {
      console.error('Error accepting partial order:', error);
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
              {' '}Vui lòng chọn một trong hai lựa chọn bên dưới:
            </p>
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
