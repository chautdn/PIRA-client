import React from "react";
import { motion } from "framer-motion";
import { useI18n } from "../../../hooks/useI18n";
import icons from "../../../utils/icons";

const AICheckingLoader = ({ isVisible }) => {
  const { t } = useI18n();

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <div className="flex flex-col items-center space-y-6">
          {/* AI Icon Animation */}
          <motion.div
            className="relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
              <icons.BiBot className="w-10 h-10 text-white" />
            </div>
            <motion.div
              className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <icons.BiCheckCircle className="w-4 h-4 text-white" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {t("aiChecking.title")}
            </h3>
            <p className="text-gray-600">{t("aiChecking.subtitle")}</p>
          </div>

          {/* Loading Animation */}
          <div className="w-full">
            <div className="flex justify-center space-x-2 mb-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-primary-600 rounded-full"
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-700"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </div>

          {/* Checking Steps */}
          <div className="w-full space-y-3">
            {[1, 2, 3].map((step) => (
              <motion.div
                key={step}
                className="flex items-center gap-3 text-sm text-gray-700"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: step * 0.3 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: step * 0.3,
                  }}
                >
                  <icons.BiCheckCircle className="w-5 h-5 text-primary-600" />
                </motion.div>
                <span>{t(`aiChecking.step${step}`)}</span>
              </motion.div>
            ))}
          </div>

          {/* Info Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
            <div className="flex items-start gap-2">
              <icons.BiInfoCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">{t("aiChecking.notice")}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AICheckingLoader;
