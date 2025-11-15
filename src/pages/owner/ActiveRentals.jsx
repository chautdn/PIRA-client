import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import rentalOrderService from "../../services/rentalOrder";
import toast from "react-hot-toast";
import Loading from "../../components/common/Loading";

const ActiveRentals = () => {
  const navigate = useNavigate();
  const [activeRentals, setActiveRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchActiveRentals();
  }, [pagination.page]);

  const fetchActiveRentals = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await rentalOrderService.getOwnerActiveRentals({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (response.success && response.metadata?.activeRentals) {
        setActiveRentals(response.metadata.activeRentals.data || []);
        setPagination({
          ...pagination,
          ...response.metadata.activeRentals.pagination,
        });
      }
    } catch (error) {
      console.error("Error fetching active rentals:", error);
      setError(
        error.message || "Không thể tải danh sách sản phẩm đang cho thuê"
      );
      toast.error(error.message || "Không thể tải danh sách");
    } finally {
      setLoading(false);
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

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { label: "Đang Thuê", color: "bg-green-100 text-green-800" },
      DELIVERED: { label: "Đã Giao", color: "bg-blue-100 text-blue-800" },
      PROCESSING: {
        label: "Đang Xử Lý",
        color: "bg-yellow-100 text-yellow-800",
      },
      SHIPPED: { label: "Đang Giao", color: "bg-purple-100 text-purple-800" },
    };

    const config = statusConfig[status] || {
      label: status,
      color: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getDaysUntilReturnBadge = (daysUntilReturn, isOverdue) => {
    if (isOverdue) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border-2 border-red-300 animate-pulse">
          ⚠️ Quá hạn {Math.abs(daysUntilReturn)} ngày
        </span>
      );
    }

    if (daysUntilReturn === 0) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border-2 border-orange-300 animate-pulse">
          🔔 Trả hôm nay
        </span>
      );
    }

    if (daysUntilReturn === 1) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border-2 border-yellow-300">
          ⏰ Trả ngày mai
        </span>
      );
    }

    if (daysUntilReturn <= 3) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700">
          📅 Còn {daysUntilReturn} ngày
        </span>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
        📅 Còn {daysUntilReturn} ngày
      </span>
    );
  };

  if (loading && activeRentals.length === 0) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
                Sản Phẩm Đang Cho Thuê
              </h1>
              <p className="text-gray-600 text-lg">
                Quản lý các sản phẩm hiện đang được khách hàng thuê
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg px-6 py-4 border-2 border-primary-100">
              <div className="text-center">
                <p className="text-gray-500 text-sm font-medium">
                  Tổng số sản phẩm
                </p>
                <p className="text-3xl font-bold text-primary-600">
                  {activeRentals.length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">❌</span>
              <div>
                <h3 className="text-red-800 font-bold text-lg">
                  Có lỗi xảy ra
                </h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchActiveRentals}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
            >
              Thử lại
            </button>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && activeRentals.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center"
          >
            <div className="text-8xl mb-6">📦</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Chưa có sản phẩm đang cho thuê
            </h2>
            <p className="text-gray-600 mb-6">
              Hiện tại bạn chưa có sản phẩm nào đang được khách hàng thuê
            </p>
            <button
              onClick={() => navigate("/owner/products")}
              className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Xem Sản Phẩm Của Tôi
            </button>
          </motion.div>
        )}

        {/* Active Rentals List */}
        {!loading && !error && activeRentals.length > 0 && (
          <div className="space-y-4">
            <AnimatePresence>
              {activeRentals.map((rental, index) => (
                <motion.div
                  key={`${rental.subOrderId}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all hover:shadow-xl ${
                    rental.isOverdue
                      ? "border-red-300 bg-red-50"
                      : rental.isReturningsoon
                      ? "border-yellow-300 bg-yellow-50"
                      : "border-gray-200 hover:border-primary-300"
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={
                            rental.product?.images?.[0] ||
                            "https://via.placeholder.com/150"
                          }
                          alt={rental.product?.name || rental.product?.title}
                          className="w-32 h-32 object-cover rounded-xl shadow-md"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {rental.product?.name || rental.product?.title}
                            </h3>
                            <div className="flex items-center gap-3 flex-wrap">
                              {getStatusBadge(rental.status)}
                              {getDaysUntilReturnBadge(
                                rental.daysUntilReturn,
                                rental.isOverdue
                              )}
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                SL: {rental.quantity}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Rental Period */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                            <p className="text-xs text-blue-600 font-semibold mb-1">
                              THỜI GIAN THUÊ
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-semibold text-gray-700">
                                📅 {formatDate(rental.startDate)}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="font-semibold text-gray-700">
                                📅 {formatDate(rental.endDate)}
                              </span>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                            <p className="text-xs text-green-600 font-semibold mb-1">
                              GIÁ TRỊ ĐƠN HÀNG
                            </p>
                            <div className="text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Tiền thuê:
                                </span>
                                <span className="font-bold text-green-700">
                                  {formatCurrency(rental.totalRental)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tiền cọc:</span>
                                <span className="font-bold text-blue-700">
                                  {formatCurrency(rental.totalDeposit)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Renter Info */}
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                          <p className="text-xs text-purple-600 font-semibold mb-2">
                            THÔNG TIN NGƯỜI THUÊ
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">👤 Tên:</span>
                              <p className="font-semibold text-gray-800">
                                {rental.renter?.profile?.firstName}{" "}
                                {rental.renter?.profile?.lastName}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">📞 SĐT:</span>
                              <p className="font-semibold text-gray-800">
                                {rental.renter?.phone || "N/A"}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">✉️ Email:</span>
                              <p className="font-semibold text-gray-800 truncate">
                                {rental.renter?.email || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Order Numbers */}
                        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            📦 Mã đơn:{" "}
                            <strong>{rental.masterOrderNumber}</strong>
                          </span>
                          <span>
                            🔖 Mã phụ: <strong>{rental.subOrderNumber}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {!loading && activeRentals.length > 0 && pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 flex justify-center gap-2"
          >
            <button
              onClick={() =>
                setPagination({ ...pagination, page: pagination.page - 1 })
              }
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ← Trước
            </button>
            <span className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPagination({ ...pagination, page: pagination.page + 1 })
              }
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Sau →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ActiveRentals;
