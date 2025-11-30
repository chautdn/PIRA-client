import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminService } from "../../services/admin";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Wallet,
  Eye,
  TrendingUp,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import useChatSocket from "../../hooks/useChatSocket";

const WithdrawalManagement = () => {
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    page: 1,
    limit: 20,
    riskLevel: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [actionData, setActionData] = useState({
    status: "",
    adminNote: "",
    rejectionReason: "",
  });
  const [systemWallet, setSystemWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [enhancedView, setEnhancedView] = useState(false);
  const { socket } = useChatSocket();

  useEffect(() => {
    fetchWithdrawals();
    fetchSystemWallet();
  }, [filters, enhancedView]);

  // Listen for system wallet updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleSystemWalletUpdate = (data) => {
      console.log("💰 System wallet update received:", data);
      setSystemWallet((prev) => ({
        ...prev,
        balance: data.balance,
        totalBalance: data.balance.total,
      }));
    };

    const handleWithdrawalRequested = (data) => {
      console.log("📥 New withdrawal request received:", data);
      toast.success("Có yêu cầu rút tiền mới!");
      // Refresh the withdrawals list
      fetchWithdrawals();
    };

    const handleWithdrawalUpdated = (data) => {
      console.log("🔄 Withdrawal updated:", data);
      // Refresh the withdrawals list
      fetchWithdrawals();
    };

    socket.on("system:wallet:update", handleSystemWalletUpdate);
    socket.on("withdrawal-requested", handleWithdrawalRequested);
    socket.on("withdrawal-updated", handleWithdrawalUpdated);

    return () => {
      socket.off("system:wallet:update", handleSystemWalletUpdate);
      socket.off("withdrawal-requested", handleWithdrawalRequested);
      socket.off("withdrawal-updated", handleWithdrawalUpdated);
    };
  }, [socket]);

  const fetchSystemWallet = async () => {
    try {
      setLoadingWallet(true);
      const result = await adminService.getSystemWallet();
      console.log("🏦 System wallet fetched:", result);
      console.log("💰 Balance data:", result?.balance);
      setSystemWallet(result);
    } catch (error) {
      console.error("Error fetching system wallet:", error);
      toast.error("Không thể tải số dư ví hệ thống");
    } finally {
      setLoadingWallet(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      
      // Use enhanced endpoint if enhanced view is enabled
      const result = enhancedView 
        ? await adminService.getEnhancedWithdrawals(filters)
        : await adminService.getWithdrawals(filters);
        
      setWithdrawals(result.withdrawals || []);
      setPagination(result.pagination || {});
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      toast.error("Không thể tải danh sách rút tiền");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (withdrawalId, status) => {
    if (!actionData.adminNote && status !== "processing") {
      toast.error("Vui lòng nhập ghi chú quản trị viên");
      return;
    }

    if (status === "rejected" && !actionData.rejectionReason) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      setProcessing(true);
      await adminService.updateWithdrawalStatus(
        withdrawalId,
        status,
        actionData
      );

      toast.success(
        status === "processing"
          ? "Đã chuyển sang đang xử lý"
          : status === "completed"
          ? "Đã duyệt yêu cầu rút tiền"
          : "Đã từ chối yêu cầu rút tiền"
      );

      setShowModal(false);
      setSelectedWithdrawal(null);
      setActionData({ status: "", adminNote: "", rejectionReason: "" });
      fetchWithdrawals();
    } catch (error) {
      console.error("Error updating withdrawal status:", error);
      toast.error(
        error.response?.data?.message || "Không thể cập nhật trạng thái"
      );
    } finally {
      setProcessing(false);
    }
  };

  const openActionModal = (withdrawal, status) => {
    setSelectedWithdrawal(withdrawal);
    setActionData({ ...actionData, status });
    setShowModal(true);
  };

  const viewDetailedAnalysis = (withdrawalId) => {
    navigate(`/admin/withdrawals/${withdrawalId}/analysis`);
  };

  const getRiskBadge = (riskLevel) => {
    if (!riskLevel) return null;
    
    const colors = {
      LOW: "bg-green-100 text-green-800",
      MEDIUM: "bg-yellow-100 text-yellow-800", 
      HIGH: "bg-orange-100 text-orange-800",
      VERY_HIGH: "bg-red-100 text-red-800",
    };

    const labels = {
      LOW: "THẤP",
      MEDIUM: "TRUNG BÌNH",
      HIGH: "CAO", 
      VERY_HIGH: "RẤT CAO",
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[riskLevel]}`}>
        <Shield className="w-3 h-3 mr-1" />
        {labels[riskLevel]}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: Clock,
        label: "Chờ xử lý",
      },
      processing: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: AlertCircle,
        label: "Đang xử lý",
      },
      completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
        label: "Đã hoàn thành",
      },
      rejected: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: XCircle,
        label: "Đã từ chối",
      },
      cancelled: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: XCircle,
        label: "Đã hủy",
      },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}
      >
        <Icon className="w-4 h-4 mr-1" />
        {badge.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("vi-VN");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản Lý Rút Tiền</h1>
        <p className="text-gray-600 mt-2">
          Quản lý các yêu cầu rút tiền từ người dùng
        </p>
      </div>

      {/* System Wallet Balance */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 mb-6 text-white">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white bg-opacity-20 rounded-lg">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-blue-100 mb-1">Số dư Ví Hệ Thống</p>
            {loadingWallet ? (
              <div className="animate-pulse h-8 w-48 bg-blue-500 rounded"></div>
            ) : (
              <h2 className="text-3xl font-bold">
                {formatCurrency(systemWallet?.balance?.available || 0)}
              </h2>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value, page: 1 })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="processing">Đang xử lý</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="rejected">Đã từ chối</option>
            <option value="cancelled">Đã hủy</option>
          </select>

          {enhancedView && (
            <select
              value={filters.riskLevel}
              onChange={(e) =>
                setFilters({ ...filters, riskLevel: e.target.value, page: 1 })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả mức rủi ro</option>
              <option value="LOW">Rủi ro thấp</option>
              <option value="MEDIUM">Rủi ro trung bình</option>
              <option value="HIGH">Rủi ro cao</option>
              <option value="VERY_HIGH">Rủi ro rất cao</option>
            </select>
          )}

          <div className="flex-1"></div>
          
          <div className="text-sm text-gray-500 hidden md:block">
            💡 Nhấn vào dòng để xem phân tích chi tiết
          </div>
          
          <button
            onClick={() => setEnhancedView(!enhancedView)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              enhancedView
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            {enhancedView ? "Chế độ nâng cao" : "Chế độ cơ bản"}
          </button>
        </div>
      </div>

      {/* Withdrawals Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : withdrawals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Không có yêu cầu rút tiền nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngân hàng
                  </th>
                  {enhancedView && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rủi ro
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {withdrawals.map((withdrawal) => (
                  <tr 
                    key={withdrawal._id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => viewDetailedAnalysis(withdrawal._id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {withdrawal.user?.profile?.firstName}{" "}
                          {withdrawal.user?.profile?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {withdrawal.user?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(withdrawal.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {withdrawal.bankDetails?.bankName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {withdrawal.bankDetails?.accountNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {withdrawal.bankDetails?.accountHolderName}
                      </div>
                    </td>
                    {enhancedView && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRiskBadge(withdrawal.riskAssessment?.level)}
                        {withdrawal.riskAssessment && (
                          <div className="text-xs text-gray-500 mt-1">
                            Điểm: {withdrawal.riskAssessment.score}/100
                          </div>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(withdrawal.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(withdrawal.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {withdrawal.status === "pending" && (
                          <button
                            onClick={() =>
                              openActionModal(withdrawal, "processing")
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                          >
                            Tiếp nhận
                          </button>
                        )}
                        {withdrawal.status === "processing" && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            Đang xử lý
                          </span>
                        )}
                        {(withdrawal.status === "completed" || withdrawal.status === "rejected" || withdrawal.status === "cancelled") && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            Đã xử lý
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {withdrawals.length} trên {pagination.totalItems} yêu
                cầu
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page - 1 })
                  }
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                <span className="px-4 py-2">
                  Trang {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page + 1 })
                  }
                  disabled={filters.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Modal */}
      {showModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold mb-4">
              {actionData.status === "processing" && "Tiếp nhận xử lý"}
              {actionData.status === "completed" && "Duyệt rút tiền"}
              {actionData.status === "rejected" && "Từ chối rút tiền"}
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Số tiền:{" "}
                <span className="font-semibold">
                  {formatCurrency(selectedWithdrawal.amount)}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Người dùng:{" "}
                <span className="font-semibold">
                  {selectedWithdrawal.user?.email}
                </span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú quản trị viên{" "}
                {actionData.status !== "processing" && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <textarea
                value={actionData.adminNote}
                onChange={(e) =>
                  setActionData({ ...actionData, adminNote: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập ghi chú..."
              />
            </div>

            {actionData.status === "rejected" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={actionData.rejectionReason}
                  onChange={(e) =>
                    setActionData({
                      ...actionData,
                      rejectionReason: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập lý do từ chối..."
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedWithdrawal(null);
                  setActionData({
                    status: "",
                    adminNote: "",
                    rejectionReason: "",
                  });
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  handleStatusChange(selectedWithdrawal._id, actionData.status)
                }
                disabled={processing}
                className={`flex-1 px-4 py-2 rounded-lg text-white disabled:opacity-50 ${
                  actionData.status === "completed"
                    ? "bg-green-600 hover:bg-green-700"
                    : actionData.status === "rejected"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {processing ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalManagement;
