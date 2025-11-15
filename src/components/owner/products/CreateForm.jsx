import React from "react";
import { motion } from "framer-motion";
import { useProductForm } from "../../../hooks/useProductForm";
import StepIndicator from "./steps/StepIndicator";
import BasicInfoStep from "./steps/BasicInfoStep";
import CategoryStep from "./steps/CategoryStep";
import ImagesStep from "./steps/ImagesStep";
import PricingStep from "./steps/PricingStep";
import LocationStep from "./steps/LocationStep";
import DeliveryStep from "./steps/DeliveryStep";
import PromotionStep from "./steps/PromotionStep";
import FormNavigation from "./steps/FormNavigation";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const CreateForm = () => {
  const {
    formData,
    currentStep,
    errors,
    isSubmitting,
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
          <PricingStep
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
          />
        );

      case 5:
        return (
          <LocationStep
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            onSaveDraft={saveDraft}
          />
        );

      case 6:
        return (
          <DeliveryStep
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
          />
        );

      case 7:
        return (
          <PromotionStep
            formData={formData}
            walletBalance={walletBalance}
            walletLoading={walletLoading}
            handleInputChange={handleInputChange}
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
            Đăng Sản Phẩm Cho Thuê
          </h1>
          <p className="text-gray-600">
            Điền thông tin chi tiết để tạo tin đăng hấp dẫn
          </p>
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
    </motion.div>
  );
};

export default CreateForm;
