import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  MapPin,
  AlertCircle,
  Loader,
  Check,
  Wallet,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import Portal from "../common/Portal";
import MapSelector from "../common/MapSelector";
import toast from "react-hot-toast";
import earlyReturnApi from "../../services/earlyReturn.Api";
import { useWallet } from "../../context/WalletContext";

/**
 * Early Return Request Modal - Multi-step flow
 * Step 1: Select date and address
 * Step 2: Review distance and additional fees (if address changed)
 * Step 3: Payment (if additional fees required)
 */
const EarlyReturnRequestModal = ({
  isOpen,
  onClose,
  subOrder,
  userAddresses,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: form, 2: review & confirm, 3: payment
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [feeCalculationResult, setFeeCalculationResult] = useState(null);
  const { balance } = useWallet();

  const [formData, setFormData] = useState({
    requestedReturnDate: "",
    useOriginalAddress: true,
    returnAddress: null,
  });

  // Get rental period from subOrder
  const rentalPeriod =
    subOrder?.products?.[0]?.rentalPeriod || subOrder?.rentalPeriod;

  // Calculate min and max dates
  const getMinMaxDates = () => {
    if (!rentalPeriod) return { minDate: "", maxDate: "" };

    const startDate = new Date(rentalPeriod.startDate);
    const endDate = new Date(rentalPeriod.endDate);

    // Min: rental start date
    const minDate = startDate.toISOString().split("T")[0];

    // Max: 1 day before end date
    const maxDate = new Date(endDate);
    maxDate.setDate(maxDate.getDate() - 1);
    const maxDateStr = maxDate.toISOString().split("T")[0];

    return { minDate, maxDate: maxDateStr };
  };

  const { minDate, maxDate } = getMinMaxDates();

  // Get default address
  const defaultAddress =
    userAddresses?.find((addr) => addr.isDefault) || userAddresses?.[0];

  useEffect(() => {
    if (isOpen && defaultAddress && formData.useOriginalAddress) {
      setFormData((prev) => ({
        ...prev,
        returnAddress: {
          streetAddress: defaultAddress.streetAddress,
          ward: defaultAddress.ward,
          district: defaultAddress.district,
          city: defaultAddress.city,
          province: defaultAddress.province,
          coordinates: defaultAddress.coordinates,
          contactPhone: defaultAddress.phone,
        },
      }));
    }
  }, [isOpen, defaultAddress, formData.useOriginalAddress]);

  const handleAddressSelect = (locationData) => {
    console.log("Address selected:", locationData);

    setFormData((prev) => ({
      ...prev,
      returnAddress: {
        streetAddress:
          locationData.streetAddress || locationData.fullAddress || "",
        ward: locationData.ward || "",
        district: locationData.district || "",
        city: locationData.city || "",
        province: locationData.province || "",
        coordinates: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        },
        contactPhone:
          prev.returnAddress?.contactPhone || defaultAddress?.phone || "",
      },
    }));

    toast.success("Đã chọn địa chỉ trên bản đồ!");
  };

  // Calculate shipping fee before showing form
  const calculateShippingFee = async () => {
    if (
      !formData.returnAddress?.coordinates?.latitude ||
      !formData.returnAddress?.coordinates?.longitude
    ) {
      toast.error("Vui lòng chọn địa chỉ trên bản đồ trước");
      return;
    }

    setCalculatingFee(true);

    try {
      // Call a new endpoint to calculate fees WITHOUT creating request
      const response = await earlyReturnApi.calculateAdditionalFee({
        subOrderId: subOrder._id,
        newAddress: formData.returnAddress,
      });

      console.log("Fee calculation result:", response.metadata);
      setFeeCalculationResult(response.metadata);

      if (response.metadata.requiresPayment) {
        toast(
          `💰 Phí ship thêm: ${response.metadata.additionalFee?.toLocaleString()}đ`,
          {
            icon: "💰",
            duration: 4000,
          }
        );
      } else {
        toast.success(
          "✅ Địa chỉ mới gần hơn hoặc bằng địa chỉ gốc - Không phí thêm!"
        );
      }

      // Always go to review step for user confirmation
      setCurrentStep(2);
    } catch (error) {
      console.error("Fee calculation error:", error);
      toast.error(error.response?.data?.message || "Không thể tính phí ship");
    } finally {
      setCalculatingFee(false);
    }
  };

  // Create the actual early return request (after payment if needed)
  const createEarlyReturnRequest = async () => {
    setLoading(true);

    try {
      // Prepare return address - remove empty fields
      let cleanedReturnAddress = undefined;
      if (!formData.useOriginalAddress && formData.returnAddress) {
        cleanedReturnAddress = {
          streetAddress: formData.returnAddress.streetAddress,
          ward: formData.returnAddress.ward,
          district: formData.returnAddress.district,
          city: formData.returnAddress.city,
          province: formData.returnAddress.province,
          coordinates: formData.returnAddress.coordinates,
        };

        // Only include contactPhone if it's not empty
        // Backend will fill it from renter.phone if missing
        if (
          formData.returnAddress.contactPhone &&
          formData.returnAddress.contactPhone.trim()
        ) {
          cleanedReturnAddress.contactPhone =
            formData.returnAddress.contactPhone;
        }
      }

      const requestPayload = {
        subOrderId: subOrder._id,
        requestedReturnDate: formData.requestedReturnDate,
        useOriginalAddress: formData.useOriginalAddress,
        returnAddress: cleanedReturnAddress,
      };

      // Add addressInfo if there was an upfront shipping fee payment
      if (feeCalculationResult?.requiresPayment) {
        requestPayload.addressInfo = {
          originalDistance: feeCalculationResult.originalDistance,
          newDistance: feeCalculationResult.newDistance,
          newAddress: formData.returnAddress,
        };
      }

      console.log(
        "[CreateRequest] Sending payload:",
        JSON.stringify(requestPayload, null, 2)
      );

      const createResponse = await earlyReturnApi.create(requestPayload);

      toast.success("✅ Yêu cầu trả hàng sớm đã được gửi!");
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error("Create early return error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error(
        "Full error:",
        JSON.stringify(error.response?.data, null, 2)
      );

      if (error.response?.data?.errors) {
        console.error("Validation errors:", error.response.data.errors);
      }

      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi tạo yêu cầu"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.requestedReturnDate) {
      toast.error("Vui lòng chọn ngày muốn trả");
      return;
    }

    if (!formData.useOriginalAddress) {
      if (!formData.returnAddress?.streetAddress) {
        toast.error("Vui lòng chọn địa chỉ trên bản đồ");
        return;
      }
      if (
        !formData.returnAddress?.coordinates?.latitude ||
        !formData.returnAddress?.coordinates?.longitude
      ) {
        toast.error("Địa chỉ chưa có tọa độ. Vui lòng chọn lại trên bản đồ");
        return;
      }

      // Calculate fee first if using new address
      await calculateShippingFee();
    } else {
      // Using original address, no fee calculation needed
      setFeeCalculationResult({ requiresPayment: false });
      // Show review step for confirmation
      setCurrentStep(2);
    }
  };

  const handlePayment = async (paymentMethod) => {
    setLoading(true);

    try {
      // Pay the upfront additional shipping fee
      const response = await earlyReturnApi.payUpfrontShippingFee({
        subOrderId: subOrder._id,
        amount: feeCalculationResult.additionalFee,
        paymentMethod,
        addressInfo: {
          originalDistance: feeCalculationResult.originalDistance,
          newDistance: feeCalculationResult.newDistance,
          newAddress: formData.returnAddress,
        },
      });

      if (paymentMethod === "wallet") {
        toast.success("✅ Thanh toán phí ship thành công!");
        // After successful wallet payment, create the request
        await createEarlyReturnRequest();
      } else if (paymentMethod === "payos") {
        // Store form data and fee info in sessionStorage for after redirect
        sessionStorage.setItem(
          "earlyReturnFormData",
          JSON.stringify({
            subOrderId: subOrder._id,
            formData,
            feeCalculationResult,
            orderCode: response.metadata.orderCode,
          })
        );

        toast.loading("🔄 Chuyển đến trang thanh toán...", { duration: 2000 });
        setTimeout(() => {
          window.location.href = response.metadata.checkoutUrl;
        }, 2000);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi thanh toán"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFeeCalculationResult(null);
    setFormData({
      requestedReturnDate: "",
      useOriginalAddress: true,
      returnAddress: null,
    });
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Render review/confirmation step
  const renderReviewStep = () => (
    <div className="p-6 space-y-6">
      {/* Review Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 text-lg">
          Xác nhận thông tin
        </h3>

        {/* Return Date */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-600 mb-1">Ngày trả hàng</p>
          <p className="font-medium text-gray-900">
            {new Date(formData.requestedReturnDate).toLocaleDateString(
              "vi-VN",
              {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            )}
          </p>
        </div>

        {/* Return Address */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-600 mb-1">Địa chỉ trả hàng</p>
          {formData.useOriginalAddress ? (
            <div>
              <p className="font-medium text-gray-900 mb-1">Địa chỉ gốc</p>
              <p className="text-sm text-gray-700">
                {defaultAddress?.streetAddress}, {defaultAddress?.ward},{" "}
                {defaultAddress?.district}, {defaultAddress?.city}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-medium text-gray-900 mb-1">Địa chỉ mới</p>
              <p className="text-sm text-gray-700">
                {formData.returnAddress?.streetAddress},{" "}
                {formData.returnAddress?.ward},{" "}
                {formData.returnAddress?.district},{" "}
                {formData.returnAddress?.city}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                📞 {formData.returnAddress?.contactPhone}
              </p>
            </div>
          )}
        </div>

        {/* Fee Information */}
        {feeCalculationResult?.requiresPayment ? (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-yellow-900 mb-2">
                  ⚠️ Địa chỉ mới xa hơn - Cần thanh toán phí thêm
                </p>
                <div className="text-sm text-yellow-800 space-y-1">
                  <p>
                    Khoảng cách gốc:{" "}
                    {feeCalculationResult?.originalDistance?.toFixed(1)} km
                  </p>
                  <p>
                    Khoảng cách mới:{" "}
                    {feeCalculationResult?.newDistance?.toFixed(1)} km
                  </p>
                  <p>
                    Chênh lệch: +
                    {feeCalculationResult?.distanceDiff?.toFixed(1)} km
                  </p>
                  <p className="font-bold text-yellow-900 mt-2 text-base">
                    💰 Phí ship thêm:{" "}
                    {feeCalculationResult?.additionalFee?.toLocaleString()}đ
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-900">
                  ✅ Không có phí ship thêm
                </p>
                {feeCalculationResult?.originalDistance && (
                  <p className="text-sm text-green-800 mt-1">
                    Địa chỉ mới gần hơn hoặc bằng địa chỉ gốc
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t gap-3">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          disabled={loading}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>

          {feeCalculationResult?.requiresPayment ? (
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <span>Tiếp tục thanh toán</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={createEarlyReturnRequest}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Xác nhận tạo yêu cầu</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Render payment step
  const renderPaymentStep = () => (
    <div className="p-6 space-y-6">
      {/* Additional Fee Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-yellow-900 mb-2">
              Địa chỉ mới xa hơn địa chỉ gốc
            </p>
            <div className="text-sm text-yellow-800 space-y-1">
              <p>
                Khoảng cách gốc:{" "}
                {feeCalculationResult?.originalDistance?.toFixed(1)} km
              </p>
              <p>
                Khoảng cách mới: {feeCalculationResult?.newDistance?.toFixed(1)}{" "}
                km
              </p>
              <p>
                Chênh lệch: +{feeCalculationResult?.distanceDiff?.toFixed(1)} km
              </p>
              <p className="font-semibold text-yellow-900 mt-2">
                Phí ship thêm:{" "}
                {feeCalculationResult?.additionalFee?.toLocaleString()}đ
              </p>
            </div>
            <div className="mt-3 bg-white border border-yellow-300 rounded-lg p-3">
              <p className="text-xs text-yellow-900 font-medium">
                ⚠️ Bạn cần thanh toán phí ship thêm trước khi tạo yêu cầu trả
                hàng sớm
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">
          Chọn phương thức thanh toán
        </h3>

        {/* Wallet Payment */}
        <button
          onClick={() => handlePayment("wallet")}
          disabled={loading || balance < feeCalculationResult?.additionalFee}
          className="w-full mb-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Ví PIRA</p>
                <p className="text-sm text-gray-600">
                  Số dư: {balance?.toLocaleString()}đ
                </p>
              </div>
            </div>
            {balance >= feeCalculationResult?.additionalFee ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <span className="text-xs text-red-600">Không đủ số dư</span>
            )}
          </div>
        </button>

        {/* PayOS Payment */}
        <button
          onClick={() => handlePayment("payos")}
          disabled={loading}
          className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all disabled:opacity-50"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">PayOS</p>
              <p className="text-sm text-gray-600">
                Thanh toán qua ngân hàng, QR Code
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          onClick={() => setCurrentStep(2)}
          disabled={loading}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Hủy
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <Portal>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-100"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {currentStep === 1 && "Yêu cầu trả hàng sớm"}
                    {currentStep === 2 && "Xác nhận thông tin"}
                    {currentStep === 3 && "Thanh toán phí ship thêm"}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    SubOrder: #{subOrder?.subOrderNumber} • Bước {currentStep}/3
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            {currentStep === 1 ? (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Rental Period Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1 text-sm text-blue-900">
                      <p className="font-medium mb-1">Thời gian thuê gốc:</p>
                      <p>
                        Từ{" "}
                        {new Date(rentalPeriod?.startDate).toLocaleDateString(
                          "vi-VN"
                        )}{" "}
                        đến{" "}
                        {new Date(rentalPeriod?.endDate).toLocaleDateString(
                          "vi-VN"
                        )}
                      </p>
                      <p className="text-blue-700 mt-2">
                        💡 Ngày trả phải trước ngày kết thúc ít nhất 1 ngày
                      </p>
                    </div>
                  </div>
                </div>

                {/* Return Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Ngày muốn trả hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.requestedReturnDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        requestedReturnDate: e.target.value,
                      }))
                    }
                    min={minDate}
                    max={maxDate}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Chọn từ {new Date(minDate).toLocaleDateString("vi-VN")} đến{" "}
                    {new Date(maxDate).toLocaleDateString("vi-VN")}
                  </p>
                </div>

                {/* Address Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Địa chỉ trả hàng <span className="text-red-500">*</span>
                  </label>

                  {/* Radio Options */}
                  <div className="space-y-3 mb-4">
                    <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        checked={formData.useOriginalAddress}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            useOriginalAddress: true,
                          }))
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium">Dùng địa chỉ gốc</p>
                        {defaultAddress && (
                          <p className="text-sm text-gray-600 mt-1">
                            {defaultAddress.streetAddress},{" "}
                            {defaultAddress.ward}, {defaultAddress.district},{" "}
                            {defaultAddress.city}
                          </p>
                        )}
                      </div>
                    </label>

                    <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        checked={!formData.useOriginalAddress}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            useOriginalAddress: false,
                          }))
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium">Chọn địa chỉ mới</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Chọn địa chỉ khác trên bản đồ VietMap
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Map Selector for New Address */}
                  {!formData.useOriginalAddress && (
                    <div className="space-y-3">
                      <MapSelector
                        onLocationSelect={handleAddressSelect}
                        initialAddress={formData.returnAddress?.streetAddress}
                        placeholder="Nhấn để chọn địa chỉ trên bản đồ VietMap..."
                        className="mb-3"
                      />

                      {/* Show selected address details */}
                      {formData.returnAddress?.coordinates?.latitude &&
                        formData.returnAddress?.coordinates?.longitude && (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-start space-x-2">
                              <Check className="w-5 h-5 text-green-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium text-green-900 mb-1">
                                  ✅ Địa chỉ đã chọn:
                                </p>
                                <p className="text-sm text-green-800">
                                  {formData.returnAddress.streetAddress}
                                  {formData.returnAddress.ward &&
                                    `, ${formData.returnAddress.ward}`}
                                  {formData.returnAddress.district &&
                                    `, ${formData.returnAddress.district}`}
                                  {formData.returnAddress.city &&
                                    `, ${formData.returnAddress.city}`}
                                </p>
                                <p className="text-xs text-green-700 mt-1">
                                  Tọa độ:{" "}
                                  {formData.returnAddress.coordinates.latitude.toFixed(
                                    6
                                  )}
                                  ,{" "}
                                  {formData.returnAddress.coordinates.longitude.toFixed(
                                    6
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading || calculatingFee}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading || calculatingFee}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {(loading || calculatingFee) && (
                      <Loader className="w-4 h-4 animate-spin" />
                    )}
                    <span>
                      {calculatingFee
                        ? "Đang tính phí..."
                        : loading
                        ? "Đang xử lý..."
                        : "Tiếp tục"}
                    </span>
                  </button>
                </div>
              </form>
            ) : currentStep === 2 ? (
              renderReviewStep()
            ) : (
              renderPaymentStep()
            )}
          </motion.div>
        </div>
      </AnimatePresence>
    </Portal>
  );
};

export default EarlyReturnRequestModal;
