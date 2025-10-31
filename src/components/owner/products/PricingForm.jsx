import React from "react";

const PricingForm = ({ pricing, onChange, errors }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value || 0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Daily Rate */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          💰 Giá Thuê Hàng Ngày (VND) *
        </label>
        <div className="relative">
          <input
            type="number"
            name="pricing.dailyRate"
            value={pricing.dailyRate}
            onChange={onChange}
            min="0"
            step="1000"
            className={`w-full px-4 py-3 pr-16 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 ${
              errors.dailyRate
                ? "border-red-500 bg-red-50 focus:ring-red-200 focus:border-red-500 animate-shake"
                : "border-gray-300 hover:border-primary-400 focus:border-primary-500 focus:ring-primary-200"
            }`}
            placeholder="50000"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            <span className="text-gray-500 text-sm font-medium">VND</span>
          </div>
        </div>
        {errors.dailyRate && (
          <p className="text-red-600 text-sm mt-2 flex items-center font-medium bg-red-50 px-3 py-1.5 rounded-lg">
            <svg
              className="w-4 h-4 mr-1.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.dailyRate}
          </p>
        )}
        {pricing.dailyRate && !errors.dailyRate && (
          <p className="text-gray-500 text-xs mt-1">
            ≈ {formatCurrency(pricing.dailyRate)} mỗi ngày
          </p>
        )}
      </div>

      {/* Deposit Amount */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          🔒 Tiền Đặt Cọc (VND) *
        </label>
        <div className="space-y-3">
          <div className="relative">
            <input
              type="number"
              name="pricing.deposit.amount"
              value={pricing.deposit.amount}
              onChange={onChange}
              min="0"
              step="1000"
              className={`w-full px-4 py-3 pr-16 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 ${
                errors.depositAmount
                  ? "border-red-500 bg-red-50 focus:ring-red-200 focus:border-red-500 animate-shake"
                  : "border-gray-300 hover:border-primary-400 focus:border-primary-500 focus:ring-primary-200"
              }`}
              placeholder="100000"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
              <span className="text-gray-500 text-sm font-medium">VND</span>
            </div>
          </div>

          {/* Deposit Type */}
          <select
            name="pricing.deposit.type"
            value={pricing.deposit.type}
            onChange={onChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-200 focus:border-primary-500 hover:border-primary-400 transition-all duration-200 appearance-none bg-white"
          >
            <option value="FIXED">Số tiền cố định</option>
            <option value="PERCENTAGE">Phần trăm giá thuê</option>
          </select>
        </div>

        {errors.depositAmount && (
          <p className="text-red-600 text-sm mt-2 flex items-center font-medium bg-red-50 px-3 py-1.5 rounded-lg">
            <svg
              className="w-4 h-4 mr-1.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.depositAmount}
          </p>
        )}

        {pricing.deposit.amount && !errors.depositAmount && (
          <p className="text-gray-500 text-xs mt-1">
            {pricing.deposit.type === "FIXED"
              ? `≈ ${formatCurrency(pricing.deposit.amount)} tiền đặt cọc`
              : `≈ ${
                  pricing.deposit.amount
                }% của giá thuê hàng ngày (${formatCurrency(
                  (pricing.dailyRate * pricing.deposit.amount) / 100
                )})`}
          </p>
        )}
      </div>

      {/* Pricing Summary */}
      {pricing.dailyRate && pricing.deposit.amount && (
        <div className="md:col-span-2 bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Pricing Summary
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Daily Rate:</span>
              <span className="font-medium">
                {formatCurrency(pricing.dailyRate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Security Deposit:</span>
              <span className="font-medium">
                {pricing.deposit.type === "FIXED"
                  ? formatCurrency(pricing.deposit.amount)
                  : `${pricing.deposit.amount}% (${formatCurrency(
                      (pricing.dailyRate * pricing.deposit.amount) / 100
                    )})`}
              </span>
            </div>
            <div className="border-t pt-1 flex justify-between font-semibold">
              <span>Total (1 day):</span>
              <span>
                {formatCurrency(
                  parseFloat(pricing.dailyRate) +
                    (pricing.deposit.type === "FIXED"
                      ? parseFloat(pricing.deposit.amount)
                      : (parseFloat(pricing.dailyRate) *
                          parseFloat(pricing.deposit.amount)) /
                        100)
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingForm;
