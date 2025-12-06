import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useWallet } from '../../context/WalletContext';

const WalletDepositWarning = ({ dispute, depositAmount, repairCost }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { balance: walletBalance, isLoading } = useWallet();

  const additionalRequired = Math.max(0, repairCost - depositAmount);
  const totalRequired = repairCost;
  const isRenter = user?._id === dispute.respondent?._id;

  const hasEnoughFunds = walletBalance + depositAmount >= repairCost;

  if (!isRenter || additionalRequired <= 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        💰 Yêu cầu thanh toán bổ sung
      </h3>

      {/* Breakdown */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Chi phí sửa chữa:</span>
            <span className="font-semibold text-gray-900">
              {repairCost.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tiền cọc (sẽ trừ):</span>
            <span className="font-semibold text-green-600">
              -{depositAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="border-t border-orange-300 pt-3 flex justify-between">
            <span className="font-medium text-orange-800">Cần thanh toán thêm:</span>
            <span className="text-xl font-bold text-orange-600">
              {additionalRequired.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      </div>

      {/* Wallet Status */}
      <div className={`border-2 rounded-lg p-4 mb-4 ${
        hasEnoughFunds 
          ? 'bg-green-50 border-green-300' 
          : 'bg-red-50 border-red-300'
      }`}>
        <div className="flex items-start gap-3">
          <div className="text-2xl">
            {isLoading ? '⏳' : (hasEnoughFunds ? '✅' : '⚠️')}
          </div>
          <div className="flex-1">
            <h4 className={`font-semibold mb-2 ${
              hasEnoughFunds ? 'text-green-900' : 'text-red-900'
            }`}>
              {isLoading ? 'Đang kiểm tra số dư ví...' : (hasEnoughFunds ? 'Số dư ví đủ để thanh toán' : 'Số dư ví không đủ')}
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Số dư ví hiện tại:</span>
                <span className="font-semibold">
                  {isLoading ? '...' : `${walletBalance.toLocaleString('vi-VN')}đ`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tiền cọc có thể dùng:</span>
                <span className="font-semibold">
                  {depositAmount.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between">
                <span className="font-medium">Tổng khả dụng:</span>
                <span className="font-bold text-lg">
                  {(walletBalance + depositAmount).toLocaleString('vi-VN')}đ
                </span>
              </div>
              
              {!hasEnoughFunds && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <div className="flex justify-between text-red-700 font-semibold">
                    <span>Cần nạp thêm:</span>
                    <span className="text-lg">
                      {(repairCost - walletBalance - depositAmount).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action */}
      {!hasEnoughFunds && (
        <div className="space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>📌 Lưu ý:</strong> Bạn cần nạp thêm tiền vào ví trước khi admin có thể xử lý thanh toán. 
              Sau khi nạp đủ, admin sẽ trừ tiền từ ví và tiền cọc để thanh toán cho owner.
            </p>
          </div>

          <button
            onClick={() => navigate('/wallet/top-up')}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            💳 Nạp tiền vào ví
          </button>
        </div>
      )}

      {hasEnoughFunds && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>✓ Đã đủ số dư!</strong> Admin sẽ xử lý thanh toán tự động. 
            Tổng {repairCost.toLocaleString('vi-VN')}đ sẽ được trừ từ ví ({additionalRequired.toLocaleString('vi-VN')}đ) 
            và tiền cọc ({depositAmount.toLocaleString('vi-VN')}đ).
          </p>
        </div>
      )}
    </div>
  );
};

export default WalletDepositWarning;
