import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import icons from "../../../../utils/icons";
import LocationSelector from "../LocationSelector";
import { useAuth } from "../../../../hooks/useAuth";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const LocationStep = ({ formData, errors, handleInputChange, onSaveDraft }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleUpdateAddress = () => {
    // Save draft before navigating
    if (onSaveDraft && onSaveDraft()) {
      navigate("/profile", { state: { fromProductCreate: true } });
    }
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

      {/* User Address Info Box */}
      {user?.address && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <icons.BiInfoCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-blue-900 mb-1">Địa Chỉ Hồ Sơ</h4>
                <p className="text-sm text-blue-800">
                  {user.address.streetAddress || "Chưa cập nhật số nhà"}{user.address.streetAddress && user.address.district ? ", " : ""}{user.address.district || ""}
                  {user.address.city && (user.address.streetAddress || user.address.district) ? `, ${user.address.city}` : user.address.city || ""}
                </p>
                {(!user.address.streetAddress || !user.address.district || !user.address.city) && (
                  <p className="text-xs text-blue-700 mt-1">
                    ⚠️ Địa chỉ chưa đầy đủ. Vui lòng cập nhật để sử dụng.
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleUpdateAddress}
              className="ml-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap"
            >
              <icons.FiEdit3 className="w-4 h-4 inline mr-1" />
              Cập Nhật
            </button>
          </div>
        </div>
      )}

      <LocationSelector
        location={formData.location}
        onChange={handleInputChange}
        errors={errors}
      />
    </motion.div>
  );
};

export default LocationStep;
