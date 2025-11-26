import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, MapPin, AlertCircle, Loader, Check } from "lucide-react";
import Portal from "../common/Portal";
import MapSelector from "../common/MapSelector";
import toast from "react-hot-toast";
import earlyReturnApi from "../../services/earlyReturn.Api";

/**
 * Early Return Request Modal
 * Allows renter to create early return request
 */
const EarlyReturnRequestModal = ({
  isOpen,
  onClose,
  subOrder,
  userAddresses,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    requestedReturnDate: "",
    useOriginalAddress: true,
    returnAddress: null,
    notes: "",
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
      if (!formData.returnAddress?.contactPhone) {
        toast.error("Vui lòng nhập số điện thoại liên hệ");
        return;
      }
    }

    setLoading(true);

    try {
      await earlyReturnApi.create({
        subOrderId: subOrder._id,
        requestedReturnDate: formData.requestedReturnDate,
        useOriginalAddress: formData.useOriginalAddress,
        returnAddress: formData.useOriginalAddress
          ? undefined
          : formData.returnAddress,
        notes: formData.notes,
      });

      toast.success("✅ Yêu cầu trả hàng sớm đã được gửi!");
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error("Create early return error:", error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi tạo yêu cầu"
      );
    } finally {
      setLoading(false);
    }
  };

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
                    Yêu cầu trả hàng sớm
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    SubOrder: #{subOrder?.subOrderNumber}
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
                          {defaultAddress.streetAddress}, {defaultAddress.ward},{" "}
                          {defaultAddress.district}, {defaultAddress.city}
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

                    {/* Contact Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại liên hệ{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.returnAddress?.contactPhone || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            returnAddress: {
                              ...prev.returnAddress,
                              streetAddress:
                                prev.returnAddress?.streetAddress || "",
                              ward: prev.returnAddress?.ward || "",
                              district: prev.returnAddress?.district || "",
                              city: prev.returnAddress?.city || "",
                              province: prev.returnAddress?.province || "",
                              coordinates:
                                prev.returnAddress?.coordinates || {},
                              contactPhone: e.target.value,
                            },
                          }))
                        }
                        placeholder="Nhập số điện thoại"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required={!formData.useOriginalAddress}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú (không bắt buộc)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  placeholder="Nhập lý do hoặc ghi chú về việc trả hàng sớm..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  <span>{loading ? "Đang gửi..." : "Gửi yêu cầu"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>
    </Portal>
  );
};

export default EarlyReturnRequestModal;
