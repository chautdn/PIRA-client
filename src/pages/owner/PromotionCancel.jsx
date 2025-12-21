import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const PromotionCancel = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/owner/products");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-lg w-full text-center"
      >
        {/* Cancel Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <XCircle size={80} className="text-red-500" />
        </motion.div>

        {/* Cancel Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Payment Cancelled
        </h1>
        <p className="text-gray-600 mb-6">
          Your promotion payment was cancelled. Your product has been saved as a
          draft.
        </p>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
          <p className="font-semibold text-gray-900 mb-2">What happened?</p>
          <p className="text-sm text-gray-700">
            You chose to cancel the payment. Your product is saved as a draft
            and was not published. You can publish it later or try promoting
            again.
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <p className="font-semibold text-gray-900 mb-2">What's next?</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>You can try promoting your product again anytime</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>
                Check your wallet balance if you want to pay with wallet
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Contact support if you encountered any issues</span>
            </li>
          </ul>
        </div>

        {/* Redirect Info */}
        <p className="text-sm text-gray-500 mb-6">
          Redirecting to your products in{" "}
          <span className="font-bold text-blue-600">{countdown}</span>{" "}
          seconds...
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
          <button
            onClick={() => navigate("/owner/products")}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Go to My Products
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PromotionCancel;
