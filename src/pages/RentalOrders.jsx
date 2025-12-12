import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useRentalOrder } from "../context/RentalOrderContext";
import { toast } from "../components/common/Toast";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../context/CartContext";
import { useI18n } from "../hooks/useI18n";
import api from "../services/api";
import earlyReturnApi from "../services/earlyReturn.Api";
import rentalOrderService from "../services/rentalOrder";
import EarlyReturnRequestModal from "../components/rental/EarlyReturnRequestModal";
import ExtendRentalModal from "../components/rental/ExtendRentalModal";
import RenterShipmentModal from "../components/rental/RenterShipmentModal";
import OrderFilters from "../components/rental/OrderFilters";
import OrdersTable from "../components/rental/OrdersTable";
import OrderDetailModal from "../components/rental/OrderDetailModal";
import { Package } from "lucide-react";
import useOrderSocket from "../hooks/useOrderSocket";

const RentalOrdersPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const { myOrders, isLoadingOrders, pagination, loadMyOrders } =
    useRentalOrder();

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEarlyReturnModal, setShowEarlyReturnModal] = useState(false);
  const [showExtendRentalModal, setShowExtendRentalModal] = useState(false);
  const [selectedSubOrder, setSelectedSubOrder] = useState(null);
  const [earlyReturnRequests, setEarlyReturnRequests] = useState([]);

  // Initialize WebSocket connection with callbacks to reload
  const { isConnected } = useOrderSocket({
    onOrderCreated: () => {
      loadMyOrders({ status: statusFilter !== "all" ? statusFilter : undefined });
    },
    onOrderStatusChanged: () => {
      loadMyOrders({ status: statusFilter !== "all" ? statusFilter : undefined });
      loadEarlyReturnRequests();
    },
    onContractSigned: () => {
      loadMyOrders({ status: statusFilter !== "all" ? statusFilter : undefined });
    },
    onContractCompleted: () => {
      loadMyOrders({ status: statusFilter !== "all" ? statusFilter : undefined });
    },
    onShipmentUpdate: () => {
      loadMyOrders({ status: statusFilter !== "all" ? statusFilter : undefined });
    },
  });

  // Load orders on mount and status change
  useEffect(() => {
    loadMyOrders({ status: statusFilter !== "all" ? statusFilter : undefined });
    loadEarlyReturnRequests();
  }, [statusFilter]);

  // Load early return requests
  const loadEarlyReturnRequests = async () => {
    try {
      const response = await earlyReturnApi.getRenterRequests();

      // Check both data.requests and metadata.requests for compatibility
      const requests =
        response.data?.requests || response.metadata?.requests || [];
      setEarlyReturnRequests(requests);
    } catch (error) {
      console.error("Failed to load early return requests:", error);
    }
  };

  // Check for success messages from navigation state or URL params
  useEffect(() => {
    // Check for payment return from PayOS
    const paymentStatus = searchParams.get("payment");
    const orderCode = searchParams.get("orderCode");
    const orderId = searchParams.get("orderId");

    if (paymentStatus === "success" && orderCode && orderId) {
      // Verify payment with backend using api service
      const verifyPayment = async () => {
        try {
          // Use api service which automatically includes auth headers
          const response = await api.post(
            `/rental-orders/${orderId}/verify-payment`,
            {
              orderCode,
            }
          );

          if (response.data.success) {
            // Clear cart after successful payment
            clearCart();

            // Show success notification with rich message
            const order = response.data.data?.order;
            const orderNumber = order?.masterOrderNumber || "";

            toast.success(
              `🎉 Thanh toán thành công!\n\n` +
                `Đơn hàng ${orderNumber} đã được xác nhận.\n` +
                `Chủ sản phẩm sẽ xác nhận trong vòng 24h.`,
              {
                duration: 6000,
                style: {
                  maxWidth: "500px",
                  padding: "16px",
                },
              }
            );
          } else {
            toast.error(
              "⚠️ Xác nhận thanh toán thất bại. Vui lòng liên hệ hỗ trợ.",
              { duration: 5000 }
            );
          }
        } catch (error) {
          // Check if already verified
          if (error.response?.data?.message?.includes("đã được thanh toán")) {
            // Clear cart for already verified orders too
            clearCart();
            toast.success("✅ Đơn hàng đã được thanh toán thành công!", {
              duration: 5000,
            });
          } else {
            toast.error(
              "⚠️ Lỗi xác nhận thanh toán. Vui lòng kiểm tra lại đơn hàng.",
              { duration: 5000 }
            );
          }
        } finally {
          // Reload orders to show updated status
          loadMyOrders({
            status: statusFilter !== "all" ? statusFilter : undefined,
          });

          // Clear URL params
          navigate("/rental-orders", { replace: true });
        }
      };

      verifyPayment();
      return;
    }

    if (paymentStatus === "cancel" && orderCode) {
      toast.error("❌ Thanh toán đã bị hủy.", { duration: 5000 });
      navigate("/rental-orders", { replace: true });
      return;
    }

    // Check for message from navigation state (from order creation)
    if (location.state?.message && location.state?.justCreated) {
      toast.success(
        `🎉 ${location.state.message}\n\nĐơn hàng đã được tạo và sẽ hiển thị trong danh sách bên dưới.`,
        {
          duration: 8000,
          style: {
            maxWidth: "500px",
            padding: "16px",
          },
        }
      );

      // Clear the state to prevent showing message again
      navigate("/rental-orders", { replace: true });
      return;
    }
    const formatTime = (timeStr) => {
      const date = new Date(timeStr);
      return date.toLocaleString();
    };

    // Check for success messages from URL params
    const signed = searchParams.get("signed");
    if (signed === "true") {
      // Show success notification
      toast.success("✅ Ký hợp đồng thành công!", { duration: 5000 });
    }
  }, [searchParams]);

  // Helper function to check if order has an early return request
  const getOrderEarlyReturnRequest = (order) => {
    if (!order.subOrders || !order.subOrders[0]) return null;
    const subOrderId =
      order.subOrders[0]._id?.toString() || order.subOrders[0]._id;

    const found = earlyReturnRequests.find((req) => {
      const reqSubOrderId =
        req.subOrder?._id?.toString() ||
        req.subOrder?.toString() ||
        req.subOrder;
      return reqSubOrderId === subOrderId && req.status !== "CANCELLED";
    });

    return found;
  };

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleRenterConfirm = async (subOrderId) => {
    try {
      toast.loading("Đang gửi xác nhận...");
      await rentalOrderService.renterConfirmDelivered(subOrderId);
      toast.dismiss();
      toast.success("Bạn đã xác nhận đã nhận hàng.");
      // reload orders and early return requests
      loadMyOrders({
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      loadEarlyReturnRequests();
    } catch (error) {
      toast.dismiss();
      console.error("Renter confirm failed", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Không thể xác nhận đã nhận hàng"
      );
    }
  };

  const handleEarlyReturn = (subOrder) => {
    setSelectedSubOrder(subOrder);
    setShowEarlyReturnModal(true);
  };

  const handleExtendRental = (order) => {
    setSelectedOrder(order);
    setShowExtendRentalModal(true);
    setShowDetailModal(false);
  };

  const closeDetailModal = () => {
    setSelectedOrder(null);
    setShowDetailModal(false);
  };

  const handleShipmentConfirmReceived = async () => {
    // Reload orders and early returns
    await loadMyOrders({
      status: statusFilter !== "all" ? statusFilter : undefined,
    });
    loadEarlyReturnRequests();
  };

  const currentOrders = myOrders;
  const currentPagination = pagination.myOrders || {};

  const filteredOrders = (currentOrders || []).filter((order) => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const orderNumber = order.masterOrderNumber;

      return (
        orderNumber.toLowerCase().includes(searchLower) ||
        order.subOrders?.some((sub) =>
          sub.products?.some((p) =>
            p.product.name.toLowerCase().includes(searchLower)
          )
        )
      );
    }
    return true;
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('common.confirm')}</h2>
          <p className="text-gray-600 mb-4">
            {t('rentalOrders.noBrowseRentals')}
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            {t('rentalOrders.login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('rentalOrders.title')}</h1>
          <p className="text-gray-600">
            {t('rentalOrders.subtitle')}
          </p>
        </div>

        {/* Content */}
        <>
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <div className="px-6 py-4">
                <h2 className="text-xl font-semibold text-blue-600">
                  {t('rentalOrders.myRentals')} ({(myOrders || []).length})
                </h2>
              </div>
            </div>

            {/* Filters */}
            <OrderFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              filteredCount={filteredOrders.length}
              totalCount={(currentOrders || []).length}
            />
          </div>

          {/* Orders List */}
          {isLoadingOrders ? (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-3">{t('rentalOrders.loading')}</span>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchQuery || statusFilter !== "all"
                  ? t('rentalOrders.notFound')
                  : t('rentalOrders.noRentals')}
              </h3>
              <p className="text-gray-500 mb-4">
                {t('rentalOrders.noRentalsDesc')}
              </p>
              <button
                onClick={() => navigate("/products")}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              >
                {t('rentalOrders.viewProducts')}
              </button>
            </div>
          ) : (
            <OrdersTable
              orders={filteredOrders}
              onViewDetail={handleViewDetail}
              onEarlyReturn={handleEarlyReturn}
              onSelectOrder={setSelectedOrder}
              earlyReturnRequests={earlyReturnRequests}
              onRenterConfirm={handleRenterConfirm}
            />
          )}

          {/* Pagination */}
          {currentPagination.pages && currentPagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-2">
              <button
                onClick={() => {
                  const newPage = Math.max(
                    1,
                    (currentPagination.page || 1) - 1
                  );
                  loadMyOrders({
                    page: newPage,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                  });
                }}
                disabled={(currentPagination.page || 1) === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {t('rentalOrders.pagination.previous')}
              </button>

              <span className="px-4 py-2">
                {t('rentalOrders.pagination.page')} {currentPagination.page || 1} {t('rentalOrders.pagination.of')}
                {" "}
                {currentPagination.pages || 1}
              </span>

              <button
                onClick={() => {
                  const newPage = Math.min(
                    currentPagination.pages || 1,
                    (currentPagination.page || 1) + 1
                  );
                  loadMyOrders({
                    page: newPage,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                  });
                }}
                disabled={
                  (currentPagination.page || 1) ===
                  (currentPagination.pages || 1)
                }
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {t('rentalOrders.pagination.next')}
              </button>
            </div>
          )}
        </>

        {/* Detail Modal */}
        {showDetailModal && selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={closeDetailModal}
            onEarlyReturn={handleEarlyReturn}
            onExtendRental={handleExtendRental}
            earlyReturnRequest={getOrderEarlyReturnRequest(selectedOrder)}
          />
        )}

        {/* Early Return Modal */}
        {showEarlyReturnModal && selectedSubOrder && (
          <EarlyReturnRequestModal
            isOpen={showEarlyReturnModal}
            onClose={() => {
              setShowEarlyReturnModal(false);
              setSelectedSubOrder(null);
            }}
            subOrder={selectedSubOrder}
            userAddresses={user.addresses || []}
            onSuccess={() => {
              setShowEarlyReturnModal(false);
              setSelectedSubOrder(null);
              loadMyOrders({
                status: statusFilter !== "all" ? statusFilter : undefined,
              });
              loadEarlyReturnRequests();
              toast.success(t('rentalOrders.earlyReturn.requestEarlyReturn'));
            }}
          />
        )}

        {/* Extend Rental Modal */}
        {showExtendRentalModal && selectedOrder && (
          <ExtendRentalModal
            isOpen={showExtendRentalModal}
            onClose={() => {
              setShowExtendRentalModal(false);
              setSelectedOrder(null);
            }}
            masterOrder={selectedOrder}
            onSuccess={() => {
              setShowExtendRentalModal(false);
              setSelectedOrder(null);
              loadMyOrders({
                status: statusFilter !== "all" ? statusFilter : undefined,
              });
              toast.success(t('rentalOrders.extendRental.successMessage'));
            }}
          />
        )}
      </div>
    </div>
  );
};

export default RentalOrdersPage;
