import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispute } from '../../context/DisputeContext';
import { useAuth } from '../../hooks/useAuth';
import useDisputeSocket from '../../hooks/useDisputeSocket';
import disputeApi from '../../services/dispute.Api';
import { 
  ChevronLeft, Package, Truck, Calendar, User, FileText, 
  Camera, Users, Clock, Scale, MessageSquare, CheckCircle, 
  XCircle, AlertTriangle, Image as ImageIcon, Mail, Phone, FileCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getDisputeStatusColor,
  getDisputeStatusText,
  getDisputeTypeText,
  formatDate
} from '../../utils/disputeHelpers';
import AdminResponseModal from '../../components/dispute/AdminResponseModal';
import AdminFinalProcessModal from '../../components/dispute/AdminFinalProcessModal';
import AdminOwnerDisputeFinalModal from '../../components/dispute/AdminOwnerDisputeFinalModal';
import ShipperDamageResolveModal from '../../components/dispute/ShipperDamageResolveModal';
import NegotiationRoom from '../../components/dispute/NegotiationRoom';
import ThirdPartySection from '../../components/dispute/ThirdPartySection';
import AdminProcessPayment from '../../components/dispute/AdminProcessPayment';

// Map dispute type codes to Vietnamese text
const disputeTypeMap = {
  'PRODUCT_NOT_AS_DESCRIBED': 'Không đúng mô tả',
  'MISSING_ITEMS': 'Thiếu hàng',
  'DAMAGED_BY_SHIPPER': 'Shipper làm hỏng',
  'DELIVERY_FAILED_RENTER': 'Renter không nhận hàng',
  'PRODUCT_DEFECT': 'Sản phẩm lỗi',
  'DAMAGED_ON_RETURN': 'Hư hỏng khi trả',
  'LATE_RETURN': 'Trả hàng trễ',
  'RETURN_FAILED_OWNER': 'Owner không nhận hàng',
  'RENTER_NO_RETURN': 'Renter không trả hàng',
  'OTHER': 'Khác'
};

// Helper function to convert timeline action to Vietnamese text
const getTimelineActionText = (action) => {
  const actionMap = {
    // Dispute lifecycle
    'DISPUTE_CREATED': 'Tạo khiếu nại',
    'CREATED': 'Tạo khiếu nại',
    
    // Respondent actions
    'RESPONDENT_ACCEPTED': 'Bên bị khiếu nại chấp nhận',
    'RESPONDENT_REJECTED': 'Bên bị khiếu nại từ chối',
    'RESPONDENT_RESPONSE': 'Bên bị khiếu nại phản hồi',
    
    // Negotiation
    'NEGOTIATION_STARTED': 'Bắt đầu thương lượng',
    'NEGOTIATION_MESSAGE': 'Tin nhắn thương lượng',
    'NEGOTIATION_OFFER': 'Đề xuất thương lượng',
    'NEGOTIATION_COUNTER_OFFER': 'Đề xuất phản hồi',
    'NEGOTIATION_OFFER_ACCEPTED': 'Chấp nhận đề xuất',
    'NEGOTIATION_OFFER_REJECTED': 'Từ chối đề xuất',
    'NEGOTIATION_AGREED': 'Thương lượng thành công',
    'NEGOTIATION_FAILED': 'Thương lượng thất bại',
    
    // Escalation
    'ESCALATED_TO_ADMIN': 'Chuyển cho Admin xử lý',
    'ESCALATED_TO_THIRD_PARTY': 'Chuyển cho bên thứ 3',
    'USER_ESCALATED_TO_THIRD_PARTY': 'Người dùng chuyển lên bên thứ 3',
    'AUTO_ESCALATED_TO_THIRD_PARTY': 'Tự động chuyển lên bên thứ 3',
    
    // Third party
    'THIRD_PARTY_EVIDENCE_UPLOADED': 'Upload bằng chứng bên thứ 3',
    'THIRD_PARTY_REVIEW': 'Bên thứ 3 đang xem xét',
    
    // Admin actions
    'ADMIN_REVIEW': 'Admin đang xem xét',
    'ADMIN_DECISION': 'Admin đưa ra quyết định',
    'ADMIN_DECISION_MADE': 'Admin đã quyết định',
    'ADMIN_FINAL_DECISION': 'Admin quyết định cuối cùng',
    'ADMIN_SHARED_PARTY_INFO': 'Admin chia sẻ thông tin các bên',
    'ADMIN_ASSIGNED': 'Admin được giao xử lý',
    
    // Resolution
    'RESOLVED': 'Đã giải quyết',
    'RESOLVED_POLICE_HANDOVER': 'Chuyển công an xử lý',
    'CLOSED': 'Đã đóng',
    'CANCELLED': 'Đã hủy',
    
    // Evidence
    'EVIDENCE_UPLOADED': 'Upload bằng chứng',
    'EVIDENCE_ADDED': 'Thêm bằng chứng mới',
    
    // Renter specific
    'RENTER_RESCHEDULE_PROPOSED': 'Renter đề xuất đổi lịch',
    'RENTER_RESCHEDULE_APPROVED': 'Duyệt đề xuất đổi lịch',
    'RENTER_RESCHEDULE_REJECTED': 'Từ chối đề xuất đổi lịch',
    
    // Payment
    'PAYMENT_PROCESSED': 'Đã xử lý thanh toán',
    'REFUND_PROCESSED': 'Đã xử lý hoàn tiền',
    'COMPENSATION_PAID': 'Đã chi trả bồi thường',
  };
  
  return actionMap[action] || action;
};

