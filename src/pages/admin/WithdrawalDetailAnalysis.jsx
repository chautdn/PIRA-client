import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminService } from "../../services/admin";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  CreditCard,
  Receipt,
  Shield,
  Activity,
  Eye,
  Copy,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

const WithdrawalDetailAnalysis = () => {
  const { withdrawalId } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [processing, setProcessing] = useState(false);
  const [showPayOSModal, setShowPayOSModal] = useState(false);
  const [actionData, setActionData] = useState({
    status: "",
    adminNote: "",
    rejectionReason: "",
  });

  useEffect(() => {
    if (withdrawalId) {
      fetchFinancialAnalysis();
    }
  }, [withdrawalId]);

  const fetchFinancialAnalysis = async () => {
    try {
      setLoading(true);
      const result = await adminService.getWithdrawalFinancialAnalysis(withdrawalId);
      setAnalysis(result);
    } catch (error) {
      console.error("Error fetching financial analysis:", error);
      toast.error("Không thể tải phân tích tài chính");
      navigate("/admin/withdrawals");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status) => {
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
      await adminService.updateWithdrawalStatus(withdrawalId, status, actionData);

      toast.success(
        status === "processing"
          ? "Đã chuyển sang đang xử lý"
          : status === "completed"
          ? "Đã duyệt yêu cầu rút tiền"
          : "Đã từ chối yêu cầu rút tiền"
      );

      // Refresh analysis
      fetchFinancialAnalysis();
      setActionData({ status: "", adminNote: "", rejectionReason: "" });
    } catch (error) {
      console.error("Error updating withdrawal status:", error);
      toast.error(error.response?.data?.message || "Không thể cập nhật trạng thái");
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
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

  const getRiskColor = (level) => {
    switch (level) {
      case "LOW": return "text-green-600 bg-green-100";
      case "MEDIUM": return "text-yellow-600 bg-yellow-100";
      case "HIGH": return "text-orange-600 bg-orange-100";
      case "VERY_HIGH": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getRiskLabel = (level) => {
    switch (level) {
      case "LOW": return "THẤP";
      case "MEDIUM": return "TRUNG BÌNH";
      case "HIGH": return "CAO";
      case "VERY_HIGH": return "RẤT CAO";
      default: return "KHÔNG XÁC ĐỊNH";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return <Clock className="w-5 h-5 text-yellow-600" />;
      case "processing": return <Activity className="w-5 h-5 text-blue-600" />;
      case "completed": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "rejected": return <XCircle className="w-5 h-5 text-red-600" />;
      case "cancelled": return <XCircle className="w-5 h-5 text-gray-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy dữ liệu</h2>
          <p className="text-gray-600 mb-4">Không thể tải thông tin phân tích tài chính</p>
          <button
            onClick={() => navigate("/admin/withdrawals")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay về danh sách
          </button>
        </div>
      </div>
    );
  }

  const { withdrawal, user, currentWalletStatus, transactionAnalysis, withdrawalHistory, 
          systemInteractions, payosVerificationCodes, riskAssessment, activityTimeline, 
          recommendedAction } = analysis;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/admin/withdrawals")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay về danh sách rút tiền
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {withdrawal.formattedAmount}
                </h1>
                <p className="text-gray-600">Yêu cầu rút tiền #{withdrawal._id.slice(-8)}</p>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusIcon(withdrawal.status)}
                  <span className="capitalize font-medium">
                    {withdrawal.status === "pending" && "Chờ xử lý"}
                    {withdrawal.status === "processing" && "Đang xử lý"}
                    {withdrawal.status === "completed" && "Đã hoàn thành"}
                    {withdrawal.status === "rejected" && "Đã từ chối"}
                    {withdrawal.status === "cancelled" && "Đã hủy"}
                  </span>
                </div>
              </div>
            </div>

            {/* Risk Assessment Badge */}
            <div className="text-right">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getRiskColor(riskAssessment.level)}`}>
                <Shield className="w-4 h-4 mr-2" />
                Rủi ro: {getRiskLabel(riskAssessment.level)} ({riskAssessment.score}/100)
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {recommendedAction.action} - Độ tin cậy {recommendedAction.confidence.toLowerCase()}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {(withdrawal.status === "pending" || withdrawal.status === "processing") && (
            <div className="mt-6 flex gap-3">
              {withdrawal.status === "pending" && (
                <button
                  onClick={() => setActionData({ ...actionData, status: "processing" })}
                  disabled={processing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {processing ? "Đang xử lý..." : "Tiếp nhận xử lý"}
                </button>
              )}
              {withdrawal.status === "processing" && (
                <>
                  <button
                    onClick={() => setActionData({ ...actionData, status: "completed" })}
                    disabled={processing}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Duyệt yêu cầu
                  </button>
                  <button
                    onClick={() => setActionData({ ...actionData, status: "rejected" })}
                    disabled={processing}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Từ chối yêu cầu
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "overview", label: "Tổng quan", icon: Eye },
              { id: "user", label: "Thông tin người dùng", icon: User },
              { id: "wallet", label: "Ví & Giao dịch", icon: Wallet },
              { id: "history", label: "Lịch sử rút tiền", icon: Receipt },
              { id: "payos", label: "Mã PayOS", icon: CreditCard },
              { id: "activity", label: "Hoạt động", icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Assessment */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Đánh giá rủi ro
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Điểm rủi ro:</span>
                  <span className="font-semibold">{riskAssessment.score}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      riskAssessment.score <= 20 ? "bg-green-500" :
                      riskAssessment.score <= 50 ? "bg-yellow-500" :
                      riskAssessment.score <= 75 ? "bg-orange-500" : "bg-red-500"
                    }`}
                    style={{ width: `${riskAssessment.score}%` }}
                  ></div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Các yếu tố rủi ro:</h4>
                  {riskAssessment.factors.length > 0 ? (
                    <ul className="space-y-1">
                      {riskAssessment.factors.map((factor, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-green-600">Không có yếu tố rủi ro đáng chú ý</p>
                  )}
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Khuyến nghị:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      recommendedAction.action === "DUYỆT" ? "bg-green-100 text-green-800" :
                      recommendedAction.action === "ĐIỀU TRA" ? "bg-yellow-100 text-yellow-800" :
                      recommendedAction.action === "KIỂM TRA THỦ CÔNG" ? "bg-orange-100 text-orange-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {recommendedAction.action}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{riskAssessment.recommendation}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Thống kê nhanh
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {withdrawalHistory.statistics.totalRequests}
                  </div>
                  <div className="text-sm text-gray-600">Tổng yêu cầu rút tiền</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {withdrawalHistory.successRate}%
                  </div>
                  <div className="text-sm text-gray-600">Tỷ lệ thành công</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {transactionAnalysis.totalTransactions}
                  </div>
                  <div className="text-sm text-gray-600">Giao dịch (90 ngày)</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {user.accountAge}
                  </div>
                  <div className="text-sm text-gray-600">Tuổi tài khoản</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Info Tab */}
        {activeTab === "user" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              Thông tin người dùng
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên:</label>
                  <p className="text-gray-900">
                    {user.profile?.firstName} {user.profile?.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò:</label>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.role === "ADMIN" ? "bg-red-100 text-red-800" :
                    user.role === "OWNER" ? "bg-blue-100 text-blue-800" :
                    "bg-green-100 text-green-800"
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tuổi tài khoản:</label>
                  <p className="text-gray-900">{user.accountAge}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Xác minh KYC:</label>
                  <div className="flex items-center gap-2">
                    {user.verificationStatus.kyc ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className={user.verificationStatus.kyc ? "text-green-600" : "text-red-600"}>
                      {user.verificationStatus.kyc ? "Đã xác minh" : "Chưa xác minh"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngân hàng xác minh:</label>
                  <div className="flex items-center gap-2">
                    {user.verificationStatus.bankAccount ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className={user.verificationStatus.bankAccount ? "text-green-600" : "text-red-600"}>
                      {user.verificationStatus.bankAccount ? "Đã xác minh" : "Chưa xác minh"}
                    </span>
                  </div>
                </div>

                {/* Bank Account Details */}
                {withdrawal.bankDetails && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Thông tin ngân hàng:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ngân hàng:</span>
                        <span className="font-medium">{withdrawal.bankDetails.bankName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Số tài khoản:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{withdrawal.bankDetails.accountNumber}</span>
                          <button
                            onClick={() => copyToClipboard(withdrawal.bankDetails.accountNumber, "số tài khoản")}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tên chủ tài khoản:</span>
                        <span className="font-medium">{withdrawal.bankDetails.accountHolderName}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Wallet & Transactions Tab */}
        {activeTab === "wallet" && (
          <div className="space-y-6">
            {/* Current Wallet Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Trạng thái ví hiện tại
              </h3>
              {currentWalletStatus.exists ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">
                      {currentWalletStatus.balance.formattedAvailable}
                    </div>
                    <div className="text-sm text-gray-600">Số dư khả dụng</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-xl font-bold text-orange-600">
                      {formatCurrency(currentWalletStatus.balance.frozen)}
                    </div>
                    <div className="text-sm text-gray-600">Số dư bị đóng băng</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">
                      {formatCurrency(currentWalletStatus.balance.pending)}
                    </div>
                    <div className="text-sm text-gray-600">Số dư đang chờ</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-xl font-bold text-purple-600">
                      {currentWalletStatus.balance.formattedTotal}
                    </div>
                    <div className="text-sm text-gray-600">Tổng số dư</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Người dùng chưa có ví</p>
                </div>
              )}
            </div>

            {/* Transaction Analysis */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Phân tích giao dịch (90 ngày qua)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {Object.entries(transactionAnalysis.statistics).map(([category, stats]) => (
                  <div key={category} className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2 capitalize">
                      {category === "deposits" && "Nạp tiền"}
                      {category === "withdrawals" && "Rút tiền"}
                      {category === "payments" && "Thanh toán"}
                      {category === "refunds" && "Hoàn tiền"}
                      {category === "penalties" && "Phạt"}
                      {category === "promotionRevenue" && "Doanh thu khuyến mại"}
                      {category === "transfers" && "Chuyển tiền"}
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Số lượng:</span>
                        <span className="font-medium">{stats.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tổng tiền:</span>
                        <span className="font-medium">{formatCurrency(stats.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tỷ lệ thành công:</span>
                        <span className="font-medium">{stats.successRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Transactions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Giao dịch gần đây (10 giao dịch)</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactionAnalysis.recentTransactions.map((transaction) => (
                        <tr key={transaction._id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              transaction.type === "deposit" ? "bg-green-100 text-green-800" :
                              transaction.type === "withdrawal" ? "bg-red-100 text-red-800" :
                              transaction.type === "payment" ? "bg-blue-100 text-blue-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm font-medium">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              transaction.status === "success" ? "bg-green-100 text-green-800" :
                              transaction.status === "failed" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {formatDate(transaction.createdAt)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {transaction.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* System Interactions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Tương tác với ví hệ thống
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(systemInteractions.receivedFromSystem)}
                  </div>
                  <div className="text-sm text-gray-600">Nhận từ hệ thống</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">
                    {formatCurrency(systemInteractions.paidToSystem)}
                  </div>
                  <div className="text-sm text-gray-600">Trả cho hệ thống</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {systemInteractions.totalInteractions}
                  </div>
                  <div className="text-sm text-gray-600">Tổng giao dịch</div>
                </div>
              </div>

              {systemInteractions.recentInteractions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Giao dịch hệ thống gần đây</h4>
                  <div className="space-y-2">
                    {systemInteractions.recentInteractions.map((interaction) => (
                      <div key={interaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">
                            {interaction.fromSystemWallet ? "Từ hệ thống" : "Đến hệ thống"}
                          </div>
                          <div className="text-xs text-gray-600">{interaction.description}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${
                            interaction.fromSystemWallet ? "text-green-600" : "text-red-600"
                          }`}>
                            {interaction.fromSystemWallet ? "+" : "-"}{formatCurrency(interaction.amount)}
                          </div>
                          <div className="text-xs text-gray-600">{formatDate(interaction.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Withdrawal History Tab */}
        {activeTab === "history" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Lịch sử rút tiền
            </h3>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {withdrawalHistory.statistics.totalRequests}
                </div>
                <div className="text-sm text-gray-600">Tổng yêu cầu</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {withdrawalHistory.statistics.successful}
                </div>
                <div className="text-sm text-gray-600">Thành công</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-xl font-bold text-red-600">
                  {withdrawalHistory.statistics.rejected}
                </div>
                <div className="text-sm text-gray-600">Bị từ chối</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-xl font-bold text-yellow-600">
                  {withdrawalHistory.statistics.pending}
                </div>
                <div className="text-sm text-gray-600">Đang chờ</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-xl font-bold text-purple-600">
                  {withdrawalHistory.successRate}%
                </div>
                <div className="text-sm text-gray-600">Tỷ lệ thành công</div>
              </div>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ngày xử lý</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {withdrawalHistory.history.map((w) => (
                    <tr key={w._id} className={`hover:bg-gray-50 ${w._id === withdrawal._id ? "bg-blue-50" : ""}`}>
                      <td className="px-4 py-2 text-sm font-mono">
                        {w._id.slice(-8)}
                        {w._id === withdrawal._id && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Hiện tại</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium">
                        {formatCurrency(w.amount)}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          w.status === "completed" ? "bg-green-100 text-green-800" :
                          w.status === "rejected" ? "bg-red-100 text-red-800" :
                          w.status === "processing" ? "bg-blue-100 text-blue-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {formatDate(w.createdAt)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {w.processedAt ? formatDate(w.processedAt) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PayOS Codes Tab */}
        {activeTab === "payos" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Mã xác minh PayOS ({payosVerificationCodes.length} giao dịch)
              </h3>
              <button
                onClick={() => setShowPayOSModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
                Hướng dẫn kiểm tra
              </button>
            </div>

            {payosVerificationCodes.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Hướng dẫn sử dụng:</h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• Sử dụng các mã dưới đây để tra cứu giao dịch trên hệ thống ngân hàng PayOS</li>
                    <li>• Kiểm tra số tiền và thời gian giao dịch có khớp với lịch sử không</li>
                    <li>• Liên hệ với PayOS để xác minh tính xác thực của giao dịch nếu cần</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {payosVerificationCodes.map((transaction) => (
                    <div key={transaction.orderCode} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900">
                          {transaction.formattedAmount}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatDate(transaction.date)}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Mã đơn hàng:</span>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-gray-100 rounded font-mono">
                              {transaction.orderCode}
                            </code>
                            <button
                              onClick={() => copyToClipboard(transaction.orderCode, "mã đơn hàng")}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {transaction.description && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Mô tả:</span>
                            <span className="text-gray-900 text-right max-w-48 truncate">
                              {transaction.description}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Không có giao dịch PayOS nào</p>
                <p className="text-sm">Người dùng chưa từng nạp tiền qua PayOS</p>
              </div>
            )}
          </div>
        )}

        {/* Activity Timeline Tab */}
        {activeTab === "activity" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Hoạt động gần đây (30 ngày)
            </h3>

            {activityTimeline.length > 0 ? (
              <div className="space-y-4">
                {activityTimeline.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === "transaction" ? "bg-blue-100" : "bg-purple-100"
                    }`}>
                      {activity.type === "transaction" ? (
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Receipt className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {activity.action}
                          </p>
                          <p className="text-sm text-gray-600">
                            {activity.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency(activity.amount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          activity.status === "success" ? "bg-green-100 text-green-800" :
                          activity.status === "failed" ? "bg-red-100 text-red-800" :
                          activity.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Không có hoạt động nào</p>
                <p className="text-sm">Không có hoạt động trong 30 ngày qua</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionData.status && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold mb-4">
              {actionData.status === "processing" && "Tiếp nhận xử lý"}
              {actionData.status === "completed" && "Duyệt yêu cầu rút tiền"}
              {actionData.status === "rejected" && "Từ chối yêu cầu rút tiền"}
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Số tiền: <span className="font-semibold">{withdrawal.formattedAmount}</span>
              </p>
              <p className="text-sm text-gray-600">
                Người dùng: <span className="font-semibold">{user.email}</span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú quản trị viên{" "}
                {actionData.status !== "processing" && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={actionData.adminNote}
                onChange={(e) => setActionData({ ...actionData, adminNote: e.target.value })}
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
                  onChange={(e) => setActionData({ ...actionData, rejectionReason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập lý do từ chối..."
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setActionData({ status: "", adminNote: "", rejectionReason: "" })}
                disabled={processing}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleStatusUpdate(actionData.status)}
                disabled={processing}
                className={`flex-1 px-4 py-2 rounded-lg text-white disabled:opacity-50 ${
                  actionData.status === "completed" ? "bg-green-600 hover:bg-green-700" :
                  actionData.status === "rejected" ? "bg-red-600 hover:bg-red-700" :
                  "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {processing ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* PayOS Help Modal */}
      {showPayOSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto"
          >
            <h3 className="text-xl font-bold mb-4">Hướng dẫn kiểm tra PayOS</h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">1. Truy cập PayOS Dashboard</h4>
                <p className="text-gray-600">Đăng nhập vào tài khoản PayOS và truy cập phần quản lý giao dịch.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">2. Tìm kiếm giao dịch</h4>
                <p className="text-gray-600">Sử dụng mã đơn hàng (orderCode) để tìm kiếm giao dịch trong hệ thống.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">3. Xác minh thông tin</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Kiểm tra số tiền giao dịch có khớp không</li>
                  <li>Xác minh thời gian thực hiện giao dịch</li>
                  <li>Kiểm tra trạng thái giao dịch (thành công/thất bại)</li>
                  <li>Xác minh thông tin người gửi tiền</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">4. Liên hệ hỗ trợ</h4>
                <p className="text-gray-600">
                  Nếu có bất kỳ nghi vấn nào về tính xác thực của giao dịch, 
                  hãy liên hệ với bộ phận hỗ trợ PayOS để được xác minh thêm.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPayOSModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalDetailAnalysis;