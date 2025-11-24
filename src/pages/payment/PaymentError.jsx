import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, Home, ArrowRight, ShoppingCart, MessageCircle } from "lucide-react";
import { ROUTES } from "../../utils/constants";

const PaymentError = () => {
  const navigate = useNavigate();

  const handleBackToCart = () => {
    navigate(ROUTES.CART);
  };

  const handleBackToHome = () => {
    navigate(ROUTES.HOME);
  };

  const handleContactSupport = () => {
    navigate(ROUTES.CHAT);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
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
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1] 
                }}
                transition={{ repeat: 2, duration: 0.8, delay: 0.5 }}
              >
                <AlertTriangle className="w-12 h-12 text-red-600" />
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
              Payment Error ⚠️
            </h2>
            <p className="text-gray-600 mb-6">
              Something went wrong while processing your payment. Please try again or contact support if the problem persists.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
              <p className="text-sm text-red-800 mb-2">
                <strong>Common causes:</strong>
              </p>
              <ul className="text-left text-sm text-red-700 space-y-1">
                <li>• Network connection issues</li>
                <li>• Payment service temporarily unavailable</li>
                <li>• Browser compatibility issues</li>
                <li>• Session timeout</li>
              </ul>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={handleBackToCart}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Try Again
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleContactSupport}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Contact Support
            </button>

            <button
              onClick={handleBackToHome}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </motion.div>

          {/* Error Details */}
          <motion.div
            className="mt-6 pt-6 border-t border-gray-200 text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Error Details
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Error Code:</span>
                <span className="font-mono text-red-600">PAYMENT_ERROR</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span>
                  {new Date().toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Help Section */}
          <motion.div
            className="mt-6 pt-4 border-t border-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="text-sm text-gray-500">
              <p className="mb-2">
                <strong>Need immediate help?</strong>
              </p>
              <p>
                Try refreshing the page, clearing your browser cache, or using a different browser. If the problem continues, please contact our support team.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentError;