import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, DollarSign, AlertCircle, Loader, Check, CreditCard, Wallet as WalletIcon } from "lucide-react";
import Portal from "../common/Portal";
import toast from "react-hot-toast";
import api from "../../services/api";

/**
 * Extend Rental Modal
 * Allows renter to request extend rental period
 */
const ExtendRentalModal = ({
  isOpen,
  onClose,
  masterOrder,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [newEndDate, setNewEndDate] = useState("");
  const [extendFee, setExtendFee] = useState(0);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("WALLET");

  // Get rental period from first product of first suborder
  const getProductRentalPeriod = () => {
    if (masterOrder?.subOrders?.[0]?.products?.[0]?.rentalPeriod) {
      return masterOrder.subOrders[0].products[0].rentalPeriod;
    }
    // Fallback to masterOrder rental period
    return masterOrder?.rentalPeriod;
  };

  const rentalPeriod = getProductRentalPeriod();
  const currentEndDate = rentalPeriod?.endDate;

  // Initialize newEndDate on open
  useEffect(() => {
    if (isOpen && currentEndDate) {
      const endDate = new Date(currentEndDate);
      const dateString = endDate.toISOString().split('T')[0];
      setNewEndDate(dateString);
    }
  }, [isOpen, currentEndDate]);

  // Calculate extend fee when newEndDate changes
  useEffect(() => {
    if (isOpen && currentEndDate && newEndDate) {
      const current = new Date(currentEndDate);
      const target = new Date(newEndDate);
      
      if (target > current) {
        const diffTime = Math.abs(target - current);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Calculate fee locally from master order data
        let fee = 0;
        if (masterOrder?.subOrders && masterOrder.subOrders.length > 0) {
          for (const subOrder of masterOrder.subOrders) {
            if (subOrder.products && subOrder.products.length > 0) {
              for (const productItem of subOrder.products) {
                // Try to get daily rental rate
                if (productItem.totalRental && productItem.rentalPeriod) {
                  const startDate = new Date(productItem.rentalPeriod.startDate);
                  const endDate = new Date(productItem.rentalPeriod.endDate);
                  const durationMs = endDate - startDate;
                  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
                  
                  if (durationDays > 0) {
                    const dailyRate = productItem.totalRental / durationDays;
                    fee += dailyRate * diffDays;
                  }
                } else if (productItem.rentalRate) {
                  // Fallback to rentalRate
                  fee += productItem.rentalRate * diffDays * (productItem.quantity || 1);
                }
              }
            }
          }
        }
        
        console.log('💰 Calculated fee locally:', { diffDays, fee: Math.round(fee) });
        setExtendFee(Math.round(fee));
      } else {
        setExtendFee(0);
      }
    }
  }, [isOpen, newEndDate, currentEndDate, masterOrder]);

  const getExtendDays = () => {
    if (!currentEndDate || !newEndDate) return 0;
    const current = new Date(currentEndDate);
    const target = new Date(newEndDate);
    const diffTime = Math.abs(target - current);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const extendDays = getExtendDays();
    if (extendDays <= 0) {
      toast.error("Ngày kết thúc mới phải sau ngày kết thúc hiện tại");
      return;
    }

    setLoading(true);

    try {
      // Get the first suborder ID to send extension request
      const subOrderId = masterOrder?.subOrders?.[0]?._id;
      if (!subOrderId) {
        throw new Error("Cannot find suborder to extend");
      }

      const response = await api.post(
        `/extensions/request`,
        {
          subOrderId: subOrderId,
          extendDays: extendDays,
          extensionFee: extendFee,
          notes: notes,
          paymentMethod: paymentMethod,
          newEndDate: newEndDate,
        }
      );

      toast.success("✅ Yêu cầu gia hạn đã được gửi cho chủ hàng!");
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error("Extend rental error:", error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi tạo yêu cầu gia hạn"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gia hạn thời gian thuê</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Yêu cầu gia hạn thêm thời gian thuê cho đơn hàng của bạn
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Current End Date */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Ngày kết thúc hiện tại</p>
                <p className="text-lg font-bold text-blue-600">
                  {new Date(currentEndDate).toLocaleDateString("vi-VN")}
                </p>
              </div>

              {/* Extend Days Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Ngày kết thúc mới
                </label>
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  min={new Date(currentEndDate).toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Chọn ngày kết thúc mới (tối thiểu hôm nay, tối đa 365 ngày)
                </p>
              </div>

              {/* New End Date */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Số ngày gia hạn</p>
                <p className="text-lg font-bold text-green-600">
                  {getExtendDays()} ngày
                </p>
              </div>

              {/* Extend Fee */}
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Phí gia hạn</p>
                      <p className="text-lg font-bold text-orange-600">
                        {`${extendFee.toLocaleString("vi-VN")}đ`}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Phí sẽ được tính dựa trên giá thuê ban đầu
                </p>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("WALLET")}
                    className={`p-3 rounded-lg border-2 transition flex flex-col items-center space-y-1 ${
                      paymentMethod === "WALLET"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                  >
                    <WalletIcon className="w-5 h-5" />
                    <span className="text-xs font-medium">Ví</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("PAYOS")}
                    className={`p-3 rounded-lg border-2 transition flex flex-col items-center space-y-1 ${
                      paymentMethod === "PAYOS"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-xs font-medium">PayOS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("COD")}
                    className={`p-3 rounded-lg border-2 transition flex flex-col items-center space-y-1 ${
                      paymentMethod === "COD"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="text-xs font-medium">COD</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {paymentMethod === "WALLET" && "Thanh toán từ ví của bạn"}
                  {paymentMethod === "PAYOS" && "Thanh toán qua ngân hàng/thẻ tín dụng"}
                  {paymentMethod === "COD" && "Thanh toán khi nhận hàng"}
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhập lí do gia hạn hoặc ghi chú thêm..."
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Info Alert */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Quy trình gia hạn:</p>
                  <ul className="space-y-1 text-xs">
                    <li>1. Yêu cầu được gửi đến chủ hàng</li>
                    <li>2. Chủ hàng xác nhận hoặc từ chối</li>
                    <li>3. Nếu xác nhận, phí sẽ được trừ ngay</li>
                    <li>4. Ngày kết thúc sẽ được cập nhật</li>
                  </ul>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || getExtendDays() <= 0}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Gửi yêu cầu</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>
    </Portal>
  );
};

export default ExtendRentalModal;
