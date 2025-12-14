import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import { useWallet } from "../../context/WalletContext";
import Portal from "../common/Portal";
import { useI18n } from "../../hooks/useI18n";

const TopUpModal = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const { createPayment, loading } = useWallet();
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [activeTab, setActiveTab] = useState("predefined"); // 'predefined' or 'custom'

  const predefinedAmounts = [10000, 50000, 100000, 500000, 1000000];
  const MIN_AMOUNT = 2000;
  const MAX_AMOUNT = 50000000;

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handlePredefinedAmount = async (amount) => {
    try {
      const response = await createPayment(amount);
      if (response?.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      }
    } catch (error) {
      // Error already handled in context
      console.error("Payment error:", error);
    }
  };

  const handleCustomAmount = async () => {
    const amount = Number(customAmount.replace(/[,\s]/g, ""));

    // Validation
    if (!amount || amount < MIN_AMOUNT) {
      toast.error(`${t('walletBalance.minAmountError')} ${MIN_AMOUNT.toLocaleString()} VND`);
      return;
    }

    if (amount > MAX_AMOUNT) {
      toast.error(`${t('walletBalance.maxAmountError')} ${MAX_AMOUNT.toLocaleString()} VND`);
      return;
    }

    try {
      const response = await createPayment(amount);
      if (response?.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      }
    } catch (error) {
      // Error already handled in context
      console.error("Payment error:", error);
    }
  };

  const formatAmount = (value) => {
    const numValue = value.replace(/[^\d]/g, "");
    return numValue ? Number(numValue).toLocaleString() : "";
  };

  const handleCustomAmountChange = (e) => {
    const formatted = formatAmount(e.target.value);
    setCustomAmount(formatted);
  };

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto"
            onClick={onClose}
            style={{ margin: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl w-full max-w-md my-auto shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: "calc(100vh - 2rem)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 rounded-t-2xl sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {t('walletBalance.topUpWallet')}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {t('walletBalance.addFunds')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/50 rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div
                className="overflow-y-auto"
                style={{ maxHeight: "calc(100vh - 12rem)" }}
              >
                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                  <button
                    onClick={() => setActiveTab("predefined")}
                    className={`flex-1 py-3 px-4 font-medium transition-all ${
                      activeTab === "predefined"
                        ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {t('walletBalance.quickAmounts')}
                  </button>
                  <button
                    onClick={() => setActiveTab("custom")}
                    className={`flex-1 py-3 px-4 font-medium transition-all ${
                      activeTab === "custom"
                        ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {t('walletBalance.customAmount')}
                  </button>
                </div>

                <div className="p-6">
                  {activeTab === "predefined" ? (
                    // Predefined amounts
                    <div className="space-y-4">
                      <p className="text-gray-600 text-sm flex items-center gap-2">
                        <span className="text-lg">🚀</span>
                        {t('walletBalance.chooseAmount')}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {predefinedAmounts.map((amount) => (
                          <motion.button
                            key={amount}
                            onClick={() => handlePredefinedAmount(amount)}
                            disabled={loading}
                            className="p-5 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="text-sm text-gray-500 mb-1 group-hover:text-blue-600">
                              VND
                            </div>
                            <div className="font-bold text-xl text-gray-900 group-hover:text-blue-600">
                              {amount.toLocaleString()}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                      {loading && (
                        <div className="text-center py-2">
                          <div className="inline-flex items-center gap-2 text-sm text-blue-600">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            {t('walletBalance.redirectingPayment')}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Custom amount
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <span className="text-lg">💵</span>
                          {t('walletBalance.enterAmount')}
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={customAmount}
                            onChange={handleCustomAmountChange}
                            placeholder="Enter amount..."
                            className="w-full pl-12 pr-16 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-lg font-semibold transition-all"
                            autoFocus={activeTab === "custom"}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">
                            VND
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                          <span>Min: {MIN_AMOUNT.toLocaleString()}</span>
                          <span>Max: {MAX_AMOUNT.toLocaleString()}</span>
                        </div>
                      </div>

                      <motion.button
                        onClick={handleCustomAmount}
                        disabled={loading || !customAmount}
                        className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span>⚡</span>
                            {t('walletBalance.topUpNow')}
                            <span>⚡</span>
                          </div>
                        )}
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-b-2xl border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <span className="font-medium">{t('walletBalance.securedByPayOS')}</span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium">{t('walletBalance.instantProcessing')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
};

export default TopUpModal;
