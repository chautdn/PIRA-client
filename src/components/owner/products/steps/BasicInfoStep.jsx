import React from "react";
import { motion } from "framer-motion";
import icons from "../../../../utils/icons";
import { useI18n } from "../../../../hooks/useI18n";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const BasicInfoStep = ({ formData, errors, handleInputChange }) => {
  const { t } = useI18n();
  return (
    <motion.div className="space-y-6" {...fadeInUp}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center mb-2">
          <icons.BiInfoCircle className="w-6 h-6 mr-3 text-primary-600" />
          {t('productForm.basicInfo')}
        </h2>
        <p className="text-gray-600">
          {t('productForm.basicInfoDesc')}
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {t('productForm.productName')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder={t('productForm.productNameExample')}
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
            {formData.title.length}/100 {t('productForm.characters')}
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {t('productForm.description')} <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder={t('productForm.descriptionPlaceholder')}
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
            {formData.description.length}/2000 {t('productForm.characters')}
          </p>
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {t('productForm.quantity')} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            min="1"
            placeholder={t('productForm.quantityPlaceholder')}
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
          {t('productForm.quantityInfo')}
        </p>
      </div>
    </motion.div>
  );
};

export default BasicInfoStep;
