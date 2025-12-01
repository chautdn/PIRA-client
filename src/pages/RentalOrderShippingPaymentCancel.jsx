import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, Home, RotateCcw } from "lucide-react";

/**
 * Payment Cancelled Page for Additional Shipping Fee
 */
const RentalOrderShippingPaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const requestId = searchParams.get("requestId");

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full"
      >
        <div className="text-center mb-6">
          <XCircle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Thanh toán đã bị hủy
          </h2>
          <p className="text-gray-600">
            Bạn đã hủy thanh toán phí ship thêm. Yêu cầu trả hàng sớm của bạn vẫn
            đang chờ thanh toán.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/rental-orders/${requestId || ''}`)}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Thử lại thanh toán</span>
          </button>

          <button
            onClick={() => navigate("/rental-orders")}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="w-5 h-5" />
            <span>Về danh sách đơn hàng</span>
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900">
            💡 <span className="font-medium">Lưu ý:</span> Bạn vẫn có thể thanh toán sau.
            Yêu cầu trả hàng sớm sẽ không được xử lý cho đến khi thanh toán thành công.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RentalOrderShippingPaymentCancel;
