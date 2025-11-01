import React from "react";
import { motion } from "framer-motion";
import icons from "../../../../utils/icons";
import promotionService from "../../../../services/promotion";

const FormNavigation = ({
  currentStep,
  totalSteps,
  isSubmitting,
  walletBalance,
  formData,
  onPrevious,
  onNext,
  onSubmit,
}) => {
  const calculatePromotionCost = () => {
    if (!formData.promotion?.enabled || !formData.promotion?.tier) {
      return 0;
    }

    const basePrice =
      promotionService.TIER_PRICES[formData.promotion.tier] *
      formData.promotion.duration;

    const discount = formData.promotion.duration >= 3 ? basePrice * 0.1 : 0;
    return basePrice - discount;
  };

  const promotionCost = calculatePromotionCost();
  const hasInsufficientBalance =
    formData.promotion?.enabled &&
    formData.promotion?.tier &&
    formData.promotion?.paymentMethod === "wallet" &&
    promotionCost > walletBalance;

  const isLastStep = currentStep === totalSteps;

  return (
    <div className="space-y-4">
      {/* Insufficient Balance Warning */}
      {hasInsufficientBalance && (
        <motion.div
          className="bg-red-50 border-2 border-red-300 rounded-xl p-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-4">
            <icons.BiError className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-bold text-red-900 mb-2">
                ⚠️ Số dư ví không đủ
              </h4>
              <p className="text-sm text-red-800">
                Bạn cần thêm{" "}
                <span className="font-bold">
                  {promotionService.formatCurrency(
                    promotionCost - walletBalance
                  )}
                </span>{" "}
                vào ví hoặc chọn phương thức thanh toán PayOS để tiếp tục.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4">
        {/* Previous Button */}
        {currentStep > 1 && (
          <motion.button
            type="button"
            onClick={onPrevious}
            disabled={isSubmitting}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <icons.FiArrowLeft className="w-5 h-5" />
            Quay Lại
          </motion.button>
        )}

        {/* Submit/Next Button */}
        <motion.button
          type="button"
          onClick={isLastStep ? onSubmit : onNext}
          disabled={isSubmitting || hasInsufficientBalance}
          className={`ml-auto px-8 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
            isLastStep
              ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
              : "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
          }`}
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
        >
          {isSubmitting ? (
            <>
              <icons.BiLoaderAlt className="w-5 h-5 animate-spin" />
              Đang xử lý...
            </>
          ) : isLastStep ? (
            <>
              <icons.FiCheck className="w-5 h-5" />
              Hoàn Tất & Đăng Sản Phẩm
            </>
          ) : (
            <>
              Tiếp Theo
              <icons.FiArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>

      {/* Submit Hint */}
      {isLastStep && !hasInsufficientBalance && (
        <p className="text-center text-sm text-gray-500">
          {formData.promotion?.enabled
            ? "Sản phẩm sẽ được đăng và quảng cáo ngay sau khi thanh toán thành công"
            : "Sản phẩm sẽ được đăng ngay lập tức"}
        </p>
      )}
    </div>
  );
};

export default FormNavigation;
