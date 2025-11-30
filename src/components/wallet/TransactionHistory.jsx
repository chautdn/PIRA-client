import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import Portal from "../common/Portal";

const TransactionHistory = ({ isOpen, onClose }) => {
  const { fetchTransactions } = useWallet();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      loadTransactions(1);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const loadTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const result = await fetchTransactions({ page, limit: 20 });
      setTransactions(result.transactions || []);
      setPagination(result.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (pagination?.hasNext) {
      loadTransactions(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination?.hasPrev) {
      loadTransactions(currentPage - 1);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "pending":
      case "processing":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTypeIcon = (type, isOutgoing = false) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case "withdrawal":
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case "payment":
        return <ArrowUpRight className="w-4 h-4 text-red-500" />; // Payment (outgoing)
      case "refund":
        return <ArrowDownLeft className="w-4 h-4 text-blue-500" />; // Hoàn tiền
      default:
        // Use isOutgoing to determine direction for unknown types
        return isOutgoing ? 
          <ArrowUpRight className="w-4 h-4 text-red-500" /> : 
          <ArrowDownLeft className="w-4 h-4 text-green-500" />;
    }
  };

  const getTransactionTitle = (type) => {
    switch (type) {
      case "deposit":
        return "Nạp tiền";
      case "withdrawal":
        return "Rút tiền";
      case "payment":
        return "Thanh toán";
      case "refund":
        return "Hoàn tiền";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto"
            onClick={onClose}
            style={{ margin: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl w-full max-w-2xl my-auto shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: "calc(100vh - 2rem)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-2xl sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">Lịch sử giao dịch</span>
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Xem tất cả giao dịch ví của bạn
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/50 rounded-full transition-colors"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div
                className="overflow-y-auto"
                style={{ maxHeight: "calc(100vh - 14rem)" }}
              >
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">
                      Đang tải giao dịch...
                    </p>
                    <p className="text-gray-400 text-sm mt-1">Vui lòng đợi</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="p-12 text-center">
                    <motion.div
                      className="text-7xl mb-4"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Chưa có giao dịch
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Chưa có giao dịch nào
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Lịch sử giao dịch sẽ xuất hiện tại đây
                    </p>
                    <button
                      onClick={onClose}
                      className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                ) : (
                  <div className="p-6 space-y-3">
                    {transactions.map((transaction, index) => (
                      <motion.div
                        key={transaction._id}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-md transition-all border border-gray-100 hover:border-blue-200"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01, x: 2 }}
                      >
                        {/* Type & Status Icons */}
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                            {getTypeIcon(transaction.type, transaction.isOutgoing)}
                          </div>
                          {getStatusIcon(transaction.status)}
                        </div>

                        {/* Transaction Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">
                              {getTransactionTitle(transaction.type)}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                transaction.status === "success"
                                  ? "bg-green-100 text-green-700"
                                  : transaction.status === "failed"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {transaction.status === "success"
                                ? "Thành công"
                                : transaction.status === "failed"
                                ? "Thất bại"
                                : "Đang xử lý"}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 truncate">
                            {transaction.description || "Giao dịch ví"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>

                        {/* Amount */}
                        <div className="text-right">
                          <div
                            className={`font-bold text-lg ${
                              transaction.displayAmount >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.displayAmount?.toLocaleString() || 
                             (transaction.amount?.toLocaleString() || "0")}
                          </div>
                          <div className="text-xs text-gray-500">VND</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Pagination */}
              {pagination && pagination.totalItems > 0 && (
                <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-blue-50 border-t border-gray-200 rounded-b-2xl sticky bottom-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">
                        {transactions.length}
                      </span>{" "}
                      trong{" "}
                      <span className="font-semibold text-gray-900">
                        {pagination.totalItems}
                      </span>{" "}
                      giao dịch
                    </div>

                    {pagination.totalPages > 1 && (
                      <div className="text-sm text-gray-500 font-medium">
                        Trang {pagination.currentPage} / {pagination.totalPages}
                      </div>
                    )}

                    {pagination.totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <motion.button
                          onClick={handlePrevPage}
                          disabled={!pagination.hasPrev || loading}
                          className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Trang trước"
                        >
                          <ChevronLeft className="w-4 h-4 text-gray-700" />
                        </motion.button>
                        <motion.button
                          onClick={handleNextPage}
                          disabled={!pagination.hasNext || loading}
                          className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Trang sau"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-700" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
};

export default TransactionHistory;