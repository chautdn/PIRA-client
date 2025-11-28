import React, { useState, useEffect } from "react";
import { Ticket, X, AlertCircle, CheckCircle2 } from "lucide-react";
import voucherService from "../../services/voucher";
import toast from "react-hot-toast";

const VoucherSelector = ({ onVoucherSelect, selectedVoucher, shippingFee }) => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (showVoucherModal) {
      fetchVouchers();
    }
  }, [showVoucherModal]);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const response = await voucherService.getUserVouchers(false);
      setVouchers(response.vouchers);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      toast.error("Không thể tải danh sách voucher");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVoucher = (voucher) => {
    onVoucherSelect(voucher);
    setShowVoucherModal(false);
    toast.success(
      `Đã áp dụng voucher giảm ${voucher.discountPercent}% phí ship`
    );
  };

  const handleValidateManualCode = async () => {
    if (!manualCode.trim()) {
      toast.error("Vui lòng nhập mã voucher");
      return;
    }

    setValidating(true);
    try {
      const response = await voucherService.validateVoucher(manualCode.trim());
      handleSelectVoucher(response.voucher);
      setManualCode("");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Mã voucher không hợp lệ";
      toast.error(errorMessage);
    } finally {
      setValidating(false);
    }
  };

  const calculateDiscount = (voucher) => {
    if (!shippingFee || !voucher) return 0;
    return Math.round((shippingFee * voucher.discountPercent) / 100);
  };

  const handleRemoveVoucher = () => {
    onVoucherSelect(null);
    toast.success("Đã xóa voucher");
  };

  return (
    <>
      {/* Voucher Display/Button */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-600" />
            <span className="font-medium text-gray-900">Voucher giảm giá</span>
          </div>

          {selectedVoucher ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-mono font-bold text-indigo-600">
                  {selectedVoucher.code}
                </p>
                <p className="text-sm text-green-600">
                  -{calculateDiscount(selectedVoucher).toLocaleString("vi-VN")}đ
                  ({selectedVoucher.discountPercent}%)
                </p>
              </div>
              <button
                onClick={handleRemoveVoucher}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowVoucherModal(true)}
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
            >
              Chọn voucher
            </button>
          )}
        </div>
      </div>

      {/* Voucher Selection Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Ticket className="w-6 h-6 text-indigo-600" />
                Chọn Voucher
              </h2>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Manual Code Input */}
            <div className="p-6 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhập mã voucher
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleValidateManualCode()
                  }
                  placeholder="VD: SHIP25-ABC123"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase"
                />
                <button
                  onClick={handleValidateManualCode}
                  disabled={validating}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {validating ? "Đang kiểm tra..." : "Áp dụng"}
                </button>
              </div>
            </div>

            {/* Voucher List */}
            <div className="p-6 overflow-y-auto max-h-96">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : vouchers.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Bạn chưa có voucher nào</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Tích điểm loyalty để đổi voucher miễn phí ship
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vouchers.map((voucher) => {
                    const discount = calculateDiscount(voucher);

                    return (
                      <div
                        key={voucher._id}
                        onClick={() => handleSelectVoucher(voucher)}
                        className="border-2 border-dashed border-indigo-200 rounded-lg p-4 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="font-mono font-bold text-gray-900">
                                {voucher.code}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm">
                              Giảm {voucher.discountPercent}% phí ship
                            </p>
                          </div>
                          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                            -{voucher.discountPercent}%
                          </span>
                        </div>

                        {shippingFee > 0 && (
                          <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                            <p className="text-green-700 text-sm font-medium">
                              Tiết kiệm: {discount.toLocaleString("vi-VN")}đ
                            </p>
                          </div>
                        )}

                        <div className="mt-2 text-xs text-gray-500">
                          Hết hạn:{" "}
                          {new Date(voucher.expiresAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Info */}
            <div className="bg-gray-50 p-4 border-t border-gray-200">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Mỗi đơn hàng chỉ áp dụng được 1 voucher. Voucher có thể được
                  chia sẻ và sử dụng bởi bất kỳ ai.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoucherSelector;
