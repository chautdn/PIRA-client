import React from "react";
import { motion } from "framer-motion";
import { useProductForm } from "../../../hooks/useProductForm";
import { useI18n } from "../../../hooks/useI18n";
import StepIndicator from "./steps/StepIndicator";
import BasicInfoStep from "./steps/BasicInfoStep";
import CategoryStep from "./steps/CategoryStep";
import ImagesStep from "./steps/ImagesStep";
import VideoUploadStep from "./steps/VideoUploadStep";
import PricingStep from "./steps/PricingStep";
import LocationStep from "./steps/LocationStep";
import PromotionStep from "./steps/PromotionStep";
import FormNavigation from "./steps/FormNavigation";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const CreateForm = () => {
  const { t } = useI18n();
  const {
    formData,
    currentStep,
    errors,
    isSubmitting,
    isValidatingMedia,
    categories,
    categoryMap,
    walletBalance,
    walletLoading,
    handleInputChange,
    handleNext,
    handlePrevious,
    handleStepClick,
    handleSubmit,
    saveDraft,
    TOTAL_STEPS,
  } = useProductForm();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
          />
        );

      case 2:
        return (
          <CategoryStep
            formData={formData}
            errors={errors}
            categories={categories}
            categoryMap={categoryMap}
            handleInputChange={handleInputChange}
          />
        );

      case 3:
        return (
          <ImagesStep
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
          />
        );

      case 4:
        return (
          <VideoUploadStep
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
          />
        );

      case 5:
        return (
          <PricingStep
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
          />
        );

      case 6:
        return (
          <LocationStep
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            onSaveDraft={saveDraft}
          />
        );

      case 7:
        return (
          <PromotionStep
            formData={formData}
            walletBalance={walletBalance}
            walletLoading={walletLoading}
            handleInputChange={handleInputChange}
            errors={errors}
          />
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <motion.div className="text-center mb-8" {...fadeInUp}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("productForm.pageTitle")}
          </h1>
          <p className="text-gray-600">{t("productForm.pageSubtitle")}</p>
        </motion.div>

        {/* Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onStepClick={handleStepClick}
        />

        {/* Form Content */}
        <div className="mb-8">{renderStep()}</div>

        {/* Navigation */}
        <FormNavigation
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          isSubmitting={isSubmitting}
          walletBalance={walletBalance}
          formData={formData}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSubmit={handleSubmit}
        />
      </div>

      {/* AI Validation Loading Overlay */}
      {isValidatingMedia && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl"
          >
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0"></div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              🤖 AI đang kiểm tra nội dung
            </h3>
            <p className="text-gray-600 mb-4">
              Đang phân tích hình ảnh và video của bạn...
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-bounce"></span>
              <span
                className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></span>
              <span
                className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></span>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default CreateForm;
