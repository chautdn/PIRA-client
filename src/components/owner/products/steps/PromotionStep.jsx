import React from "react";
import { motion } from "framer-motion";
import icons from "../../../../utils/icons";
import promotionService from "../../../../services/promotion";
import { useI18n } from "../../../../hooks/useI18n";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const PromotionStep = ({
  formData,
  walletBalance,
  walletLoading,
  handleInputChange,
  errors = {},
}) => {
  const { t } = useI18n();
  const handlePromotionToggle = (enabled, tier = null) => {
    handleInputChange({
      target: {
        name: "promotion",
        value: {
          ...formData.promotion,
          enabled,
          tier,
        },
      },
    });
  };

  const handleTierChange = (tier) => {
    handleInputChange({
      target: {
        name: "promotion",
        value: {
          ...formData.promotion,
          enabled: true,
          tier: parseInt(tier),
        },
      },
    });
  };

  const handleDurationChange = (duration) => {
    handleInputChange({
      target: {
        name: "promotion",
        value: {
          ...formData.promotion,
          duration: parseInt(duration),
        },
      },
    });
  };

  const handlePaymentMethodChange = (method) => {
    handleInputChange({
      target: {
        name: "promotion",
        value: {
          ...formData.promotion,
          paymentMethod: method,
        },
      },
    });
  };

  const calculateTotal = () => {
    if (!formData.promotion.tier) return 0;

    const basePrice =
      promotionService.TIER_PRICES[formData.promotion.tier] *
      formData.promotion.duration;

    const discount = formData.promotion.duration >= 3 ? basePrice * 0.1 : 0;
    return basePrice - discount;
  };

  return (
    <motion.div id="promotion-section" className="space-y-8" {...fadeInUp}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full font-bold text-sm mb-4 shadow-lg">
          🚀 {t('productForm.promotionBadge')}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {t('productForm.promotionTitle')}
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('productForm.promotionSubtitle')}
        </p>
      </div>

      {/* Benefits Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border-2 border-blue-200">
          <div className="text-3xl mb-2">⚡</div>
          <div className="font-bold text-gray-900 mb-1">{t('productForm.showFirst')}</div>
          <div className="text-sm text-gray-600">
            {t('productForm.showFirstDesc')}
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border-2 border-purple-200">
          <div className="text-3xl mb-2">👑</div>
          <div className="font-bold text-gray-900 mb-1">{t('productForm.specialBadge')}</div>
          <div className="text-sm text-gray-600">
            {t('productForm.specialBadgeDesc')}
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border-2 border-green-200">
          <div className="text-3xl mb-2">📈</div>
          <div className="font-bold text-gray-900 mb-1">{t('productForm.moreViews')}</div>
          <div className="text-sm text-gray-600">{t('productForm.moreViewsDesc')}</div>
        </div>
      </div>

      {/* "No Thanks" Option */}
      <div className="space-y-4">
        <motion.button
          type="button"
          onClick={() => handlePromotionToggle(false, null)}
          className={`w-full p-5 rounded-2xl border-2 transition-all text-center ${
            !formData.promotion.enabled
              ? "border-gray-400 bg-gray-50 shadow-md"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center gap-3">
            {formData.promotion.enabled ? (
              <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
            ) : (
              <div className="w-5 h-5 bg-primary-600 rounded flex items-center justify-center">
                <icons.FiCheck className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="font-semibold text-gray-700">
              {t('productForm.normalPost')}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {t('productForm.normalPostDesc')}
          </p>
        </motion.button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-dashed border-gray-300"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-sm font-bold text-gray-500 uppercase">
            {t('productForm.orSelectPackage')}
          </span>
        </div>
      </div>

      {/* Tier Selection */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(promotionService.TIER_CONFIG).map(
            ([tier, config]) => {
              const isSelected =
                formData.promotion.enabled &&
                formData.promotion.tier === parseInt(tier);
              const isPopular = tier === "3"; // Tier 3 (Popular)

              return (
                <div
                  key={tier}
                  className={`relative ${isPopular ? "pt-4" : ""}`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 whitespace-nowrap">
                        <span>🔥</span>
                        <span>{t('productForm.popular')}</span>
                      </div>
                    </div>
                  )}

                  <motion.button
                    type="button"
                    onClick={() => handleTierChange(tier)}
                    className={`relative p-5 rounded-2xl border-2 transition-all w-full ${
                      isSelected
                        ? "border-primary-500 bg-primary-50 shadow-xl ring-2 ring-primary-300"
                        : "border-gray-200 hover:border-primary-300 bg-white hover:shadow-md"
                    }`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Selected Check Mark */}
                    {isSelected && (
                      <motion.div
                        className="absolute -top-2 -right-2 bg-primary-600 text-white rounded-full p-1.5 shadow-lg"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <icons.FiCheck className="w-3.5 h-3.5" />
                      </motion.div>
                    )}

                    <div className="text-center w-full">
                      {/* Icon */}
                      <div className="text-4xl mb-2">{config.icon}</div>

                      {/* Tier Name */}
                      <h4 className="font-bold text-lg mb-2 text-gray-900 truncate px-1">
                        {t(`productForm.tier${tier}Name`)}
                      </h4>

                      {/* Price */}
                      <div className="mb-3">
                        <div className="text-2xl font-bold text-green-600 leading-tight">
                          {promotionService
                            .formatCurrency(promotionService.TIER_PRICES[tier])
                            .replace(" VNĐ", "")
                            .replace(",", ".")}
                          <span className="text-base font-normal text-gray-600">
                            {" "}
                            ₫
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {t('productForm.perDay')}
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-1.5 text-left px-1">
                        {[1, 2, 3, 4].map((featureNum) => (
                          <div
                            key={featureNum}
                            className="flex items-start gap-1.5 text-xs text-gray-600"
                          >
                            <icons.FiCheck
                              className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                                isSelected
                                  ? "text-primary-600"
                                  : "text-gray-400"
                              }`}
                            />
                            <span className="leading-tight break-words">
                              {t(`productForm.tier${tier}Feature${featureNum}`)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.button>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Duration and Payment - Only when tier is selected */}
      {formData.promotion.enabled && formData.promotion.tier && (
        <>
          {/* Duration Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <icons.BiCalendar className="w-5 h-5 mr-2 text-primary-600" />
              {t('productForm.promotionDuration')}
            </h3>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="30"
                value={formData.promotion.duration}
                onChange={(e) => handleDurationChange(e.target.value)}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-xl border border-primary-200 min-w-[120px]">
                <icons.BiCalendar className="w-5 h-5 text-primary-600" />
                <span className="font-bold text-primary-700">
                  {formData.promotion.duration} {t('productForm.days')}
                </span>
              </div>
            </div>
            {formData.promotion.duration >= 3 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <icons.BiCheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-800">
                    {t('productForm.discount10')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Price Preview */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <icons.BiCalculator className="w-5 h-5 mr-2 text-yellow-600" />
              {t('productForm.estimatedCost')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">{t('productForm.selectedPackage')}</span>
                <span className="font-bold text-gray-900">
                  {t(`productForm.tier${formData.promotion.tier}Name`)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">{t('productForm.pricePerDay')}</span>
                <span className="font-semibold text-gray-900">
                  {promotionService.formatCurrency(
                    promotionService.TIER_PRICES[formData.promotion.tier]
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">{t('productForm.duration')}</span>
                <span className="font-semibold text-gray-900">
                  {formData.promotion.duration} {t('productForm.days')}
                </span>
              </div>
              <div className="border-t-2 border-yellow-300 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">{t('productForm.totalBeforeDiscount')}</span>
                  <span className="font-semibold text-gray-900">
                    {promotionService.formatCurrency(
                      promotionService.TIER_PRICES[formData.promotion.tier] *
                        formData.promotion.duration
                    )}
                  </span>
                </div>
              </div>
              {formData.promotion.duration >= 3 && (
                <div className="flex justify-between items-center text-green-700">
                  <span className="font-semibold">{t('productForm.discountLabel')}</span>
                  <span className="font-bold">
                    -
                    {promotionService.formatCurrency(
                      promotionService.TIER_PRICES[formData.promotion.tier] *
                        formData.promotion.duration *
                        0.1
                    )}
                  </span>
                </div>
              )}
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4 mt-3">
                <div className="flex justify-between items-center text-white">
                  <span className="text-lg font-bold">{t('productForm.totalPayment')}</span>
                  <span className="text-2xl font-extrabold">
                    {promotionService.formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <icons.HiCash className="w-5 h-5 mr-2 text-primary-600" />
              {t('productForm.paymentMethod')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Wallet Payment */}
              <motion.button
                type="button"
                onClick={() => handlePaymentMethodChange("wallet")}
                className={`relative p-6 rounded-xl border-2 transition-all ${
                  formData.promotion.paymentMethod === "wallet"
                    ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200 shadow-md"
                    : "border-gray-200 hover:border-primary-300 hover:shadow-sm"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {formData.promotion.paymentMethod === "wallet" && (
                  <div className="absolute -top-2 -right-2 bg-primary-600 text-white rounded-full p-1.5 shadow-lg">
                    <icons.FiCheck className="w-4 h-4" />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                    <icons.HiCash className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-gray-900 mb-1 text-lg">
                      {t('productForm.piraWallet')}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {walletLoading ? (
                        <span className="flex items-center gap-2">
                          <icons.BiLoaderAlt className="w-3 h-3 animate-spin" />
                          {t('productForm.loading')}
                        </span>
                      ) : (
                        <span className="font-semibold text-primary-600">
                          {promotionService.formatCurrency(walletBalance || 0)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </motion.button>

              {/* PayOS Payment */}
              <motion.button
                type="button"
                onClick={() => handlePaymentMethodChange("payos")}
                className={`relative p-6 rounded-xl border-2 transition-all ${
                  formData.promotion.paymentMethod === "payos"
                    ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200 shadow-md"
                    : "border-gray-200 hover:border-primary-300 hover:shadow-sm"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {formData.promotion.paymentMethod === "payos" && (
                  <div className="absolute -top-2 -right-2 bg-primary-600 text-white rounded-full p-1.5 shadow-lg">
                    <icons.FiCheck className="w-4 h-4" />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                    <icons.HiCreditCard className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-gray-900 mb-1 text-lg">
                      {t('productForm.payosBank')}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {t('productForm.payViaBank')}
                    </p>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        </>
      )}

      {/* Prompt when no tier selected */}
      {formData.promotion.enabled && !formData.promotion.tier && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
          <icons.BiInfoCircle className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <p className="text-blue-800 font-semibold">
            {t('productForm.selectPromotionPackage')}
          </p>
        </div>
      )}

      {/* Terms and Conditions Agreement */}
      <div className="bg-gray-50 border-2 border-gray-300 rounded-2xl p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <icons.BiInfoCircle className="w-5 h-5 mr-2 text-gray-700" />
          {t('productForm.termsTitle')}
        </h3>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="agreedToTerms"
            checked={formData.agreedToTerms || false}
            onChange={(e) =>
              handleInputChange({
                target: {
                  name: "agreedToTerms",
                  value: e.target.checked,
                },
              })
            }
            className="mt-1 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
          />
          <label
            htmlFor="agreedToTerms"
            className="text-gray-700 leading-relaxed cursor-pointer"
          >
            {t('productForm.termsAgree')}{" "}
            <a
              href="/terms-and-conditions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 font-semibold underline"
            >
              {t('productForm.termsLink')}
            </a>{" "}
            {t('productForm.termsOf')}
          </label>
        </div>
        {errors.agreedToTerms && (
          <p className="text-red-600 text-sm mt-2 flex items-center">
            <icons.BiInfoCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
            {errors.agreedToTerms}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default PromotionStep;
