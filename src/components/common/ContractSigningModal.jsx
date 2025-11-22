import React, { useState } from 'react';

const ContractSigningModal = ({ contractId, onSign, onClose }) => {
  const [signature, setSignature] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSign = async () => {
    if (!signature.trim() || !isAgreed) {
      return;
    }

    setLoading(true);
    try {
      await onSign(contractId, {
        signature: signature.trim(),
        agreementConfirmed: true,
        signedAt: new Date()
      });
      onClose();
    } catch (error) {
      console.error('Lỗi ký hợp đồng:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Ký hợp đồng thuê</h2>
        
        {/* Contract Preview */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Nội dung hợp đồng</h3>
          <div className="border rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
            <div className="text-sm space-y-2">
              <p><strong>HỢP ĐỒNG THUÊ SẢN PHẨM</strong></p>
              <p>Hợp đồng số: {contractId}</p>
              <p>Ngày ký: {new Date().toLocaleDateString('vi-VN')}</p>
              
              <div className="mt-4 space-y-1">
                <p><strong>ĐIỀU KHOẢN:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Bên thuê có trách nhiệm bảo quản sản phẩm trong suốt thời gian thuê</li>
                  <li>Hoàn trả sản phẩm đúng thời hạn và trong tình trạng ban đầu</li>
                  <li>Thanh toán đầy đủ phí thuê theo thỏa thuận</li>
                  <li>Chịu trách nhiệm bồi thường nếu làm hỏng hoặc mất sản phẩm</li>
                  <li>Tuân thủ các quy định sử dụng sản phẩm do chủ thuê đưa ra</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Digital Signature */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chữ ký điện tử *
          </label>
          <input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Nhập họ tên đầy đủ làm chữ ký"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Việc nhập họ tên có giá trị như chữ ký điện tử
          </p>
        </div>

        {/* Agreement Checkbox */}
        <div className="mb-6">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="mt-1 text-blue-500"
            />
            <span className="text-sm text-gray-700">
              Tôi đã đọc, hiểu và đồng ý với tất cả các điều khoản trong hợp đồng này. 
              Tôi xác nhận rằng chữ ký điện tử có giá trị pháp lý tương đương chữ ký tay.
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSign}
            disabled={!signature.trim() || !isAgreed || loading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang ký...' : '✍️ Ký hợp đồng'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractSigningModal;