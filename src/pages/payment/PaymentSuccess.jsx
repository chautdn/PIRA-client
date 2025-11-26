import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Clock, Calendar, Package, Home, ArrowRight, Receipt } from "lucide-react";
import api from "../../services/api";
import { ROUTES } from "../../utils/constants";
import toast from "react-hot-toast";

const PaymentSuccess = () => {
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

          console.log("🔍 Payment verification result:", paymentResult);

          // ✅ If payment is successful
          if (
            paymentResult?.transaction?.status === "success" ||
            paymentResult?.payosStatus?.status === "PAID"
          ) {
            if (pollInterval) clearInterval(pollInterval);
            if (stopTimer) clearTimeout(stopTimer);

            // Show success toast
            toast.success(
              "✅ Payment successful! Your rental order has been confirmed.",
              { duration: 4000, icon: "🎉" }
            );

            setResult(paymentResult);
            setLoading(false);
            return;
          }

          // If payment failed or cancelled
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
          if (pollInterval) clearInterval(pollInterval);
          if (stopTimer) clearTimeout(stopTimer);
          setLoading(false);
        }
      };

      // Verify immediately
      verifyPayment();

      // Poll every 2 seconds
      pollInterval = setInterval(verifyPayment, 2000);

      // Stop polling after 60 seconds
      stopTimer = setTimeout(() => {
        clearInterval(pollInterval);
        setLoading(false);
      }, 60000);

      return () => {
        if (pollInterval) clearInterval(pollInterval);
        if (stopTimer) clearTimeout(stopTimer);
      };
    } else {
      setResult({ error: true, message: "No order code provided" });
      setLoading(false);
    }
  }, [orderCode]);

  const handleViewOrders = () => {
    navigate(ROUTES.RENTAL_ORDERS);
  };

  const handleContinueShopping = () => {
    navigate(ROUTES.HOME);
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
            Please wait while we confirm your rental order payment
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
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ repeat: 2, duration: 0.5 }}
                >
                  <Package className="w-12 h-12 text-red-600" />
                </motion.div>
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
                  Rental Order Confirmed! 🎉
                </h2>
                <p className="text-gray-600 mb-6">
                  Your payment has been processed successfully. Your rental order is now confirmed and being prepared.
                </p>
                {result?.rentalOrder && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-green-800 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Rental Period:</span>
                    </div>
                    <div className="text-sm text-green-700">
                      {new Date(result.rentalOrder.rentalStartDate).toLocaleDateString()} -{" "}
                      {new Date(result.rentalOrder.rentalEndDate).toLocaleDateString()}
                    </div>
                    {result?.transaction?.amount && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <div className="text-sm text-green-800 mb-1">
                          Amount Paid:
                        </div>
                        <div className="text-xl font-bold text-green-900">
                          {result.transaction.amount?.toLocaleString()} VND
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : isProcessing ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Processing Payment... ⏳
                </h2>
                <p className="text-gray-600 mb-6">
                  Your payment is being processed. This usually takes a few moments.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Not Completed ❌
                </h2>
                <p className="text-gray-600 mb-6">
                  {result?.message ||
                    "The payment was not completed or was cancelled. Your rental order was not confirmed."}
                </p>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                  <p className="text-sm text-red-800">
                    💡 <strong>What to do next:</strong> You can try placing the order again or contact support if you need assistance.
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
            {isSuccess ? (
              <>
                <button
                  onClick={handleViewOrders}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <Receipt className="w-5 h-5" />
                  View My Orders
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={handleContinueShopping}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Continue Shopping
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleContinueShopping}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Back to Home
                  <ArrowRight className="w-5 h-5" />
                </button>
                {isFailed && (
                  <button
                    onClick={() => navigate(ROUTES.CART)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-all"
                  >
                    Try Again
                  </button>
                )}
              </>
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
                  <span className="font-mono text-blue-600">{orderCode}</span>
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
                    {new Date().toLocaleString()}
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

export default PaymentSuccess;