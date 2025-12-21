import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Trash2, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useNotification } from "../hooks/useNotification";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const AllNotifications = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    pagination,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotification();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    const filters = {};
    if (selectedType !== "all") filters.type = selectedType;
    if (selectedStatus !== "all") filters.status = selectedStatus;

    // Use limit of 20 for full page, dropdown shows only 5
    fetchNotifications(currentPage, filters, 20);
  }, [currentPage, selectedType, selectedStatus]);

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (notification.status !== "READ") {
      await markAsRead(notification._id);
    }
    
    // Navigate if actions exist
    if (notification.actions && notification.actions.length > 0) {
      const action = notification.actions[0]; // Use first action
      if (action.url) {
        navigate(action.url);
      }
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "ERROR":
        return "bg-red-100 text-red-800";
      case "WARNING":
        return "bg-yellow-100 text-yellow-800";
      case "INFO":
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "SUCCESS":
        return "✓";
      case "ERROR":
        return "✗";
      case "WARNING":
        return "⚠";
      case "INFO":
      default:
        return "ℹ";
    }
  };

  const getTypeTranslation = (type) => {
    const translations = {
      ORDER: "Đơn hàng",
      PAYMENT: "Thanh toán",
      SHIPMENT: "Vận chuyển",
      REVIEW: "Đánh giá",
      DISPUTE: "Tranh chấp",
      PROMOTION: "Khuyến mãi",
      PROMOTION_PAYMENT: "Thanh toán quảng cáo",
      SYSTEM: "Hệ thống",
      REMINDER: "Nhắc nhở",
      WITHDRAWAL: "Rút tiền",
      VOUCHER: "Phiếu giảm giá",
    };
    return translations[type] || type;
  };

  const getStatusTranslation = (status) => {
    const translations = {
      PENDING: "Chờ xử lý",
      SENT: "Đã gửi",
      DELIVERED: "Đã nhận",
      READ: "Đã đọc",
      FAILED: "Thất bại",
    };
    return translations[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Tất cả thông báo
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {unreadCount > 0
                    ? `Bạn có ${unreadCount} thông báo chưa đọc`
                    : "Bạn đã đọc hết thông báo"}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Lọc:</span>
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả loại</option>
              <option value="ORDER">Đơn hàng</option>
              <option value="PAYMENT">Thanh toán</option>
              <option value="WITHDRAWAL">Rút tiền</option>
              <option value="VOUCHER">Phiếu giảm giá</option>
              <option value="PROMOTION">Khuyến mãi</option>
              <option value="SYSTEM">Hệ thống</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="READ">Đã đọc</option>
              <option value="DELIVERED">Chưa đọc</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <Bell className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Không có thông báo</p>
              <p className="text-sm text-gray-400 mt-1">
                {selectedType !== "all" || selectedStatus !== "all"
                  ? "Không tìm thấy thông báo phù hợp với bộ lọc"
                  : "Bạn chưa có thông báo nào"}
              </p>
            </div>
          ) : (
            <>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-6 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    notification.status !== "READ" ? "bg-blue-50" : ""
                  } ${
                    index === notifications.length - 1
                      ? "border-b-0 rounded-b-lg"
                      : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Category Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${getCategoryColor(
                            notification.category
                          )}`}
                        >
                          <span className="mr-1">
                            {getCategoryIcon(notification.category)}
                          </span>
                          {getTypeTranslation(notification.type)}
                        </span>
                        {notification.status !== "READ" && (
                          <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                        )}
                        <span className="text-xs text-gray-400">
                          {getStatusTranslation(notification.status)}
                        </span>
                      </div>

                      {/* Title & Message */}
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {notification.message}
                      </p>

                      {/* Timestamp */}
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDelete(e, notification._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Xóa thông báo"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-700">
              Hiển thị trang{" "}
              <span className="font-medium">{pagination.currentPage}</span>{" "}
              trong <span className="font-medium">{pagination.totalPages}</span>{" "}
              trang
              <span className="text-gray-500 ml-2">
                (Tổng {pagination.totalItems} thông báo)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex gap-1">
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    let pageNumber;
                    if (pagination.totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNumber = pagination.totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNumber
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllNotifications;
