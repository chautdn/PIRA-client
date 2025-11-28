import React from "react";
import { motion } from "framer-motion";
import icons from "../../../../utils/icons";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const BasicInfoStep = ({ formData, errors, handleInputChange }) => {
  return (
    <motion.div className="space-y-6" {...fadeInUp}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center mb-2">
          <icons.BiInfoCircle className="w-6 h-6 mr-3 text-primary-600" />
          Thông Tin Cơ Bản
        </h2>
        <p className="text-gray-600">
          Nhập thông tin cơ bản về sản phẩm của bạn
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Tên Sản Phẩm <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="VD: Máy ảnh Canon EOS 90D kèm lens 18-135mm"
          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
            errors.title
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-gray-200 focus:border-primary-500 focus:ring-primary-200"
          }`}
          maxLength={100}
        />
        <div className="flex justify-between mt-1">
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title}</p>
          )}
          <p className="text-xs text-gray-500 ml-auto">
            {formData.title.length}/100 ký tự
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Mô Tả Chi Tiết <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Mô tả chi tiết về tình trạng, đặc điểm nổi bật, phụ kiện đi kèm..."
          rows="6"
          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all resize-none ${
            errors.description
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-gray-200 focus:border-primary-500 focus:ring-primary-200"
          }`}
          maxLength={2000}
        />
        <div className="flex justify-between mt-1">
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description}</p>
          )}
          <p className="text-xs text-gray-500 ml-auto">
            {formData.description.length}/2000 ký tự
          </p>
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Số Lượng Sản Phẩm <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            min="1"
            placeholder="Nhập số lượng sản phẩm có sẵn"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
              errors.quantity
                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                : "border-gray-200 focus:border-primary-500 focus:ring-primary-200"
            }`}
          />
        </div>
        {errors.quantity && (
          <p className="text-sm text-red-600 mt-1">{errors.quantity}</p>
        )}
        <p className="text-xs text-gray-500 mt-1 flex items-center">
          <icons.BiInfoCircle className="w-3 h-3 mr-1" />
          Số lượng sản phẩm giống nhau mà bạn có thể cho thuê cùng lúc
        </p>
      </div>
    </motion.div>
  );
};

export default BasicInfoStep;
