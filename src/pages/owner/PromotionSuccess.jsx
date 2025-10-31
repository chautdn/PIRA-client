import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  Sparkles,
  ArrowRight,
  XCircle,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { toast } from "react-hot-toast";

const PromotionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get("orderCode");
  const status = searchParams.get("status");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!orderCode) {
      toast.error("No order code provided");
      setLoading(false);
      setResult({ error: true, message: "No order code provided" });
      return;
    }

    let pollInterval;
    let stopTimer;

    const verifyPromotion = async () => {
      try {
        // Check promotion status by orderCode
        const response = await api.get(
          `/product-promotions/verify/${orderCode}`
        );
        const promotionResult =
          response.data?.metadata || response.data?.data || response.data;

        console.log("Full API response:", response.data);
        console.log("Promotion verification result:", promotionResult);

        // ✅ If promotion is active, show toast
        if (
          promotionResult?.isActive &&
          promotionResult?.paymentStatus === "paid"
        ) {
          if (pollInterval) clearInterval(pollInterval);
          if (stopTimer) clearTimeout(stopTimer);

          // Show success toast
          toast.success(
            `✨ Promotion activated! Your product is now featured`,
            { duration: 4000, icon: "🎉" }
          );

          setResult(promotionResult);
          setLoading(false);
          return;
        }

        // If promotion failed
        if (
          promotionResult?.paymentStatus === "failed" ||
          promotionResult?.error
        ) {
          setResult(promotionResult);
          if (pollInterval) clearInterval(pollInterval);
          if (stopTimer) clearTimeout(stopTimer);
          setLoading(false);
          return;
        }

        // Still processing, keep polling
        setResult(promotionResult);
      } catch (error) {
        console.error("Promotion verification error:", error);
        setResult({
          error: true,
          message: error.response?.data?.message || "Verification failed",
        });
        // Stop polling on error
        if (pollInterval) clearInterval(pollInterval);
        if (stopTimer) clearTimeout(stopTimer);
        setLoading(false);
      }
    };

    // Verify immediately
    verifyPromotion();

    // Poll every 2 seconds
    pollInterval = setInterval(verifyPromotion, 2000);

    // Stop polling after 30 seconds
    stopTimer = setTimeout(() => {
      clearInterval(pollInterval);
      setLoading(false);

      // If still no result, show error
      if (!result || (!result.isActive && result.paymentStatus !== "paid")) {
        toast.error(
          "⚠️ Payment verification taking longer than expected. Please check your products page.",
          { duration: 6000 }
        );
      }
    }, 30000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (stopTimer) clearTimeout(stopTimer);
    };
  }, [orderCode]);

  // Countdown timer for redirect (only when successful)
  useEffect(() => {
    if (
      !loading &&
      result &&
      result.isActive &&
      result.paymentStatus === "paid"
    ) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Navigate to the specific product detail page
            if (result.product?._id) {
              navigate(`/product/${result.product._id}`);
            } else {
              navigate("/owner/products");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, result, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-yellow-50 to-orange-50 flex items-center justify-center">
        <motion.div
          className="text-center bg-white rounded-3xl shadow-xl p-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-20 h-20 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Activating Promotion...
          </h3>
          <p className="text-gray-600">
            Please wait while we activate your product promotion
          </p>
        </motion.div>
      </div>
    );
  }

  const isSuccess = result?.isActive && result?.paymentStatus === "paid";
  const isFailed = result?.paymentStatus === "failed" || result?.error;
  const isProcessing = result?.paymentStatus === "pending";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-lg w-full text-center"
      >
        {/* Status Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            {isSuccess ? (
              <>
                <CheckCircle size={80} className="text-green-500" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles size={24} className="text-yellow-500" />
                </motion.div>
              </>
            ) : isProcessing ? (
              <Clock size={80} className="text-blue-500" />
            ) : (
              <XCircle size={80} className="text-red-500" />
            )}
          </div>
        </motion.div>

        {/* Status Message */}
        {isSuccess ? (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Payment Successful! 🎉
            </h1>
            <p className="text-gray-600 mb-6">
              Your product has been published and promoted successfully! It will
              now appear at the top of search results with enhanced visibility.
            </p>
          </>
        ) : isFailed ? (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Promotion Failed ❌
            </h1>
            <p className="text-gray-600 mb-6">
              {result?.message ||
                "The promotion payment was not completed or was cancelled. Your product was created but not promoted."}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Processing Payment... ⏳
            </h1>
            <p className="text-gray-600 mb-6">
              We're still processing your promotion payment. This usually takes
              a few seconds.
            </p>
          </>
        )}

        {/* Order Info */}
        {searchParams.get("orderId") && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <div className="text-sm text-gray-500 mb-1">Order ID</div>
            <div className="font-mono text-sm text-gray-900">
              {searchParams.get("orderId")}
            </div>
          </div>
        )}

        {/* Benefits List */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-6 text-left">
          <p className="font-semibold text-gray-900 mb-2">
            Your product now has:
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Higher visibility in search results
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Promotional badge display
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Top position in category listings
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Increased customer engagement
            </li>
          </ul>
        </div>

        {/* Redirect Info */}
        {isSuccess && (
          <p className="text-sm text-gray-500 mb-6">
            Redirecting to your product in{" "}
            <span className="font-bold text-blue-600">{countdown}</span>{" "}
            seconds...
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isSuccess && result?.product?._id ? (
            <button
              onClick={() => navigate(`/product/${result.product._id}`)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg flex items-center justify-center gap-2"
            >
              View Your Product
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={() => navigate("/owner/products")}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg flex items-center justify-center gap-2"
            >
              Go to My Products
              <ArrowRight size={18} />
            </button>
          )}
          <button
            onClick={() => navigate("/")}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PromotionSuccess;
