import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useRentalOrder } from "../context/RentalOrderContext";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import api from "../services/api";
import rentalOrderService from "../services/rentalOrder";
import EarlyReturnRequestModal from "../components/rental/EarlyReturnRequestModal";
import CreateDisputeModal from "../components/dispute/CreateDisputeModal";
import { useDispute } from "../context/DisputeContext";
import ExtendRentalModal from "../components/rental/ExtendRentalModal";
import ManageShipmentModal from "../components/owner/ManageShipmentModal";
import RenterShipmentModal from "../components/rental/RenterShipmentModal";
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
  Star,
  MessageCircle,
  RotateCcw,
  Plus,
} from "lucide-react";

const RentalOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
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
  const [showEarlyReturnModal, setShowEarlyReturnModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { createDispute } = useDispute();
  const [showExtendRentalModal, setShowExtendRentalModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);

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
      await createDispute({
        ...disputeData,
        subOrderId: selectedProduct.subOrder._id,
        productId: selectedProduct.product.product._id,
        productIndex: selectedProduct.productIndex
      });
      setShowDisputeModal(false);
      setSelectedProduct(null);
      toast.success('Tạo tranh chấp thành công!');
      // Reload order detail
      loadOrderDetail(id);
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast.error(error.response?.data?.message || 'Tạo tranh chấp thất bại');
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
      return productStatus === 'DELIVERY_FAILED' || productStatus === 'ACTIVE';
    }
    
    // OWNER can create dispute when:
    // - RETURNED: Đã trả về (sản phẩm hư hỏng khi trả)
    // - RETURN_FAILED: Trả hàng thất bại (renter không trả hoặc trả trễ)
    if (isOwner) {
      return productStatus === 'RETURNED' || productStatus === 'RETURN_FAILED';
    }
    
    return false;
  };
  const action = searchParams.get("action"); // Check for "extend" action

  // Load order detail first
  useEffect(() => {
    if (id) {
      console.log("📥 Loading order detail for ID:", id);
      loadOrderDetail(id);
    }
  }, [id]);

  // Open extend modal if action parameter is set
  useEffect(() => {
    if (action === "extend" && currentOrder && currentOrder.status === "ACTIVE") {
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
          console.log("🔄 Verifying payment return:", { id, orderCode });

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
          console.error("❌ Payment verification failed:", error);

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
    console.log("⏳ Loading state:", {
      isLoadingOrderDetail,
      id,
      hasCurrentOrder: !!currentOrder,
    });
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3">Đang tải chi tiết đơn hàng...</span>
        </div>
      </div>
    );
  }

  if (!currentOrder) {
    console.error("❌ No current order found:", {
      id,
      isLoadingOrderDetail,
      currentOrder,
      payment,
      orderCode,
    });
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy đơn hàng</h2>
          <p className="text-gray-600 mb-4">Order ID: {id}</p>
          <p className="text-sm text-gray-500 mb-4">
            {payment && `Payment: ${payment}, OrderCode: ${orderCode}`}
          </p>
          <button
            onClick={() => navigate("/rental-orders")}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  console.log("✅ Rendering order detail:", {
    orderId: currentOrder._id,
    status: currentOrder.status,
    paymentStatus: currentOrder.paymentStatus,
  });

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
      console.error("Error handling owner action:", error);
      alert("Có lỗi xảy ra khi thực hiện hành động");
    }
  };



  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/rental-orders")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Quay lại</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold">Chi tiết đơn hàng</h1>
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

            {(currentOrder.status === "CONFIRMED" ||
              currentOrder.status === "PARTIALLY_CANCELLED" ||
              currentOrder.status === "CONTRACT_SIGNED") && (
              <button
                onClick={() => navigate(`/rental-orders/${currentOrder._id}/confirmation-summary`)}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Chi tiết xác nhận</span>
              </button>
            )}

            {currentOrder.status === "READY_FOR_CONTRACT" && isRenter && (
              <button
                onClick={() => navigate("/rental-orders/contracts")}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex items-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Ký hợp đồng</span>
              </button>
            )}

            {currentOrder.status === "ACTIVE" && isRenter && (
              <>
                <button
                  onClick={() => setShowExtendRentalModal(true)}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Gia hạn</span>
                </button>
                <button
                  onClick={() => setShowEarlyReturnModal(true)}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 flex items-center space-x-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Trả hàng sớm</span>
                </button>
                <button
                  onClick={() => setShowShipmentModal(true)}
                  className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 flex items-center space-x-2"
                >
                  <Package className="w-5 h-5" />
                  <span>Quản lí vận chuyển</span>
                </button>
              </>
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
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === "products"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Sản phẩm (
                {currentOrder.subOrders?.reduce(
                  (sum, sub) => sum + (sub.products?.length || 0),
                  0
                ) || 0}
                )
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === "timeline"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Lịch sử
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
                  Hợp đồng
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
                        <p className="text-sm text-gray-600">Thời gian thuê</p>
                        {(() => {
                          // Lấy tất cả rental periods từ các products
                          const allPeriods = currentOrder.subOrders?.flatMap(sub => 
                            sub.products?.map(p => p.rentalPeriod).filter(Boolean) || []
                          ) || [];
                          
                          if (allPeriods.length === 0) {
                            return <p className="text-sm text-gray-500">Chưa xác định</p>;
                          }
                          
                          // Kiểm tra xem có nhiều period khác nhau không
                          const uniquePeriods = [...new Set(allPeriods.map(p => 
                            `${p.startDate}-${p.endDate}`
                          ))];
                          
                          if (uniquePeriods.length === 1) {
                            // Tất cả cùng 1 period
                            const period = allPeriods[0];
                            return (
                              <>
                                <p className="font-bold text-lg">
                                  {calculateDuration(period.startDate, period.endDate)} ngày
                                </p>
                                <p className="text-sm text-gray-600">
                                  {new Date(period.startDate).toLocaleDateString("vi-VN")} - {new Date(period.endDate).toLocaleDateString("vi-VN")}
                                </p>
                              </>
                            );
                          } else {
                            // Có nhiều period khác nhau
                            return (
                              <>
                                <p className="font-bold text-lg text-orange-600">Nhiều mốc</p>
                                <p className="text-xs text-gray-600">
                                  Xem chi tiết ở tab Sản phẩm
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
                        <p className="text-sm text-gray-600">Tổng sản phẩm</p>
                        <p className="font-bold text-lg">
                          {currentOrder.subOrders?.reduce(
                            (sum, sub) => sum + (sub.products?.length || 0),
                            0
                          ) || 0}
                        </p>
                        <p className="text-sm text-gray-600">
                          {currentOrder.subOrders?.length || 0} chủ cho thuê
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-8 h-8 text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-600">Giao hàng</p>
                        <p className="font-bold text-lg">
                          {currentOrder.deliveryMethod === "PICKUP"
                            ? "Nhận trực tiếp"
                            : "Giao tận nơi"}
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
                        <p className="text-sm text-gray-600">Tổng thanh toán</p>
                        <p className="font-bold text-lg text-purple-600">
                          {(
                            currentOrder.totalAmount +
                            currentOrder.totalDepositAmount +
                            currentOrder.totalShippingFee
                          ).toLocaleString("vi-VN")}
                          đ
                        </p>
                        <div className="text-xs text-gray-600">
                          <div>
                            Thuê:{" "}
                            {currentOrder.totalAmount?.toLocaleString("vi-VN")}đ
                          </div>
                          <div>
                            Cọc:{" "}
                            {currentOrder.totalDepositAmount?.toLocaleString(
                              "vi-VN"
                            )}
                            đ
                          </div>
                          <div>
                            Ship:{" "}
                            {currentOrder.totalShippingFee?.toLocaleString(
                              "vi-VN"
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
                      <span>Người thuê</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium">
                          {currentOrder.renter?.profile?.fullName || "Không rõ"}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>
                          {currentOrder.renter?.profile?.phoneNumber ||
                            "Chưa cập nhật"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>
                          {currentOrder.renter?.email || "Chưa cập nhật"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <span>Địa chỉ giao hàng</span>
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
                          {currentOrder.deliveryAddress.district && `, ${currentOrder.deliveryAddress.district}`}
                          {`, ${currentOrder.deliveryAddress.city}`}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        Nhận trực tiếp tại cửa hàng
                      </p>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                      <span>Thông tin thanh toán</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Phương thức:</p>
                        <p className="font-medium">
                          {currentOrder.paymentMethod === "WALLET" ? "Ví điện tử" : 
                           currentOrder.paymentMethod === "PAYOS" ? "PayOS" :
                           currentOrder.paymentMethod === "BANK_TRANSFER" ? "Chuyển khoản ngân hàng" :
                           currentOrder.paymentMethod === "COD" ? "Thanh toán khi nhận hàng" :
                           currentOrder.paymentMethod || "PayOS"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Trạng thái:</p>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          currentOrder.paymentStatus === "PAID" 
                            ? "bg-green-100 text-green-800" 
                            : currentOrder.paymentStatus === "PARTIALLY_PAID"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {currentOrder.paymentStatus === "PAID" ? "Đã thanh toán" : 
                           currentOrder.paymentStatus === "PARTIALLY_PAID" ? "Thanh toán một phần" : 
                           "Chưa thanh toán"}
                        </span>
                      </div>
                      {(currentOrder.paymentInfo?.transactionId || currentOrder.updatedAt) && (
                        <div>
                          <p className="text-sm text-gray-600">
                            {currentOrder.paymentInfo?.transactionId ? "Mã giao dịch:" : "Ngày cập nhật:"}
                          </p>
                          <p className="font-medium">
                            {currentOrder.paymentInfo?.transactionId || formatDate(currentOrder.updatedAt)}
                          </p>
                        </div>
                      )}
                      {currentOrder.paymentInfo?.paymentDetails?.message && (
                        <div>
                          <p className="text-sm text-gray-600">Chi tiết:</p>
                          <p className="font-medium text-sm text-green-600">{currentOrder.paymentInfo.paymentDetails.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub Orders Status */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Trạng thái từ các chủ cho thuê
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
                                  "Không rõ"}
                              </p>
                              <p className="text-sm text-gray-600">
                                {subOrder.owner?.profile?.phoneNumber || "Chưa cập nhật"}
                              </p>
                              <p className="text-xs text-gray-500">
                                SubOrder: #{subOrder.subOrderNumber || subOrder._id.slice(-6)}
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
                              (String(subOrder.owner?._id ?? subOrder.owner) === String(user?._id)) &&
                              subOrder.status ===
                                "PENDING_CONFIRMATION" && (
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
                                    <span>Xác nhận</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      setConfirmAction(`reject-${subOrder._id}`)
                                    }
                                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 flex items-center space-x-1"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    <span>Từ chối</span>
                                  </button>
                                </div>
                              )}


                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Sản phẩm:</p>
                            <p className="font-medium">
                              {subOrder.products?.length || 0} sản phẩm
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Tổng tiền:</p>
                            <p className="font-medium">
                              {subOrder.pricing?.totalAmount?.toLocaleString(
                                "vi-VN"
                              )}
                              đ
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Cập nhật:</p>
                            <p className="font-medium">
                              {new Date(subOrder.updatedAt).toLocaleDateString(
                                "vi-VN"
                              )}
                            </p>
                          </div>
                        </div>

                        {subOrder.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm font-medium text-red-800">
                              Lý do từ chối:
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
                    <span>Danh sách sản phẩm ({currentOrder.subOrders?.reduce(
                      (sum, sub) => sum + (sub.products?.length || 0),
                      0
                    ) || 0})</span>
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
                                  Chủ cho thuê: {subOrder.owner?.profile?.fullName || "Không rõ"}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  productItem.productStatus || subOrder.status
                                )}`}
                              >
                                {getStatusText(productItem.productStatus || subOrder.status)}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                              <div>
                                <p className="text-xs text-gray-500">Số lượng</p>
                                <p className="font-semibold">{productItem.quantity}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Giá thuê</p>
                                <p className="font-semibold">
                                  {productItem.rentalRate?.toLocaleString("vi-VN")}đ
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Tiền cọc</p>
                                <p className="font-semibold">
                                  {productItem.depositRate?.toLocaleString("vi-VN")}đ
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Phí ship</p>
                                <p className="font-semibold">
                                  {productItem.totalShippingFee?.toLocaleString("vi-VN") || 0}đ
                                </p>
                              </div>
                            </div>

                            {productItem.rentalPeriod && (
                              <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(productItem.rentalPeriod.startDate).toLocaleDateString("vi-VN")} - {new Date(productItem.rentalPeriod.endDate).toLocaleDateString("vi-VN")}
                                </span>
                              </div>
                            )}

                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex justify-between items-center mb-3">
                                <div className="text-sm text-gray-600">
                                  <div>Tổng thuê: {productItem.totalRental?.toLocaleString("vi-VN")}đ</div>
                                  <div>Tổng cọc: {productItem.totalDeposit?.toLocaleString("vi-VN")}đ</div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">Tổng tiền</p>
                                  <p className="font-bold text-xl text-orange-600">
                                    {((productItem.totalRental || 0) + (productItem.totalDeposit || 0) + (productItem.totalShippingFee || 0)).toLocaleString("vi-VN")}đ
                                  </p>
                                </div>
                              </div>
                              
                              {/* Dispute button */}
                              {canCreateDispute(productItem.productStatus, subOrder) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateDispute(productItem, subOrder, idx);
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
                          {currentOrder.totalDepositAmount?.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tổng phí vận chuyển:</span>
                        <span className="font-semibold">
                          {currentOrder.totalShippingFee?.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-3 border-t">
                        <span>Tổng thanh toán:</span>
                        <span className="text-orange-600">
                          {(
                            (currentOrder.totalAmount || 0) +
                            (currentOrder.totalDepositAmount || 0) +
                            (currentOrder.totalShippingFee || 0)
                          ).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </div>
                  </div>
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
                  {(currentOrder.paymentStatus === "PAID" || currentOrder.paymentStatus === "PARTIALLY_PAID") && (
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentOrder.paymentStatus === "PAID" ? "bg-green-500" : "bg-blue-500"
                      }`}>
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {currentOrder.paymentStatus === "PAID" ? "Thanh toán hoàn tất" : "Thanh toán một phần"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {currentOrder.paymentStatus === "PAID" ? "Đã thanh toán thành công" : "Đã thanh toán cọc"}
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
          onSuccess={() => {
            setShowEarlyReturnModal(false);
            loadOrderDetail(id);
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
          rentalOrder={currentOrder}
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

      {/* Renter Shipment Modal */}
      {showShipmentModal && currentOrder && (
        <RenterShipmentModal
          isOpen={showShipmentModal}
          onClose={() => setShowShipmentModal(false)}
          masterOrderId={currentOrder._id}
        />
      )}


    </div>
  );
};

export default RentalOrderDetailPage;
