import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Home, ArrowRight, RefreshCw } from "lucide-react";
import { ROUTES } from "../../utils/constants";

const PaymentPending = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderCode = searchParams.get("orderCode");

  const handleCheckAgain = () => {
    // Refresh the page to check payment status again
    window.location.reload();
  };

  const handleBackToHome = () => {
    navigate(ROUTES.HOME);
  };

  const handleViewOrders = () => {
    navigate(ROUTES.RENTAL_ORDERS);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <motion.div
        className="max-w-lg w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          {/* Status Icon */}
          <motion.div
            className="mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              >
                <Clock className="w-12 h-12 text-yellow-600" />
              </motion.div>
            </div>
          </motion.div>

          {/* Status Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Pending ⏳
            </h2>
            <p className="text-gray-600 mb-6">
              Your payment is being processed. This may take a few minutes to complete.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
              <p className="text-sm text-yellow-800">
                💡 <strong>Please wait...</strong> We're confirming your payment with the payment provider. You'll be automatically redirected once it's complete.
              </p>
            </div>
          </motion.div>

          {/* Loading Animation */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex justify-center space-x-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-yellow-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <button
              onClick={handleCheckAgain}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Check Status
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleViewOrders}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              View My Orders
            </button>

            <button
              onClick={handleBackToHome}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </motion.div>

          {/* Order Details */}
          {orderCode && (
            <motion.div
              className="mt-6 pt-6 border-t border-gray-200 text-left"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Order Details
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Order Code:</span>
                  <span className="font-mono text-blue-600">{orderCode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium text-yellow-600">
                    PENDING
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>
                    {new Date().toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Auto-refresh notice */}
          <motion.div
            className="mt-4 text-xs text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            This page will automatically update when your payment is processed.
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentPending;