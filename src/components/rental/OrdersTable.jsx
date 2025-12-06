import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  FileText,
  PenTool,
  RotateCcw,
  Package,
  Calendar,
  DollarSign,
  Hash,
  Clock,
  Truck
} from "lucide-react";
import {
  getStatusColor,
  getStatusText,
  formatDate,
  calculateDuration,
  getEarlyReturnStatusColor,
  getEarlyReturnStatusText,
  formatDateTime
} from "../../utils/orderHelpers";

// Sub-components for better organization
const TableHeader = () => (
  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
    <tr>
      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
        <div className="flex items-center space-x-2">
          <Hash className="w-4 h-4" />
          <span>Mã đơn</span>
        </div>
      </th>
      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4" />
          <span>Ngày tạo</span>
        </div>
      </th>
      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4" />
          <span>Số sản phẩm</span>
        </div>
      </th>
      
      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden xl:table-cell">
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4" />
          <span>Giao hàng</span>
        </div>
      </th>
      <th className="px-4 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
        <div className="flex items-center justify-end space-x-2">
          <DollarSign className="w-4 h-4" />
          <span>Tổng tiền</span>
        </div>
      </th>
      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
        <span>Trạng thái</span>
      </th>
    </tr>
  </thead>
);

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${getStatusColor(
      status
    )}`}
    role="status"
    aria-label={`Trạng thái: ${getStatusText(status)}`}
  >
    {getStatusText(status)}
  </span>
);

const EarlyReturnBadge = ({ request }) => (
  <span
    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEarlyReturnStatusColor(
      request.status
    )}`}
    role="status"
    aria-label={`Trả sớm: ${getEarlyReturnStatusText(request.status)}`}
  >
    {getEarlyReturnStatusText(request.status)}
  </span>
);

const ActionButton = ({
  onClick,
  children,
  variant = "primary",
  icon: Icon,
  disabled = false,
  title
}) => {
  const baseClasses = "inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    warning: "bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500",
    danger: "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${Icon ? 'space-x-2' : ''}`}
      title={title}
      aria-label={title}
    >
      {Icon && <Icon className="w-3 h-3" />}
      <span>{children}</span>
    </button>
  );
};

