import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, DollarSign, Scale } from 'lucide-react';

/**
 * Modal cho admin đưa ra quyết định sơ bộ
 * Admin chọn bên thắng (renter/owner/partial), nhập lý do, số tiền hoàn/phạt
 * Sau khi submit, renter và owner có 7 ngày để phản hồi
 */
const AdminDecisionModal = ({ isOpen, onClose, dispute, onSubmit }) => {
  const [formData, setFormData] = useState({
    decision: '',
    reasoning: '',
    refundAmount: 0,
    penaltyAmount: 0,
    favoredParty: '' // 'RENTER', 'OWNER', 'PARTIAL'
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !dispute) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFavoredPartyChange = (party) => {
    setFormData(prev => ({
      ...prev,
      favoredParty: party,
      // Reset amounts when changing party
      refundAmount: 0,
      penaltyAmount: 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.favoredParty) {
      setError('Vui lòng chọn bên được ưu tiên');
      return;
    }

    if (!formData.decision || !formData.reasoning) {
      setError('Vui lòng nhập quyết định và lý do');
      return;
    }

    if (formData.refundAmount < 0 || formData.penaltyAmount < 0) {
      setError('Số tiền không được âm');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        ...formData,
        refundAmount: parseFloat(formData.refundAmount) || 0,
        penaltyAmount: parseFloat(formData.penaltyAmount) || 0
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi submit quyết định');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Đưa ra quyết định sơ bộ</h2>
            <p className="text-blue-100 text-sm mt-1">
              Dispute ID: {dispute.disputeId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dispute Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Thông tin tranh chấp</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Loại:</span> {dispute.type}</p>
                <p><span className="font-medium">Renter:</span> {dispute.renter?.fullName || 'N/A'}</p>
                <p><span className="font-medium">Owner:</span> {dispute.owner?.fullName || 'N/A'}</p>
                <p><span className="font-medium">Mô tả:</span> {dispute.description}</p>
              </div>
            </div>

            {/* Favored Party Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Bên được ưu tiên <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleFavoredPartyChange('RENTER')}
                  className={`p-4 border-2 rounded-lg transition flex flex-col items-center gap-2 ${
                    formData.favoredParty === 'RENTER'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle size={24} />
                  <span className="font-medium">Renter thắng</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFavoredPartyChange('OWNER')}
                  className={`p-4 border-2 rounded-lg transition flex flex-col items-center gap-2 ${
                    formData.favoredParty === 'OWNER'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle size={24} />
                  <span className="font-medium">Owner thắng</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFavoredPartyChange('PARTIAL')}
                  className={`p-4 border-2 rounded-lg transition flex flex-col items-center gap-2 ${
                    formData.favoredParty === 'PARTIAL'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Scale size={24} />
                  <span className="font-medium">Một phần</span>
                </button>
              </div>
            </div>

            {/* Decision Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tóm tắt quyết định <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="decision"
                value={formData.decision}
                onChange={handleInputChange}
                placeholder="VD: Hoàn tiền 100% cho renter do sản phẩm không đúng mô tả"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Reasoning */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reasoning"
                value={formData.reasoning}
                onChange={handleInputChange}
                rows={5}
                placeholder="Nhập lý do chi tiết cho quyết định của bạn..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Refund Amount */}
            {(formData.favoredParty === 'RENTER' || formData.favoredParty === 'PARTIAL') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền hoàn lại (VNĐ)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    name="refundAmount"
                    value={formData.refundAmount}
                    onChange={handleInputChange}
                    min="0"
                    step="1000"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Số tiền sẽ được hoàn vào ví của renter
                </p>
              </div>
            )}

            {/* Penalty Amount */}
            {formData.favoredParty && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền phạt (VNĐ)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    name="penaltyAmount"
                    value={formData.penaltyAmount}
                    onChange={handleInputChange}
                    min="0"
                    step="1000"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.favoredParty === 'RENTER' && 'Owner sẽ bị phạt và trừ credit score'}
                  {formData.favoredParty === 'OWNER' && 'Renter sẽ bị phạt và trừ credit score'}
                  {formData.favoredParty === 'PARTIAL' && 'Cả 2 bên sẽ bị phạt một phần'}
                </p>
              </div>
            )}

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Lưu ý quan trọng:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Quyết định này sẽ được gửi đến cả renter và owner</li>
                  <li>Họ có <strong>7 ngày</strong> để phản hồi (đồng ý hoặc từ chối)</li>
                  <li>Nếu cả 2 đồng ý → Thực thi ngay lập tức</li>
                  <li>Nếu có 1 bên từ chối → Chuyển sang giải quyết pháp lý</li>
                  <li>Nếu không phản hồi trong 7 ngày → Tự động thực thi</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? 'Đang xử lý...' : 'Gửi quyết định'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDecisionModal;
