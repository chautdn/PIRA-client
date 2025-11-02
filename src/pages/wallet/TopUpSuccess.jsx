import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, ArrowRight, Home } from "lucide-react";
import api from "../../services/api";
import { ROUTES } from "../../utils/constants";
import toast from "react-hot-toast";

const TopUpSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderCode = searchParams.get("orderCode");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderCode) {
      let pollInterval;
      let stopTimer;

      const verifyPayment = async () => {
        try {
          const response = await api.get(`/payment/verify/${orderCode}`);
          const paymentResult = response.data?.metadata || response.data?.data;

          // ✅ If payment is successful, show toast and redirect immediately
          if (
            paymentResult?.transaction?.status === "success" ||
            paymentResult?.payosStatus?.status === "PAID"
          ) {
            if (pollInterval) clearInterval(pollInterval);
            if (stopTimer) clearTimeout(stopTimer);

            // Show success toast
            toast.success(
              `✅ Payment successful! +${paymentResult.transaction.amount?.toLocaleString()} VND added to your wallet`,
              { duration: 4000, icon: "💰" }
            );

            // Set success result to show success UI during redirect delay
            setResult(paymentResult);
            setLoading(false);

            // Redirect to home after showing success message
            setTimeout(() => {
              window.location.href = ROUTES.HOME;
            }, 2000);

            return;
          }

          // If payment failed, show the result
          if (
            paymentResult?.transaction?.status === "failed" ||
            paymentResult?.transaction?.status === "cancelled" ||
            paymentResult?.error
          ) {
            setResult(paymentResult);
            if (pollInterval) clearInterval(pollInterval);
            if (stopTimer) clearTimeout(stopTimer);
            setLoading(false);
            return;
          }

          // Still processing, keep polling
          setResult(paymentResult);
        } catch (error) {
          console.error("Payment verification error:", error);
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
      verifyPayment();

      // Poll every 1 second for fast response
      pollInterval = setInterval(verifyPayment, 1000);

      // Stop polling after 30 seconds (payments should be instant now)
      stopTimer = setTimeout(() => {
        clearInterval(pollInterval);
        setLoading(false);
      }, 30000);

      return () => {
        if (pollInterval) clearInterval(pollInterval);
        if (stopTimer) clearTimeout(stopTimer);
      };
    } else {
      setResult({ error: true, message: "No order code provided" });
      setLoading(false);
    }
  }, [orderCode, navigate]);

  const handleContinue = () => {
    navigate(ROUTES.HOME);
  };

  const handleRetry = () => {
    // Navigate back to previous page or home
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 flex items-center justify-center">
        <motion.div
          className="text-center bg-white rounded-3xl shadow-xl p-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Verifying Payment...
          </h3>
          <p className="text-gray-600">
            Please wait while we confirm your transaction
          </p>
        </motion.div>
      </div>
    );
  }

  const isSuccess =
    result?.transaction?.status === "success" ||
    result?.payosStatus?.status === "PAID";
  const isFailed =
    result?.transaction?.status === "failed" ||
    result?.transaction?.status === "cancelled" ||
    result?.error;
  const isProcessing =
    result?.transaction?.status === "pending" ||
    result?.transaction?.status === "processing";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 flex items-center justify-center p-4">
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
            {isSuccess ? (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            ) : isProcessing ? (
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-12 h-12 text-yellow-600" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
            )}
          </motion.div>

          {/* Status Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {isSuccess ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Successful! 🎉
                </h2>
                <p className="text-gray-600 mb-6">
                  Your wallet has been topped up successfully.
                </p>
                {result?.transaction?.amount && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
                    <div className="text-sm text-green-800 mb-1">
                      Amount Added:
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      +{result.transaction.amount?.toLocaleString()} VND
                    </div>
                    {result?.wallet?.balance && (
                      <div className="text-sm text-green-700 mt-2">
                        New Balance: {result.wallet.balance?.toLocaleString()}{" "}
                        VND
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Incomplete ❌
                </h2>
                <p className="text-gray-600 mb-6">
                  {result?.message ||
                    "The payment was not completed or was cancelled."}
                </p>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                  <p className="text-sm text-red-800">
                    💡 <strong>Common reasons:</strong> Payment was cancelled,
                    insufficient funds, or session expired. Please try again.
                  </p>
                </div>
              </>
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
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              {isSuccess ? "Continue Shopping" : "Back to Home"}
              <ArrowRight className="w-5 h-5" />
            </button>

            {isFailed && (
              <button
                onClick={handleRetry}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-all"
              >
                Try Again
              </button>
            )}
          </motion.div>

          {/* Transaction Details */}
          {result?.transaction && (
            <motion.div
              className="mt-6 pt-6 border-t border-gray-200 text-left"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Transaction Details
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Order Code:</span>
                  <span className="font-mono">{orderCode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span
                    className={`font-medium ${
                      isSuccess
                        ? "text-green-600"
                        : isProcessing
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {result.transaction.status?.toUpperCase()}
                  </span>
                </div>
                {result.transaction.amount && (
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">
                      {result.transaction.amount?.toLocaleString()} VND
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>
                    {new Date(result.transaction.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TopUpSuccess;
