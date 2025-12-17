import React from "react";
import { motion } from "framer-motion";
import icons from "../../../../utils/icons";
import { useI18n } from "../../../../hooks/useI18n";

const StepIndicator = ({ currentStep, totalSteps = 6, onStepClick }) => {
  const { t } = useI18n();
  
  const STEP_LABELS = [
    { number: 1, labelKey: "stepBasic", icon: icons.BiInfoCircle },
    { number: 2, labelKey: "stepCategory", icon: icons.BiCategory },
    { number: 3, labelKey: "stepImages", icon: icons.BiImage },
    { number: 4, labelKey: "stepPricing", icon: icons.BiMoney },
    { number: 5, labelKey: "stepLocation", icon: icons.BiMapPin },
    { number: 6, labelKey: "stepPromotion", icon: icons.BiCrown },
  ];
  
  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full"></div>
        <motion.div
          className="absolute top-5 left-0 h-1 bg-primary-600 rounded-full"
          initial={{ width: 0 }}
          animate={{
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        ></motion.div>

        {/* Step Circles */}
        <div className="relative flex justify-between">
          {STEP_LABELS.map(({ number, labelKey, icon: Icon }) => {
            const isCompleted = number < currentStep;
            const isCurrent = number === currentStep;
            const isClickable = number <= currentStep;

            return (
              <button
                key={number}
                type="button"
                onClick={() => isClickable && onStepClick?.(number)}
                disabled={!isClickable}
                className={`flex flex-col items-center transition-all ${
                  isClickable ? "cursor-pointer" : "cursor-not-allowed"
                }`}
              >
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-all ${
                    isCompleted
                      ? "bg-primary-600 text-white shadow-lg"
                      : isCurrent
                      ? "bg-primary-600 text-white shadow-xl ring-4 ring-primary-200"
                      : "bg-gray-200 text-gray-400"
                  }`}
                  whileHover={isClickable ? { scale: 1.1 } : {}}
                  whileTap={isClickable ? { scale: 0.95 } : {}}
                >
                  {isCompleted ? (
                    <icons.FiCheck className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </motion.div>
                <span
                  className={`text-xs font-semibold transition-all ${
                    isCurrent
                      ? "text-primary-600"
                      : isCompleted
                      ? "text-gray-700"
                      : "text-gray-400"
                  }`}
                >
                  {t(`productForm.${labelKey}`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Counter */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          {t('productForm.stepLabel')} {currentStep} {t('productForm.of')} {totalSteps}
        </p>
      </div>
    </div>
  );
};

export default StepIndicator;
