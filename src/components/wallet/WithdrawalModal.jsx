import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle, DollarSign, Loader } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import withdrawalService from "../../services/withdrawal";
import {
  formatCurrency,
  validateAmount,
  LIMITS,
} from "../../utils/withdrawalHelpers";
import toast from "react-hot-toast";

const WithdrawalModal = ({ isOpen, onClose, onSuccess, bankAccount }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [errors, setErrors] = useState({});

  const balance = user?.wallet?.balance?.available || 0;
  const remainingDaily = LIMITS.DAILY - dailyTotal;

  useEffect(() => {
    if (isOpen) {
      fetchDailyTotal();
      // Reset form
      setAmount("");
      setNote("");
      setErrors({});
    }
  }, [isOpen]);

  const fetchDailyTotal = async () => {
    try {
      const response = await withdrawalService.getDailyTotal();
      setDailyTotal(response.data.dailyTotal || 0);
    } catch (error) {
      console.error("Failed to fetch daily total:", error);
    }
  };

  const handleAmountChange = (value) => {
    // Remove non-numeric characters except dots
    const cleaned = value.replace(/[^\d]/g, "");
    setAmount(cleaned);

    // Clear amount errors when user types
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: null }));
    }
  };

  const setQuickAmount = (value) => {
    setAmount(value.toString());
    setErrors((prev) => ({ ...prev, amount: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    const numAmount = parseInt(amount);

    if (!amount || numAmount <= 0) {
      newErrors.amount = "Vui lòng nhập số tiền";
      setErrors(newErrors);
      return false;
    }

    const validation = validateAmount(numAmount, balance, dailyTotal);
    if (!validation.valid) {
      newErrors.amount = validation.error;
      setErrors(newErrors);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await withdrawalService.requestWithdrawal({
        amount: parseInt(amount),
        note: note.trim() || undefined,
      });

      toast.success("Yêu cầu rút tiền đã được gửi! Chờ xử lý trong 3-5 ngày.");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Withdrawal request failed:", error);
      const errorMsg =
        error.response?.data?.message || "Không thể tạo yêu cầu rút tiền";
      toast.error(errorMsg);

      // Set field-specific errors if available
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const numAmount = parseInt(amount) || 0;
  const progressPercent = (dailyTotal / LIMITS.DAILY) * 100;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Yêu cầu rút tiền</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Balance Display */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Số dư khả dụng</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Bank Account Display */}
          {bankAccount && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Rút về tài khoản</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {bankAccount.bankName}
                  </p>
                  <p className="text-sm text-gray-600 font-mono">
                    {bankAccount.accountNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    {bankAccount.accountHolderName}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số tiền muốn rút <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount ? parseInt(amount).toLocaleString("vi-VN") : ""}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Nhập số tiền"
                className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.amount
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                }`}
                disabled={loading}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                đ
              </span>
            </div>
            {errors.amount && (
              <div className="mt-2 flex items-center text-sm text-red-600">
                <AlertCircle size={16} className="mr-1" />
                {errors.amount}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Tối thiểu: {formatCurrency(LIMITS.MIN)} - Tối đa:{" "}
              {formatCurrency(LIMITS.MAX)}
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Chọn nhanh</p>
            <div className="grid grid-cols-3 gap-2">
              {[100000, 500000, 1000000, 2000000, 5000000, 10000000].map(
                (quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setQuickAmount(quickAmount)}
                    disabled={
                      loading ||
                      quickAmount > balance ||
                      quickAmount > remainingDaily
                    }
                    className={`px-3 py-2 text-sm font-medium border-2 rounded-lg transition-colors ${
                      parseInt(amount) === quickAmount
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-blue-300 text-gray-700"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {quickAmount >= 1000000
                      ? `${quickAmount / 1000000}M`
                      : `${quickAmount / 1000}K`}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Daily Limit Progress */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">
                Hạn mức hôm nay
              </p>
              <p className="text-sm text-gray-600">
                {formatCurrency(dailyTotal)} / {formatCurrency(LIMITS.DAILY)}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  progressPercent >= 90
                    ? "bg-red-500"
                    : progressPercent >= 70
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Còn lại: {formatCurrency(remainingDaily)}
            </p>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú (tùy chọn)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Thêm ghi chú cho yêu cầu rút tiền..."
              rows={3}
              maxLength={200}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500 text-right">
              {note.length}/200
            </p>
          </div>

          {/* Warning */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle
                className="text-orange-500 mr-2 flex-shrink-0 mt-0.5"
                size={18}
              />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">Lưu ý quan trọng:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Yêu cầu sẽ được xử lý trong 3-5 ngày làm việc</li>
                  <li>Bạn có thể hủy yêu cầu nếu chưa được xử lý</li>
                  <li>Kiểm tra kỹ thông tin tài khoản ngân hàng</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !amount || parseInt(amount) <= 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin mr-2" size={18} />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận rút tiền"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default WithdrawalModal;