// Helper function to format timeline details with translated dispute types
const formatTimelineDetails = (details) => {
  if (!details) return '';
  
  let formattedDetails = details;
  
  // Replace dispute type codes with Vietnamese text
  Object.entries(disputeTypeMap).forEach(([code, text]) => {
    formattedDetails = formattedDetails.replace(new RegExp(code, 'g'), text);
  });
  
  return formattedDetails;
};

const AdminDisputeDetail = () => {
  const { disputeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentDispute, isLoading, loadDisputeDetail } = useDispute();
  
  // Initialize socket for realtime updates with custom callbacks
  const { isConnected } = useDisputeSocket({
    onNewEvidence: (data) => {
      // Reload dispute detail when new evidence is uploaded
      const dataDisputeId = data.disputeId?.toString();
      const dataDisputeNumber = data.disputeNumber?.toString();
      const currentId = currentDispute?._id?.toString();
      
      console.log('📡 [Socket] onNewEvidence received:', { dataDisputeId, dataDisputeNumber, disputeId, currentId });
      
      if (disputeId && (dataDisputeId === disputeId || dataDisputeNumber === disputeId || currentId === dataDisputeId)) {
        console.log('📡 [Socket] New evidence matched, reloading dispute detail...');
        loadDisputeDetail(disputeId);
        toast.info('Có bằng chứng mới được upload!', { duration: 4000 });
      }
    },
    onDisputeStatusChanged: (data) => {
      // Reload dispute detail when status changes
      const dataDisputeId = data.disputeId?.toString();
      const dataDisputeNumber = data.disputeNumber?.toString();
      const currentId = currentDispute?._id?.toString();
      
      console.log('📡 [Socket] onDisputeStatusChanged received:', { dataDisputeId, dataDisputeNumber, disputeId, currentId, status: data.status });
      
      if (disputeId && (dataDisputeId === disputeId || dataDisputeNumber === disputeId || currentId === dataDisputeId)) {
        console.log('📡 [Socket] Status changed matched, reloading dispute detail...');
        loadDisputeDetail(disputeId);
      }
    },
    onDisputeCompleted: (data) => {
      // Reload dispute detail when dispute is completed
      const dataDisputeId = data.disputeId?.toString();
      const dataDisputeNumber = data.disputeNumber?.toString();
      const currentId = currentDispute?._id?.toString();
      
      console.log('📡 [Socket] onDisputeCompleted received:', { dataDisputeId, dataDisputeNumber, disputeId, currentId });
      
      if (disputeId && (dataDisputeId === disputeId || dataDisputeNumber === disputeId || currentId === dataDisputeId)) {
        console.log('📡 [Socket] Dispute completed matched, reloading dispute detail...');
        loadDisputeDetail(disputeId);
        toast.success('Khiếu nại đã được giải quyết!', { duration: 4000 });
      }
    }
  });
  
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showFinalProcessModal, setShowFinalProcessModal] = useState(false);
  const [showOwnerDisputeFinalModal, setShowOwnerDisputeFinalModal] = useState(false);
  const [showShipperDamageModal, setShowShipperDamageModal] = useState(false);
  const [showRejectEvidenceModal, setShowRejectEvidenceModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (disputeId) {
      loadDisputeDetail(disputeId);
    }
  }, [disputeId]);

  // Listen for reject evidence modal trigger from AdminOwnerDisputeFinalModal
  useEffect(() => {
    const handleOpenRejectModal = () => {
      setShowRejectEvidenceModal(true);
    };

    window.addEventListener('openRejectEvidenceModal', handleOpenRejectModal);
    
    return () => {
      window.removeEventListener('openRejectEvidenceModal', handleOpenRejectModal);
    };
  }, []);

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
  const canProcessNegotiationResult = dispute.status === 'NEGOTIATION_AGREED' && dispute.shipmentType === 'DELIVERY'; // Chỉ cho Renter Dispute
  const canProcessOwnerDisputeResult = (dispute.status === 'THIRD_PARTY_EVIDENCE_UPLOADED' || dispute.status === 'NEGOTIATION_AGREED') && dispute.shipmentType === 'RETURN'; // Owner Dispute - đàm phán hoặc bên thứ 3
  const canProcessRenterDisputeResult = dispute.status === 'THIRD_PARTY_EVIDENCE_UPLOADED' && dispute.shipmentType === 'DELIVERY';
  const canProcessThirdPartyEvidence = dispute.status === 'THIRD_PARTY_EVIDENCE_UPLOADED'; // For both DELIVERY and RETURN
  const canResolveShipperDamage = dispute.status === 'ADMIN_REVIEW' && dispute.type === 'DAMAGED_BY_SHIPPER';
  const canProcessPayment = dispute.status === 'RESPONDENT_ACCEPTED' && dispute.repairCost > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/admin/disputes')}
                className="text-white/80 hover:text-white transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-white">{dispute.disputeId}</h1>
            </div>
            <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${getDisputeStatusColor(dispute.status)}`}>
              {getDisputeStatusText(dispute.status)}
            </span>
          </div>
        </div>
        
        {/* Quick Info Bar */}
        <div className="px-6 py-3 bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{getDisputeTypeText(dispute.type)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{dispute.shipmentType === 'DELIVERY' ? 'Giao hàng' : 'Trả hàng'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{formatDate(dispute.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{dispute.assignedAdmin?.profile?.fullName || 'Chưa phân công'}</span>
          </div>
        </div>

        {/* Shipper Damage Resolution */}
        {canResolveShipperDamage && (
          <div className="mt-4 pt-4 border-t">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Tranh chấp lỗi vận chuyển
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Đây là tranh chấp về hư hỏng trong quá trình vận chuyển. 
                      Cần thu thập bằng chứng từ shipper và đơn vị vận chuyển để xử lý.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowShipperDamageModal(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
            >
              Xử lý tranh chấp lỗi shipper
            </button>
          </div>
        )}

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
              Xử lý kết quả đàm phán ({dispute.shipmentType === 'DELIVERY' ? 'Renter Dispute' : 'Owner Dispute'})
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex min-w-max -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1" /> Tổng quan
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'evidence'
                  ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Camera className="w-4 h-4 inline mr-1" /> Bằng chứng
            </button>
            <button
              onClick={() => setActiveTab('parties')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'parties'
                  ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1" /> Các bên
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'timeline'
                  ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-1" /> Lịch sử
            </button>
            {(dispute.status === 'THIRD_PARTY_ESCALATED' || 
              dispute.status === 'THIRD_PARTY_EVIDENCE_UPLOADED' ||
              dispute.thirdPartyResolution) && (
              <button
                onClick={() => setActiveTab('thirdparty')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === 'thirdparty'
                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Scale className="w-4 h-4 inline mr-1" /> Bên thứ 3
              </button>
            )}
          </nav>
        </div>

        <div className="p-5">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Column */}
              <div className="space-y-5">
                {/* Admin Process Payment */}
                {canProcessPayment && (
                  <AdminProcessPayment 
                    dispute={dispute}
                    onUpdate={() => loadDisputeDetail(disputeId)}
                  />
                )}

                {/* Description */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" /> Mô tả vấn đề
                  </h3>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{dispute.description || 'Không có mô tả'}</p>
                </div>

                {/* Product Info */}
                {dispute.subOrder?.products?.[dispute.productIndex] && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" /> Sản phẩm liên quan
                    </h3>
                    {(() => {
                      const productData = dispute.subOrder.products[dispute.productIndex];
                      const product = productData?.product;
                      
                      const getImageUrl = () => {
                        if (!product?.images?.[0]) return null;
                        const firstImage = product.images[0];
                        return typeof firstImage === 'string' ? firstImage : firstImage?.url;
                      };
                      
                      const getDepositAmount = () => {
                        if (productData?.totalDeposit) return productData.totalDeposit;
                        if (product?.pricing?.deposit) {
                          const deposit = product.pricing.deposit;
                          return typeof deposit === 'number' ? deposit : deposit?.amount;
                        }
                        return null;
                      };
                      
                      return (
                        <div className="flex gap-3">
                          {getImageUrl() ? (
                            <img 
                              src={getImageUrl()} 
                              alt={product?.title || product?.name || 'Product'}
                              className="w-20 h-20 object-cover rounded-lg border flex-shrink-0"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{product?.title || product?.name || 'Không có tên'}</p>
                            <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-500">
                              <span>SL: <span className="text-gray-700 font-medium">{productData?.quantity || 0}</span></span>
                              <span>Giá/ngày: <span className="text-gray-700 font-medium">{product?.pricing?.dailyRate?.toLocaleString('vi-VN')}đ</span></span>
                              <span>Tiền cọc: <span className="text-gray-700 font-medium">{getDepositAmount()?.toLocaleString('vi-VN')}đ</span></span>
                              <span>Chủ hàng: <span className="text-gray-700 font-medium">{dispute.subOrder?.owner?.profile?.fullName}</span></span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Rental Order Info */}
                {dispute.subOrder && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" /> Thông tin đơn thuê
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-500">Mã đơn</p>
                        <p className="font-mono text-gray-700 truncate">{dispute.subOrder.subOrderId || dispute.subOrder._id}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Người thuê</p>
                        <p className="font-medium text-gray-700">{dispute.subOrder.masterOrder?.renter?.profile?.fullName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Bắt đầu</p>
                        <p className="font-medium text-gray-700">
                          {formatDate(dispute.subOrder.products?.[dispute.productIndex]?.rentalPeriod?.startDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Kết thúc</p>
                        <p className="font-medium text-gray-700">
                          {formatDate(dispute.subOrder.products?.[dispute.productIndex]?.rentalPeriod?.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                {/* Respondent Response */}
                {dispute.respondentResponse?.decision && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-orange-500" /> Phản hồi từ bên bị khiếu nại
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded flex items-center gap-1 ${
                          dispute.respondentResponse.decision === 'ACCEPTED' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {dispute.respondentResponse.decision === 'ACCEPTED' 
                            ? <><CheckCircle className="w-3 h-3" /> Chấp nhận</> 
                            : <><XCircle className="w-3 h-3" /> Từ chối</>}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(dispute.respondentResponse.respondedAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600">{dispute.respondentResponse.reason}</p>
                    </div>
                  </div>
                )}

                {/* Admin Decision */}
                {dispute.adminDecision?.decidedAt && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-purple-500" /> Quyết định của Admin
                    </h3>
                    <div className="space-y-3">
                      {dispute.adminDecision.whoIsRight && (
                        <p className="text-sm font-medium text-gray-900">
                          {dispute.adminDecision.whoIsRight === 'COMPLAINANT_RIGHT' 
                            ? <><CheckCircle className="w-4 h-4 inline mr-1 text-green-500" /> Người khiếu nại đúng</> 
                            : <><CheckCircle className="w-4 h-4 inline mr-1 text-green-500" /> Bên bị khiếu nại đúng</>}
                        </p>
                      )}
                      {dispute.adminDecision.decision && (
                        <p className="text-sm text-gray-700 font-medium">{dispute.adminDecision.decision}</p>
                      )}
                      {dispute.adminDecision.reasoning && (
                        <p className="text-sm text-gray-600">{dispute.adminDecision.reasoning}</p>
                      )}
                      
                      {(dispute.adminDecision.refundAmount > 0 || dispute.adminDecision.penaltyAmount > 0) && (
                        <div className="flex gap-4 pt-2 border-t border-purple-200">
                          {dispute.adminDecision.refundAmount > 0 && (
                            <div className="text-xs">
                              <span className="text-gray-500">Hoàn tiền: </span>
                              <span className="font-semibold text-green-600">
                                {dispute.adminDecision.refundAmount.toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          )}
                          {dispute.adminDecision.penaltyAmount > 0 && (
                            <div className="text-xs">
                              <span className="text-gray-500">Phạt: </span>
                              <span className="font-semibold text-red-600">
                                {dispute.adminDecision.penaltyAmount.toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {dispute.status === 'ADMIN_DECISION_MADE' && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-200">
                          <div className={`p-2 rounded text-xs ${
                            dispute.adminDecision.complainantAccepted === true ? 'bg-green-100' 
                            : dispute.adminDecision.complainantAccepted === false ? 'bg-red-100' 
                            : 'bg-gray-100'
                          }`}>
                            <p className="text-gray-500">Người khiếu nại</p>
                            <p className="font-semibold flex items-center gap-1">
                              {dispute.adminDecision.complainantAccepted === true ? <><CheckCircle className="w-3 h-3 text-green-600" /> Đồng ý</>
                              : dispute.adminDecision.complainantAccepted === false ? <><XCircle className="w-3 h-3 text-red-600" /> Không đồng ý</>
                              : <><Clock className="w-3 h-3 text-gray-500" /> Chờ</>}
                            </p>
                          </div>
                          <div className={`p-2 rounded text-xs ${
                            dispute.adminDecision.respondentAccepted === true ? 'bg-green-100' 
                            : dispute.adminDecision.respondentAccepted === false ? 'bg-red-100' 
                            : 'bg-gray-100'
                          }`}>
                            <p className="text-gray-500">Bên bị khiếu nại</p>
                            <p className="font-semibold flex items-center gap-1">
                              {dispute.adminDecision.respondentAccepted === true ? <><CheckCircle className="w-3 h-3 text-green-600" /> Đồng ý</>
                              : dispute.adminDecision.respondentAccepted === false ? <><XCircle className="w-3 h-3 text-red-600" /> Không đồng ý</>
                              : <><Clock className="w-3 h-3 text-gray-500" /> Chờ</>}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {dispute.adminDecision.decidedAt && (
                        <p className="text-xs text-gray-400 pt-1">
                          Quyết định lúc: {formatDate(dispute.adminDecision.decidedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Evidence Tab */}
          {activeTab === 'evidence' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Complainant Evidence */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-500" /> Bằng chứng từ {dispute.complainant?.profile?.fullName}
                  <span className="text-xs font-normal text-gray-500">(Người khiếu nại)</span>
                </h3>
                
                {dispute.evidence?.description && (
                  <p className="text-sm text-gray-600 mb-3 p-2 bg-white rounded">{dispute.evidence.description}</p>
                )}
                
                {dispute.evidence?.photos?.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {dispute.evidence.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Evidence ${idx + 1}`}
                        onClick={() => window.open(photo, '_blank')}
                        className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition"
                      />
                    ))}
                  </div>
                )}
                
                {dispute.evidence?.videos?.length > 0 && (
                  <div className="space-y-2">
                    {dispute.evidence.videos.map((video, idx) => (
                      <video key={idx} controls className="w-full rounded border max-h-40">
                        <source src={video} type="video/mp4" />
                      </video>
                    ))}
                  </div>
                )}
                
                {!dispute.evidence?.photos?.length && !dispute.evidence?.videos?.length && (
                  <p className="text-sm text-gray-400 italic">Không có bằng chứng</p>
                )}
              </div>

              {/* Respondent Evidence */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-orange-500" /> Bằng chứng từ {dispute.respondent?.profile?.fullName}
                  <span className="text-xs font-normal text-gray-500">(Bên bị khiếu nại)</span>
                </h3>
                
                {dispute.respondentResponse?.evidence?.description && (
                  <p className="text-sm text-gray-600 mb-3 p-2 bg-white rounded">
                    {dispute.respondentResponse.evidence.description}
                  </p>
                )}
                
                {dispute.respondentResponse?.evidence?.photos?.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {dispute.respondentResponse.evidence.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Response Evidence ${idx + 1}`}
                        onClick={() => window.open(photo, '_blank')}
                        className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition"
                      />
                    ))}
                  </div>
                )}
                
                {dispute.respondentResponse?.evidence?.videos?.length > 0 && (
                  <div className="space-y-2">
                    {dispute.respondentResponse.evidence.videos.map((video, idx) => (
                      <video key={idx} controls className="w-full rounded border max-h-40">
                        <source src={video} type="video/mp4" />
                      </video>
                    ))}
                  </div>
                )}
                
                {!dispute.respondentResponse?.evidence && (
                  <p className="text-sm text-gray-400 italic">Chưa có phản hồi</p>
                )}
              </div>

              {/* Contract Section */}
              {dispute.subOrder?.contract && (
                <div className="bg-green-50 rounded-lg p-4 lg:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-green-600" /> Hợp đồng thuê sản phẩm
                  </h3>
                  
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Số hợp đồng: {dispute.subOrder.contract.contractNumber}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Trạng thái: 
                          <span className={`ml-1 px-2 py-0.5 rounded text-xs font-medium ${
                            dispute.subOrder.contract.status === 'SIGNED' || dispute.subOrder.contract.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : dispute.subOrder.contract.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {dispute.subOrder.contract.status === 'SIGNED' ? 'Đã ký'
                              : dispute.subOrder.contract.status === 'ACTIVE' ? 'Đang hiệu lực'
                              : dispute.subOrder.contract.status === 'COMPLETED' ? 'Hoàn thành'
                              : dispute.subOrder.contract.status === 'CANCELLED' ? 'Đã hủy'
                              : dispute.subOrder.contract.status === 'EXPIRED' ? 'Hết hạn'
                              : dispute.subOrder.contract.status === 'PENDING' ? 'Chờ xử lý'
                              : 'Khác'}
                          </span>
                        </p>
                        {dispute.subOrder.contract.terms && (
                          <div className="mt-2 flex gap-4 text-xs text-gray-600">
                            <p>Tiền cọc: <span className="font-medium">{dispute.subOrder.contract.terms.deposit?.toLocaleString('vi-VN')}đ</span></p>
                            <p>Tổng tiền: <span className="font-medium">{dispute.subOrder.contract.terms.totalAmount?.toLocaleString('vi-VN')}đ</span></p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {dispute.subOrder.contract.content?.pdfUrl && (
                          <a
                            href={dispute.subOrder.contract.content.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                          >
                            <FileText className="w-4 h-4" />
                            Xem PDF
                          </a>
                        )}
                        {dispute.subOrder.contract.content?.htmlContent && (
                          <button
                            onClick={() => {
                              let html = dispute.subOrder.contract.content.htmlContent;
                              const signatures = dispute.subOrder.contract.signatures;
                              
                              // Thêm CSS để ẩn phần chữ ký cũ
                              const hideOldSignatureCSS = `
                                <style>
                                  .signatures { display: none !important; }
                                </style>
                              `;
                              
                              // Chèn CSS vào head
                              if (html.includes('</head>')) {
                                html = html.replace('</head>', hideOldSignatureCSS + '</head>');
                              }
                              
                              // Tạo phần hiển thị chữ ký mới
                              let signatureImages = `
                                <div style="display: flex; justify-content: space-between; margin: 20px 40px; padding: 20px; border-top: 2px solid #333;">
                                  <div style="text-align: center; width: 45%;">
                                    <p style="font-weight: bold; color: #333;">BÊN CHO THUÊ</p>
                                    <p style="font-size: 12px; color: #666;">(Ký và ghi rõ họ tên)</p>
                                    ${signatures?.owner?.signed && signatures?.owner?.signature 
                                      ? `<img src="${signatures.owner.signature}" style="max-width: 200px; max-height: 100px; margin: 10px auto; display: block; border: 1px solid #ddd; padding: 5px; background: #fff;" alt="Owner Signature" />`
                                      : '<div style="width: 200px; height: 100px; border: 1px dashed #ccc; margin: 10px auto;"></div>'
                                    }
                                    ${signatures?.owner?.signedAt 
                                      ? `<p style="font-size: 11px; color: #666;">Đã ký lúc: ${new Date(signatures.owner.signedAt).toLocaleString('vi-VN')}</p>`
                                      : ''
                                    }
                                  </div>
                                  <div style="text-align: center; width: 45%;">
                                    <p style="font-weight: bold; color: #333;">BÊN THUÊ</p>
                                    <p style="font-size: 12px; color: #666;">(Ký và ghi rõ họ tên)</p>
                                    ${signatures?.renter?.signed && signatures?.renter?.signature 
                                      ? `<img src="${signatures.renter.signature}" style="max-width: 200px; max-height: 100px; margin: 10px auto; display: block; border: 1px solid #ddd; padding: 5px; background: #fff;" alt="Renter Signature" />`
                                      : '<div style="width: 200px; height: 100px; border: 1px dashed #ccc; margin: 10px auto;"></div>'
                                    }
                                    ${signatures?.renter?.signedAt 
                                      ? `<p style="font-size: 11px; color: #666;">Đã ký lúc: ${new Date(signatures.renter.signedAt).toLocaleString('vi-VN')}</p>`
                                      : ''
                                    }
                                  </div>
                                </div>
                              `;
                              
                              // Chèn trước footer nếu có, không thì chèn trước </body>
                              const footerIndex = html.lastIndexOf('<div class="footer">');
                              const bodyEndIndex = html.lastIndexOf('</body>');
                              
                              if (footerIndex > -1) {
                                html = html.slice(0, footerIndex) + signatureImages + html.slice(footerIndex);
                              } else if (bodyEndIndex > -1) {
                                html = html.slice(0, bodyEndIndex) + signatureImages + html.slice(bodyEndIndex);
                              } else {
                                html += signatureImages;
                              }
                              
                              const newWindow = window.open('', '_blank');
                              newWindow.document.write(html);
                              newWindow.document.close();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                          >
                            <FileCheck className="w-4 h-4" />
                            Xem hợp đồng
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Signature info */}
                    {dispute.subOrder.contract.signatures && (
                      <div className="mt-3 pt-3 border-t border-green-200 grid grid-cols-2 gap-3">
                        <div className="text-xs">
                          <p className="text-gray-500 mb-1">Chữ ký Owner:</p>
                          {dispute.subOrder.contract.signatures.owner?.signed ? (
                            <p className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-3 h-3" /> Đã ký - {new Date(dispute.subOrder.contract.signatures.owner.signedAt).toLocaleDateString('vi-VN')}
                            </p>
                          ) : (
                            <p className="text-gray-400">Chưa ký</p>
                          )}
                        </div>
                        <div className="text-xs">
                          <p className="text-gray-500 mb-1">Chữ ký Renter:</p>
                          {dispute.subOrder.contract.signatures.renter?.signed ? (
                            <p className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-3 h-3" /> Đã ký - {new Date(dispute.subOrder.contract.signatures.renter.signedAt).toLocaleDateString('vi-VN')}
                            </p>
                          ) : (
                            <p className="text-gray-400">Chưa ký</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Parties Tab */}
          {activeTab === 'parties' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {dispute.complainant?.profile?.fullName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{dispute.complainant?.profile?.fullName || 'N/A'}</p>
                    <p className="text-xs text-blue-600">Người khiếu nại</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm text-gray-600">
                  <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {dispute.complainant?.email || 'N/A'}</p>
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {dispute.complainant?.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    {dispute.respondent?.profile?.fullName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{dispute.respondent?.profile?.fullName || 'N/A'}</p>
                    <p className="text-xs text-orange-600">Bên bị khiếu nại</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm text-gray-600">
                  <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {dispute.respondent?.email || 'N/A'}</p>
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {dispute.respondent?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="relative">
              {dispute.timeline?.length > 0 ? (
                <div className="space-y-0">
                  {dispute.timeline.map((event, idx) => (
                    <div key={idx} className="flex gap-3 pb-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100"></div>
                        {idx < dispute.timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <p className="text-sm font-medium text-gray-900">{getTimelineActionText(event.action)}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{formatTimelineDetails(event.details)}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(event.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic text-center py-8">Không có lịch sử</p>
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

      {/* Admin Final Process Modal (Renter Dispute) */}
      <AdminFinalProcessModal
        isOpen={showFinalProcessModal}
        onClose={() => setShowFinalProcessModal(false)}
        dispute={dispute}
      />

      {/* Admin Owner Dispute Final Modal */}
      <AdminOwnerDisputeFinalModal
        isOpen={showOwnerDisputeFinalModal}
        onClose={() => setShowOwnerDisputeFinalModal(false)}
        dispute={dispute}
        onUpdate={() => {
          loadDisputeDetail(disputeId);
        }}
      />

      {/* Shipper Damage Resolve Modal */}
      <ShipperDamageResolveModal
        isOpen={showShipperDamageModal}
        onClose={() => setShowShipperDamageModal(false)}
        dispute={dispute}
        onSuccess={() => {
          // Reload dispute detail after successful resolution
          loadDisputeDetail(disputeId);
        }}
      />

      {/* Reject Evidence Modal */}
      {showRejectEvidenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Từ chối bằng chứng bên thứ 3
            </h2>
            
            <p className="text-sm text-gray-600 mb-4">
              Bạn đang từ chối bằng chứng do không hợp lệ hoặc có dấu hiệu giả mạo. 
              Dispute sẽ quay lại trạng thái <span className="font-semibold">Chuyển bên thứ 3</span> 
              {' '}và 2 bên sẽ được yêu cầu upload lại.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="VD: Bằng chứng không rõ ràng, hình ảnh bị chỉnh sửa, thông tin không khớp với cuộc gọi xác nhận..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectEvidenceModal(false);
                  setRejectReason('');
                }}
                disabled={isRejecting}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  if (!rejectReason.trim()) {
                    toast.error('Vui lòng nhập lý do từ chối');
                    return;
                  }

                  setIsRejecting(true);
                  try {
                    await disputeApi.adminRejectThirdPartyEvidence(disputeId, {
                      reason: rejectReason
                    });
                    toast.success('Đã từ chối bằng chứng. Dispute quay lại trạng thái Chuyển bên thứ 3');
                    setShowRejectEvidenceModal(false);
                    setRejectReason('');
                    loadDisputeDetail(disputeId);
                  } catch (error) {
                    console.error('Reject evidence error:', error);
                    toast.error(error.response?.data?.message || 'Không thể từ chối bằng chứng');
                  } finally {
                    setIsRejecting(false);
                  }
                }}
                disabled={isRejecting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isRejecting ? 'Đang xử lý...' : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisputeDetail;
