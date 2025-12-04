import { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const AdminProcessPayment = ({ dispute, onUpdate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Get payment details
  const product = dispute.subOrder?.products?.[dispute.productIndex];
  const depositAmount = product?.totalDeposit || 0;
  const repairCost = dispute.repairCost || 0;
  const additionalRequired = Math.max(0, repairCost - depositAmount);

  // Get renter info (respondent)
  const renter = dispute.respondent;
  
  // Parse wallet balance - ALWAYS use available balance for payment processing
  let renterWalletBalance = 0;
  if (renter?.wallet?.balance) {
    const balance = renter.wallet.balance;
    // If balance is an object, use available (real usable amount)
    if (typeof balance === 'object') {
      renterWalletBalance = balance.available || 0;
    } 
    // If balance is a number
    else if (typeof balance === 'number') {
      renterWalletBalance = balance;
    }
    // If balance is a string
    else if (typeof balance === 'string') {
      renterWalletBalance = parseFloat(balance) || 0;
    }
  }

  const hasEnoughFunds = renterWalletBalance + depositAmount >= repairCost;

  const handleProcessPayment = async () => {
    if (!hasEnoughFunds) {
      toast.error('Renter chưa nạp đủ tiền vào ví');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await api.post(`/disputes/${dispute._id}/admin-process-payment`, {
        repairCost,
        depositAmount,
        additionalRequired
      });

      toast.success('Xử lý thanh toán thành công');
      setShowModal(false);
      onUpdate && onUpdate(response.data.dispute);
    } catch (error) {
      console.error('Process payment error:', error);
      toast.error(error.response?.data?.message || 'Xử lý thanh toán thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        💰 Admin: Xử lý thanh toán
      </h2>

      {/* Payment Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="font-medium text-blue-900 mb-3">📋 Thông tin thanh toán</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Chi phí sửa chữa:</span>
            <span className="font-semibold text-gray-900">
              {repairCost.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tiền cọc (sẽ trừ):</span>
            <span className="font-semibold text-green-600">
              {depositAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>
          {additionalRequired > 0 && (
            <div className="flex justify-between border-t border-blue-200 pt-2">
              <span className="font-medium text-blue-900">Cần trừ từ ví:</span>
              <span className="font-bold text-blue-600">
                {additionalRequired.toLocaleString('vi-VN')}đ
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Renter Wallet Status */}
      <div className={`border-2 rounded-lg p-4 mb-4 ${
        hasEnoughFunds 
          ? 'bg-green-50 border-green-300' 
          : 'bg-red-50 border-red-300'
      }`}>
        <h3 className={`font-semibold mb-2 ${
          hasEnoughFunds ? 'text-green-900' : 'text-red-900'
        }`}>
          {hasEnoughFunds ? '✅ Renter đã có đủ tiền' : '⚠️ Renter chưa đủ tiền'}
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Số dư ví renter:</span>
            <span className="font-semibold">
              {renterWalletBalance.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tiền cọc:</span>
            <span className="font-semibold">
              {depositAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="border-t border-gray-300 pt-2 flex justify-between">
            <span className="font-medium">Tổng khả dụng:</span>
            <span className="font-bold text-lg">
              {(renterWalletBalance + depositAmount).toLocaleString('vi-VN')}đ
            </span>
          </div>
          
          {!hasEnoughFunds && (
            <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
              <p className="text-xs text-red-700">
                ⚠️ Còn thiếu: <strong>{(repairCost - renterWalletBalance - depositAmount).toLocaleString('vi-VN')}đ</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => setShowModal(true)}
        disabled={!hasEnoughFunds}
        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
      >
        {hasEnoughFunds ? '✓ Xử lý thanh toán' : '⏳ Chờ renter nạp tiền'}
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ✅ Xác nhận xử lý thanh toán
            </h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 mb-3">
                <strong>Hệ thống sẽ thực hiện:</strong>
              </p>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>✓ Trừ {depositAmount.toLocaleString('vi-VN')}đ từ tiền cọc</li>
                {additionalRequired > 0 && (
                  <li>✓ Trừ {additionalRequired.toLocaleString('vi-VN')}đ từ ví renter</li>
                )}
                <li>✓ Chuyển {repairCost.toLocaleString('vi-VN')}đ cho owner</li>
                <li>✓ Đổi status dispute → RESOLVED</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleProcessPayment}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isProcessing ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProcessPayment;
