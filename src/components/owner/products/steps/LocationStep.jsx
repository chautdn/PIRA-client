import React from "react";
import { motion } from "framer-motion";
import icons from "../../../../utils/icons";
import LocationSelector from "../LocationSelector";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const LocationStep = ({ formData, errors, handleInputChange }) => {
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

      <LocationSelector
        location={formData.location}
        onChange={handleInputChange}
        errors={errors}
      />
    </motion.div>
  );
};

export default LocationStep;
