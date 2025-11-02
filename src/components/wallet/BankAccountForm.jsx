import React, { useState, useMemo, useRef, memo } from "react";
import { X } from "lucide-react";
import {
  VIETNAMESE_BANKS,
  validateBankAccount,
} from "../../utils/withdrawalHelpers";
import userService from "../../services/user.Api";
import toast from "react-hot-toast";

const BankAccountFormInner = ({
  existingAccount,
  onSuccess,
  onCancel,
  isModal = false,
}) => {
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log("🔄 BankAccountForm render #", renderCount.current, {
    existingAccount,
  });

  // Check if existingAccount has actual data (not just empty object)
  const hasExistingAccount = Boolean(existingAccount?.accountNumber);

  // Initialize state with lazy initialization function - ONLY RUNS ONCE
  const [formState, setFormState] = useState(() => {
    console.log("🎬 Initializing state with:", existingAccount);
    return {
      bankCode: existingAccount?.bankCode || "",
      accountNumber: existingAccount?.accountNumber || "",
      accountHolderName: existingAccount?.accountHolderName || "",
    };
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    console.log("📝 Field change:", field, "=", value);
    setFormState((prev) => {
      const newState = { ...prev, [field]: value };
      console.log("✅ New state:", newState);
      return newState;
    });
    if (errors[field]) {
      setErrors((prev) => {
        const { [field]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formState.bankCode) {
      newErrors.bankCode = "Vui lòng chọn ngân hàng";
    }

    const accountValidation = validateBankAccount(
      formState.bankCode,
      formState.accountNumber
    );
    if (!accountValidation.valid) {
      newErrors.accountNumber = accountValidation.error;
    }

    if (!formState.accountHolderName.trim()) {
      newErrors.accountHolderName = "Vui lòng nhập tên chủ tài khoản";
    } else if (formState.accountHolderName.length > 100) {
      newErrors.accountHolderName = "Tên quá dài (tối đa 100 ký tự)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        bankCode: formState.bankCode,
        accountNumber: formState.accountNumber.replace(/[\s-]/g, ""),
        accountHolderName: formState.accountHolderName.trim().toUpperCase(),
      };

      if (hasExistingAccount) {
        // Update existing account
        await userService.updateBankAccount(payload);
        toast.success("Cập nhật tài khoản ngân hàng thành công!");
      } else {
        // Add new account
        await userService.addBankAccount(payload);
        toast.success("Thêm tài khoản ngân hàng thành công!");
      }
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Không thể lưu tài khoản ngân hàng";
      toast.error(errorMessage);
      console.error("Bank account error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Bank Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ngân hàng <span className="text-red-500">*</span>
        </label>
        <select
          value={formState.bankCode}
          onChange={(e) => handleChange("bankCode", e.target.value)}
          disabled={hasExistingAccount || loading}
          className={`w-full px-4 py-3 border-2 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            errors.bankCode
              ? "border-red-500 bg-red-50"
              : hasExistingAccount
              ? "border-gray-200 bg-gray-100 cursor-not-allowed text-gray-500"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
        >
          <option value="">Chọn ngân hàng</option>
          {VIETNAMESE_BANKS.map((bank) => (
            <option key={bank.code} value={bank.code}>
              {bank.name} ({bank.code})
            </option>
          ))}
        </select>
        {errors.bankCode && (
          <p className="text-red-600 text-sm mt-1.5 flex items-center">
            <span className="mr-1">⚠</span>
            {errors.bankCode}
          </p>
        )}
      </div>

      {/* Account Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Số tài khoản <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formState.accountNumber}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, "");
            handleChange("accountNumber", value);
          }}
          disabled={hasExistingAccount || loading}
          placeholder="Nhập số tài khoản (chỉ số)"
          maxLength="19"
          autoComplete="off"
          className={`w-full px-4 py-3 border-2 rounded-lg font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            errors.accountNumber
              ? "border-red-500 bg-red-50"
              : hasExistingAccount
              ? "border-gray-200 bg-gray-100 cursor-not-allowed text-gray-500"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
        />
        {errors.accountNumber && (
          <p className="text-red-600 text-sm mt-1.5 flex items-center">
            <span className="mr-1">⚠</span>
            {errors.accountNumber}
          </p>
        )}
        {!hasExistingAccount && !errors.accountNumber && (
          <p className="text-gray-500 text-sm mt-1.5">
            💡 Nhập số tài khoản ngân hàng (12-19 chữ số)
          </p>
        )}
      </div>

      {/* Account Holder Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên chủ tài khoản <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formState.accountHolderName}
          onChange={(e) => {
            const value = e.target.value.toUpperCase();
            handleChange("accountHolderName", value);
          }}
          disabled={loading}
          placeholder="VD: NGUYEN VAN A"
          maxLength="100"
          autoComplete="off"
          className={`w-full px-4 py-3 border-2 rounded-lg text-base uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            errors.accountHolderName
              ? "border-red-500 bg-red-50"
              : loading
              ? "border-gray-200 bg-gray-100 cursor-not-allowed"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
        />
        {errors.accountHolderName && (
          <p className="text-red-600 text-sm mt-1.5 flex items-center">
            <span className="mr-1">⚠</span>
            {errors.accountHolderName}
          </p>
        )}
        {!errors.accountHolderName && (
          <p className="text-gray-500 text-sm mt-1.5">
            💡 Tên phải khớp với tên đăng ký tại ngân hàng (tự động viết hoa)
          </p>
        )}
      </div>

      {/* Important Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-yellow-800">
            <strong>Lưu ý quan trọng:</strong> Vui lòng đảm bảo thông tin tài
            khoản ngân hàng chính xác. Thông tin sai có thể dẫn đến thất bại
            trong quá trình rút tiền.
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? "Đang lưu..."
            : hasExistingAccount
            ? "Cập nhật"
            : "Thêm tài khoản"}
        </button>
      </div>
    </form>
  );

  // If used as modal
  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
            <h2 className="text-xl font-semibold text-gray-900">
              {hasExistingAccount
                ? "Cập nhật tài khoản ngân hàng"
                : "Thêm tài khoản ngân hàng"}
            </h2>
            <button
              onClick={onCancel}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-6">{formContent}</div>
        </div>
      </div>
    );
  }

  // If used inline
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-5">
        {hasExistingAccount
          ? "Cập nhật tài khoản ngân hàng"
          : "Thêm tài khoản ngân hàng"}
      </h3>
      {formContent}
    </div>
  );
};

// Memoize the component with custom comparison
const BankAccountForm = memo(BankAccountFormInner, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.isModal === nextProps.isModal &&
    prevProps.existingAccount?.accountNumber ===
      nextProps.existingAccount?.accountNumber &&
    prevProps.onSuccess === nextProps.onSuccess &&
    prevProps.onCancel === nextProps.onCancel
  );
});

export default BankAccountForm;
