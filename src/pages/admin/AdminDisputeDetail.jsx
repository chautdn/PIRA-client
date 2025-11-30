import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispute } from '../../context/DisputeContext';
import { useAuth } from '../../hooks/useAuth';
import disputeApi from '../../services/dispute.Api';
import { toast } from 'react-hot-toast';
import {
  getDisputeStatusColor,
  getDisputeStatusText,
  getDisputeTypeText,
  formatDate
} from '../../utils/disputeHelpers';
import AdminResponseModal from '../../components/dispute/AdminResponseModal';
import AdminFinalProcessModal from '../../components/dispute/AdminFinalProcessModal';
import NegotiationRoom from '../../components/dispute/NegotiationRoom';
import ThirdPartySection from '../../components/dispute/ThirdPartySection';

const AdminDisputeDetail = () => {
  const { disputeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentDispute, isLoading, loadDisputeDetail } = useDispute();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showFinalProcessModal, setShowFinalProcessModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (disputeId) {
      loadDisputeDetail(disputeId);
    }
  }, [disputeId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentDispute) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Không tìm thấy tranh chấp</p>
        </div>
      </div>
    );
  }

  const dispute = currentDispute;
  const canReview = dispute.status === 'RESPONDENT_REJECTED';
  const canProcessNegotiationResult = dispute.status === 'NEGOTIATION_AGREED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {dispute.disputeId}
            </h1>
            <p className="text-sm text-gray-600">{dispute.title}</p>
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getDisputeStatusColor(dispute.status)}`}>
              {getDisputeStatusText(dispute.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Loại tranh chấp</p>
            <p className="font-medium text-gray-900">{getDisputeTypeText(dispute.type)}</p>
          </div>
          <div>
            <p className="text-gray-600">Loại vận chuyển</p>
            <p className="font-medium text-gray-900">
              {dispute.shipmentType === 'DELIVERY' ? 'Giao hàng' : 'Trả hàng'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Ngày tạo</p>
            <p className="font-medium text-gray-900">{formatDate(dispute.createdAt)}</p>
          </div>
          <div>
            <p className="text-gray-600">Admin phụ trách</p>
            <p className="font-medium text-gray-900">
              {dispute.assignedAdmin?.profile?.fullName || 'Chưa phân công'}
            </p>
          </div>
        </div>

        {canReview && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => setShowAdminModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
            >
              Đưa ra quyết định sơ bộ
            </button>
          </div>
        )}
        
        {canProcessNegotiationResult && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => setShowFinalProcessModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              Xử lý kết quả đàm phán
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Tổng quan
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'evidence'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Bằng chứng
            </button>
            <button
              onClick={() => setActiveTab('parties')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'parties'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Các bên liên quan
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'timeline'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Lịch sử
            </button>
            {(dispute.status === 'THIRD_PARTY_ESCALATED' || 
              dispute.status === 'THIRD_PARTY_EVIDENCE_UPLOADED' ||
              dispute.thirdPartyResolution) && (
              <button
                onClick={() => setActiveTab('thirdparty')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'thirdparty'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Bên thứ 3
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Mô tả</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{dispute.description}</p>
              </div>

              {/* Product Info */}
              {dispute.subOrder && dispute.subOrder.products && dispute.subOrder.products[dispute.productIndex] && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Thông tin sản phẩm</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {(() => {
                      const productData = dispute.subOrder.products[dispute.productIndex];
                      const product = productData?.product;
                      
                      // Get image URL - handle both string and object format
                      const getImageUrl = () => {
                        if (!product?.images?.[0]) return null;
                        const firstImage = product.images[0];
                        return typeof firstImage === 'string' ? firstImage : firstImage?.url;
                      };
                      
                      // Get deposit amount - handle both number and object format
                      const getDepositAmount = () => {
                        if (productData?.totalDeposit) return productData.totalDeposit;
                        if (product?.pricing?.deposit) {
                          const deposit = product.pricing.deposit;
                          return typeof deposit === 'number' ? deposit : deposit?.amount;
                        }
                        return null;
                      };
                      
                      return (
                        <div className="flex gap-4">
                          {getImageUrl() ? (
                            <img 
                              src={getImageUrl()} 
                              alt={product.title || product.name || 'Product'}
                              className="w-24 h-24 object-cover rounded-lg border"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-gray-200 rounded-lg border flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No image</span>
                            </div>
                          )}
                          <div className="flex-1 space-y-2">
                            <p className="font-semibold text-gray-900">{product?.title || product?.name || 'Không có tên sản phẩm'}</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                              <div>
                                <span className="text-gray-600">Số lượng:</span>
                                <span className="ml-2 font-medium">{productData?.quantity || 0}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Giá thuê/ngày:</span>
                                <span className="ml-2 font-medium">
                                  {product?.pricing?.dailyRate 
                                    ? `${product.pricing.dailyRate.toLocaleString('vi-VN')}đ` 
                                    : 'Chưa có'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Tiền cọc:</span>
                                <span className="ml-2 font-medium">
                                  {getDepositAmount()
                                    ? `${getDepositAmount().toLocaleString('vi-VN')}đ` 
                                    : 'Chưa có'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Chủ hàng:</span>
                                <span className="ml-2 font-medium">{dispute.subOrder.owner?.profile?.fullName || 'Không rõ'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Rental Order Info */}
              {dispute.subOrder && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Thông tin đơn thuê</h3>
                  <div className="bg-blue-50 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Mã SubOrder</p>
                      <p className="font-medium text-gray-900 font-mono text-xs break-all">
                        {dispute.subOrder.subOrderId || dispute.subOrder._id || 'Không có'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Người thuê</p>
                      <p className="font-medium text-gray-900">
                        {dispute.subOrder.masterOrder?.renter?.profile?.fullName || 'Không rõ'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Ngày bắt đầu thuê</p>
                      <p className="font-medium text-gray-900">
                        {(() => {
                          const productData = dispute.subOrder.products?.[dispute.productIndex];
                          const startDate = productData?.rentalPeriod?.startDate || dispute.subOrder.rentalPeriod?.startDate;
                          return startDate ? formatDate(startDate) : 'Chưa có';
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Ngày kết thúc thuê</p>
                      <p className="font-medium text-gray-900">
                        {(() => {
                          const productData = dispute.subOrder.products?.[dispute.productIndex];
                          const endDate = productData?.rentalPeriod?.endDate || dispute.subOrder.rentalPeriod?.endDate;
                          return endDate ? formatDate(endDate) : 'Chưa có';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Respondent Response */}
              {dispute.respondentResponse && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Phản hồi từ bên bị khiếu nại</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Quyết định:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        dispute.respondentResponse.decision === 'ACCEPTED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {dispute.respondentResponse.decision === 'ACCEPTED' ? 'Chấp nhận' : 'Từ chối'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Lý do:</p>
                      <p className="text-sm text-gray-600">{dispute.respondentResponse.reason}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Phản hồi lúc: {formatDate(dispute.respondentResponse.respondedAt)}
                    </p>
                  </div>
                </div>
              )}

              {/* Admin Decision */}
              {dispute.adminDecision && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Quyết định của Admin</h3>
                  <div className="bg-purple-50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Quyết định:</p>
                      <p className="text-sm text-gray-900 font-semibold">
                        {dispute.adminDecision.decision === 'COMPLAINANT_RIGHT' 
                          ? '✅ Người khiếu nại đúng' 
                          : '✅ Bên bị khiếu nại đúng'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Lý do:</p>
                      <p className="text-sm text-gray-600">{dispute.adminDecision.reasoning}</p>
                    </div>
                    {dispute.adminDecision.refundAmount > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Số tiền hoàn:</p>
                        <p className="text-sm text-gray-900 font-semibold">
                          {dispute.adminDecision.refundAmount.toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    )}
                    {dispute.adminDecision.penaltyAmount > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Số tiền phạt:</p>
                        <p className="text-sm text-red-600 font-semibold">
                          {dispute.adminDecision.penaltyAmount.toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 pt-2 border-t">
                      Quyết định lúc: {formatDate(dispute.adminDecision.decidedAt)}
                    </p>

                    {/* Response Status */}
                    {dispute.status === 'ADMIN_DECISION_MADE' && (
                      <div className="pt-3 border-t space-y-2">
                        <p className="text-sm font-medium text-gray-700">Trạng thái phản hồi:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className={`p-2 rounded ${
                            dispute.adminDecision.complainantAccepted === true 
                              ? 'bg-green-100 border border-green-300' 
                              : dispute.adminDecision.complainantAccepted === false 
                              ? 'bg-red-100 border border-red-300'
                              : 'bg-gray-100 border border-gray-300'
                          }`}>
                            <p className="text-xs font-medium text-gray-700">Người khiếu nại:</p>
                            <p className="text-xs font-semibold">
                              {dispute.adminDecision.complainantAccepted === true 
                                ? '✅ Đã đồng ý' 
                                : dispute.adminDecision.complainantAccepted === false 
                                ? '❌ Không đồng ý'
                                : '⏳ Chờ phản hồi'}
                            </p>
                          </div>
                          <div className={`p-2 rounded ${
                            dispute.adminDecision.respondentAccepted === true 
                              ? 'bg-green-100 border border-green-300' 
                              : dispute.adminDecision.respondentAccepted === false 
                              ? 'bg-red-100 border border-red-300'
                              : 'bg-gray-100 border border-gray-300'
                          }`}>
                            <p className="text-xs font-medium text-gray-700">Bên bị khiếu nại:</p>
                            <p className="text-xs font-semibold">
                              {dispute.adminDecision.respondentAccepted === true 
                                ? '✅ Đã đồng ý' 
                                : dispute.adminDecision.respondentAccepted === false 
                                ? '❌ Không đồng ý'
                                : '⏳ Chờ phản hồi'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Evidence Tab */}
          {activeTab === 'evidence' && (
            <div className="space-y-6">
              {/* Complainant Evidence */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Bằng chứng từ người khiếu nại ({dispute.complainant?.profile?.fullName})
                </h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  {dispute.evidence?.description && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Mô tả:</p>
                      <p className="text-sm text-gray-600">{dispute.evidence.description}</p>
                    </div>
                  )}
                  {dispute.evidence?.photos?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Hình ảnh ({dispute.evidence.photos.length}):</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {dispute.evidence.photos.map((photo, idx) => (
                          <div 
                            key={idx} 
                            className="relative group cursor-pointer"
                            onClick={() => window.open(photo, '_blank')}
                          >
                            <img
                              src={photo}
                              alt={`Evidence ${idx + 1}`}
                              className="w-full h-32 object-cover rounded border hover:border-blue-500 transition"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded flex items-center justify-center pointer-events-none">
                              <span className="text-white text-sm opacity-0 group-hover:opacity-100">
                                🔍 Xem chi tiết
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {dispute.evidence?.videos?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Video ({dispute.evidence.videos.length}):</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {dispute.evidence.videos.map((video, idx) => (
                          <div key={idx}>
                            <video
                              controls
                              className="w-full rounded border"
                              style={{ maxHeight: '250px' }}
                            >
                              <source src={video} type="video/mp4" />
                              Trình duyệt không hỗ trợ video.
                            </video>
                            <p className="text-xs text-gray-500 mt-1 text-center">Video {idx + 1}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(!dispute.evidence?.photos || dispute.evidence.photos.length === 0) && 
                   (!dispute.evidence?.videos || dispute.evidence.videos.length === 0) && (
                    <p className="text-sm text-gray-500">Không có bằng chứng hình ảnh/video</p>
                  )}
                </div>
              </div>

              {/* Respondent Evidence */}
              {dispute.respondentResponse?.evidence && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Bằng chứng từ bên bị khiếu nại ({dispute.respondent?.profile?.fullName})
                  </h3>
                  <div className="bg-orange-50 rounded-lg p-4">
                    {dispute.respondentResponse.evidence.description && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Mô tả:</p>
                        <p className="text-sm text-gray-600">{dispute.respondentResponse.evidence.description}</p>
                      </div>
                    )}
                    {dispute.respondentResponse.evidence.photos?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Hình ảnh ({dispute.respondentResponse.evidence.photos.length}):
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {dispute.respondentResponse.evidence.photos.map((photo, idx) => (
                            <div 
                              key={idx} 
                              className="relative group cursor-pointer"
                              onClick={() => window.open(photo, '_blank')}
                            >
                              <img
                                src={photo}
                                alt={`Response Evidence ${idx + 1}`}
                                className="w-full h-32 object-cover rounded border hover:border-orange-500 transition"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded flex items-center justify-center pointer-events-none">
                                <span className="text-white text-sm opacity-0 group-hover:opacity-100">
                                  🔍 Xem chi tiết
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {dispute.respondentResponse.evidence.videos?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Video ({dispute.respondentResponse.evidence.videos.length}):
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {dispute.respondentResponse.evidence.videos.map((video, idx) => (
                            <div key={idx}>
                              <video
                                controls
                                className="w-full rounded border"
                                style={{ maxHeight: '250px' }}
                              >
                                <source src={video} type="video/mp4" />
                                Trình duyệt không hỗ trợ video.
                              </video>
                              <p className="text-xs text-gray-500 mt-1 text-center">Video {idx + 1}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(!dispute.respondentResponse.evidence.photos || 
                      dispute.respondentResponse.evidence.photos.length === 0) &&
                     (!dispute.respondentResponse.evidence.videos || 
                      dispute.respondentResponse.evidence.videos.length === 0) && (
                      <p className="text-sm text-gray-500">Không có bằng chứng hình ảnh/video</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Parties Tab */}
          {activeTab === 'parties' && (
            <div className="space-y-4">
              {/* Complainant */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Người khiếu nại <span className="text-sm font-normal text-gray-600">(Chủ hàng)</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Tên:</span> {dispute.complainant?.profile?.fullName || 'N/A'}</p>
                  <p><span className="font-medium">Email:</span> {dispute.complainant?.email || 'N/A'}</p>
                  <p><span className="font-medium">Số điện thoại:</span> {dispute.complainant?.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Respondent */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Bên bị khiếu nại <span className="text-sm font-normal text-gray-600">(Người thuê)</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Tên:</span> {dispute.respondent?.profile?.fullName || 'N/A'}</p>
                  <p><span className="font-medium">Email:</span> {dispute.respondent?.email || 'N/A'}</p>
                  <p><span className="font-medium">Số điện thoại:</span> {dispute.respondent?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {dispute.timeline?.map((event, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1 pb-4 border-b border-gray-200 last:border-0">
                    <p className="font-medium text-gray-900">{event.action}</p>
                    <p className="text-sm text-gray-600 mt-1">{event.details}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(event.timestamp)}</p>
                  </div>
                </div>
              ))}
              {(!dispute.timeline || dispute.timeline.length === 0) && (
                <p className="text-sm text-gray-500">Không có lịch sử</p>
              )}
            </div>
          )}

          {/* Third Party Tab */}
          {activeTab === 'thirdparty' && (
            <ThirdPartySection dispute={dispute} isAdmin={true} />
          )}
        </div>
      </div>

      {/* Admin Response Modal */}
      <AdminResponseModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        dispute={dispute}
        onSubmit={async (data) => {
          try {
            await disputeApi.adminReview(disputeId, data);
            toast.success('Đã đưa ra quyết định thành công');
            setShowAdminModal(false);
            // Reload dispute detail
            loadDisputeDetail(disputeId);
          } catch (error) {
            console.error('Admin review error:', error);
            toast.error(error.response?.data?.message || 'Không thể gửi quyết định');
          }
        }}
      />

      {/* Admin Final Process Modal */}
      <AdminFinalProcessModal
        isOpen={showFinalProcessModal}
        onClose={() => setShowFinalProcessModal(false)}
        dispute={dispute}
      />
    </div>
  );
};

export default AdminDisputeDetail;
