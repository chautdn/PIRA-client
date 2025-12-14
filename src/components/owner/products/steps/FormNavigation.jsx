import React from "react";
import { motion } from "framer-motion";
import icons from "../../../../utils/icons";
import promotionService from "../../../../services/promotion";
import { useI18n } from "../../../../hooks/useI18n";

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
  const { t } = useI18n();
  
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

  const hasNotAgreedToTerms = !formData.agreedToTerms;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="space-y-4">
      {/* Terms Agreement Warning */}
      {isLastStep && hasNotAgreedToTerms && (
        <motion.div
          className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-4">
            <icons.BiInfoCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-bold text-orange-900 mb-2">
                {t('productForm.needTermsWarning')}
              </h4>
              <p className="text-sm text-orange-800">
                {t('productForm.needTermsDesc')}
              </p>
            </div>
          </div>
        </motion.div>
      )}

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
                {t('productForm.insufficientBalance')}
              </h4>
              <p className="text-sm text-red-800">
                {t('productForm.insufficientBalanceDesc').replace('{{amount}}', promotionService.formatCurrency(promotionCost - walletBalance))}
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
            {t('productForm.backButton')}
          </motion.button>
        )}

        {/* Submit/Next Button */}
        <motion.button
          type="button"
          onClick={isLastStep ? onSubmit : onNext}
          disabled={
            isSubmitting ||
            hasInsufficientBalance ||
            (isLastStep && hasNotAgreedToTerms)
          }
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
              {t('productForm.processing')}
            </>
          ) : isLastStep ? (
            <>
              <icons.FiCheck className="w-5 h-5" />
              {t('productForm.submitButton')}
            </>
          ) : (
            <>
              {t('productForm.nextButton')}
              <icons.FiArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>

      {/* Submit Hint */}
      {isLastStep && !hasInsufficientBalance && !hasNotAgreedToTerms && (
        <p className="text-center text-sm text-gray-500">
          {formData.promotion?.enabled
            ? t('productForm.postAfterPayment')
            : t('productForm.postNow')}
        </p>
      )}
    </div>
  );
};

export default FormNavigation;
