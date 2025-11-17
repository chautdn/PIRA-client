import { useState } from 'react';

/**
 * Modal Admin xử lý dispute boom hàng
 * Hiển thị thông tin phạt → Admin click Accept → Tự động trừ tiền/credit/warning
 */
export default function BoomDisputeResolveModal({ dispute, onClose, onResolve }) {
  const [processing, setProcessing] = useState(false);

  if (!dispute) return null;

  const subOrder = dispute.subOrder;
  const renter = dispute.renter;
  const owner = dispute.owner;

  // Tính toán phạt từ metadata hoặc tính lại từ SubOrder
  let penalty = dispute.metadata?.penaltyEstimate;
  
  if (!penalty || penalty.total === 0) {
    // Tính lại nếu metadata rỗng
    const rentalDays = subOrder?.rentalPeriod?.duration?.value || 1;
    const subtotalRental = subOrder?.pricing?.subtotalRental || 0;
    const shippingFee = subOrder?.pricing?.shippingFee || 0;
    
    const oneDayRental = Math.round(subtotalRental / rentalDays);
    const twoWayShipping = shippingFee * 2;
    
    penalty = {
      oneDayRental,
      twoWayShipping,
      total: oneDayRental + twoWayShipping
    };
  }
  
  // Evidence từ shipper (nếu có)
  const evidence = dispute.metadata?.evidence || [];

  const handleAccept = async () => {
    if (!confirm(
      `Xác nhận xử lý đơn boom này?\n\n` +
      `Renter sẽ bị:\n` +
      `- Trừ ${penalty.total.toLocaleString()} VND từ ví\n` +
      `- Trừ 30 điểm tín dụng\n` +
      `- Cảnh cáo +1 lần\n\n` +
      `Owner nhận: ${penalty.oneDayRental.toLocaleString()} VND\n` +
      `Admin nhận: ${penalty.twoWayShipping.toLocaleString()} VND`
    )) {
      return;
    }

    setProcessing(true);
    try {
      await onResolve({
        decision: 'RENTER_WIN', // Dummy - backend sẽ tự động xử lý boom
        reason: 'Admin xác nhận renter không nhận hàng (boom)'
      });
      alert('Xử lý đơn boom thành công!');
      onClose();
    } catch (error) {
      console.error('Error resolving boom:', error);
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚫</span>
            <div>
              <h2 className="text-xl font-bold">Đơn Hàng Bị Boom</h2>
              <p className="text-sm text-red-100">Renter không nhận hàng khi shipper đến giao</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-red-700 rounded-lg p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Dispute Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Dispute ID</p>
            <p className="font-mono font-semibold">{dispute.disputeId}</p>
          </div>

          {/* SubOrder Info */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">📦 Thông tin đơn hàng</h3>
            <div className="bg-blue-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">SubOrder:</span>
                <span className="font-semibold">{subOrder?.subOrderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thời gian thuê:</span>
                <span>{subOrder?.rentalPeriod?.duration?.value} {subOrder?.rentalPeriod?.duration?.unit?.toLowerCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phí thuê:</span>
                <span className="font-semibold">{subOrder?.pricing?.subtotalRental?.toLocaleString()} VND</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phí ship (1 chiều):</span>
                <span className="font-semibold">{subOrder?.pricing?.shippingFee?.toLocaleString()} VND</span>
              </div>
            </div>
          </div>

          {/* Evidence from Shipper */}
          {evidence && evidence.length > 0 && (
            <div className="border-2 border-orange-300 rounded-lg p-4 bg-orange-50">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>📸</span>
                <span>Bằng chứng từ Shipper</span>
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {evidence.map((img, idx) => (
                  <a
                    key={idx}
                    href={img}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative group"
                  >
                    <img
                      src={img}
                      alt={`Evidence ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-orange-200 group-hover:border-orange-400 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-opacity flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-2xl">🔍</span>
                    </div>
                  </a>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">Click vào ảnh để xem chi tiết</p>
            </div>
          )}

          {/* People Involved */}
          <div className="grid grid-cols-2 gap-4">
            {/* Renter */}
            <div className="border-2 border-red-300 rounded-lg p-4">
              <p className="text-xs text-red-600 uppercase font-semibold mb-2">😞 Người thuê (Bị phạt)</p>
              <p className="font-semibold text-gray-900">
                {renter?.profile?.firstName} {renter?.profile?.lastName}
              </p>
              <p className="text-sm text-gray-600">{renter?.email}</p>
              <p className="text-sm text-gray-600">{renter?.phone}</p>
              <div className="mt-2 pt-2 border-t border-red-200">
                <p className="text-xs text-red-700 font-semibold">
                  Credit hiện tại: {renter?.creditScore || 100} điểm
                </p>
              </div>
            </div>

            {/* Owner */}
            <div className="border-2 border-green-300 rounded-lg p-4">
              <p className="text-xs text-green-700 uppercase font-semibold mb-2">🏠 Chủ sản phẩm (Nhận tiền)</p>
              <p className="font-semibold text-gray-900">
                {owner?.profile?.firstName} {owner?.profile?.lastName}
              </p>
              <p className="text-sm text-gray-600">{owner?.email}</p>
              <p className="text-sm text-gray-600">{owner?.phone}</p>
            </div>
          </div>

          {/* Penalty Breakdown */}
          <div className="border-2 border-yellow-400 rounded-lg p-5 bg-yellow-50">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>💰</span>
              <span>Chi tiết tiền phạt</span>
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Phí 1 ngày thuê:</span>
                <span className="font-semibold text-green-700 text-lg">
                  +{penalty.oneDayRental.toLocaleString()} VND
                </span>
              </div>
              <p className="text-xs text-gray-500 pl-4">→ Chuyển vào ví owner</p>

              <div className="h-px bg-yellow-300 my-2"></div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Phí ship 2 chiều:</span>
                <span className="font-semibold text-blue-700 text-lg">
                  +{penalty.twoWayShipping.toLocaleString()} VND
                </span>
              </div>
              <p className="text-xs text-gray-500 pl-4">→ Chuyển vào ví admin</p>

              <div className="h-px bg-yellow-400 my-3"></div>

              <div className="flex justify-between items-center bg-white rounded-lg p-3">
                <span className="font-bold text-gray-900">Tổng trừ từ Renter:</span>
                <span className="font-bold text-red-700 text-xl">
                  -{penalty.total.toLocaleString()} VND
                </span>
              </div>
            </div>

            {/* Additional Penalties */}
            <div className="mt-4 pt-4 border-t border-yellow-300 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-gray-900">Credit Score: -30 điểm</p>
                  <p className="text-xs text-gray-500">Sau khi trừ: {(renter?.creditScore || 100) - 30} điểm</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <span className="text-2xl">🚨</span>
                <div>
                  <p className="font-semibold text-gray-900">Cảnh cáo: +1 lần</p>
                  <p className="text-xs text-gray-500">Sau 3 lần cảnh cáo → Tài khoản bị khóa</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-2xl">💳</span>
                <div>
                  <p className="font-semibold text-gray-900">Ví âm → Tạm khóa tính năng thuê</p>
                  <p className="text-xs text-gray-500">Renter phải nạp tiền trước khi thuê tiếp</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {dispute.description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Mô tả</p>
              <p className="text-gray-700">{dispute.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handleAccept}
              disabled={processing}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                processing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {processing ? '⏳ Đang xử lý...' : '✓ Xác nhận & Xử lý'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
