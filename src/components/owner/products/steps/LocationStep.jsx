import React from "react";
import { motion } from "framer-motion";
import icons from "../../../../utils/icons";
import MapSelector from "../../../common/MapSelector";
import { useAuth } from "../../../../hooks/useAuth";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const LocationStep = ({ formData, errors, handleInputChange, onSaveDraft }) => {
  const { user } = useAuth();

  // Handle location selection from MapSelector
  const handleLocationSelect = (locationData) => {
    // Update the form data with the selected location
    const locationObject = {
      target: {
        name: "location",
        value: {
          address: {
            streetAddress:
              locationData.streetAddress || locationData.fullAddress || "",
            ward: locationData.ward || "",
            district: locationData.district || "",
          },
          city: locationData.city || "Đà Nẵng",
          coordinates: {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          },
        },
      },
    };

    handleInputChange(locationObject);
  };

  return (
    <motion.div className="space-y-6" {...fadeInUp}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center mb-2">
          <icons.BiMapPin className="w-6 h-6 mr-3 text-primary-600" />
          Địa Điểm
        </h2>
        <p className="text-gray-600">
          Chọn vị trí giao/nhận sản phẩm để khách hàng tiện theo dõi
        </p>
      </div>

      {/* Current Location Display */}
      {(formData.location?.address?.streetAddress ||
        formData.location?.coordinates?.latitude) && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <icons.FiMapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-green-900 mb-1">Địa Chỉ Đã Chọn</h4>
              <p className="text-sm text-green-800">
                {formData.location.address?.streetAddress ||
                  "Địa chỉ đã chọn từ bản đồ"}
                {formData.location.address?.ward &&
                  `, ${formData.location.address.ward}`}
                {formData.location.address?.district &&
                  `, ${formData.location.address.district}`}
                {formData.location.city && `, ${formData.location.city}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VietMap Selector */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-800">
          <icons.BiMapPin className="inline w-4 h-4 mr-2 text-primary-600" />
          Chọn địa chỉ trên bản đồ (để tính khoảng cách chính xác) *
        </label>
        <MapSelector
          onLocationSelect={handleLocationSelect}
          initialAddress={formData.location?.address?.streetAddress || ""}
          placeholder="Nhấn để chọn địa chỉ trên bản đồ VietMap..."
          className="mb-4"
        />
        {errors.location && (
          <p className="text-sm text-red-600 mt-1 flex items-center">
            <icons.BiInfoCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
            {errors.location}
          </p>
        )}
      </div>

      {/* Location Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-6">
        <h5 className="font-bold text-blue-800 mb-3 flex items-center">
          <icons.BiInfoCircle className="w-5 h-5 mr-2" />
          Mẹo Chọn Địa Điểm
        </h5>
        <div className="space-y-2 text-sm text-blue-700">
          <div className="flex items-start space-x-2">
            <icons.FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Chọn địa điểm dễ tìm và thuận tiện cho việc giao nhận</span>
          </div>
          <div className="flex items-start space-x-2">
            <icons.HiOutlineLocationMarker className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Ưu tiên khu vực có chỗ đậu xe hoặc gần phương tiện công cộng
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <icons.BsBuildings className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Có thể gặp tại văn phòng, trung tâm thương mại hoặc địa điểm công
              cộng
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LocationStep;
