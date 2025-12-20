import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  MapPin,
  User,
  Calendar,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  Package,
  MessageSquare,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";
import earlyReturnApi from "../../services/earlyReturn.Api";

/**
 * Early Return Requests Section for Owners
 * Displays pending early return requests and allows owners to confirm/manage them
 */
const EarlyReturnRequestsSection = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState({
    notes: "",
    qualityCheck: {
      condition: "EXCELLENT",
      notes: "",
      photos: [],
    },
  });

  useEffect(() => {
    fetchEarlyReturnRequests();
  }, []);

  const fetchEarlyReturnRequests = async () => {
    try {
      setLoading(true);
      console.log("[EarlyReturnRequestsSection] Fetching owner requests...");
      const response = await earlyReturnApi.getOwnerRequests({
        page: 1,
        limit: 50,
      });

      console.log("[EarlyReturnRequestsSection] API response:", response);

      // Check both data.requests and metadata.requests for compatibility
      const requests =
        response.data?.requests || response.metadata?.requests || [];

      if (requests.length > 0) {
        console.log(
          "[EarlyReturnRequestsSection] Setting requests:",
          requests.length
        );
        setRequests(requests);
      } else {
        console.log("[EarlyReturnRequestsSection] No requests found");
        setRequests([]);
      }
    } catch (error) {
      console.error(
        "[EarlyReturnRequestsSection] Error fetching requests:",
        error
      );
      setRequests([]);
      // Don't show error toast if it's just empty or not found
      if (error.response?.status !== 404) {
        toast.error("Không thể tải yêu cầu trả sớm");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!selectedRequest) return;

    try {
      await earlyReturnApi.confirmReturn(selectedRequest._id, confirmData);
      toast.success("✅ Đã xác nhận nhận hàng và hoàn cọc!");
      setShowConfirmModal(false);
      setSelectedRequest(null);
      setConfirmData({
        notes: "",
        qualityCheck: {
          condition: "EXCELLENT",
          notes: "",
          photos: [],
        },
      });
      fetchEarlyReturnRequests();
    } catch (error) {
      console.error("Confirm return error:", error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi xác nhận"
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const getStatusConfig = (status) => {
    const configs = {
      PENDING: {
        label: "Chờ Xác Nhận",
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: Clock,
      },
      ACKNOWLEDGED: {
        label: "Đã Xác Nhận",
        color: "bg-blue-100 text-blue-800 border-blue-300",
        icon: CheckCircle,
      },
      RETURNED: {
        label: "Đã Trả Hàng",
        color: "bg-green-100 text-green-800 border-green-300",
        icon: Package,
      },
      COMPLETED: {
        label: "Hoàn Thành",
        color: "bg-green-100 text-green-800 border-green-300",
        icon: CheckCircle,
      },
      AUTO_COMPLETED: {
        label: "Tự Động Hoàn Thành",
        color: "bg-purple-100 text-purple-800 border-purple-300",
        icon: CheckCircle,
      },
      CANCELLED: {
        label: "Đã Hủy",
        color: "bg-gray-100 text-gray-800 border-gray-300",
        icon: XCircle,
      },
    };
    return (
      configs[status] || {
        label: status,
        color: "bg-gray-100 text-gray-800 border-gray-300",
        icon: AlertCircle,
      }
    );
  };

  const pendingRequests = requests.filter(
    (req) => req?.status === "PENDING" || req?.status === "ACKNOWLEDGED"
  );
  const otherRequests = requests.filter(
    (req) => req?.status !== "PENDING" && req?.status !== "ACKNOWLEDGED"
  );

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải yêu cầu trả sớm...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-gray-200">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Chưa có yêu cầu trả sớm
        </h3>
        <p className="text-gray-600">
          Hiện tại chưa có yêu cầu trả hàng sớm nào từ khách hàng
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            Yêu Cầu Cần Xử Lý ({pendingRequests.length})
          </h3>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <EarlyReturnCard
                key={request._id}
                request={request}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                getStatusConfig={getStatusConfig}
                onConfirm={() => {
                  setSelectedRequest(request);
                  setShowConfirmModal(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Requests */}
      {otherRequests.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-6 h-6 text-gray-600" />
            Lịch Sử Yêu Cầu ({otherRequests.length})
          </h3>
          <div className="space-y-4">
            {otherRequests.map((request) => (
              <EarlyReturnCard
                key={request._id}
                request={request}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                getStatusConfig={getStatusConfig}
                isHistory={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirmModal && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Xác Nhận Đã Nhận Hàng
                </h2>

                <div className="space-y-4">
                  {/* Request Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>Mã yêu cầu:</strong>{" "}
                      {selectedRequest.requestNumber}
                    </p>
                    <p className="text-sm text-blue-800">
                      <strong>Người thuê:</strong>{" "}
                      {selectedRequest.renter?.name || "N/A"}
                    </p>
                    <p className="text-sm text-blue-800">
                      <strong>Tiền cọc:</strong>{" "}
                      {formatCurrency(selectedRequest.depositRefund?.amount)}
                    </p>
                  </div>

                  {/* Quality Check */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tình trạng sản phẩm
                    </label>
                    <select
                      value={confirmData.qualityCheck.condition}
                      onChange={(e) =>
                        setConfirmData({
                          ...confirmData,
                          qualityCheck: {
                            ...confirmData.qualityCheck,
                            condition: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="EXCELLENT">Xuất sắc - Như mới</option>
                      <option value="GOOD">Tốt - Không có vấn đề</option>
                      <option value="FAIR">Khá - Có vài vết nhỏ</option>
                      <option value="DAMAGED">Hư hỏng - Cần sửa chữa</option>
                    </select>
                  </div>

                  {/* Quality Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú về chất lượng
                    </label>
                    <textarea
                      value={confirmData.qualityCheck.notes}
                      onChange={(e) =>
                        setConfirmData({
                          ...confirmData,
                          qualityCheck: {
                            ...confirmData.qualityCheck,
                            notes: e.target.value,
                          },
                        })
                      }
                      rows={3}
                      placeholder="VD: Sản phẩm còn nguyên vẹn, không có hư hỏng..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                    />
                  </div>

                  {/* General Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú chung (tùy chọn)
                    </label>
                    <textarea
                      value={confirmData.notes}
                      onChange={(e) =>
                        setConfirmData({
                          ...confirmData,
                          notes: e.target.value,
                        })
                      }
                      rows={2}
                      placeholder="Ghi chú bổ sung nếu có..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                    />
                  </div>

                  {/* Warning */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-semibold mb-1">Lưu ý:</p>
                        <p>
                          Sau khi xác nhận, tiền cọc sẽ được tự động hoàn trả
                          vào ví của người thuê. Hành động này không thể hoàn
                          tác.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowConfirmModal(false);
                        setSelectedRequest(null);
                      }}
                      className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleConfirmReturn}
                      className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all font-bold shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Xác Nhận Đã Nhận Hàng
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EarlyReturnCard = ({
  request,
  formatDate,
  formatCurrency,
  getStatusConfig,
  onConfirm,
  isHistory = false,
}) => {
  const statusConfig = getStatusConfig(request.status);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl shadow-lg border-2 p-6 ${
        isHistory ? "border-gray-200" : "border-orange-300"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-3 rounded-xl ${
              isHistory ? "bg-gray-100" : "bg-orange-100"
            }`}
          >
            <Package className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">
              Yêu Cầu Trả Sớm
            </h4>
            <p className="text-sm text-gray-600">
              Mã: <strong>{request.requestNumber}</strong>
            </p>
            {request.masterOrder?.masterOrderNumber && (
              <p className="text-xs text-gray-500 mt-1">
                Đơn hàng:{" "}
                <strong>{request.masterOrder.masterOrderNumber}</strong>
              </p>
            )}
          </div>
        </div>
        <span
          className={`px-4 py-2 rounded-full text-xs font-bold border-2 flex items-center gap-2 ${statusConfig.color}`}
        >
          <StatusIcon className="w-4 h-4" />
          {statusConfig.label}
        </span>
      </div>

      {/* Products - Only show PENDING products from deliveryBatches */}
      {(() => {
        const subOrder = request.subOrder;
        if (!subOrder?.products || !subOrder?.deliveryBatches) return null;

        // Get product IDs from PENDING batches
        const pendingProductIds = subOrder.deliveryBatches
          .filter((batch) => batch.shippingFee?.status === "PENDING")
          .flatMap((batch) => batch.products.map((p) => p.toString()));

        // Filter products that are in PENDING batches
        const pendingProducts = subOrder.products.filter((p) =>
          pendingProductIds.includes(p._id?.toString())
        );

        if (pendingProducts.length === 0) return null;

        return (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <p className="text-xs font-semibold text-indigo-600">
                SẢN PHẨM TRẢ SỚM ({pendingProducts.length})
              </p>
            </div>
            <div className="space-y-2">
              {pendingProducts.map((productItem, idx) => {
                const product = productItem.product;
                return (
                  <div
                    key={idx}
                    className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center gap-3"
                  >
                    {product?.images?.[0] && (
                      <img
                        src={product.images[0]}
                        alt={product.title || product.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {product?.title || product?.name || "Sản phẩm"}
                      </p>
                      <p className="text-xs text-gray-600">
                        Số lượng: {productItem.quantity || 1}
                      </p>
                      {productItem.totalRental && (
                        <p className="text-xs text-indigo-700 font-medium">
                          {formatCurrency(productItem.totalRental)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Renter Info */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-purple-600" />
            <p className="text-xs font-semibold text-purple-600">NGƯỜI THUÊ</p>
          </div>
          <p className="font-bold text-gray-900">
            {request.renter?.profile?.firstName &&
            request.renter?.profile?.lastName
              ? `${request.renter.profile.firstName} ${request.renter.profile.lastName}`
              : request.renter?.email || "Chưa cập nhật"}
          </p>
          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
            <Phone className="w-3 h-3" />
            {request.renter?.phone ||
              request.renter?.profile?.phoneNumber ||
              "Chưa có SĐT"}
          </p>
        </div>

        {/* Return Date */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-semibold text-blue-600">NGÀY TRẢ</p>
          </div>
          <p className="font-bold text-gray-900">
            {formatDate(request.requestedReturnDate)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Gốc: {formatDate(request.originalPeriod?.endDate)}
          </p>
        </div>
      </div>

      {/* Return Address */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-green-600" />
          <p className="text-xs font-semibold text-green-600">ĐỊA CHỈ TRẢ</p>
        </div>
        <p className="text-sm text-gray-800">
          {request.returnAddress?.streetAddress}
          {request.returnAddress?.ward && `, ${request.returnAddress.ward}`}
          {request.returnAddress?.district &&
            `, ${request.returnAddress.district}`}
          {request.returnAddress?.city && `, ${request.returnAddress.city}`}
        </p>
        {request.returnAddress?.contactPhone && (
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {request.returnAddress.contactPhone}
          </p>
        )}
      </div>

      {/* Deposit Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-yellow-600" />
          <p className="text-xs font-semibold text-yellow-600">TIỀN CỌC</p>
        </div>
        <p className="text-lg font-bold text-gray-900">
          {formatCurrency(request.depositRefund?.amount)}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Trạng thái:{" "}
          <strong>
            {request.depositRefund?.status === "COMPLETED"
              ? "Đã hoàn"
              : "Chưa hoàn"}
          </strong>
        </p>
      </div>

      {/* Notes */}
      {request.renterNotes && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <p className="text-xs font-semibold text-gray-600">
              GHI CHÚ TỪ NGƯỜI THUÊ
            </p>
          </div>
          <p className="text-sm text-gray-700 italic">
            "{request.renterNotes}"
          </p>
        </div>
      )}

      {/* Action Button */}
      {request.status === "PENDING" && onConfirm && (
        <button
          onClick={onConfirm}
          className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Xác Nhận Đã Nhận Hàng
        </button>
      )}

      {/* Confirmation Info */}
      {request.ownerConfirmation?.returnedAt && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-xs font-semibold text-green-600">ĐÃ XÁC NHẬN</p>
          </div>
          <p className="text-sm text-gray-700">
            <strong>Ngày xác nhận:</strong>{" "}
            {formatDate(request.ownerConfirmation.returnedAt)}
          </p>
          {request.ownerConfirmation.qualityCheck?.condition && (
            <p className="text-sm text-gray-700">
              <strong>Tình trạng:</strong>{" "}
              {request.ownerConfirmation.qualityCheck.condition}
            </p>
          )}
          {request.ownerConfirmation.notes && (
            <p className="text-sm text-gray-700 italic mt-1">
              "{request.ownerConfirmation.notes}"
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default EarlyReturnRequestsSection;
