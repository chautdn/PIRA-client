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

  // Show existing bank account
  return (
    <div className="space-y-6">
      {/* Bank Account Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {bankAccount.bankName}
              </h3>
              <p className="text-sm text-gray-600">{bankAccount.bankCode}</p>
            </div>
          </div>
          {bankAccount.isVerified && (
            <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Đã xác minh</span>
            </div>
          )}
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Số tài khoản</p>
            <p className="text-xl font-mono font-bold text-gray-900">
              {bankAccount.accountNumber}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Chủ tài khoản</p>
            <p className="text-lg font-semibold text-gray-900">
              {bankAccount.accountHolderName}
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-500 mb-4">
          Đã thêm vào:{" "}
          {new Date(bankAccount.addedAt).toLocaleDateString("vi-VN")}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-blue-200">
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-white text-blue-600 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            <span>Chỉnh sửa</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-white text-red-600 border-2 border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa</span>
          </button>
        </div>
      </div>

      {/* Important Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Lưu ý quan trọng:</strong> Tài khoản ngân hàng này sẽ được
          sử dụng để rút tiền. Vui lòng đảm bảo thông tin chính xác để tránh trì
          hoãn trong quá trình xử lý.
        </p>
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
