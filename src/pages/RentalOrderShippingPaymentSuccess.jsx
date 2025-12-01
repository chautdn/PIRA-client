import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader, Home, FileText } from "lucide-react";
import earlyReturnApi from "../services/earlyReturn.Api";
import toast from "react-hot-toast";

/**
 * Payment Success Page for Additional Shipping Fee
 * Polls verify endpoint to check PayOS payment status
 */
const RentalOrderShippingPaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderCode = searchParams.get("orderCode");
  const subOrderId = searchParams.get("subOrderId");

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [creatingRequest, setCreatingRequest] = useState(false);

  useEffect(() => {
    if (!orderCode) {
      setError("Không tìm thấy mã đơn hàng");
      setLoading(false);
      return;
    }

    let pollInterval;
    let stopTimer;

    const verifyPaymentAndCreateRequest = async () => {
      try {
        // First, verify the upfront payment transaction
        const Transaction = await import("../services/api");
        const response = await Transaction.default.get(
          `/transactions/${orderCode}`
        );

        if (response.data.metadata?.transaction?.status === "success") {
          clearInterval(pollInterval);
          clearTimeout(stopTimer);

          setResult({ status: "paid", transaction: response.data.metadata.transaction });
          setLoading(false);

          toast.success("✅ Thanh toán thành công!");

          // Now create the early return request
          const storedData = sessionStorage.getItem("earlyReturnFormData");
          if (storedData) {
            const { formData, subOrderId } = JSON.parse(storedData);
            
            setCreatingRequest(true);
            try {
              await earlyReturnApi.create({
                subOrderId,
                requestedReturnDate: formData.requestedReturnDate,
                useOriginalAddress: formData.useOriginalAddress,
                returnAddress: formData.useOriginalAddress
                  ? undefined
                  : formData.returnAddress,
                notes: formData.notes,
              });

              toast.success("✅ Yêu cầu trả hàng sớm đã được tạo!");
              sessionStorage.removeItem("earlyReturnFormData");
            } catch (createError) {
              console.error("Failed to create request:", createError);
              toast.error("Đã thanh toán nhưng không thể tạo yêu cầu. Vui lòng liên hệ hỗ trợ.");
            } finally {
              setCreatingRequest(false);
            }
          }
        }
      } catch (error) {
        console.error("Verification error:", error);
      }
    };

    // Verify immediately
    verifyPaymentAndCreateRequest();

    // Poll every 2 seconds
    pollInterval = setInterval(verifyPaymentAndCreateRequest, 2000);

    // Stop after 30 seconds
    stopTimer = setTimeout(() => {
      clearInterval(pollInterval);
      setLoading(false);

      if (!result) {
        setError(
          "Không thể xác minh thanh toán. Vui lòng kiểm tra lại sau."
        );
      }
    }, 30000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (stopTimer) clearTimeout(stopTimer);
    };
  }, [orderCode]);

  if (loading || creatingRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {creatingRequest ? "Đang tạo yêu cầu trả hàng sớm..." : "Đang xác minh thanh toán"}
          </h2>
          <p className="text-gray-600">
            Vui lòng đợi trong giây lát...
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Có lỗi xảy ra
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>

          <button
            onClick={() => navigate("/rental-orders")}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="w-5 h-5" />
            <span>Về trang chủ</span>
          </button>
        </motion.div>
      </div>
    );
  }

  if (result?.status === "paid") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full"
        >
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Thanh toán thành công!
            </h2>
            <p className="text-gray-600">
              Yêu cầu trả hàng sớm đã được tạo
            </p>
          </div>

          {/* Transaction Info */}
          {result.transaction && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Mã giao dịch</p>
              <p className="font-medium text-gray-900">
                #{result.transaction._id}
              </p>

              <p className="text-sm text-gray-600 mt-3 mb-1">Phí đã thanh toán</p>
              <p className="text-lg font-bold text-green-600">
                {result.transaction.amount?.toLocaleString()}đ
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/rental-orders/${subOrderId || ''}`)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <FileText className="w-5 h-5" />
              <span>Xem chi tiết đơn hàng</span>
            </button>

            <button
              onClick={() => navigate("/rental-orders")}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Về danh sách đơn hàng</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
};

export default RentalOrderShippingPaymentSuccess;
