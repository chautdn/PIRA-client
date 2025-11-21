import React, { useState } from 'react';
import { FileText, Image as ImageIcon, Scale, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';

/**
 * Component cho admin xem legal evidence và đưa ra quyết định cuối cùng
 */
const AdminFinalDecisionModal = ({ isOpen, onClose, dispute, onSubmit }) => {
  const [formData, setFormData] = useState({
    finalDecision: '',
    finalDecisionReasoning: '',
    refundAmount: dispute?.adminDecision?.refundAmount || 0,
    penaltyAmount: dispute?.adminDecision?.penaltyAmount || 0,
    favoredParty: dispute?.adminDecision?.favoredParty || ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !dispute) return null;

  const legalEvidence = dispute.legalProcess?.legalEvidence || [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.finalDecision || !formData.finalDecisionReasoning) {
      setError('Vui lòng nhập quyết định cuối và lý do');
      return;
    }

    if (!formData.favoredParty) {
      setError('Vui lòng chọn bên được ưu tiên');
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
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Quyết định cuối cùng (Legal Process)</h2>
            <p className="text-purple-100 text-sm mt-1">
              Dispute ID: {dispute.disputeId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Original Admin Decision */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Quyết định ban đầu của Admin:</h3>
            <p className="text-sm text-blue-800 mb-2">{dispute.adminDecision.decision}</p>
            <p className="text-sm text-blue-700">{dispute.adminDecision.reasoning}</p>
            <div className="mt-2 flex gap-4 text-sm">
              <span>
                <strong>Bên thắng:</strong> {dispute.adminDecision.favoredParty}
              </span>
              {dispute.adminDecision.refundAmount > 0 && (
                <span className="text-green-600">
                  <strong>Hoàn:</strong> {dispute.adminDecision.refundAmount.toLocaleString()} VNĐ
                </span>
              )}
              {dispute.adminDecision.penaltyAmount > 0 && (
                <span className="text-red-600">
                  <strong>Phạt:</strong> {dispute.adminDecision.penaltyAmount.toLocaleString()} VNĐ
                </span>
              )}
            </div>
          </div>

          {/* Party Responses */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border-2 ${
              dispute.partyResponses.renter?.status === 'REJECTED'
                ? 'bg-red-50 border-red-300'
                : 'bg-green-50 border-green-300'
            }`}>
              <p className="font-medium mb-2">Phản hồi Renter:</p>
              <p className={`font-bold ${
                dispute.partyResponses.renter?.status === 'REJECTED'
                  ? 'text-red-700'
                  : 'text-green-700'
              }`}>
                {dispute.partyResponses.renter?.status === 'REJECTED' ? 'Từ chối' : 'Đồng ý'}
              </p>
              {dispute.partyResponses.renter?.rejectionReason && (
                <p className="text-sm text-red-700 mt-1">
                  Lý do: {dispute.partyResponses.renter.rejectionReason}
                </p>
              )}
            </div>

            <div className={`p-4 rounded-lg border-2 ${
              dispute.partyResponses.owner?.status === 'REJECTED'
                ? 'bg-red-50 border-red-300'
                : 'bg-green-50 border-green-300'
            }`}>
              <p className="font-medium mb-2">Phản hồi Owner:</p>
              <p className={`font-bold ${
                dispute.partyResponses.owner?.status === 'REJECTED'
                  ? 'text-red-700'
                  : 'text-green-700'
              }`}>
                {dispute.partyResponses.owner?.status === 'REJECTED' ? 'Từ chối' : 'Đồng ý'}
              </p>
              {dispute.partyResponses.owner?.rejectionReason && (
                <p className="text-sm text-red-700 mt-1">
                  Lý do: {dispute.partyResponses.owner.rejectionReason}
                </p>
              )}
            </div>
          </div>

          {/* Legal Evidence */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileText size={20} />
              Bằng chứng pháp lý ({legalEvidence.length}):
            </h3>
            {legalEvidence.length === 0 ? (
              <p className="text-gray-500 italic">Chưa có bằng chứng pháp lý nào</p>
            ) : (
              <div className="space-y-3">
                {legalEvidence.map((evidence, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {evidence.fileType === 'PDF' ? (
                      <FileText className="text-red-500 flex-shrink-0" size={28} />
                    ) : (
                      <ImageIcon className="text-blue-500 flex-shrink-0" size={28} />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{evidence.fileName}</p>
                      <p className="text-sm text-gray-600 mt-1">{evidence.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className={`px-2 py-1 rounded ${
                          evidence.userRole === 'RENTER'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {evidence.userRole}
                        </span>
                        <span>
                          {new Date(evidence.uploadedAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <a
                      href={evidence.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Xem file
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Final Decision Form */}
          <form onSubmit={handleSubmit} className="space-y-6 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Scale size={20} />
              Quyết định cuối cùng
            </h3>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={18} />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Favored Party */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Bên được ưu tiên (có thể thay đổi) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['RENTER', 'OWNER', 'PARTIAL'].map((party) => (
                  <button
                    key={party}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, favoredParty: party }))}
                    className={`p-3 border-2 rounded-lg transition ${
                      formData.favoredParty === party
                        ? party === 'RENTER' ? 'border-green-500 bg-green-50 text-green-700' :
                          party === 'OWNER' ? 'border-blue-500 bg-blue-50 text-blue-700' :
                          'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {party}
                  </button>
                ))}
              </div>
            </div>

            {/* Final Decision Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quyết định cuối <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="finalDecision"
                value={formData.finalDecision}
                onChange={handleInputChange}
                placeholder="VD: Sau khi xem xét bằng chứng từ Tòa án, quyết định..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            {/* Final Decision Reasoning */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea
                name="finalDecisionReasoning"
                value={formData.finalDecisionReasoning}
                onChange={handleInputChange}
                rows={5}
                placeholder="Giải thích chi tiết về quyết định cuối dựa trên bằng chứng pháp lý..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền hoàn (VNĐ)
                </label>
                <input
                  type="number"
                  name="refundAmount"
                  value={formData.refundAmount}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền phạt (VNĐ)
                </label>
                <input
                  type="number"
                  name="penaltyAmount"
                  value={formData.penaltyAmount}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Warning */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-purple-600 flex-shrink-0" size={20} />
                <div className="text-sm text-purple-800">
                  <p className="font-medium mb-1">Lưu ý:</p>
                  <p>
                    Quyết định này là <strong>CUỐI CÙNG</strong> và sẽ được thực thi ngay lập tức.
                    Không thể thay đổi sau khi submit.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
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
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-medium"
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận quyết định cuối'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminFinalDecisionModal;
