import React from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import {
  getStatusColor,
  getStatusText,
  formatDate,
  calculateDuration,
  getEarlyReturnStatusColor,
  getEarlyReturnStatusText,
} from "../../utils/orderHelpers";

const OrdersTable = ({
  orders,
  onViewDetail,
  onEarlyReturn,
  earlyReturnRequests,
  onRenterConfirm,
}) => {
  const navigate = useNavigate();

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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Mã đơn
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ngày tạo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Số mục
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thời gian
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Giao hàng
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tổng
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {order.masterOrderNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(order.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {order.subOrders?.reduce(
                  (sum, sub) => sum + (sub.products?.length || 0),
                  0
                ) || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {order.rentalPeriod?.startDate &&
                order.rentalPeriod?.endDate ? (
                  <span>
                    {calculateDuration(
                      order.rentalPeriod.startDate,
                      order.rentalPeriod.endDate
                    )}{" "}
                    ngày
                  </span>
                ) : (
                  <span className="text-sm text-blue-600">Nhiều thời gian</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {order.deliveryMethod === "PICKUP"
                  ? "Nhận trực tiếp"
                  : "Giao tận nơi"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-orange-600">
                {(
                  (order.totalAmount || 0) +
                  (order.totalDepositAmount || 0) +
                  (order.totalShippingFee || 0)
                ).toLocaleString("vi-VN")}
                đ
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusText(order.status)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => onViewDetail(order)}
                    className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Xem
                  </button>
                  {/* Renter confirm: always show button next to 'Xem' (disabled when all subOrders already DELIVERED) */}
                  {onRenterConfirm && (
                    <button
                      onClick={() => {
                        // choose first subOrder that is not yet DELIVERED to confirm
                        const candidate = order.subOrders?.find((s) => s.status !== 'DELIVERED');
                        if (!candidate) return;
                        onRenterConfirm(candidate._id);
                      }}
                      disabled={
                        !order.subOrders || order.subOrders.length === 0 ||
                        order.subOrders.every((s) => s.status === 'DELIVERED')
                      }
                      className={`text-sm px-3 py-1 rounded text-white ${
                        order.subOrders && order.subOrders.every((s) => s.status === 'DELIVERED')
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      Xác nhận đã nhận
                    </button>
                  )}
                  {(order.status === "CONFIRMED" ||
                    order.status === "PARTIALLY_CANCELLED") && (
                    <button
                      onClick={() =>
                        navigate(
                          `/rental-orders/${order._id}/confirmation-summary`
                        )
                      }
                      className="text-sm bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      Chi tiết XN
                    </button>
                  )}
                  {order.status === "READY_FOR_CONTRACT" && (
                    <button
                      onClick={() => navigate("/rental-orders/contracts")}
                      className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Ký HĐ
                    </button>
                  )}
                  {order.status === "ACTIVE" &&
                    order.subOrders?.[0] &&
                    (() => {
                      const earlyReturnRequest =
                        getOrderEarlyReturnRequest(order);
                      if (earlyReturnRequest) {
                        return (
                          <div className="flex items-center space-x-1">
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-medium ${getEarlyReturnStatusColor(
                                earlyReturnRequest.status
                              )}`}
                            >
                              {getEarlyReturnStatusText(
                                earlyReturnRequest.status
                              )}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <button
                          onClick={() => onEarlyReturn(order.subOrders[0])}
                          className="text-sm bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 flex items-center space-x-1"
                          title="Trả hàng sớm"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Trả sớm</span>
                        </button>
                      );
                    })()}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTable;
