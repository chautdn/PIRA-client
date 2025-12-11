import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Plus, History, RefreshCw, ChevronDown } from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import TopUpModal from "./TopUpModal";
import TransactionHistory from "./TransactionHistory";
import { useI18n } from "../../hooks/useI18n";

const WalletBalance = () => {
  const { t } = useI18n();
  const { balance, available, frozen, loading, fetchBalance } = useWallet();
  const [showTopUp, setShowTopUp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Wallet Balance Display with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-0.5 xs:gap-1 sm:gap-2 px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 sm:py-2 bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 border border-green-200 rounded-lg transition-all"
          >
            <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
              <Wallet className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>

            <div className="flex flex-col items-start">
              <span className="hidden sm:block text-[10px] text-gray-500 font-medium leading-tight">
                {t('walletBalance.balance')}
              </span>
              <div className="flex items-center gap-0.5 sm:gap-1">
                {loading ? (
                  <div className="w-10 xs:w-12 sm:w-16 h-3 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <span className="text-[10px] xs:text-xs sm:text-sm font-bold text-gray-900">
                    {(balance || 0).toLocaleString()}
                  </span>
                )}
                <span className="text-[9px] xs:text-[10px] sm:text-xs text-gray-600 font-medium">đ</span>
              </div>
            </div>

            <ChevronDown
              className={`w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 text-gray-400 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu - History & Refresh */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
              >
                {/* Balance Details */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">
                        {t('walletBalance.currentBalance')}
                      </p>
                      {loading ? (
                        <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
                      ) : (
                        <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                          {(balance || 0).toLocaleString()} VND
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchBalance();
                      }}
                      disabled={loading}
                      className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                      title={t('walletBalance.refresh')}
                    >
                      <RefreshCw
                        className={`w-4 h-4 text-gray-600 ${
                          loading ? "animate-spin" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Balance Breakdown */}
                  <div className="space-y-3">
                    {/* Available Balance */}
                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs text-gray-600 font-medium">
                            {t('walletBalance.availableBalance')}
                          </span>
                        </div>
                        {loading ? (
                          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                        ) : (
                          <span className="text-sm font-bold text-green-600">
                            {(available || 0).toLocaleString()} VND
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Frozen Balance */}
                    {frozen > 0 && (
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span className="text-xs text-gray-600 font-medium">
                              {t('walletBalance.frozenBalance')}
                            </span>
                          </div>
                          {loading ? (
                            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                          ) : (
                            <span className="text-sm font-bold text-orange-600">
                              {(frozen || 0).toLocaleString()} VND
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 ml-4">
                          {t('walletBalance.frozenMessage')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaction History Button */}
                <div className="p-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHistory(true);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-all"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      <History className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold">
                        {t('walletBalance.transactionHistory')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('walletBalance.viewAllTransactions')}
                      </p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Top Up Button - Always Visible */}
        <motion.button
          onClick={() => setShowTopUp(true)}
          className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm">{t('walletBalance.topUp')}</span>
        </motion.button>
      </div>

      {/* Modals */}
      <TopUpModal isOpen={showTopUp} onClose={() => setShowTopUp(false)} />
      <TransactionHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </>
  );
};

export default WalletBalance;
