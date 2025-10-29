import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { ROUTES } from "../../utils/constants";

const TopUpCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderCode = searchParams.get("orderCode");

  const handleRetry = () => {
    // Navigate back to the previous page to retry payment
    navigate(-1);
  };

  const handleHome = () => {
    navigate(ROUTES.HOME);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-orange-50 flex items-center justify-center p-4">
      <motion.div
        className="max-w-md w-full"
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
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-12 h-12 text-orange-600" />
            </div>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Cancelled
            </h2>
            <p className="text-gray-600 mb-6">
              Your payment has been cancelled. No charges were made to your
              account.
            </p>

            {orderCode && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
                <div className="text-sm text-orange-800 mb-2">
                  <strong>Order Code:</strong> {orderCode}
                </div>
                <p className="text-sm text-orange-700">
                  You can retry this payment or try with a different amount.
                </p>
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={handleRetry}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>

            <button
              onClick={handleHome}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            className="mt-6 pt-6 border-t border-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Need Help?
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                If you're having trouble with payments, please contact our
                support team.
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <span>📧 support@pira.com</span>
                <span>📞 1900-PIRA</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default TopUpCancel;


