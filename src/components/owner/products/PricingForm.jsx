import React from "react";
import { useI18n } from "../../../hooks/useI18n";

const PricingForm = ({ pricing = {}, onChange, errors = {} }) => {
  const { t } = useI18n();
  
  // Ensure pricing has correct structure
  const safePricing = {
    dailyRate: pricing?.dailyRate || "",
    deposit: {
      amount: pricing?.deposit?.amount || "",
      type: pricing?.deposit?.type || "FIXED",
    },
  };

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
          {t('productForm.dailyRentPrice')}
        </label>
        <div className="relative">
          <input
            type="number"
            name="pricing.dailyRate"
            value={safePricing.dailyRate}
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
        {safePricing.dailyRate && !errors.dailyRate && (
          <p className="text-gray-500 text-xs mt-1">
            ≈ {formatCurrency(safePricing.dailyRate)} {t('productForm.perDay')}
          </p>
        )}
      </div>

      {/* Deposit Amount */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          {t('productForm.depositAmount')}
        </label>
        <div className="space-y-3">
          <div className="relative">
            <input
              type="number"
              name="pricing.deposit.amount"
              value={safePricing.deposit.amount}
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
            value={safePricing.deposit.type}
            onChange={onChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-200 focus:border-primary-500 hover:border-primary-400 transition-all duration-200 appearance-none bg-white"
          >
            <option value="FIXED">{t('productForm.depositType')}</option>
            <option value="PERCENTAGE">% {t('productForm.dailyRentPrice')}</option>
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

        {safePricing.deposit.amount && !errors.depositAmount && (
          <p className="text-gray-500 text-xs mt-1">
            {safePricing.deposit.type === "FIXED"
              ? `≈ ${formatCurrency(safePricing.deposit.amount)} tiền đặt cọc`
              : `≈ ${
                  safePricing.deposit.amount
                }% của giá thuê hàng ngày (${formatCurrency(
                  (safePricing.dailyRate * safePricing.deposit.amount) / 100
                )})`}
          </p>
        )}
      </div>
    </div>
  );
};

export default PricingForm;
