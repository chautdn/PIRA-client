import { useState } from 'react';
import { useDispute } from '../../context/DisputeContext';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/disputeHelpers';

const ThirdPartySection = ({ dispute, isAdmin = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { shareShipperInfo, uploadThirdPartyEvidence, loadDisputeDetail } = useDispute();

  const handleShareShipperInfo = async () => {
    setIsLoading(true);
    try {
      await shareShipperInfo(dispute._id);
      toast.success('Đã chia sẻ thông tin shipper thành công');
      await loadDisputeDetail(dispute._id);
    } catch (error) {
      toast.error(error.message || 'Có lỗi khi chia sẻ thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  const thirdParty = dispute.thirdPartyResolution;
  const isShipperInfoShared = thirdParty?.shipperInfoShared?.sharedAt;
  const evidenceDeadline = thirdParty?.evidenceDeadline;
  const isEvidenceUploaded = dispute.status === 'THIRD_PARTY_EVIDENCE_UPLOADED';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Xử lý bởi bên thứ 3
      </h3>

      {/* Thông tin escalation */}
      {thirdParty?.escalatedAt && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
          <p className="text-yellow-800">
            <strong>Chuyển bên thứ 3:</strong> {formatDate(thirdParty.escalatedAt)}
          </p>
          {evidenceDeadline && (
            <p className="text-yellow-700 mt-1">
              <strong>Hạn upload bằng chứng:</strong> {formatDate(evidenceDeadline)}
            </p>
          )}
        </div>
      )}

      {/* Admin actions */}
      {isAdmin && dispute.status === 'THIRD_PARTY_ESCALATED' && !isShipperInfoShared && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 mb-3">
            Cần chia sẻ thông tin shipper và bằng chứng cho cả hai bên để họ có thể upload kết quả từ bên thứ 3.
          </p>
          <button
            onClick={handleShareShipperInfo}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {isLoading ? 'Đang chia sẻ...' : 'Chia sẻ thông tin shipper'}
          </button>
        </div>
      )}

      {/* Shipper info shared status */}
      {isShipperInfoShared && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
          <p className="text-green-800">
            <strong>✅ Đã chia sẻ thông tin shipper:</strong> {formatDate(isShipperInfoShared)}
          </p>
          <p className="text-green-700 text-sm mt-1">
            Cả hai bên đã có thông tin để upload bằng chứng từ bên thứ 3
          </p>
        </div>
      )}

      {/* Upload evidence section cho user */}
      {!isAdmin && isShipperInfoShared && !isEvidenceUploaded && dispute.status === 'THIRD_PARTY_ESCALATED' && (
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-orange-800 mb-3">
            Bạn có thể upload bằng chứng kết quả từ bên thứ 3. Hạn cuối: {formatDate(evidenceDeadline)}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
          >
            Upload bằng chứng
          </button>
        </div>
      )}

      {/* Evidence uploaded status */}
      {isEvidenceUploaded && thirdParty?.evidence && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-purple-800 mb-2">
            <strong>📋 Đã upload bằng chứng:</strong> {formatDate(thirdParty.evidence.uploadedAt)}
          </p>
          {thirdParty.evidence.officialDecision && (
            <div className="mt-3">
              <p className="text-purple-700 font-medium">Quyết định chính thức:</p>
              <p className="text-purple-800 bg-purple-100 p-3 rounded mt-1">
                {thirdParty.evidence.officialDecision}
              </p>
            </div>
          )}
          {thirdParty.evidence.documents?.length > 0 && (
            <p className="text-purple-700 mt-2">
              Tài liệu đính kèm: {thirdParty.evidence.documents.length} file(s)
            </p>
          )}
          {thirdParty.evidence.photos?.length > 0 && (
            <p className="text-purple-700 mt-1">
              Hình ảnh: {thirdParty.evidence.photos.length} ảnh
            </p>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <ThirdPartyUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          dispute={dispute}
        />
      )}
    </div>
  );
};

const ThirdPartyUploadModal = ({ isOpen, onClose, dispute }) => {
  const [formData, setFormData] = useState({
    officialDecision: '',
    documents: [],
    photos: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const { uploadThirdPartyEvidence, loadDisputeDetail } = useDispute();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.officialDecision.trim()) {
      toast.error('Vui lòng nhập quyết định chính thức');
      return;
    }

    setIsLoading(true);
    try {
      await uploadThirdPartyEvidence(dispute._id, formData);
      toast.success('Upload bằng chứng thành công');
      await loadDisputeDetail(dispute._id);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Có lỗi khi upload bằng chứng');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Upload bằng chứng bên thứ 3
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="officialDecision" className="block text-sm font-medium text-gray-700 mb-2">
              Quyết định chính thức từ bên thứ 3 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="officialDecision"
              rows={4}
              value={formData.officialDecision}
              onChange={(e) => setFormData({...formData, officialDecision: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nhập quyết định chính thức từ bên thứ 3..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {isLoading ? 'Đang upload...' : 'Upload bằng chứng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ThirdPartySection;