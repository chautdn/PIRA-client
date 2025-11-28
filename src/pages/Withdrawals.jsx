import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Lock,
  CreditCard,
  CheckCircle,
  Plus,
  Clock,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import BankAccountForm from "../components/wallet/BankAccountForm";
import WithdrawalModal from "../components/wallet/WithdrawalModal";
import userService from "../services/user.Api";
import withdrawalService from "../services/withdrawal";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import useChatSocket from "../hooks/useChatSocket";

const Withdrawals = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [showBankForm, setShowBankForm] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [bankAccount, setBankAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const { socket } = useChatSocket();

  // Check what the user is missing
  const isKycVerified = user?.cccd?.isVerified === true;
  const hasBankAccount = bankAccount && bankAccount.accountNumber;

  // Listen for withdrawal updates via socket
  React.useEffect(() => {
    if (!socket || !user) return;

    const handleWithdrawalUpdated = (data) => {
      console.log("💰 Withdrawal updated:", data);
      // Refresh withdrawals list when any withdrawal is updated
      fetchWithdrawals();
    };

    socket.on("withdrawal-updated", handleWithdrawalUpdated);

    return () => {
      socket.off("withdrawal-updated", handleWithdrawalUpdated);
    };
  }, [socket, user]);

  // Refresh user data on mount to get latest KYC status
  useEffect(() => {
    const initializeData = async () => {
      if (refreshUser) {
        await refreshUser();
      }
      if (user) {
        fetchBankAccount();
        fetchWithdrawals();
      }
    };
    initializeData();
  }, []);

  const fetchBankAccount = async () => {
    try {
      const response = await userService.getBankAccount();
      console.log("📊 Bank account response:", response.data);
      // Response structure: { status, message, data: { bankAccount: {...} } }
      const account =
        response.data?.data?.bankAccount || response.data?.bankAccount;
      console.log("🏦 Bank account:", account);
      setBankAccount(account);
    } catch (error) {
      // No bank account yet, which is fine
      if (error.response?.status !== 404) {
        console.error("Error fetching bank account:", error);
      }
      setBankAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setLoadingWithdrawals(true);
      const response = await withdrawalService.getMyWithdrawals();
      console.log("💰 Withdrawals response:", response.data);
      const withdrawalData =
        response.data?.metadata?.withdrawals || response.data?.data || [];
      setWithdrawals(withdrawalData);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      toast.error("Không thể tải lịch sử rút tiền");
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const handleBankAccountAdded = async () => {
    setShowBankForm(false);
    await fetchBankAccount();
    await refreshUser?.();
    toast.success("Bank account added! You can now request withdrawals.");
  };

  const handleWithdrawalSuccess = async () => {
    // Refresh user data and close modal
    await refreshUser?.();
    setShowWithdrawalModal(false);
    // Refresh withdrawal history
    fetchWithdrawals();
  };

  const handleGoToKyc = () => {
    navigate("/profile", { state: { openKyc: true } });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        label: "Chờ xử lý",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      processing: {
        label: "Đang xử lý",
        color: "bg-blue-100 text-blue-800",
        icon: Clock,
      },
      completed: {
        label: "Hoàn thành",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle2,
      },
      rejected: {
        label: "Từ chối",
        color: "bg-red-100 text-red-800",
        icon: XCircle,
      },
      cancelled: {
        label: "Đã hủy",
        color: "bg-gray-100 text-gray-800",
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3.5 h-3.5 mr-1" />
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleCancelWithdrawal = async (withdrawalId) => {
    if (!window.confirm("Bạn có chắc muốn hủy yêu cầu rút tiền này?")) {
      return;
    }

    try {
      await withdrawalService.cancelWithdrawal(withdrawalId);
      toast.success("Đã hủy yêu cầu rút tiền");
      fetchWithdrawals();
      await refreshUser?.();
    } catch (error) {
      console.error("Error canceling withdrawal:", error);
      toast.error(error.response?.data?.message || "Không thể hủy yêu cầu");
    }
  };

  // Step-by-step requirements checklist
  const renderRequirementChecklist = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Trước khi rút tiền
        </h2>
        <div className="space-y-4">
          {/* Step 1: KYC */}
          <div
            className={`flex items-start space-x-3 p-3 rounded-lg ${
              isKycVerified ? "bg-green-50" : "bg-gray-50"
            }`}
          >
            <div
              className={`flex-shrink-0 mt-0.5 ${
                isKycVerified ? "text-green-600" : "text-gray-400"
              }`}
            >
              {isKycVerified ? <CheckCircle size={20} /> : <Lock size={20} />}
            </div>
            <div className="flex-1">
              <h3
                className={`text-sm font-medium ${
                  isKycVerified ? "text-green-900" : "text-gray-900"
                }`}
              >
                Bước 1: Hoàn thành xác minh danh tính (KYC)
              </h3>
              <p
                className={`text-sm mt-1 ${
                  isKycVerified ? "text-green-700" : "text-gray-600"
                }`}
              >
                {isKycVerified
                  ? "✓ Danh tính của bạn đã được xác minh"
                  : "Xác minh danh tính để mở khóa chức năng rút tiền"}
              </p>
              {!isKycVerified && (
                <button
                  onClick={handleGoToKyc}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Hoàn thành xác minh KYC →
                </button>
              )}
            </div>
          </div>

          {/* Step 2: Bank Account */}
          <div
            className={`flex items-start space-x-3 p-3 rounded-lg ${
              hasBankAccount
                ? "bg-green-50"
                : isKycVerified
                ? "bg-gray-50"
                : "bg-gray-100 opacity-60"
            }`}
          >
            <div
              className={`flex-shrink-0 mt-0.5 ${
                hasBankAccount
                  ? "text-green-600"
                  : isKycVerified
                  ? "text-gray-400"
                  : "text-gray-300"
              }`}
            >
              {hasBankAccount ? (
                <CheckCircle size={20} />
              ) : (
                <CreditCard size={20} />
              )}
            </div>
            <div className="flex-1">
              <h3
                className={`text-sm font-medium ${
                  hasBankAccount
                    ? "text-green-900"
                    : isKycVerified
                    ? "text-gray-900"
                    : "text-gray-500"
                }`}
              >
                Bước 2: Thêm tài khoản ngân hàng
              </h3>
              <p
                className={`text-sm mt-1 ${
                  hasBankAccount
                    ? "text-green-700"
                    : isKycVerified
                    ? "text-gray-600"
                    : "text-gray-500"
                }`}
              >
                {hasBankAccount
                  ? `✓ ${bankAccount.bankName} - ${bankAccount.accountNumber}`
                  : isKycVerified
                  ? "Liên kết tài khoản ngân hàng Việt Nam để rút tiền"
                  : "Hoàn thành xác minh KYC trước"}
              </p>
              {!hasBankAccount && isKycVerified && (
                <button
                  onClick={() => setShowBankForm(true)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Thêm tài khoản ngân hàng →
                </button>
              )}
              {hasBankAccount && (
                <button
                  onClick={() => setShowBankForm(true)}
                  className="mt-2 text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  Chỉnh sửa tài khoản ngân hàng
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ready to withdraw message */}
        {isKycVerified && hasBankAccount && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="text-blue-600 mr-2" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Bạn đã sẵn sàng! Giờ bạn có thể yêu cầu rút tiền.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Rút tiền</h1>
        <p className="mt-2 text-gray-600">
          Rút tiền từ ví PIRA về tài khoản ngân hàng của bạn
        </p>
      </div>

      {/* Requirements Checklist */}
      {renderRequirementChecklist()}

      {/* Bank Account Form Modal */}
      {showBankForm && (
        <BankAccountForm
          key={bankAccount?.accountNumber || "new-bank-account"}
          existingAccount={bankAccount}
          onSuccess={handleBankAccountAdded}
          onCancel={() => setShowBankForm(false)}
          isModal={true}
        />
      )}

      {/* Withdrawal Request Modal */}
      {showWithdrawalModal && (
        <WithdrawalModal
          isOpen={showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(false)}
          onSuccess={handleWithdrawalSuccess}
          bankAccount={bankAccount}
        />
      )}

      {/* Main Content - Withdrawal History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Lịch sử rút tiền
            </h2>
            {isKycVerified && hasBankAccount && (
              <button
                type="button"
                onClick={() => setShowWithdrawalModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus size={16} className="mr-2" />
                Yêu cầu rút tiền
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {loadingWithdrawals ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Chưa có yêu cầu rút tiền
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {isKycVerified && hasBankAccount
                  ? 'Nhấn "Yêu cầu rút tiền" để bắt đầu'
                  : "Hoàn thành các bước trên để bắt đầu rút tiền"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phản hồi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(withdrawal.createdAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(withdrawal.createdAt), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(withdrawal.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(withdrawal.status)}
                      </td>
                      <td className="px-6 py-4">
                        {withdrawal.rejectionReason && (
                          <div className="text-sm">
                            <span className="font-medium text-red-600">
                              Lý do từ chối:
                            </span>
                            <p className="text-red-700 mt-1">
                              {withdrawal.rejectionReason}
                            </p>
                          </div>
                        )}
                        {withdrawal.adminNote &&
                          !withdrawal.rejectionReason && (
                            <div className="text-sm">
                              <span className="font-medium text-gray-600">
                                Ghi chú:
                              </span>
                              <p className="text-gray-700 mt-1">
                                {withdrawal.adminNote}
                              </p>
                            </div>
                          )}
                        {!withdrawal.rejectionReason &&
                          !withdrawal.adminNote && (
                            <span className="text-sm text-gray-400">
                              Chưa có phản hồi
                            </span>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Withdrawals;
