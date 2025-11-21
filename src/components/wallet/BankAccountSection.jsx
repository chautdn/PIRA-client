import { useState, useEffect, useCallback, useRef, memo } from "react";
import { Building2, CheckCircle, Edit2, Trash2 } from "lucide-react";
import BankAccountForm from "./BankAccountForm";
import userService from "../../services/user.Api";
import toast from "react-hot-toast";

const BankAccountSection = memo(({ user, onUpdate }) => {
  const [bankAccount, setBankAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const bankAccountRef = useRef(null);
  const stableAccountRef = useRef(null);

  // Fetch bank account on mount
  useEffect(() => {
    fetchBankAccount();
  }, []);

  const fetchBankAccount = async () => {
    try {
      setLoading(true);
      const response = await userService.getBankAccount();
      // Response structure: { status, message, data: { bankAccount: {...} } }
      const account =
        response.data?.data?.bankAccount || response.data?.bankAccount;
      setBankAccount(account);
      bankAccountRef.current = account;
    } catch (error) {
      console.error("Failed to fetch bank account:", error);
      if (error.response?.status !== 404) {
        toast.error("Không thể tải thông tin tài khoản ngân hàng");
      }
      setBankAccount(null);
      bankAccountRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = useCallback(() => {
    setIsEditing(false);
    // Use ref to avoid dependency on bankAccount state
    const wasEditing = bankAccountRef.current !== null;
    fetchBankAccount();
    if (onUpdate) onUpdate(); // Refresh parent user data
    toast.success(
      wasEditing
        ? "Cập nhật tài khoản ngân hàng thành công"
        : "Thêm tài khoản ngân hàng thành công"
    );
  }, [onUpdate]);

  const handleDelete = useCallback(async () => {
    try {
      await userService.removeBankAccount();
      setBankAccount(null);
      setShowDeleteConfirm(false);
      if (onUpdate) onUpdate(); // Refresh parent user data
      toast.success("Đã xóa tài khoản ngân hàng");
    } catch (error) {
      console.error("Failed to delete bank account:", error);
      toast.error(
        error.response?.data?.message || "Không thể xóa tài khoản ngân hàng"
      );
    }
  }, [onUpdate]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Show form if editing or no bank account
  if (isEditing || !bankAccount) {
    console.log("🏦 Rendering BankAccountForm, bankAccount:", bankAccount);

    // Store stable reference to prevent re-renders
    if (bankAccount?.accountNumber && !stableAccountRef.current) {
      stableAccountRef.current = bankAccount;
    }

    return (
      <div className="space-y-6">
        <BankAccountForm
          key="bank-form"
          isModal={false}
          existingAccount={stableAccountRef.current || bankAccount}
          onSuccess={handleFormSuccess}
          onCancel={bankAccount ? handleCancelEdit : null}
        />
      </div>
    );
  }

  // Get status display
  const getStatusDisplay = () => {
    const status = bankAccount?.status?.toUpperCase() || 'PENDING';
    
    switch (status) {
      case 'VERIFIED':
        return {
          text: 'Đã xác minh',
          color: 'text-green-700',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300',
          icon: '✅'
        };
      case 'REJECTED':
        return {
          text: 'Bị từ chối',
          color: 'text-red-700',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-300',
          icon: '❌'
        };
      default:
        return {
          text: 'Chờ xác minh',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-300',
          icon: '⏳'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  // Show existing bank account
  return (
    <div className="space-y-6">
      {/* Bank Account Card */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        {/* Header with Bank Info */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {bankAccount.bankName}
                </h3>
                <p className="text-blue-100 text-sm font-medium">{bankAccount.bankCode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="p-6 space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-gray-100">
            <span className="text-sm font-medium text-gray-600">Trạng thái</span>
            <div className={`flex items-center gap-2 px-4 py-2 ${statusDisplay.bgColor} ${statusDisplay.borderColor} border-2 rounded-lg`}>
              <span className="text-lg">{statusDisplay.icon}</span>
              <span className={`font-bold text-sm ${statusDisplay.color}`}>
                {statusDisplay.text}
              </span>
            </div>
          </div>

          {/* Account Number */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-600 mb-1 font-medium">Số tài khoản</p>
            <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
              {bankAccount.accountNumber}
            </p>
          </div>

          {/* Account Holder */}
          <div className="bg-gradient-to-r from-gray-50 to-purple-50 p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-600 mb-1 font-medium">Chủ tài khoản</p>
            <p className="text-lg font-bold text-gray-900">
              {bankAccount.accountHolderName}
            </p>
          </div>

          {/* Metadata Row */}
          <div className="flex items-center justify-between pt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span>📅</span>
              <span>Đã thêm: {new Date(bankAccount.addedAt).toLocaleDateString("vi-VN")}</span>
            </div>
            {bankAccount.verifiedAt && (
              <div className="flex items-center gap-1 text-green-600">
                <span>✓</span>
                <span>Xác minh: {new Date(bankAccount.verifiedAt).toLocaleDateString("vi-VN")}</span>
              </div>
            )}
          </div>

          {/* Rejection Info */}
          {bankAccount.status === 'REJECTED' && bankAccount.rejectionReason && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-800 mb-1">Lý do từ chối:</p>
              <p className="text-sm text-red-700">{bankAccount.rejectionReason}</p>
            </div>
          )}

          {/* Admin Note */}
          {bankAccount.status === 'VERIFIED' && bankAccount.adminNote && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-800 mb-1">Ghi chú từ Admin:</p>
              <p className="text-sm text-green-700">{bankAccount.adminNote}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-600 shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <Edit2 className="w-4 h-4" />
            <span>Chỉnh sửa</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-red-600 border-2 border-red-300 font-semibold rounded-xl hover:bg-red-50 shadow-md transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa</span>
          </button>
        </div>
      </div>

      {/* Important Note */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-5 shadow-md">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-bold text-yellow-900 mb-1">Lưu ý quan trọng</p>
            <p className="text-sm text-yellow-800">
              Tài khoản ngân hàng này sẽ được sử dụng để rút tiền. Vui lòng đảm bảo thông tin chính xác để tránh trì hoãn trong quá trình xử lý.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Xác nhận xóa tài khoản ngân hàng
              </h3>
              <p className="text-gray-600">
                Bạn có chắc chắn muốn xóa tài khoản ngân hàng này không? Bạn sẽ
                không thể rút tiền cho đến khi thêm tài khoản mới.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default BankAccountSection;
