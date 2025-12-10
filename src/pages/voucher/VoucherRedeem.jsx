import React, { useState, useEffect } from "react";
import { Gift, Ticket, AlertCircle, CheckCircle2, Star } from "lucide-react";
import voucherService from "../../services/voucher";
import { useI18n } from "../../hooks/useI18n";
import toast from "react-hot-toast";

const VoucherRedeem = () => {
  const { t } = useI18n();
  const [loyaltyData, setLoyaltyData] = useState({
    loyaltyPoints: 0,
    creditScore: 0,
    canRedeem: false,
  });
  const [loading, setLoading] = useState(true);
  const [redeemingTier, setRedeemingTier] = useState(null);
  const [vouchers, setVouchers] = useState([]);

  const voucherTiers = [
    {
      points: 25,
      discount: 25,
      icon: "🎫",
      color: "from-blue-500 to-cyan-500",
      title: t('voucherRedeem.silverVoucher'),
      description: t('voucherRedeem.discount25'),
    },
    {
      points: 50,
      discount: 50,
      icon: "🎟️",
      color: "from-purple-500 to-pink-500",
      title: t('voucherRedeem.goldVoucher'),
      description: t('voucherRedeem.discount50'),
    },
    {
      points: 100,
      discount: 100,
      icon: "🏆",
      color: "from-amber-500 to-orange-500",
      title: t('voucherRedeem.diamondVoucher'),
      description: t('voucherRedeem.discount100'),
    },
  ];

  useEffect(() => {
    fetchLoyaltyData();
    fetchVouchers();
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      const response = await voucherService.getLoyaltyPoints();
      setLoyaltyData(response);
    } catch (error) {
      console.error("Error fetching loyalty data:", error);
      toast.error(t('voucherRedeem.cannotLoadLoyalty'));
    } finally {
      setLoading(false);
    }
  };

  const fetchVouchers = async () => {
    try {
      const response = await voucherService.getUserVouchers(true);
      setVouchers(response.vouchers);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
    }
  };

  const handleRedeem = async (requiredPoints) => {
    if (!loyaltyData.canRedeem) {
      toast.error(t('voucherRedeem.needMinCredit'));
      return;
    }

    if (loyaltyData.loyaltyPoints < requiredPoints) {
      toast.error(t('voucherRedeem.notEnoughPoints').replace('{{points}}', requiredPoints));
      return;
    }

    setRedeemingTier(requiredPoints);
    try {
      const response = await voucherService.redeemVoucher(requiredPoints);

      toast.success(
        <div>
          <p className="font-semibold">{t('voucherRedeem.redeemSuccess')}</p>
          <p className="text-sm">
            {t('voucherRedeem.voucherCode')} <strong>{response.voucher.code}</strong>
          </p>
        </div>,
        { duration: 5000 }
      );

      // Refresh data
      await fetchLoyaltyData();
      await fetchVouchers();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || t('voucherRedeem.cannotRedeem');
      toast.error(errorMessage);
    } finally {
      setRedeemingTier(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Gift className="w-8 h-8 text-indigo-600" />
          {t('voucherRedeem.title')}
        </h1>
        <p className="text-gray-600 mt-2">
          {t('voucherRedeem.subtitle')}
        </p>
      </div>

      {/* Loyalty Points Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-100 mb-2">{t('voucherRedeem.yourLoyaltyPoints')}</p>
            <p className="text-5xl font-bold">{loyaltyData.loyaltyPoints}</p>
            <p className="text-sm text-indigo-100 mt-4">
              Credit Score:{" "}
              <span className="font-semibold">{loyaltyData.creditScore}</span>
            </p>
          </div>
          <Star className="w-24 h-24 text-indigo-200 opacity-50" />
        </div>

        {!loyaltyData.canRedeem && (
          <div className="mt-4 bg-red-500/20 border border-red-300 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">{t('voucherRedeem.notEligible')}</p>
              <p className="text-indigo-100 mt-1">
                {t('voucherRedeem.needCreditScore')} {loyaltyData.creditScore}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Voucher Tiers */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('voucherRedeem.chooseVoucher')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {voucherTiers.map((tier) => {
            const canAfford = loyaltyData.loyaltyPoints >= tier.points;
            const canRedeem = loyaltyData.canRedeem && canAfford;

            return (
              <div
                key={tier.points}
                className={`relative rounded-2xl p-6 shadow-lg transition-all duration-300 ${
                  canRedeem
                    ? "hover:scale-105 cursor-pointer"
                    : "opacity-60 cursor-not-allowed"
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${tier.color} rounded-2xl opacity-10`}
                ></div>

                <div className="relative">
                  <div className="text-5xl mb-4">{tier.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {tier.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{tier.description}</p>

                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {tier.points}
                      </span>
                      <span className="text-gray-600">{t('voucherRedeem.points')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRedeem(tier.points)}
                    disabled={!canRedeem || redeemingTier !== null}
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      canRedeem
                        ? `bg-gradient-to-r ${tier.color} text-white hover:shadow-lg`
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {redeemingTier === tier.points
                      ? t('voucherRedeem.redeeming')
                      : canAfford
                      ? t('voucherRedeem.redeemNow')
                      : t('voucherRedeem.needMorePoints').replace('{{points}}', tier.points - loyaltyData.loyaltyPoints)}
                  </button>

                  {!canAfford && loyaltyData.loyaltyPoints > 0 && (
                    <div className="mt-2 text-sm text-gray-500 text-center">
                      {t('voucherRedeem.youHavePoints').replace('{{points}}', loyaltyData.loyaltyPoints)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Vouchers */}
      {vouchers.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-indigo-600" />
            {t('voucherRedeem.yourVouchers').replace('{{count}}', vouchers.length)}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vouchers.map((voucher) => {
              const isExpired = new Date(voucher.expiresAt) < new Date();
              const isUsed = voucher.isUsed || voucher.status === "USED";

              return (
                <div
                  key={voucher._id}
                  className={`bg-white border-2 border-dashed rounded-lg p-5 transition-all ${
                    isUsed || isExpired
                      ? "border-gray-300 opacity-60"
                      : "border-indigo-300 hover:border-indigo-500"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className={`w-5 h-5 ${
                          isUsed || isExpired
                            ? "text-gray-400"
                            : "text-green-500"
                        }`}
                      />
                      <span className="font-mono font-bold text-lg text-gray-900">
                        {voucher.code}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-semibold">
                        -{voucher.discountPercent}%
                      </span>
                      {isUsed && (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-semibold">
                          {t('voucherRedeem.used')}
                        </span>
                      )}
                      {isExpired && !isUsed && (
                        <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-semibold">
                          {t('voucherRedeem.expired')}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3">
                    -{voucher.discountPercent}% shipping
                  </p>

                  <div className="text-xs text-gray-500">
                    <p>
                      {t('voucherRedeem.expiresAt')}{" "}
                      {new Date(voucher.expiresAt).toLocaleDateString("vi-VN")}
                    </p>
                    {isUsed && voucher.usedAt && (
                      <p className="mt-1">
                        {t('voucherRedeem.usedAt')}{" "}
                        {new Date(voucher.usedAt).toLocaleDateString("vi-VN")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {t('voucherRedeem.loyaltyInfo')}
        </h3>
        <ul className="space-y-2 text-blue-800 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>{t('voucherRedeem.loyaltyTip1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>{t('voucherRedeem.loyaltyTip2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>{t('voucherRedeem.loyaltyTip3')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>{t('voucherRedeem.loyaltyTip4')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default VoucherRedeem;
