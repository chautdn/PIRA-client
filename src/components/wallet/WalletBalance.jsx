import React, { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Plus, History, RefreshCw } from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import TopUpModal from "./TopUpModal";
import TransactionHistory from "./TransactionHistory";

const WalletBalance = () => {
  const { balance, loading, fetchBalance } = useWallet();
  const [showTopUp, setShowTopUp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <motion.div
        className="flex items-center gap-4 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg border border-gray-200"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Balance Display */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium">
              Wallet Balance
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">
                {loading ? (
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                ) : (
                  `${balance.toLocaleString()} VND`
                )}
              </span>
              <button
                onClick={fetchBalance}
                disabled={loading}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3 h-3 text-gray-400 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => setShowTopUp(true)}
            className="flex items-center gap-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-md"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            Top Up
          </motion.button>

          <motion.button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <History className="w-4 h-4" />
            History
          </motion.button>
        </div>
      </motion.div>

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


