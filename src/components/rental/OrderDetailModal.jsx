import React from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Calendar,
  MapPin,
  DollarSign,
  User,
  Phone,
  Mail,
  FileText,
  RotateCcw,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { ownerProductApi } from "../../services/ownerProduct.Api";
import { toast } from "react-hot-toast";
import {
  getStatusColor,
  getStatusText,
  formatDate,
  formatDateTime,
  calculateDuration,
  getEarlyReturnStatusColor,
  getEarlyReturnStatusText,
} from "../../utils/orderHelpers";

const OrderDetailModal = ({
  order,
  onClose,
  onEarlyReturn,
  onExtendRental,
  earlyReturnRequest,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!order) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold">
              Chi tiết đơn thuê #{order.masterOrderNumber}
            </h2>
            <p className="text-gray-600">
              Tạo ngày {formatDateTime(order.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Thông tin đơn hàng</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Thời gian thuê</p>
                  {order.rentalPeriod?.startDate &&
                  order.rentalPeriod?.endDate ? (
                    <>
                      <p className="font-medium">
                        {calculateDuration(
                          order.rentalPeriod.startDate,
                          order.rentalPeriod.endDate
                        )}{" "}
                        ngày
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(order.rentalPeriod.startDate)} -{" "}
                        {formatDate(order.rentalPeriod.endDate)}
                      </p>
                    </>
                  ) : (
                    <p className="font-medium text-blue-600">
                      Nhiều thời gian khác nhau
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Giao hàng</p>
                  <p className="font-medium">
                    {order.deliveryMethod === "PICKUP"
                      ? "Nhận trực tiếp"
                      : "Giao tận nơi"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusText(order.status)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">
                    Phương thức thanh toán
                  </p>
                  <p className="font-medium">
                    {order.paymentMethod === "WALLET"
                      ? "Ví điện tử"
                      : order.paymentMethod === "PAYOS"
                      ? "Chuyển khoản"
                      : order.paymentMethod === "COD"
                      ? "Thanh toán khi nhận hàng"
                      : order.paymentMethod}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sub Orders */}
          {order.subOrders && order.subOrders.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">
                Chi tiết từng chủ cho thuê ({order.subOrders.length})
              </h3>
              <div className="space-y-4">
                {order.subOrders.map((subOrder, index) => (
                  <div
                    key={subOrder._id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    {/* Sub Order Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          Chủ thuê #{index + 1}
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${getStatusColor(
                            subOrder.status
                          )}`}
                        >
                          {getStatusText(subOrder.status)}
                        </span>
                      </div>
                    </div>

                    {/* Owner Info */}
                    <div className="bg-gray-50 rounded p-3 mb-4">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium">
                            {subOrder.owner?.profile?.firstName ||
                              "Không rõ tên"}{" "}
                            {subOrder.owner?.profile?.lastName || ""}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            {subOrder.owner?.profile?.phoneNumber && (
                              <div className="flex items-center space-x-1">
                                <Phone className="w-4 h-4" />
                                <span>
                                  {subOrder.owner.profile.phoneNumber}
                                </span>
                              </div>
                            )}
                            {subOrder.owner?.email && (
                              <div className="flex items-center space-x-1">
                                <Mail className="w-4 h-4" />
                                <span>{subOrder.owner.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Owner actions (accept/reject) - show only to the owner when pending */}
                    {user &&
                      subOrder.owner &&
                      (subOrder.owner._id === user._id ||
                        subOrder.owner === user._id) &&
                      subOrder.status === "PENDING_OWNER_CONFIRMATION" && (
                        <div className="mt-3 flex items-center space-x-2">
                          <button
                            onClick={async () => {
                              try {
                                await ownerProductApi.confirmSubOrder(
                                  subOrder._id
                                );
                                toast.success("Đã chấp nhận đơn thuê");
                                onClose();
                              } catch (err) {
                                console.error("Lỗi chấp nhận đơn:", err);
                                toast.error(
                                  err?.response?.data?.message ||
                                    err?.message ||
                                    "Không thể chấp nhận đơn"
                                );
                              }
                            }}
                            className="px-4 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                          >
                            ✓ Chấp nhận
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const reason = window.prompt(
                                  "Nhập lý do từ chối (tùy chọn):"
                                );
                                await ownerProductApi.rejectSubOrder(
                                  subOrder._id,
                                  { reason }
                                );
                                toast.success("Đã từ chối đơn thuê");
                                onClose();
                              } catch (err) {
                                console.error("Lỗi từ chối đơn:", err);
                                toast.error(
                                  err?.response?.data?.message ||
                                    err?.message ||
                                    "Không thể từ chối đơn"
                                );
                              }
                            }}
                            className="px-4 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                          >
                            ✗ Từ chối
                          </button>
                        </div>
                      )}

                    {/* Products */}
                    {subOrder.products && subOrder.products.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">
                          Sản phẩm ({subOrder.products.length})
                        </h4>
                        <div className="space-y-3">
                          {subOrder.products.map(
                            (productItem, productIndex) => (
                              <div
                                key={`${productItem.product._id}-${productIndex}`}
                                className="flex items-start space-x-4 bg-white border rounded p-3"
                              >
                                <img
                                  src={
                                    productItem.product.images?.[0]?.url ||
                                    "/placeholder.jpg"
                                  }
                                  alt={productItem.product.name}
                                  className="w-16 h-16 object-cover rounded"
                                />
                                <div className="flex-1">
                                  <h5 className="font-medium">
                                    {productItem.product.name}
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    Số lượng: {productItem.quantity}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Giá thuê:{" "}
                                    {productItem.rentalRate?.toLocaleString(
                                      "vi-VN"
                                    )}
                                    đ/ngày
                                  </p>
                                  {productItem.rentalPeriod && (
                                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                      <div className="flex items-center space-x-1 text-blue-700">
                                        <Calendar className="w-4 h-4" />
                                        <span className="font-medium">
                                          Thời gian thuê:
                                        </span>
                                      </div>
                                      <p className="text-blue-600 mt-1">
                                        {formatDate(
                                          productItem.rentalPeriod.startDate
                                        )}{" "}
                                        -{" "}
                                        {formatDate(
                                          productItem.rentalPeriod.endDate
                                        )}
                                      </p>
                                      <p className="text-blue-600 text-xs">
                                        (
                                        {productItem.rentalPeriod.duration
                                          ?.value ||
                                          calculateDuration(
                                            productItem.rentalPeriod.startDate,
                                            productItem.rentalPeriod.endDate
                                          )}{" "}
                                        ngày)
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-blue-600">
                                    {productItem.totalRental?.toLocaleString(
                                      "vi-VN"
                                    )}
                                    đ
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Tiền thuê
                                  </p>
                                  {productItem.totalDeposit > 0 && (
                                    <p className="text-sm text-orange-600">
                                      +
                                      {productItem.totalDeposit?.toLocaleString(
                                        "vi-VN"
                                      )}
                                      đ cọc
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>

                        {/* Sub Order Total */}
                        <div className="mt-4 p-3 bg-gray-50 rounded">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Tổng tiền thuê:</span>
                            <span className="font-bold text-blue-600">
                              {subOrder.pricing?.totalRental?.toLocaleString(
                                "vi-VN"
                              )}
                              đ
                            </span>
                          </div>
                          {subOrder.pricing?.totalDeposit > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="font-medium">
                                Tổng tiền cọc:
                              </span>
                              <span className="font-bold text-orange-600">
                                {subOrder.pricing?.totalDeposit?.toLocaleString(
                                  "vi-VN"
                                )}
                                đ
                              </span>
                            </div>
                          )}
                          {subOrder.pricing?.shippingFee >= 0 && (
                            <div className="space-y-1">
                              {/* Original shipping fee */}
                              {(subOrder.shipping?.fee?.totalFee > 0 ||
                                subOrder.shipping?.fee?.promotionDiscount > 0 ||
                                subOrder.shipping?.fee?.voucherDiscount >
                                  0) && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">
                                    Phí ship gốc:
                                  </span>
                                  <span className="text-gray-600">
                                    {(
                                      subOrder.shipping?.fee?.totalFee || 0
                                    )?.toLocaleString("vi-VN")}
                                    đ
                                  </span>
                                </div>
                              )}

                              {/* System promotion discount */}
                              {subOrder.shipping?.fee?.promotionDiscount >
                                0 && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-green-600">
                                    Giảm giá khuyến mãi:
                                  </span>
                                  <span className="text-green-600">
                                    -
                                    {subOrder.shipping.fee.promotionDiscount?.toLocaleString(
                                      "vi-VN"
                                    )}
                                    đ
                                  </span>
                                </div>
                              )}

                              {/* Voucher discount */}
                              {subOrder.shipping?.fee?.voucherDiscount > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-green-600">
                                    Giảm giá voucher (
                                    {subOrder.appliedVoucher?.voucherCode}):
                                  </span>
                                  <span className="text-green-600">
                                    -
                                    {subOrder.shipping.fee.voucherDiscount?.toLocaleString(
                                      "vi-VN"
                                    )}
                                    đ
                                  </span>
                                </div>
                              )}

                              {/* Final shipping fee */}
                              <div className="flex justify-between items-center">
                                <span className="font-medium">
                                  Phí vận chuyển{" "}
                                  {subOrder.shipping?.fee?.promotionDiscount >
                                    0 ||
                                  subOrder.shipping?.fee?.voucherDiscount > 0
                                    ? "sau giảm"
                                    : ""}
                                  :
                                </span>
                                <span className="font-medium">
                                  {subOrder.pricing?.shippingFee?.toLocaleString(
                                    "vi-VN"
                                  )}
                                  đ
                                </span>
                              </div>
                            </div>
                          )}

                          {/* COD Payment Status */}
                          {order.paymentMethod === "COD" && (
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                              <div className="flex items-center space-x-2 mb-2">
                                <DollarSign className="w-4 h-4 text-amber-600" />
                                <span className="font-medium text-amber-800">
                                  Thanh toán khi nhận hàng
                                </span>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Đã thanh toán cọc:</span>
                                  <span className="font-medium text-green-600">
                                    {subOrder.pricing?.subtotalDeposit?.toLocaleString(
                                      "vi-VN"
                                    )}
                                    đ
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Còn phải trả:</span>
                                  <span className="font-bold text-red-600">
                                    {(
                                      (subOrder.pricing?.subtotalRental || 0) +
                                      (subOrder.pricing?.shippingFee || 0)
                                    )?.toLocaleString("vi-VN")}
                                    đ
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold">
                                Tổng thanh toán:
                              </span>
                              <span className="font-bold text-lg text-green-600">
                                {subOrder.pricing?.totalAmount?.toLocaleString(
                                  "vi-VN"
                                )}
                                đ
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Total */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">
              Tổng thanh toán đơn hàng
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Tổng tiền thuê:</span>
                <span className="font-bold text-blue-600">
                  {order.totalAmount?.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Tổng tiền cọc:</span>
                <span className="font-bold text-orange-600">
                  {order.totalDepositAmount?.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Phí vận chuyển:</span>
                <span className="font-medium">
                  {order.totalShippingFee?.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">Tổng cộng:</span>
                  <span className="text-xl font-bold text-green-600">
                    {(
                      order.totalAmount +
                      order.totalDepositAmount +
                      order.totalShippingFee
                    )?.toLocaleString("vi-VN")}
                    đ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          {order.status === "READY_FOR_CONTRACT" && (
            <button
              onClick={() => {
                onClose();
                navigate("/rental-orders/contracts");
              }}
              className="flex items-center space-x-2 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
            >
              <FileText className="w-4 h-4" />
              <span>Ký hợp đồng</span>
            </button>
          )}
          {order.subOrders?.[0] &&
            order.subOrders[0].products?.some(
              (p) => p.productStatus === "ACTIVE"
            ) &&
            (() => {
              if (earlyReturnRequest) {
                return (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <span
                      className={`px-4 py-2 rounded-lg font-medium ${getEarlyReturnStatusColor(
                        earlyReturnRequest.status
                      )}`}
                    >
                      {getEarlyReturnStatusText(earlyReturnRequest.status)}
                    </span>
                  </div>
                );
              }
              return (
                <>
                  <button
                    onClick={() => onExtendRental(order)}
                    className="flex items-center space-x-2 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Gia hạn</span>
                  </button>
                  <button
                    onClick={() => {
                      onEarlyReturn(order.subOrders[0]);
                      onClose();
                    }}
                    className="flex items-center space-x-2 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Trả hàng sớm</span>
                  </button>
                </>
              );
            })()}
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
