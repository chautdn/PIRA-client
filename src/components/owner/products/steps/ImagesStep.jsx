import React from "react";
import { motion } from "framer-motion";
import icons from "../../../../utils/icons";
import ImageUploader from "../ImageUploader";
import { useI18n } from "../../../../hooks/useI18n";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const ImagesStep = ({ formData, errors, handleInputChange }) => {
  const { t } = useI18n();
  return (
    <motion.div className="space-y-6" {...fadeInUp}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center mb-2">
          <icons.BiImage className="w-6 h-6 mr-3 text-primary-600" />
          {t('productForm.images')}
        </h2>
        <p className="text-gray-600">
          {t('productForm.imagesDesc')}
        </p>
      </div>

      <ImageUploader
        images={formData.images}
        onChange={(images) =>
          handleInputChange({ target: { name: "images", value: images } })
        }
        error={errors.images}
      />
    </motion.div>
  );
};

export default ImagesStep;
