import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Crown,
  Star,
  TrendingUp,
  Zap,
  Sparkles,
  Wallet,
  CreditCard,
} from "lucide-react";
import Portal from "../common/Portal";
import promotionService from "../../services/promotion";
import { useWallet } from "../../context/WalletContext";
import toast from "react-hot-toast";

const PromoteProductModal = ({ product, onClose, onSuccess }) => {
  const [tier, setTier] = useState(3);
  const [duration, setDuration] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scheduleMode, setScheduleMode] = useState("override"); // 'override' or 'after'
  const [hasActivePromotion, setHasActivePromotion] = useState(false);
  const [activePromotionEndDate, setActivePromotionEndDate] = useState(null);
  const modalRef = useRef(null);
  const { balance } = useWallet();

  // Tier icons mapping
  const tierIcons = {
    1: Crown,
    2: Star,
    3: TrendingUp,
    4: Zap,
    5: Sparkles,
  };

  // Check if product has active promotion
  useEffect(() => {
    if (product?.isPromoted && product?.currentPromotion) {
      setHasActivePromotion(true);
      // Try to get end date from currentPromotion object
      if (product.currentPromotion.endDate) {
        setActivePromotionEndDate(new Date(product.currentPromotion.endDate));
      }
    }
  }, [product]);

  // Calculate pricing when tier/duration changes
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const result = await promotionService.calculatePricing(tier, duration);
        setPricing(result);
      } catch (error) {
        console.error("Pricing error:", error);
      }
    };

    if (tier && duration) {
      fetchPricing();
    }
  }, [tier, duration]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check wallet balance if paying with wallet
      if (paymentMethod === "wallet" && balance < pricing.totalAmount) {
        toast.error(
          "Số dư ví không đủ. Vui lòng nạp thêm tiền vào ví."
        );
        setLoading(false);
        return;
      }

      // Prepare promotion data
      const promotionData = {
        productId: product._id || product.id,
        tier,
        duration,
        paymentMethod,
      };

      // Add schedule mode if there's an active promotion
      if (hasActivePromotion) {
        promotionData.scheduleMode = scheduleMode;
      }

      const result = await promotionService.createPromotion(promotionData);

      if (paymentMethod === "payos") {
        // Redirect to payment page
        toast.success("Đang chuyển đến cổng thanh toán...");
        setTimeout(() => {
          window.location.href = result.paymentUrl;
        }, 1000);
      } else {
        if (scheduleMode === "override") {
          toast.success("Cập nhật quảng cáo sản phẩm thành công! 🎉");
        } else {
          toast.success(
            "Đã đặt lịch quảng cáo! Sẽ tự động kích hoạt sau khi quảng cáo hiện tại hết hạn. 📅"
          );
        }
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error(error.message || "Không thể quảng cáo sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <div
          ref={modalRef}
          className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl z-100"
          onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-3xl">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  Quảng Cáo Sản Phẩm
                </h2>
                <p className="text-blue-100">
                  Làm cho sản phẩm của bạn nổi bật và xuất hiện ở vị trí hàng đầu!
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>            {/* Product Preview */}
            {product && (
              <div className="mt-4 bg-white/10 backdrop-blur rounded-xl p-3 flex items-center gap-3">
                {product.images && product.images[0] && (
                  <img
                    src={product.images[0].url || product.images[0]}
                    alt={product.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.title}</p>
                  <p className="text-sm text-blue-100">
                    {promotionService.formatCurrency(
                      product.pricing?.dailyRate || 0
                    )}
                    /ngày
                  </p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Active Promotion Warning & Schedule Mode */}
            {hasActivePromotion && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <TrendingUp className="text-amber-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-900 mb-1">
                      Phát hiện quảng cáo đang hoạt động
                    </h4>
                    <p className="text-sm text-amber-700">
                      Sản phẩm này hiện có quảng cáo đang hoạt động
                      {activePromotionEndDate &&
                        ` kết thúc vào ${new Date(
                          activePromotionEndDate
                        ).toLocaleDateString("vi-VN")}`}
                      . Chọn cách thức tiếp tục:
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setScheduleMode("override")}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      scheduleMode === "override"
                        ? "border-amber-500 bg-amber-100 shadow-md"
                        : "border-amber-200 hover:border-amber-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          scheduleMode === "override"
                            ? "border-amber-600 bg-amber-600"
                            : "border-gray-300"
                        }`}
                      >
                        {scheduleMode === "override" && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          Thay thế quảng cáo hiện tại
                        </div>
                        <div className="text-sm text-gray-600">
                          Thay thế ngay lập tức quảng cáo hiện tại bằng quảng cáo mới này
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleMode("after")}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      scheduleMode === "after"
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-amber-200 hover:border-amber-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          scheduleMode === "after"
                            ? "border-blue-600 bg-blue-600"
                            : "border-gray-300"
                        }`}
                      >
                        {scheduleMode === "after" && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          Đặt lịch sau khi hết hạn
                        </div>
                        <div className="text-sm text-gray-600">
                          Quảng cáo này sẽ tự động kích hoạt khi quảng cáo hiện tại kết thúc
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Tier Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Chọn Gói Quảng Cáo
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((t) => {
                  const config = promotionService.TIER_CONFIG[t];
                  const TierIcon = tierIcons[t];
                  const pricePerDay = promotionService.TIER_PRICES[t];

                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTier(t)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        tier === t
                          ? `${config.borderColor} bg-gradient-to-br ${config.color} bg-opacity-10 shadow-lg`
                          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex justify-center mb-2">
                        <TierIcon
                          size={24}
                          className={
                            tier === t ? "text-white" : "text-gray-400"
                          }
                        />
                      </div>
                      <div
                        className={`text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r ${config.color} text-white inline-block mb-2`}
                      >
                        {config.badge}
                      </div>
                      <div className="text-base font-bold text-gray-900">
                        {(pricePerDay / 1000).toFixed(0)}k
                      </div>
                      <div className="text-xs text-gray-500">VND/ngày</div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Tier Features */}
              {tier && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <p className="font-medium text-gray-900 mb-2">
                    Tính năng gói {promotionService.TIER_CONFIG[tier].name}:
                  </p>
                  <ul className="space-y-1">
                    {promotionService.TIER_CONFIG[tier].features.map(
                      (feature, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-600 flex items-center gap-2"
                        >
                          <span className="text-green-500">✓</span>
                          {feature}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian (ngày)
              </label>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Nhập số ngày"
              />
              {duration >= promotionService.DISCOUNT_CONFIG.minDays && (
                <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                  <Sparkles size={16} />
                  Giảm giá {promotionService.DISCOUNT_CONFIG.percentage}% cho{" "}
                  {promotionService.DISCOUNT_CONFIG.minDays}+ ngày!
                </p>
              )}
            </div>

            {/* Pricing Summary */}
            {pricing && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Giá gốc:</span>
                  <span className="font-medium">
                    {promotionService.formatCurrency(pricing.pricePerDay)}/ngày
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Thời gian:</span>
                  <span className="font-medium">{duration} ngày</span>
                </div>
                {pricing.discountApplied > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>
                      Giảm giá ({promotionService.DISCOUNT_CONFIG.percentage}%):
                    </span>
                    <span className="font-medium">
                      -
                      {promotionService.formatCurrency(pricing.discountApplied)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t border-blue-200 pt-2">
                  <span>Tổng cộng:</span>
                  <span className="text-blue-600">
                    {promotionService.formatCurrency(pricing.totalAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Phương thức thanh toán
              </label>
              <div className="space-y-3">
                {/* Wallet Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("wallet")}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === "wallet"
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          paymentMethod === "wallet"
                            ? "bg-blue-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <Wallet
                          size={24}
                          className={
                            paymentMethod === "wallet"
                              ? "text-blue-600"
                              : "text-gray-400"
                          }
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          Thanh toán bằng Ví
                        </div>
                        <div className="text-sm text-gray-600">
                          Số dư hiện tại:{" "}
                          <span className="font-medium">
                            {promotionService.formatCurrency(balance)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {pricing && balance < pricing.totalAmount && (
                      <span className="text-red-500 text-sm font-medium px-3 py-1 bg-red-50 rounded-full">
                        Không đủ tiền
                      </span>
                    )}
                  </div>
                </button>

                {/* PayOS Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("payos")}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === "payos"
                      ? "border-purple-500 bg-purple-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        paymentMethod === "payos"
                          ? "bg-purple-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <CreditCard
                        size={24}
                        className={
                          paymentMethod === "payos"
                            ? "text-purple-600"
                            : "text-gray-400"
                        }
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        Thanh toán bằng PayOS
                      </div>
                      <div className="text-sm text-gray-600">
                        Cổng thanh toán trực tuyến an toàn
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
                disabled={
                  loading ||
                  (paymentMethod === "wallet" &&
                    pricing &&
                    balance < pricing.totalAmount)
                }
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  `Quảng cáo với ${
                    pricing
                      ? promotionService.formatCurrency(pricing.totalAmount)
                      : "..."
                  }`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default PromoteProductModal;