const OrderRow = ({
  order,
  onViewDetail,
  onEarlyReturn,
  onSelectOrder,
  earlyReturnRequest,
  navigate
}) => {
  // Check if subOrder has any products with ACTIVE status
  const hasActiveProducts = useMemo(() => {
    if (!order.subOrders || !order.subOrders[0]) return false;
    const subOrder = order.subOrders[0];
    return subOrder.products?.some(p => p.productStatus === 'ACTIVE') || false;
  }, [order.subOrders]);

  const totalAmount = useMemo(() => {
    return (
      (order.totalAmount || 0) +
      (order.totalDepositAmount || 0) +
      (order.totalShippingFee || 0)
    );
  }, [order]);

  const itemCount = useMemo(() => {
    return order.subOrders?.reduce(
      (sum, sub) => sum + (sub.products?.length || 0),
      0
    ) || 0;
  }, [order.subOrders]);

  const rentalDuration = useMemo(() => {
    if (order.rentalPeriod?.startDate && order.rentalPeriod?.endDate) {
      return calculateDuration(
        order.rentalPeriod.startDate,
        order.rentalPeriod.endDate
      );
    }
    return null;
  }, [order.rentalPeriod]);

  const renderDetailActions = () => {
    return (
      <ActionButton
        onClick={() => onViewDetail(order)}
        variant="primary"
        icon={Eye}  
        title="Xem chi tiết đơn hàng đã tạo"
      >
        Chi tiết
      </ActionButton>
    );
  };

  const renderStatusActions = () => {
    const actions = [];

    // ✅ MODIFIED: Kiểm tra nếu có SubOrder READY_FOR_CONTRACT (không cần chờ tất cả MasterOrder status)
    const hasReadyForContractSubOrder = order.subOrders?.some(
      (sub) => sub.status === 'READY_FOR_CONTRACT'
    );

    // Confirmation details button - show when pending confirmation or when ready for contract
    if (
      order.status === "PENDING_CONFIRMATION" ||
      order.status === "CONFIRMED" ||
      order.status === "PARTIALLY_CANCELLED" ||
      order.status === "CONTRACT_SIGNED" ||
      hasReadyForContractSubOrder
    ) {
      actions.push(
        <ActionButton
          key="confirmation"
          onClick={() => navigate(`/rental-orders/${order._id}/confirmation-summary`)}
          variant="secondary"
          icon={FileText}
          title="Xem chi tiết xác nhận của chủ"
        >
           chi tiết xác nhận
        </ActionButton>
      );
    }

    // Contract Signing - show when any suborder is ready for contract
    if (hasReadyForContractSubOrder) {
      actions.push(
        <ActionButton
          key="contract"
          onClick={() => {
            // Tìm SubOrder READY_FOR_CONTRACT đầu tiên để lấy contractId
            const readySubOrder = order?.subOrders?.find(
              (sub) => sub.status === 'READY_FOR_CONTRACT'
            );
            if (readySubOrder?.contract) {
              navigate(`/rental-orders/contracts?contractId=${readySubOrder.contract}`);
            } else {
              navigate("/rental-orders/contracts");
            }
          }}
          variant="success"
          icon={PenTool}
          title="Ký hợp đồng"
        >
          Ký HĐ
        </ActionButton>
      );
    }



    // Early Return - Only show if has products with ACTIVE status
    if (order.subOrders?.[0] && hasActiveProducts) {
      if (earlyReturnRequest) {
        actions.push(
          <EarlyReturnBadge key="early-return-status" request={earlyReturnRequest} />
        );
      } else {
        actions.push(
          <ActionButton
            key="early-return"
            onClick={() => onEarlyReturn(order.subOrders[0])}
            variant="warning"
            icon={RotateCcw}
            title="Trả hàng sớm"
          >
            Trả sớm
          </ActionButton>
        );
      }
    }

    return actions.length > 0 ? actions : null;
  };

  return (
    <tr 
      onClick={() => navigate(`/rental-orders/${order._id}`)}
      className="hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 cursor-pointer"
    >
      {/* Order Number */}
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="text-sm font-semibold text-gray-900">
            {order.masterOrderNumber}
          </div>
        </div>
      </td>

      {/* Created Date - Hidden on mobile */}
      <td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">
        <div className="text-sm text-gray-600">
          {formatDateTime(order.createdAt)}
        </div>
      </td>

      {/* Item Count - Hidden on mobile/tablet */}
      <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
        <div className="text-sm text-gray-700 font-medium">
          {itemCount} sản phẩm
        </div>
      </td>

    

      {/* Delivery Method - Hidden on mobile */}
      <td className="px-4 py-4 whitespace-nowrap hidden xl:table-cell">
        <div className="text-sm text-gray-700">
          {order.deliveryMethod === "PICKUP" ? "Nhận trực tiếp" : "Giao tận nơi"}
        </div>
      </td>

      {/* Total Amount */}
      <td className="px-4 py-4 whitespace-nowrap text-right">
        <div className="text-sm font-bold text-orange-600">
          {totalAmount.toLocaleString("vi-VN")}đ
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-4 whitespace-nowrap">
        <StatusBadge status={order.status} />
      </td>
    </tr>
  );
};

const OrdersTable = ({
  orders = [],
  onViewDetail,
  onEarlyReturn,
  earlyReturnRequests = [],
  isLoading = false,
  error = null,
  onRenterConfirm,
  onSelectOrder,
}) => {
  const navigate = useNavigate();

  // Memoized early return requests lookup for performance
  const earlyReturnMap = useMemo(() => {
    const map = new Map();
    earlyReturnRequests.forEach((req) => {
      if (req.subOrder && req.status !== "CANCELLED") {
        const subOrderId = req.subOrder?._id?.toString() || req.subOrder?.toString() || req.subOrder;
        map.set(subOrderId, req);
      }
    });
    return map;
  }, [earlyReturnRequests]);

  const getOrderEarlyReturnRequest = (order) => {
    if (!order.subOrders || !order.subOrders[0]) return null;
    const subOrderId = order.subOrders[0]._id?.toString() || order.subOrders[0]._id;
    return earlyReturnMap.get(subOrderId) || null;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 font-medium mb-2">Có lỗi xảy ra</div>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-gray-600">Đang tải danh sách đơn hàng...</div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <div className="text-gray-500 font-medium mb-2">Không có đơn hàng nào</div>
        <div className="text-gray-400 text-sm">
          Bạn chưa có đơn hàng thuê nào. Hãy bắt đầu thuê sản phẩm!
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Mobile Header - Show on small screens */}
      <div className="sm:hidden bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Danh sách đơn hàng ({orders.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <TableHeader />
          <tbody className="bg-white divide-y divide-gray-100">
            {orders.map((order) => (
              <OrderRow
                key={order._id}
                order={order}
                onViewDetail={onViewDetail}
                onEarlyReturn={onEarlyReturn}
                onSelectOrder={onSelectOrder}
                earlyReturnRequest={getOrderEarlyReturnRequest(order)}
                navigate={navigate}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
          <div className="mb-2 sm:mb-0">
            Hiển thị {orders.length} đơn hàng
          </div>
          <div className="text-xs text-gray-500">
            Cuộn ngang để xem thêm thông tin trên thiết bị nhỏ
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersTable;
