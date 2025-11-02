import React, { useState } from 'react';

const PaymentMethodSelector = ({ onSelectMethod, selectedMethod, onClose }) => {
  const [localSelection, setLocalSelection] = useState(selectedMethod || '');

  const paymentMethods = [
    {
      key: 'WALLET',
      title: 'Ví điện tử',
      description: 'Thanh toán trực tiếp từ số dư ví (Tự động trừ tiền)',
      icon: '💳'
    },
    {
      key: 'BANK_TRANSFER',
      title: 'Chuyển khoản ngân hàng',
      description: 'Thanh toán qua PayOS - Chuyển khoản',
      icon: '🏦'
    },
    {
      key: 'PAYOS',
      title: 'PayOS QR Code',
      description: 'Thanh toán qua mã QR PayOS',
      icon: '💰'
    },
    {
      key: 'COD',
      title: 'Thanh toán khi nhận hàng',
      description: 'Thanh toán bằng tiền mặt khi nhận sản phẩm',
      icon: '💵'
    }
  ];

  const handleConfirm = () => {
    if (localSelection) {
      onSelectMethod(localSelection);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Chọn phương thức thanh toán</h2>
        
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div
              key={method.key}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                localSelection === method.key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setLocalSelection(method.key)}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{method.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.key}
                      checked={localSelection === method.key}
                      onChange={() => setLocalSelection(method.key)}
                      className="text-blue-500"
                    />
                    <h3 className="font-medium">{method.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={!localSelection}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;