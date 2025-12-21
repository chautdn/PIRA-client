import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useRentalOrder } from "../context/RentalOrderContext";
import { useAuth } from "../hooks/useAuth";
import { useI18n } from "../hooks/useI18n";
import { useEarlyReturn } from "../hooks/useEarlyReturn";
import toast from "react-hot-toast";
import api from "../services/api";
import rentalOrderService from "../services/rentalOrder";
import EarlyReturnRequestModal from "../components/rental/EarlyReturnRequestModal";
import CreateDisputeModal from "../components/dispute/CreateDisputeModal";
import { useDispute } from "../context/DisputeContext";
import ExtendRentalModal from "../components/rental/ExtendRentalModal";
import ManageShipmentModal from "../components/owner/ManageShipmentModal";
import RenterShipmentModal from "../components/rental/RenterShipmentModal";
import RenterPartialDecisionModal from "../components/rental/RenterPartialDecisionModal";
import {
  ArrowLeft,
  Package,
  Calendar,
  MapPin,
  DollarSign,
  User,
  Phone,
  Mail,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  RotateCcw,
  Plus,
  Loader2,
} from "lucide-react";
import { IoStarSharp } from "react-icons/io5";

const RentalOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const {
    currentOrder,
    isLoadingOrderDetail, // Changed from isLoading
    confirmOwnerOrder,
    rejectOwnerOrder,
    loadOrderDetail,
  } = useRentalOrder();

  const [activeTab, setActiveTab] = useState("overview");
  const [confirmAction, setConfirmAction] = useState(null); // 'confirm' or 'reject'
  const [rejectReason, setRejectReason] = useState("");
  const [showPartialDecisionModal, setShowPartialDecisionModal] = useState(false);
  const [partialDecisionSubOrder, setPartialDecisionSubOrder] = useState(null);
  const [showEarlyReturnModal, setShowEarlyReturnModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { createDispute } = useDispute();
  const [showExtendRentalModal, setShowExtendRentalModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [earlyReturnRequests, setEarlyReturnRequests] = useState([]);
  const { getRenterRequests, deleteRequest } = useEarlyReturn();
  const [showCancelPendingModal, setShowCancelPendingModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if this is a payment return
  const payment = searchParams.get("payment");
  const orderCode = searchParams.get("orderCode");

  // Handle dispute creation
  const handleCreateDispute = (product, subOrder, productIndex) => {
    setSelectedProduct({ product, subOrder, productIndex });
    setShowDisputeModal(true);
  };

  const handleDisputeSubmit = async (disputeData) => {
    try {
      // Modal đã build đầy đủ data rồi, gửi trực tiếp
      await createDispute(disputeData);
      setShowDisputeModal(false);
      setSelectedProduct(null);
      toast.success(t("rentalOrderDetail.createDisputeSuccess"));
      // Reload order detail
      loadOrderDetail(id);
    } catch (error) {
      toast.error(error.response?.data?.message || t("rentalOrderDetail.createDisputeFailed"));
    }
  };

  // Check if can create dispute for product based on status and user role
  const canCreateDispute = (productStatus, subOrder) => {
    const isRenter = user?._id === currentOrder.renter?._id;
    const isOwner = user?._id === subOrder.owner?._id;

    // RENTER can create dispute when:
    // - DELIVERY_FAILED: Giao hàng thất bại
    // - ACTIVE: Đang trong thời gian thuê (sản phẩm lỗi)
    if (isRenter) {
      return productStatus === "DELIVERY_FAILED" || productStatus === "ACTIVE";
    }

    // OWNER can create dispute when:
    // - RETURNED: Đã trả về (sản phẩm hư hỏng khi trả)
    // - RETURN_FAILED: Trả hàng thất bại (renter không trả hoặc trả trễ)
    if (isOwner) {
      return productStatus === "RETURNED" || productStatus === "RETURN_FAILED";
    }

    return false;
  };

  // ✅ NEW: Kiểm tra nếu có ít nhất 1 SubOrder READY_FOR_CONTRACT (không cần chờ tất cả)
  const hasReadyForContractSubOrder = currentOrder?.subOrders?.some(
    (sub) => sub.status === 'READY_FOR_CONTRACT'
  );
  
  const action = searchParams.get("action"); // Check for "extend" action

  // Load order detail first
  useEffect(() => {
    if (id) {
      loadOrderDetail(id);
    }
  }, [id]);

  // Check for partial confirmation that needs renter decision
  useEffect(() => {
    if (currentOrder && currentOrder.subOrders) {
      const isRenter = user?._id === currentOrder.renter?._id;
      
      if (isRenter) {
        // Find subOrder waiting for renter decision
        const pendingDecision = currentOrder.subOrders.find(
          sub => sub.status === 'PENDING_RENTER_DECISION'
        );
        
        if (pendingDecision) {
          setPartialDecisionSubOrder(pendingDecision);
          // Chỉ tự động hiển thị modal lần đầu tiên
          if (!showPartialDecisionModal) {
            setShowPartialDecisionModal(true);
          }
        } else {
          // Không còn pending decision, reset state
          setPartialDecisionSubOrder(null);
          setShowPartialDecisionModal(false);
        }
      }
    }
  }, [currentOrder, user]);

  // Handle renter decision
  const handleRenterDecision = async (decision, result) => {
    setShowPartialDecisionModal(false);
    setPartialDecisionSubOrder(null);
    
    if (decision === 'CANCELLED') {
      toast.success(`Đã hủy đơn hàng và hoàn ${result.metadata?.refundAmount?.toLocaleString('vi-VN')}đ`);
      // Reload order detail
      await loadOrderDetail(id);
    } else if (decision === 'ACCEPTED') {
      toast.success(`Đã chấp nhận đơn hàng. Hoàn tiền: ${result.metadata?.refundAmount?.toLocaleString('vi-VN')}đ`);
      // Reload order detail
      await loadOrderDetail(id);
      
      // Navigate to confirmation summary page
      navigate(`/rental-orders/${id}/confirmation-summary`);
    }
  };

  // Fetch early return requests for this order
  const fetchEarlyReturnRequests = async () => {
    if (!currentOrder || !currentOrder._id) return;

    try {
      const response = await getRenterRequests();

      // Extract requests array from response (could be in data, metadata, or direct)
      const requests =
        response?.requests ||
        response?.metadata?.requests ||
        response?.data?.requests ||
        [];

      // Filter requests for this specific order's subOrders
      const orderSubOrderIds =
        currentOrder.subOrders?.map((sub) => sub._id) || [];
      const filteredRequests = requests.filter((req) =>
        orderSubOrderIds.includes(req.subOrder?._id || req.subOrder)
      );
      setEarlyReturnRequests(filteredRequests);
    } catch (error) {
      setEarlyReturnRequests([]); // Set to empty array on error
    }
  };

  // Load early return requests for this order
  useEffect(() => {
    fetchEarlyReturnRequests();
  }, [currentOrder]);

  // Open extend modal if action parameter is set
  useEffect(() => {
    if (
      action === "extend" &&
      currentOrder &&
      currentOrder.status === "ACTIVE"
    ) {
      setShowExtendRentalModal(true);
    }
  }, [action, currentOrder]);

  // Then handle payment verification if needed
  useEffect(() => {
    const handlePaymentReturn = async () => {
      if (!payment || !orderCode || !id || !currentOrder) {
        return;
      }

      if (payment === "cancel") {
        toast.error("Thanh toán đã bị hủy");
        return;
      }

      if (payment === "success") {
        try {
          const response = await api.post(
            `/rental-orders/${id}/verify-payment`,
            {
              orderCode: orderCode,
            }
          );

          if (response.data.success) {
            toast.success(
              "🎉 Thanh toán thành công! Đơn hàng đã được xác nhận.",
              {
                duration: 4000,
                icon: "✅",
              }
            );

            // Reload order detail to show updated status
            setTimeout(() => {
              loadOrderDetail(id);
            }, 1000);
          }
        } catch (error) {
          // Only show error if it's not already verified
          if (!error.response?.data?.message?.includes("đã được thanh toán")) {
            toast.error(
              "Xác nhận thanh toán thất bại: " +
                (error.response?.data?.message || error.message)
            );
          }
        }
      }
    };

    // Wait a bit for order to load first
    const timer = setTimeout(() => {
      handlePaymentReturn();
    }, 500);

    return () => clearTimeout(timer);
  }, [payment, orderCode, id, currentOrder]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Vui lòng đăng nhập</h2>
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingOrderDetail || (!currentOrder && id)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3">{t("rentalOrderDetail.loading")}</span>
        </div>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">{t("rentalOrderDetail.notFound")}</h2>
          <p className="text-gray-600 mb-4">Order ID: {id}</p>
          <p className="text-sm text-gray-500 mb-4">
            {payment && `Payment: ${payment}, OrderCode: ${orderCode}`}
          </p>
          <button
            onClick={() => navigate("/rental-orders")}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            {t("rentalOrderDetail.backToList")}
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-800",
      PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
      PAYMENT_COMPLETED: "bg-blue-100 text-blue-800",
      PENDING_CONFIRMATION: "bg-orange-100 text-orange-800",
      OWNER_CONFIRMED: "bg-blue-100 text-blue-800",
      OWNER_REJECTED: "bg-red-100 text-red-800",
      READY_FOR_CONTRACT: "bg-purple-100 text-purple-800",
      CONTRACT_SIGNED: "bg-green-100 text-green-800",
      DELIVERED: "bg-blue-100 text-blue-800",
      ACTIVE: "bg-green-100 text-green-800",
      COMPLETED: "bg-gray-100 text-gray-800",
      CANCELLED: "bg-red-100 text-red-800",
      PENDING_RENTER_DECISION: "bg-yellow-100 text-yellow-800",
      RETURN_FAILED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    const texts = {
      DRAFT: "Nháp",
      PENDING_PAYMENT: "Chờ thanh toán",
      PAYMENT_COMPLETED: "Đã thanh toán",
      PENDING_CONFIRMATION: "Chờ xác nhận",
      OWNER_CONFIRMED: "Chủ đã xác nhận",
      OWNER_REJECTED: "Chủ từ chối",
      READY_FOR_CONTRACT: "Sẵn sàng ký HĐ",
      CONTRACT_SIGNED: "Đã ký HĐ",
      DELIVERED: "Đã giao hàng",
      ACTIVE: "Đang thuê",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Đã hủy",
      PENDING_RENTER_DECISION: "Chờ quyết định người thuê",
      RETURN_FAILED: "Trả hàng thất bại",
    };
    return texts[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isOwner = !!currentOrder.subOrders?.some((subOrder) => {
    const ownerId = subOrder.owner?._id ?? subOrder.owner;
    return ownerId && String(ownerId) === String(user?._id);
  });

  const isRenter = currentOrder.renter?._id === user._id;

  const handleOwnerAction = async (action, subOrderId, reason = null) => {
    try {
      if (action === "confirm") {
        await confirmOwnerOrder(subOrderId);
      } else if (action === "reject") {
        await rejectOwnerOrder(subOrderId, reason);
      }
      setConfirmAction(null);
      setRejectReason("");
      // Reload order details
      await loadOrderDetail(id);
    } catch (error) {
      alert(t("rentalOrderDetail.actionError"));
    }
  };


  const handleRenterConfirm = async (subOrderId) => {
    try {
      toast.loading(t("rentalOrderDetail.confirmingSending"));
      const response = await rentalOrderService.renterConfirmDelivered(
        subOrderId
      );

      toast.dismiss();
      toast.success(t("rentalOrderDetail.confirmReceivedSuccess"));

      // Add small delay to ensure backend processing is complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      await loadOrderDetail(id);
    } catch (error) {
      toast.dismiss();
      toast.error(
        error.response?.data?.message ||
          error.message ||
          t("rentalOrderDetail.confirmReceivedFailed")
      );
    }
  };

  const handleCancelPendingOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn');
      return;
    }

    try {
      setLoading(true);
      // Cancel all suborders in this master order
      const cancelPromises = currentOrder.subOrders
        .filter(sub => sub.status === 'PENDING_CONFIRMATION')
        .map(sub => 
          rentalOrderService.renterCancelPendingOrder(sub._id, cancelReason)
        );
      
      await Promise.all(cancelPromises);
      
      toast.success('Đã hủy đơn hàng thành công! Tiền sẽ được hoàn lại 100%.');
      setShowCancelPendingModal(false);
      setCancelReason('');
      
      // Reload order
      await loadOrderDetail(currentOrder._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // Check if has pending decision subOrder
  const hasPendingDecision = currentOrder?.subOrders?.some(
    sub => sub.status === 'PENDING_RENTER_DECISION'
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Alert Banner for Pending Decision */}
        {hasPendingDecision && isRenter && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 rounded-lg shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-orange-900 text-lg mb-1">
                    ⚠️ {t("rentalOrderDetail.needDecision")}
                  </h3>
                  <p className="text-orange-800 mb-2">
                    {t("rentalOrderDetail.partialConfirmMessage")}
                  </p>
                  <button
                    onClick={() => {
                      const pendingSubOrder = currentOrder.subOrders.find(
                        sub => sub.status === 'PENDING_RENTER_DECISION'
                      );
                      if (pendingSubOrder) {
                        setPartialDecisionSubOrder(pendingSubOrder);
                        setShowPartialDecisionModal(true);
                      }
                    }}
                    className="mt-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-semibold flex items-center gap-2 transition-colors"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {t("rentalOrderDetail.viewAndDecide")}
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  // User can dismiss the banner, but can open modal via button
                }}
                className="text-orange-600 hover:text-orange-800 p-1"
              >
                {/* Keep banner visible */}
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/rental-orders")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t("rentalOrderDetail.backToList")}</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold">{t("rentalOrderDetail.title")}</h1>
              <p className="text-gray-600">#{currentOrder.masterOrderNumber}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                currentOrder.status
              )}`}
            >
              {getStatusText(currentOrder.status)}
            </span>

            {/* Cancel Pending Order Button for Renter */}
            {isRenter && currentOrder.status === "PENDING_CONFIRMATION" && (
              <button
                onClick={() => setShowCancelPendingModal(true)}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 flex items-center space-x-2"
              >
                <XCircle className="w-5 h-5" />
                <span>Hủy đơn hàng</span>
              </button>
            )}

            {/* ✅ MODIFIED: Hiển thị "Chi tiết xác nhận" khi có SubOrder OWNER_CONFIRMED (không cần tất cả) */}
            {(currentOrder.status === "CONFIRMED" ||
              currentOrder.status === "PARTIALLY_CANCELLED" ||
              currentOrder.status === "CONTRACT_SIGNED" ||
              currentOrder.status === "READY_FOR_CONTRACT" ||
              hasReadyForContractSubOrder) && (
              <button
                onClick={() =>
                  navigate(
                    `/rental-orders/${currentOrder._id}/confirmation-summary`
                  )
                }
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>{t("rentalOrderDetail.confirmationDetails")}</span>
              </button>
            )}

            {/* ✅ MODIFIED: Kiểm tra nếu có SubOrder READY_FOR_CONTRACT (thay vì chỉ MasterOrder status) */}
            {hasReadyForContractSubOrder && isRenter && (
              <button
                onClick={() => {
                  // Tìm SubOrder READY_FOR_CONTRACT đầu tiên để lấy contractId
                  const readySubOrder = currentOrder?.subOrders?.find(
                    (sub) => sub.status === 'READY_FOR_CONTRACT'
                  );
                  if (readySubOrder?.contract) {
                    navigate(`/rental-orders/contracts?contractId=${readySubOrder.contract}`);
                  } else {
                    navigate("/rental-orders/contracts");
                  }
                }}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex items-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>{t("rentalOrderDetail.signContract")}</span>
              </button>
            )}

            {isRenter &&
              currentOrder.status === "ACTIVE" && (
                <>
                  <button
                    onClick={() => setShowExtendRentalModal(true)}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex items-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>{t("rentalOrderDetail.extend")}</span>
                  </button>
                  <button
                    onClick={() => setShowEarlyReturnModal(true)}
                    className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 flex items-center space-x-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>{t("rentalOrderDetail.earlyReturn")}</span>
                  </button>
                  <button
                    onClick={() => setShowShipmentModal(true)}
                    className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 flex items-center space-x-2"
                  >
                    <Package className="w-5 h-5" />
                    <span>{t("rentalOrderDetail.manageShipment")}</span>
                  </button>
                </>
              )}

            {/* Renter: manage shipment button */}
            {isRenter &&
              currentOrder.status === "CONTRACT_SIGNED" && (
                <button
                  onClick={() => setShowShipmentModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Package className="w-5 h-5" />
                  <span>{t("rentalOrderDetail.manageShipment")}</span>
                </button>
              )}

            {/* Owner: manage shipment button visible after contract signed */}
            {isOwner && currentOrder.status === "CONTRACT_SIGNED" && (
              <button
                onClick={() => setShowShipmentModal(true)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>{t("rentalOrderDetail.manageShipment")}</span>
              </button>
            )}

            {/* Rating button - shown when order is completed */}
            {isRenter && currentOrder.status === "COMPLETED" && (
              <button
                onClick={() => {
                  // Navigate to first product detail with order info
                  const firstProduct = currentOrder.subOrders?.[0]?.products?.[0];
                  const productId = firstProduct?.product?._id;
                  if (productId) {
                    navigate(`/product/${productId}?activeTab=reviews&fromOrder=${currentOrder._id}`);
                  }
                }}
                className="bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600 flex items-center space-x-2"
              >
                <IoStarSharp className="w-5 h-5" />
                <span>{t("rentalOrderDetail.rate")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("rentalOrderDetail.overview")}
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === "products"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("rentalOrderDetail.products")} (
                {currentOrder.subOrders?.reduce(
                  (sum, sub) => sum + (sub.products?.length || 0),
                  0
                ) || 0}
                )
              </button>
              <button
                onClick={() => setActiveTab("earlyReturns")}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === "earlyReturns"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("rentalOrderDetail.earlyReturnRequests")}
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === "timeline"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("rentalOrderDetail.history")}
              </button>
              {currentOrder.contracts && currentOrder.contracts.length > 0 && (
                <button
                  onClick={() => setActiveTab("contracts")}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === "contracts"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t("rentalOrderDetail.contract")}
                </button>
              )}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">{t("rentalOrderDetail.rentalPeriod")}</p>
                        {(() => {
                          // Lấy tất cả rental periods từ các products
                          const allPeriods =
                            currentOrder.subOrders?.flatMap(
                              (sub) =>
                                sub.products
                                  ?.map((p) => p.rentalPeriod)
                                  .filter(Boolean) || []
                            ) || [];

                          if (allPeriods.length === 0) {
                            return (
                              <p className="text-sm text-gray-500">
                                {t("rentalOrderDetail.notDetermined")}
                              </p>
                            );
                          }

                          // Kiểm tra xem có nhiều period khác nhau không
                          const uniquePeriods = [
                            ...new Set(
                              allPeriods.map(
                                (p) => `${p.startDate}-${p.endDate}`
                              )
                            ),
                          ];

                          if (uniquePeriods.length === 1) {
                            // Tất cả cùng 1 period
                            const period = allPeriods[0];
                            return (
                              <>
                                <p className="font-bold text-lg">
                                  {calculateDuration(
                                    period.startDate,
                                    period.endDate
                                  )}{" "}
                                  {t("rentalOrderDetail.days")}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {new Date(
                                    period.startDate
                                  ).toLocaleDateString(language === 'vi' ? "vi-VN" : "en-US")}{" "}
                                  -{" "}
                                  {new Date(period.endDate).toLocaleDateString(
                                    language === 'vi' ? "vi-VN" : "en-US"
                                  )}
                                </p>
                              </>
                            );
                          } else {
                            // Có nhiều period khác nhau
                            return (
                              <>
                                <p className="font-bold text-lg text-orange-600">
                                  {t("rentalOrderDetail.multiplePeriods")}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {t("rentalOrderDetail.seeProductsTab")}
                                </p>
                              </>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Package className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">{t("rentalOrderDetail.totalProducts")}</p>
                        <p className="font-bold text-lg">
                          {currentOrder.subOrders?.reduce(
                            (sum, sub) => sum + (sub.products?.length || 0),
                            0
                          ) || 0}
                        </p>
                        <p className="text-sm text-gray-600">
                          {currentOrder.subOrders?.length || 0} {t("rentalOrderDetail.owners")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-8 h-8 text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-600">{t("rentalOrderDetail.delivery")}</p>
                        <p className="font-bold text-lg">
                          {currentOrder.deliveryMethod === "PICKUP"
                            ? t("rentalOrderDetail.pickupInStore")
                            : t("rentalOrderDetail.homeDelivery")}
                        </p>
                        {currentOrder.deliveryAddress && (
                          <p className="text-sm text-gray-600 truncate">
                            {currentOrder.deliveryAddress.streetAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">{t("rentalOrderDetail.totalPayment")}</p>
                        <p className="font-bold text-lg text-purple-600">
                          {(
                            currentOrder.totalAmount +
                            currentOrder.totalDepositAmount +
                            currentOrder.totalShippingFee
                          ).toLocaleString(language === 'vi' ? "vi-VN" : "en-US")}
                          đ
                        </p>
                        <div className="text-xs text-gray-600">
                          <div>
                            {t("rentalOrderDetail.rental")}:{" "}
                            {currentOrder.totalAmount?.toLocaleString(language === 'vi' ? "vi-VN" : "en-US")}đ
                          </div>
                          <div>
                            {t("rentalOrderDetail.deposit")}:{" "}
                            {currentOrder.totalDepositAmount?.toLocaleString(
                              language === 'vi' ? "vi-VN" : "en-US"
                            )}
                            đ
                          </div>
                          <div>
                            {t("rentalOrderDetail.shipping")}:{" "}
                            {currentOrder.totalShippingFee?.toLocaleString(
                              language === 'vi' ? "vi-VN" : "en-US"
                            )}
                            đ
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parties Info & Payment Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Renter Info */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <span>{t("rentalOrderDetail.renter")}</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium">
                          {currentOrder.renter?.profile?.fullName || t("rentalOrderDetail.unknown")}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>
                          {currentOrder.renter?.profile?.phoneNumber ||
                            t("rentalOrderDetail.notUpdated")}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>
                          {currentOrder.renter?.email || t("rentalOrderDetail.notUpdated")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <span>{t("rentalOrderDetail.deliveryAddress")}</span>
                    </h3>
                    {currentOrder.deliveryAddress ? (
                      <div className="space-y-2">
                        <p className="font-medium">
                          {currentOrder.deliveryAddress.contactName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {currentOrder.deliveryAddress.contactPhone}
                        </p>
                        <p className="text-sm text-gray-600">
                          {currentOrder.deliveryAddress.streetAddress}
                        </p>
                        <p className="text-sm text-gray-600">
                          {currentOrder.deliveryAddress.ward}
                          {currentOrder.deliveryAddress.district &&
                            `, ${currentOrder.deliveryAddress.district}`}
                          {`, ${currentOrder.deliveryAddress.city}`}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        {t("rentalOrderDetail.pickupInStore")}
                      </p>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                      <span>{t("rentalOrderDetail.paymentInfo")}</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">{t("rentalOrderDetail.paymentMethod")}</p>
                        <p className="font-medium">
                          {currentOrder.paymentMethod === "WALLET"
                            ? t("rentalOrderDetail.eWallet")
                            : currentOrder.paymentMethod === "PAYOS"
                            ? t("rentalOrderDetail.payos")
                            : currentOrder.paymentMethod === "BANK_TRANSFER"
                            ? t("rentalOrderDetail.bankTransfer")
                            : currentOrder.paymentMethod === "COD"
                            ? t("rentalOrderDetail.cod")
                            : currentOrder.paymentMethod || t("rentalOrderDetail.payos")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t("rentalOrderDetail.status")}</p>
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            currentOrder.paymentStatus === "PAID"
                              ? "bg-green-100 text-green-800"
                              : currentOrder.paymentStatus === "PARTIALLY_PAID"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {currentOrder.paymentStatus === "PAID"
                            ? t("rentalOrderDetail.paid")
                            : currentOrder.paymentStatus === "PARTIALLY_PAID"
                            ? t("rentalOrderDetail.partiallyPaid")
                            : t("rentalOrderDetail.unpaid")}
                        </span>
                      </div>
                      {(currentOrder.paymentInfo?.transactionId ||
                        currentOrder.updatedAt) && (
                        <div>
                          <p className="text-sm text-gray-600">
                            {currentOrder.paymentInfo?.transactionId
                              ? t("rentalOrderDetail.transactionCode")
                              : t("rentalOrderDetail.updateDate")}
                          </p>
                          <p className="font-medium">
                            {currentOrder.paymentInfo?.transactionId ||
                              formatDate(currentOrder.updatedAt)}
                          </p>
                        </div>
                      )}
                      {currentOrder.paymentInfo?.paymentDetails?.message && (
                        <div>
                          <p className="text-sm text-gray-600">{t("rentalOrderDetail.details")}</p>
                          <p className="font-medium text-sm text-green-600">
                            {currentOrder.paymentInfo.paymentDetails.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub Orders Status */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {t("rentalOrderDetail.ownerStatuses")}
                  </h3>
                  <div className="space-y-4">
                    {currentOrder.subOrders?.map((subOrder) => (
                      <div
                        key={subOrder._id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <User className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium">
                                {subOrder.owner?.profile?.fullName ||
                                  t("rentalOrderDetail.unknown")}
                              </p>
                              <p className="text-sm text-gray-600">
                                {subOrder.owner?.profile?.phoneNumber ||
                                  t("rentalOrderDetail.notUpdated")}
                              </p>
                              <p className="text-xs text-gray-500">
                                SubOrder: #
                                {subOrder.subOrderNumber ||
                                  subOrder._id.slice(-6)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                                subOrder.status
                              )}`}
                            >
                              {getStatusText(subOrder.status)}
                            </span>

                            {isOwner &&
                              String(subOrder.owner?._id ?? subOrder.owner) ===
                                String(user?._id) &&
                              subOrder.status === "PENDING_CONFIRMATION" && (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() =>
                                      setConfirmAction(
                                        `confirm-${subOrder._id}`
                                      )
                                    }
                                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 flex items-center space-x-1"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>{t("rentalOrderDetail.confirm")}</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      setConfirmAction(`reject-${subOrder._id}`)
                                    }
                                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 flex items-center space-x-1"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    <span>{t("rentalOrderDetail.reject")}</span>
                                  </button>
                                </div>
                              )}

                            {/* Renter: confirm received button (when shipment marked DELIVERED) */}
                            {isRenter && subOrder.status === "DELIVERED" && (
                              <div className="flex items-center ml-2">
                                <button
                                  onClick={() =>
                                    handleRenterConfirm(subOrder._id)
                                  }
                                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 flex items-center space-x-1"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>{t("rentalOrderDetail.confirmReceived")}</span>
                                </button>
                              </div>
                            )}

                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">{t("rentalOrderDetail.products")}</p>
                            <p className="font-medium">
                              {subOrder.products?.length || 0} {t("rentalOrderDetail.productCount")}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">{t("rentalOrderDetail.totalAmount")}</p>
                            <p className="font-medium">
                              {subOrder.pricing?.totalAmount?.toLocaleString(
                                language === 'vi' ? "vi-VN" : "en-US"
                              )}
                              đ
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">{t("rentalOrderDetail.updated")}</p>
                            <p className="font-medium">
                              {new Date(subOrder.updatedAt).toLocaleDateString(
                                language === 'vi' ? "vi-VN" : "en-US"
                              )}
                            </p>
                          </div>
                        </div>

                        {subOrder.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm font-medium text-red-800">
                              {t("rentalOrderDetail.rejectionReason")}
                            </p>
                            <p className="text-sm text-red-600">
                              {subOrder.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "products" && (
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <span>
                      {t("rentalOrderDetail.productList")} (
                      {currentOrder.subOrders?.reduce(
                        (sum, sub) => sum + (sub.products?.length || 0),
                        0
                      ) || 0}
                      )
                    </span>
                  </h3>

                  <div className="space-y-4">
                    {currentOrder.subOrders?.map((subOrder) =>
                      subOrder.products?.map((productItem, idx) => (
                        <div
                          key={`${subOrder._id}-${idx}`}
                          className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                        >
                          <img
                            src={
                              productItem.product?.images?.[0]?.url ||
                              "/placeholder.jpg"
                            }
                            alt={productItem.product?.name}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-lg">
                                  {productItem.product?.name}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {t("rentalOrderDetail.owner")}{" "}
                                  {subOrder.owner?.profile?.fullName ||
                                    t("rentalOrderDetail.unknown")}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  productItem.productStatus || subOrder.status
                                )}`}
                              >
                                {getStatusText(
                                  productItem.productStatus || subOrder.status
                                )}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                              <div>
                                <p className="text-xs text-gray-500">
                                  {t("rentalOrderDetail.quantity")}
                                </p>
                                <p className="font-semibold">
                                  {productItem.quantity}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">
                                  {t("rentalOrderDetail.rentalPrice")}
                                </p>
                                <p className="font-semibold">
                                  {productItem.rentalRate?.toLocaleString(
                                    language === 'vi' ? "vi-VN" : "en-US"
                                  )}
                                  đ
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">
                                  {t("rentalOrderDetail.depositAmount")}
                                </p>
                                <p className="font-semibold">
                                  {productItem.depositRate?.toLocaleString(
                                    language === 'vi' ? "vi-VN" : "en-US"
                                  )}
                                  đ
                                </p>
                              </div>
                            </div>

                            {productItem.rentalPeriod && (
                              <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(
                                    productItem.rentalPeriod.startDate
                                  ).toLocaleDateString("vi-VN")}{" "}
                                  -{" "}
                                  {new Date(
                                    productItem.rentalPeriod.endDate
                                  ).toLocaleDateString("vi-VN")}
                                </span>
                              </div>
                            )}

                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex justify-between items-center mb-3">
                                <div className="text-sm text-gray-600">
                                  <div>
                                    Tổng thuê:{" "}
                                    {productItem.totalRental?.toLocaleString(
                                      "vi-VN"
                                    )}
                                    đ
                                  </div>
                                  <div>
                                    Tổng cọc:{" "}
                                    {productItem.totalDeposit?.toLocaleString(
                                      "vi-VN"
                                    )}
                                    đ
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">
                                    Tổng tiền
                                  </p>
                                  <p className="font-bold text-xl text-orange-600">
                                    {(
                                      (productItem.totalRental || 0) +
                                      (productItem.totalDeposit || 0)
                                    ).toLocaleString("vi-VN")}
                                    đ
                                  </p>
                                </div>
                              </div>

                              {/* Early Return button or status for ACTIVE products */}
                              {isRenter &&
                                productItem.productStatus === "ACTIVE" &&
                                (() => {
                                  // Check if there's an early return request for this subOrder
                                  const hasEarlyReturnRequest =
                                    earlyReturnRequests.some((req) => {
                                      const reqSubOrderId =
                                        req.subOrder?._id || req.subOrder;
                                      const currentSubOrderId = subOrder._id;
                                      const match =
                                        (reqSubOrderId === currentSubOrderId ||
                                          String(reqSubOrderId) ===
                                            String(currentSubOrderId)) &&
                                        req.status !== "CANCELLED";

                                      return match;
                                    });

                                  return hasEarlyReturnRequest ? (
                                    <div className="w-full px-4 py-2 bg-orange-50 border-2 border-orange-200 text-orange-700 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 mb-2">
                                      <RotateCcw className="w-4 h-4" />
                                      <span>Đã yêu cầu trả sớm</span>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowEarlyReturnModal(true);
                                      }}
                                      className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 mb-2"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                      <span>Trả hàng sớm</span>
                                    </button>
                                  );
                                })()}

                              {/* Dispute button */}
                              {canCreateDispute(
                                productItem.productStatus,
                                subOrder
                              ) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateDispute(
                                      productItem,
                                      subOrder,
                                      idx
                                    );
                                  }}
                                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Tạo tranh chấp</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Tổng kết */}
                  <div className="mt-6 pt-6 border-t-2 border-gray-300">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tổng tiền thuê:</span>
                        <span className="font-semibold">
                          {currentOrder.totalAmount?.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tổng tiền cọc:</span>
                        <span className="font-semibold">
                          {currentOrder.totalDepositAmount?.toLocaleString(
                            "vi-VN"
                          )}
                          đ
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Tổng phí vận chuyển:
                        </span>
                        <span className="font-semibold">
                          {currentOrder.totalShippingFee?.toLocaleString(
                            "vi-VN"
                          )}
                          đ
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-3 border-t">
                        <span>Tổng thanh toán:</span>
                        <span className="text-orange-600">
                          {(
                            (currentOrder.totalAmount || 0) +
                            (currentOrder.totalDepositAmount || 0) +
                            (currentOrder.totalShippingFee || 0)
                          ).toLocaleString("vi-VN")}
                          đ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "earlyReturns" && (
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <RotateCcw className="w-5 h-5 text-orange-600" />
                    <span>Yêu Cầu Trả Sớm</span>
                  </h3>

                  {earlyReturnRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <RotateCcw className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Chưa có yêu cầu trả sớm nào</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {earlyReturnRequests.map((request) => {
                        const subOrder = currentOrder.subOrders?.find(
                          (sub) =>
                            sub._id === request.subOrder?._id ||
                            sub._id === request.subOrder
                        );

                        return (
                          <div
                            key={request._id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors"
                          >
                            <div className="flex items-start space-x-4 mb-4">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-3">
                                  <span className="font-semibold text-gray-900">
                                    Mã yêu cầu: {request.requestNumber}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      request.status === "ACTIVE"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {request.status === "ACTIVE"
                                      ? "Đang hoạt động"
                                      : "Đã hủy"}
                                  </span>
                                </div>

                                {/* Products in this subOrder */}
                                {subOrder?.products &&
                                  subOrder.products.length > 0 && (
                                    <div className="mb-4">
                                      <p className="text-sm font-medium text-gray-700 mb-2">
                                        Sản phẩm:
                                      </p>
                                      <div className="space-y-2">
                                        {subOrder.products.map(
                                          (productItem, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg"
                                            >
                                              <img
                                                src={
                                                  productItem.product
                                                    ?.images?.[0]?.url ||
                                                  "/placeholder.jpg"
                                                }
                                                alt={productItem.product?.name}
                                                className="w-16 h-16 object-cover rounded-lg"
                                              />
                                              <div className="flex-1">
                                                <p className="font-medium text-sm">
                                                  {productItem.product?.name}
                                                </p>
                                                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                                                  <span>
                                                    Số lượng:{" "}
                                                    {productItem.quantity}
                                                  </span>
                                                  <span>
                                                    Giá thuê:{" "}
                                                    {productItem.rentalRate?.toLocaleString(
                                                      "vi-VN"
                                                    )}
                                                    đ
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-600 mt-2">
                                        Chủ cho thuê:{" "}
                                        {subOrder.owner?.profile?.fullName ||
                                          "Không rõ"}
                                      </p>
                                    </div>
                                  )}

                                <div className="grid grid-cols-2 gap-3 text-sm bg-orange-50 p-3 rounded-lg">
                                  <div>
                                    <p className="text-gray-600">
                                      Ngày trả ban đầu:
                                    </p>
                                    <p className="font-medium">
                                      {new Date(
                                        request.originalReturnDate
                                      ).toLocaleDateString("vi-VN")}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">
                                      Ngày trả sớm:
                                    </p>
                                    <p className="font-medium text-orange-600">
                                      {new Date(
                                        request.requestedReturnDate
                                      ).toLocaleDateString("vi-VN")}
                                    </p>
                                  </div>
                                </div>

                                {request.reason && (
                                  <div className="mt-3 text-sm">
                                    <p className="text-gray-600">Lý do:</p>
                                    <p className="text-gray-900">
                                      {request.reason}
                                    </p>
                                  </div>
                                )}

                                {request.ownerResponse && (
                                  <div className="mt-3 text-sm bg-gray-50 p-3 rounded">
                                    <p className="text-gray-600">
                                      Phản hồi từ chủ cho thuê:
                                    </p>
                                    <p className="text-gray-900">
                                      {request.ownerResponse}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-500">
                                Tạo lúc:{" "}
                                {new Date(request.createdAt).toLocaleString(
                                  "vi-VN"
                                )}
                              </p>

                              {/* Delete button - only for ACTIVE requests */}
                              {request.status === "ACTIVE" && isRenter && (
                                <button
                                  onClick={async () => {
                                    const hasAdditionalFee =
                                      request.additionalShipping
                                        ?.paymentStatus === "paid" &&
                                      request.additionalShipping
                                        ?.additionalFee > 0;
                                    const confirmMessage = hasAdditionalFee
                                      ? `Bạn có chắc muốn xóa yêu cầu này?\n\nPhí ship thêm ${request.additionalShipping.additionalFee.toLocaleString()} VND sẽ được hoàn lại vào ví của bạn.\nNgày trả gốc sẽ được khôi phục.`
                                      : "Bạn có chắc muốn xóa yêu cầu này? Ngày trả gốc sẽ được khôi phục.";

                                    if (window.confirm(confirmMessage)) {
                                      try {
                                        const result = await deleteRequest(
                                          request._id
                                        );

                                        if (result.refundResult?.refunded) {
                                          toast.success(
                                            `Xóa thành công! Đã hoàn ${result.refundResult.amount.toLocaleString()} VND vào ví.`
                                          );
                                        } else {
                                          toast.success(
                                            "Xóa yêu cầu trả sớm thành công!"
                                          );
                                        }

                                        await loadOrderDetail(id);
                                        await fetchEarlyReturnRequests();
                                      } catch (error) {
                                        toast.error(
                                          error.response?.data?.message ||
                                            "Xóa yêu cầu thất bại"
                                        );
                                      }
                                    }
                                  }}
                                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors flex items-center space-x-1"
                                >
                                  <span>🗑️</span>
                                  <span>Xóa</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="space-y-4">
                <div className="space-y-4">
                  {/* Order created */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Đơn hàng được tạo</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(currentOrder.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Payment status */}
                  {(currentOrder.paymentStatus === "PAID" ||
                    currentOrder.paymentStatus === "PARTIALLY_PAID") && (
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          currentOrder.paymentStatus === "PAID"
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                      >
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {currentOrder.paymentStatus === "PAID"
                            ? "Thanh toán hoàn tất"
                            : "Thanh toán một phần"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {currentOrder.paymentStatus === "PAID"
                            ? "Đã thanh toán thành công"
                            : "Đã thanh toán cọc"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Sub orders timeline */}
                  {currentOrder.subOrders?.map((subOrder) => (
                    <div
                      key={subOrder._id}
                      className="pl-11 border-l-2 border-gray-200"
                    >
                      <div className="flex items-start space-x-3 -ml-6">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            subOrder.status === "OWNER_CONFIRMED"
                              ? "bg-green-500"
                              : subOrder.status === "OWNER_REJECTED"
                              ? "bg-red-500"
                              : subOrder.status === "PENDING_CONFIRMATION"
                              ? "bg-yellow-500"
                              : "bg-gray-500"
                          }`}
                        >
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {subOrder.owner?.profile?.fullName ||
                              "Chủ cho thuê"}{" "}
                            - {getStatusText(subOrder.status)}
                          </p>
                          <p className="text-sm text-gray-600">
                            #{subOrder.subOrderNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(subOrder.updatedAt)}
                          </p>
                          {subOrder.rejectionReason && (
                            <p className="text-sm text-red-600 mt-1">
                              Lý do: {subOrder.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Contract signing */}
                  {currentOrder.status === "CONTRACT_SIGNED" && (
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Hợp đồng đã được ký</p>
                        <p className="text-sm text-gray-600">
                          Tất cả bên đã ký hợp đồng
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "contracts" && currentOrder.contracts && (
              <div className="space-y-4">
                {currentOrder.contracts.map((contract) => (
                  <div
                    key={contract._id}
                    className="bg-white border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        Hợp đồng #{contract.contractNumber}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          contract.status
                        )}`}
                      >
                        {getStatusText(contract.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Ngày tạo:</p>
                        <p className="font-medium">
                          {formatDate(contract.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Ngày ký:</p>
                        <p className="font-medium">
                          {contract.signedDate
                            ? formatDate(contract.signedDate)
                            : "Chưa ký"}
                        </p>
                      </div>
                    </div>

                    {contract.signatures && contract.signatures.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Chữ ký:</h4>
                        <div className="space-y-2">
                          {contract.signatures.map((signature, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>
                                {signature.signerName} ({signature.role})
                              </span>
                              <span className="text-green-600">✓ Đã ký</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() =>
                          window.open(
                            `/api/contracts/${contract._id}/download`,
                            "_blank"
                          )
                        }
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Tải hợp đồng</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {confirmAction.includes("confirm")
                ? "Xác nhận đơn hàng"
                : "Từ chối đơn hàng"}
            </h3>

            {confirmAction.includes("reject") && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do từ chối:
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập lý do từ chối..."
                />
              </div>
            )}

            <p className="text-gray-600 mb-6">
              {confirmAction.includes("confirm")
                ? "Bạn có chắc chắn muốn xác nhận đơn hàng này?"
                : "Bạn có chắc chắn muốn từ chối đơn hàng này?"}
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const subOrderId = confirmAction.split("-")[1];
                  const action = confirmAction.includes("confirm")
                    ? "confirm"
                    : "reject";
                  handleOwnerAction(action, subOrderId, rejectReason);
                }}
                disabled={
                  confirmAction.includes("reject") && !rejectReason.trim()
                }
                className={`px-4 py-2 rounded-lg text-white ${
                  confirmAction.includes("confirm")
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {confirmAction.includes("confirm") ? "Xác nhận" : "Từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Early Return Modal */}
      {showEarlyReturnModal && currentOrder.subOrders && (
        <EarlyReturnRequestModal
          isOpen={showEarlyReturnModal}
          onClose={() => setShowEarlyReturnModal(false)}
          subOrder={currentOrder.subOrders[0]}
          userAddresses={user.addresses || []}
          onSuccess={async () => {
            setShowEarlyReturnModal(false);
            await loadOrderDetail(id);
            await fetchEarlyReturnRequests();
            toast.success("Tạo yêu cầu trả hàng sớm thành công!");
          }}
        />
      )}

      {/* Dispute Modal */}
      {showDisputeModal && selectedProduct && (
        <CreateDisputeModal
          isOpen={showDisputeModal}
          onClose={() => {
            setShowDisputeModal(false);
            setSelectedProduct(null);
          }}
          onSubmit={handleDisputeSubmit}
          subOrder={selectedProduct.subOrder}
          product={selectedProduct.product}
          productIndex={selectedProduct.productIndex}
          shipment={selectedProduct.product?.deliveryShipment || selectedProduct.product?.returnShipment || null}
        />
      )}

      {/* Extend Rental Modal */}
      {showExtendRentalModal && currentOrder && (
        <ExtendRentalModal
          isOpen={showExtendRentalModal}
          onClose={() => setShowExtendRentalModal(false)}
          masterOrder={currentOrder}
          onSuccess={() => {
            setShowExtendRentalModal(false);
            loadOrderDetail(id);
          }}
        />
      )}

      {/* Renter Partial Decision Modal */}
      {showPartialDecisionModal && partialDecisionSubOrder && (
        <RenterPartialDecisionModal
          isOpen={showPartialDecisionModal}
          onClose={() => {
            setShowPartialDecisionModal(false);
            setPartialDecisionSubOrder(null);
          }}
          subOrder={partialDecisionSubOrder}
          onDecisionMade={handleRenterDecision}
        />
      )}

      {/* Renter Shipment Modal */}
      {showShipmentModal && currentOrder && (
        <RenterShipmentModal
          isOpen={showShipmentModal}
          onClose={() => setShowShipmentModal(false)}
          masterOrderId={currentOrder._id}
        />
      )}

      {/* Cancel Pending Order Modal */}
      {showCancelPendingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full mx-4 shadow-2xl">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <XCircle size={24} />
                Hủy đơn hàng
              </h3>
            </div>
            
            <div className="p-6">
              <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-4 mb-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-orange-800 font-semibold mb-1">
                      Cảnh báo: Hành động này không thể hoàn tác!
                    </p>
                    <p className="text-xs text-orange-700 mb-1">
                      Đơn hàng: <strong>#{currentOrder.masterOrderNumber}</strong>
                    </p>
                    <p className="text-xs text-orange-700">
                      Bạn sẽ được hoàn 100% tiền (bao gồm cọc, phí thuê và phí vận chuyển).
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-800 font-semibold mb-1">
                      💰 Số tiền hoàn trả
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {(
                        (currentOrder.totalAmount || 0) + 
                        (currentOrder.totalDepositAmount || 0) + 
                        (currentOrder.totalShippingFee || 0)
                      ).toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                  <div className="text-right text-xs text-green-700">
                    <div>Phí thuê: {(currentOrder.totalAmount || 0).toLocaleString('vi-VN')}₫</div>
                    <div>Tiền cọc: {(currentOrder.totalDepositAmount || 0).toLocaleString('vi-VN')}₫</div>
                    <div>Phí ship: {(currentOrder.totalShippingFee || 0).toLocaleString('vi-VN')}₫</div>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lý do hủy đơn <span className="text-red-500">*</span>
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                  disabled={loading}
                >
                  <option value="">-- Chọn lý do hủy đơn --</option>
                  <option value="Tìm được sản phẩm tốt hơn">Tìm được sản phẩm tốt hơn</option>
                  <option value="Đổi ý, không cần thuê nữa">Đổi ý, không cần thuê nữa</option>
                  <option value="Thời gian thuê không phù hợp">Thời gian thuê không phù hợp</option>
                  <option value="Giá thuê quá cao">Giá thuê quá cao</option>
                  <option value="Sản phẩm không đúng mong đợi">Sản phẩm không đúng mong đợi</option>
                  <option value="Không liên hệ được với chủ">Không liên hệ được với chủ</option>
                  <option value="Thay đổi kế hoạch">Thay đổi kế hoạch</option>
                  <option value="other">Lý do khác...</option>
                </select>
              </div>

              {cancelReason === 'other' && (
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nhập lý do cụ thể <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={cancelReason === 'other' ? '' : cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Vui lòng nhập lý do hủy đơn hàng..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
              )}
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCancelPendingModal(false);
                    setCancelReason('');
                  }}
                  disabled={loading}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-all font-semibold disabled:opacity-50 border border-gray-300"
                >
                  Đóng
                </button>
                <button
                  onClick={handleCancelPendingOrder}
                  disabled={loading || !cancelReason.trim() || cancelReason === 'other'}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang hủy...
                    </>
                  ) : (
                    <>
                      <XCircle size={18} />
                      Xác nhận hủy đơn
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RentalOrderDetailPage;
