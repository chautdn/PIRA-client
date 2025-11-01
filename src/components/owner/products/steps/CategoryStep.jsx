import React from "react";
import { motion } from "framer-motion";
import icons from "../../../../utils/icons";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const CategoryStep = ({
  formData,
  errors,
  categories,
  categoryMap,
  handleInputChange,
}) => {
  return (
    <motion.div className="space-y-6" {...fadeInUp}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center mb-2">
          <icons.BiCategory className="w-6 h-6 mr-3 text-primary-600" />
          Phân Loại Sản Phẩm
        </h2>
        <p className="text-gray-600">
          Chọn danh mục phù hợp để khách hàng dễ dàng tìm thấy
        </p>
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Danh Mục Chính <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((category) => (
            <button
              key={category._id}
              type="button"
              onClick={() => {
                console.log("🔘 Selected category:", category);
                console.log(
                  "📋 Category has subCategories (camelCase):",
                  category.subCategories
                );
                console.log(
                  "📋 Category has subcategories (lowercase):",
                  category.subcategories
                );
                console.log("🗺️ CategoryMap entry:", categoryMap[category._id]);
                handleInputChange({
                  target: { name: "category", value: category._id },
                });
                // Reset subCategory when category changes
                handleInputChange({
                  target: { name: "subCategory", value: "" },
                });
              }}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.category === category._id
                  ? "border-primary-500 bg-primary-50 shadow-md"
                  : "border-gray-200 hover:border-primary-300 hover:shadow-sm"
              }`}
            >
              <div className="text-3xl mb-2">{category.icon}</div>
              <div className="text-sm font-semibold text-gray-900">
                {category.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {
                  (category.subCategories || category.subcategories || [])
                    .length
                }{" "}
                loại
              </div>
            </button>
          ))}
        </div>
        {errors.category && (
          <p className="text-sm text-red-600 mt-2">{errors.category}</p>
        )}
      </div>

      {/* SubCategory Selection */}
      {formData.category &&
        (categoryMap[formData.category]?.subCategories ||
          categoryMap[formData.category]?.subcategories) && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Danh Mục Con <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(
                categoryMap[formData.category].subCategories ||
                categoryMap[formData.category].subcategories ||
                []
              ).map((subCat) => (
                <button
                  key={subCat._id}
                  type="button"
                  onClick={() =>
                    handleInputChange({
                      target: { name: "subCategory", value: subCat._id },
                    })
                  }
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.subCategory === subCat._id
                      ? "border-primary-500 bg-primary-50 shadow-md"
                      : "border-gray-200 hover:border-primary-300 hover:shadow-sm"
                  }`}
                >
                  <div className="text-2xl mb-2">{subCat.icon}</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {subCat.name}
                  </div>
                </button>
              ))}
            </div>
            {errors.subCategory && (
              <p className="text-sm text-red-600 mt-2">{errors.subCategory}</p>
            )}
          </div>
        )}
    </motion.div>
  );
};

export default CategoryStep;
