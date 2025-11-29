import { useState } from 'react';
import { useDispute } from '../../context/DisputeContext';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/disputeHelpers';
import AdminThirdPartyFinalDecisionModal from './AdminThirdPartyFinalDecisionModal';

const ThirdPartySection = ({ dispute, isAdmin = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAdminFinalDecisionModal, setShowAdminFinalDecisionModal] = useState(false);
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
  const sharedData = thirdParty?.sharedData;
  const isShipperInfoShared = sharedData?.sharedAt;
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
            Cần chia sẻ thông tin của renter và owner gửi lại cho renter và owner để biết, giúp họ có thể upload kết quả từ bên thứ 3.
          </p>
          <button
            onClick={handleShareShipperInfo}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {isLoading ? 'Đang chia sẻ...' : 'Chia sẻ thông tin các bên'}
          </button>
        </div>
      )}

      {/* Shared info status */}
      {isShipperInfoShared && sharedData && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4 space-y-4">
          <div>
            <p className="text-green-800 font-semibold mb-2">
              ✅ Admin đã chia sẻ thông tin để chuẩn bị cho bên thứ 3
            </p>
            <p className="text-green-700 text-sm">
              Thời gian chia sẻ: {formatDate(sharedData.sharedAt)}
            </p>
          </div>

          {/* Thông tin cá nhân 2 bên */}
          {sharedData.partyInfo && (
            <div className="bg-white p-4 rounded border border-green-300 space-y-3">
              <h4 className="font-semibold text-green-900">📋 Thông tin các bên liên quan</h4>
              <p className="text-xs text-gray-600">
                Thông tin này đã được chia sẻ cho cả hai bên để họ có thể liên hệ với nhau và chuẩn bị tài liệu cho bên thứ 3.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Complainant */}
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-blue-600 font-medium mb-2">
                    {dispute.shipmentType === 'DELIVERY' ? 'NGƯỜI THUÊ (Chủ hàng)' : 'CHỦ HÀNG (Người thuê)'}
                  </p>
                  <div className="text-sm space-y-1">
                    <p><strong>Tên:</strong> {sharedData.partyInfo.complainant.name}</p>
                    <p><strong>Email:</strong> {sharedData.partyInfo.complainant.email}</p>
                    <p><strong>Số điện thoại:</strong> {sharedData.partyInfo.complainant.phone}</p>
                  </div>
                </div>

                {/* Respondent */}
                <div className="bg-orange-50 p-3 rounded">
                  <p className="text-xs text-orange-600 font-medium mb-2">
                    {dispute.shipmentType === 'DELIVERY' ? 'CHỦ HÀNG (Người thuê)' : 'NGƯỜI THUÊ (Chủ hàng)'}
                  </p>
                  <div className="text-sm space-y-1">
                    <p><strong>Tên:</strong> {sharedData.partyInfo.respondent.name}</p>
                    <p><strong>Email:</strong> {sharedData.partyInfo.respondent.email}</p>
                    <p><strong>Số điện thoại:</strong> {sharedData.partyInfo.respondent.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 p-3 rounded border border-yellow-300">
            <p className="text-yellow-800 text-sm">
              💡 <strong>Hướng dẫn:</strong> Sử dụng thông tin trên để liên hệ với bên kia nếu cần thiết. 
              Sau khi nhận được kết quả từ bên thứ 3, vui lòng upload bằng chứng bên dưới trước hạn <strong>{formatDate(evidenceDeadline)}</strong>.
            </p>
          </div>
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
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 space-y-4">
          <p className="text-purple-800 mb-2">
            <strong>📋 Đã upload bằng chứng:</strong> {formatDate(thirdParty.evidence.uploadedAt)}
          </p>
          <p className="text-purple-700 text-sm">
            <strong>Người upload:</strong> {thirdParty.evidence.uploadedBy?.profile?.fullName || 'N/A'}
          </p>
          
          {thirdParty.evidence.officialDecision && (
            <div className="mt-3">
              <p className="text-purple-700 font-medium mb-2">Quyết định chính thức từ bên thứ 3:</p>
              <p className="text-purple-800 bg-purple-100 p-3 rounded whitespace-pre-wrap">
                {thirdParty.evidence.officialDecision}
              </p>
            </div>
          )}
          
          {/* Thông tin bên thứ 3 */}
          {thirdParty.thirdPartyInfo && (
            <div className="mt-3 bg-white p-3 rounded border border-purple-300">
              <p className="text-purple-700 font-medium mb-2">Thông tin bên thứ 3:</p>
              <div className="text-sm space-y-1">
                <p><strong>Tên:</strong> {thirdParty.thirdPartyInfo.name}</p>
                <p><strong>Liên hệ:</strong> {thirdParty.thirdPartyInfo.contactInfo}</p>
                <p><strong>Mã hồ sơ:</strong> {thirdParty.thirdPartyInfo.caseNumber}</p>
              </div>
            </div>
          )}
          
          {/* Hình ảnh bằng chứng */}
          {thirdParty.evidence.photos?.length > 0 && (
            <div className="mt-3">
              <p className="text-purple-700 font-medium mb-2">
                Hình ảnh bằng chứng ({thirdParty.evidence.photos.length} ảnh):
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {thirdParty.evidence.photos.map((photo, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={photo}
                      alt={`Third party evidence ${idx + 1}`}
                      className="w-full h-40 object-cover rounded border-2 border-purple-300 cursor-pointer hover:border-purple-500 transition"
                      onClick={() => window.open(photo, '_blank')}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                      Ảnh {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-purple-600 mt-2">💡 Click vào ảnh để xem chi tiết</p>
            </div>
          )}
          
          {/* Tài liệu đính kèm */}
          {thirdParty.evidence.documents?.length > 0 && (
            <div className="mt-3">
              <p className="text-purple-700 font-medium mb-2">
                Tài liệu đính kèm ({thirdParty.evidence.documents.length} file):
              </p>
              <div className="space-y-2">
                {thirdParty.evidence.documents.map((doc, idx) => (
                  <a
                    key={idx}
                    href={doc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-white rounded border border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition text-sm"
                  >
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-purple-700">Tài liệu {idx + 1}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin button: Đưa ra quyết định cuối */}
      {isAdmin && isEvidenceUploaded && dispute.status === 'THIRD_PARTY_EVIDENCE_UPLOADED' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 mb-3">
            <strong>✅ Đã nhận được kết quả từ bên thứ 3.</strong> Admin có thể đưa ra quyết định cuối cùng dựa trên bằng chứng trên.
          </p>
          <button
            onClick={() => setShowAdminFinalDecisionModal(true)}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
          >
            Đưa ra quyết định cuối cùng
          </button>
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

      {/* Admin Final Decision Modal */}
      {showAdminFinalDecisionModal && (
        <AdminThirdPartyFinalDecisionModal
          isOpen={showAdminFinalDecisionModal}
          onClose={() => setShowAdminFinalDecisionModal(false)}
          dispute={dispute}
          onSuccess={() => {
            loadDisputeDetail(dispute._id);
          }}
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