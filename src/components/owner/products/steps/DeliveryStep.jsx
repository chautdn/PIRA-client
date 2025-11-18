import React from "react";
import { motion } from "framer-motion";
import icons from "../../../../utils/icons";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const DeliveryStep = ({ formData, errors, handleInputChange }) => {
  const handleDeliveryOptionChange = (option, value) => {
    handleInputChange({
      target: {
        name: `location.deliveryOptions.${option}`,
        value: value,
      },
    });
  };

  return (
    <motion.div className="space-y-6" {...fadeInUp}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center mb-2">
          <icons.FiMapPin className="w-6 h-6 mr-3 text-primary-600" />
          Phương Thức Giao Hàng
        </h2>
        <p className="text-gray-600">
          Chọn cách thức giao/nhận sản phẩm với người thuê
        </p>
      </div>

      {/* Delivery Options */}
      <div className="space-y-4">
        {/* Self Pickup */}
        <div
          className={`border-2 rounded-xl p-6 transition-all cursor-pointer ${
            formData.location.deliveryOptions.pickup
              ? "border-primary-500 bg-primary-50 shadow-md"
              : "border-gray-200 hover:border-primary-300"
          }`}
          onClick={() =>
            handleDeliveryOptionChange(
              "pickup",
              !formData.location.deliveryOptions.pickup
            )
          }
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  formData.location.deliveryOptions.pickup
                    ? "border-primary-500 bg-primary-500"
                    : "border-gray-300"
                }`}
              >
                {formData.location.deliveryOptions.pickup && (
                  <icons.FiCheck className="w-4 h-4 text-white" />
                )}
              </div>
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <icons.BiMap className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  Tự Giao Nhận
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Bạn sẽ tự giao và nhận lại sản phẩm với người thuê tại địa điểm
                đã chọn
              </p>
            </div>
          </div>
        </div>

        {/* PIRA Delivery */}
        <div
          className={`border-2 rounded-xl p-6 transition-all cursor-pointer ${
            formData.location.deliveryOptions.delivery
              ? "border-primary-500 bg-primary-50 shadow-md"
              : "border-gray-200 hover:border-primary-300"
          }`}
          onClick={() =>
            handleDeliveryOptionChange(
              "delivery",
              !formData.location.deliveryOptions.delivery
            )
          }
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  formData.location.deliveryOptions.delivery
                    ? "border-primary-500 bg-primary-500"
                    : "border-gray-300"
                }`}
              >
                {formData.location.deliveryOptions.delivery && (
                  <icons.FiCheck className="w-4 h-4 text-white" />
                )}
              </div>
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <icons.HiSparkles className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  Giao Hàng PIRA
                </h3>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  Khuyến nghị
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Sử dụng dịch vụ giao hàng của PIRA để vận chuyển sản phẩm đến
                người thuê
              </p>
              <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
                <div className="flex items-start gap-2 text-xs text-gray-600">
                  <icons.BiInfoCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">Ưu điểm:</p>
                    <ul className="space-y-1">
                      <li>
                        • Được bảo hiểm hàng hóa trong quá trình vận chuyển
                      </li>
                      <li>• Tiết kiệm thời gian của bạn</li>
                      <li>• Hệ thống theo dõi đơn hàng trực tuyến</li>
                      <li>• Hỗ trợ 24/7 khi có sự cố</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errors.deliveryOptions && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600 flex items-center">
            <icons.BiErrorCircle className="w-5 h-5 mr-2" />
            {errors.deliveryOptions}
          </p>
        </div>
      )}

      {/* Summary */}
      {(formData.location.deliveryOptions.pickup ||
        formData.location.deliveryOptions.delivery) && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <icons.FiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-green-900 mb-2">
                Phương Thức Đã Chọn
              </h4>
              <div className="space-y-2 text-sm text-green-800">
                {formData.location.deliveryOptions.pickup && (
                  <div className="flex items-center gap-2">
                    <icons.BiMap className="w-4 h-4" />
                    <span>Tự giao nhận</span>
                  </div>
                )}
                {formData.location.deliveryOptions.delivery && (
                  <div className="flex items-center gap-2">
                    <icons.HiSparkles className="w-4 h-4" />
                    <span>Giao hàng PIRA</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h5 className="font-bold text-blue-800 mb-3 flex items-center">
          <icons.HiLightBulb className="w-5 h-5 mr-2" />
          Mẹo Chọn Phương Thức
        </h5>
        <div className="space-y-2 text-sm text-blue-700">
          <div className="flex items-start space-x-2">
            <icons.FiCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Chọn cả hai phương thức để người thuê có nhiều lựa chọn hơn
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <icons.FiCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Với sản phẩm giá trị cao, nên sử dụng dịch vụ PIRA để được bảo
              hiểm
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DeliveryStep;
