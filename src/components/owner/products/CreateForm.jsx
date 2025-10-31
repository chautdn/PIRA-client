import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ownerProductApi } from "../../../services/ownerProduct.Api";
import { categoryApi } from "../../../services/category.Api";
import ImageUploader from "./ImageUploader";
import LocationSelector from "./LocationSelector";
import PricingForm from "./PricingForm";
import { toast } from "react-hot-toast";
import icons from "../../../utils/icons";
import promotionService from "../../../services/promotion";
import { useWallet } from "../../../context/WalletContext";

const CreateForm = () => {
  const navigate = useNavigate();
  const { balance: walletBalance, loading: walletLoading } = useWallet();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);

  // Debug wallet balance
  useEffect(() => {
    console.log("CreateForm - Wallet Balance:", walletBalance);
    console.log("CreateForm - Wallet Loading:", walletLoading);
  }, [walletBalance, walletLoading]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    condition: "LIKE_NEW",
    category: "",
    subCategory: "",
    pricing: {
      dailyRate: "",
      deposit: {
        amount: "",
        type: "FIXED",
      },
    },
    location: {
      address: {
        streetAddress: "",
      },
      city: "Đà Nẵng",
      district: "",
      ward: "",
    },
    promotion: {
      enabled: false,
      tier: null,
      duration: 1,
      paymentMethod: "wallet",
    },
  });

  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [promotionCost, setPromotionCost] = useState(null);
  const [calculatingCost, setCalculatingCost] = useState(false);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (formData.category) {
      loadSubCategories(formData.category);
    } else {
      setSubCategories([]);
      setFormData((prev) => ({ ...prev, subCategory: "" }));
    }
  }, [formData.category]);

  // Calculate promotion cost when tier or duration changes
  useEffect(() => {
    if (formData.promotion.enabled && formData.promotion.tier) {
      const calculateCost = async () => {
        try {
          setCalculatingCost(true);
          const pricing = await promotionService.calculatePricing(
            formData.promotion.tier,
            formData.promotion.duration
          );
          setPromotionCost(pricing);
        } catch (error) {
          console.error("Failed to calculate promotion cost:", error);
          setPromotionCost(null);
          toast.error("Không thể tính chi phí quảng cáo. Vui lòng thử lại.");
        } finally {
          setCalculatingCost(false);
        }
      };
      calculateCost();
    } else {
      setPromotionCost(null);
      setCalculatingCost(false);
    }
  }, [
    formData.promotion.tier,
    formData.promotion.duration,
    formData.promotion.enabled,
  ]);

  const loadCategories = async () => {
    try {
      const response = await categoryApi.getCategories();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Không thể tải danh mục. Vui lòng tải lại trang.");
    }
  };

  const loadSubCategories = async (categoryId) => {
    try {
      const category = await categoryApi.getCategoryById(categoryId);
      if (category.success) {
        setSubCategories(category.data.subcategories || []);
      }
    } catch (error) {
      console.error("Failed to load subcategories:", error);
      setSubCategories([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      // Handle nested object updates (pricing, location)
      const keys = name.split(".");
      setFormData((prev) => {
        const updated = { ...prev };
        let current = updated;

        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;

        return updated;
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.title.trim()) {
      newErrors.title = "Tên sản phẩm là bắt buộc";
    } else if (formData.title.length < 5) {
      newErrors.title = "Tên sản phẩm phải có ít nhất 5 ký tự";
    } else if (formData.title.length > 100) {
      newErrors.title = "Tên sản phẩm phải ít hơn 100 ký tự";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Mô tả sản phẩm là bắt buộc";
    } else if (formData.description.length < 20) {
      newErrors.description = "Mô tả phải có ít nhất 20 ký tự";
    } else if (formData.description.length > 1000) {
      newErrors.description = "Mô tả phải ít hơn 1000 ký tự";
    }

    if (!formData.category) {
      newErrors.category = "Danh mục là bắt buộc";
    }

    if (
      !formData.pricing.dailyRate ||
      parseFloat(formData.pricing.dailyRate) <= 0
    ) {
      newErrors.dailyRate = "Giá thuê hàng ngày phải lớn hơn 0";
    } else if (parseFloat(formData.pricing.dailyRate) > 10000000) {
      newErrors.dailyRate = "Giá thuê hàng ngày có vẻ quá cao";
    }

    if (
      !formData.pricing.deposit.amount ||
      parseFloat(formData.pricing.deposit.amount) <= 0
    ) {
      newErrors.depositAmount = "Số tiền đặt cọc phải lớn hơn 0";
    } else if (parseFloat(formData.pricing.deposit.amount) > 100000000) {
      newErrors.depositAmount = "Số tiền đặt cọc có vẻ quá cao";
    }

    if (!formData.location.address.streetAddress.trim()) {
      newErrors.streetAddress = "Địa chỉ đường phố là bắt buộc";
    }

    if (!formData.location.district.trim()) {
      newErrors.district = "Quận/huyện là bắt buộc";
    }

    if (!formData.location.ward.trim()) {
      newErrors.ward = "Phường/xã là bắt buộc";
    }

    if (images.length === 0) {
      newErrors.images = "Cần ít nhất một hình ảnh";
    } else if (images.length > 10) {
      newErrors.images = "Tối đa 10 hình ảnh được phép";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("FormData before submit:", formData);
    if (!validateForm()) {
      // Show detailed error messages for each field
      const errorFields = Object.keys(errors);
      const errorCount = errorFields.length;

      // Main error toast
      toast.error(`❌ ${errorCount} lỗi cần sửa`, {
        duration: 4000,
      });

      // Show specific field errors with delay for readability
      setTimeout(() => {
        errorFields.forEach((field, index) => {
          const fieldLabels = {
            title: "📝 Tên sản phẩm",
            description: "📄 Mô tả",
            category: "📂 Danh mục",
            dailyRate: "💰 Giá thuê hàng ngày",
            depositAmount: "🔒 Tiền đặt cọc",
            streetAddress: "🏠 Địa chỉ đường phố",
            district: "🌍 Quận/Huyện",
            ward: "📍 Phường/Xã",
            images: "📷 Hình ảnh",
          };

          const label = fieldLabels[field] || field;

          setTimeout(() => {
            toast.error(`${label}: ${errors[field]}`, {
              duration: 5000,
              id: `error-${field}`, // Prevent duplicate toasts
            });
          }, (index + 1) * 300); // Stagger the error messages
        });
      }, 500);

      // Scroll to first error
      const firstErrorElement = document.querySelector(
        ".border-red-500, .border-red-400"
      );
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }

    // Pre-check wallet balance for promotion (if wallet payment selected)
    if (
      formData.promotion.enabled &&
      formData.promotion.tier &&
      formData.promotion.paymentMethod === "wallet" &&
      promotionCost
    ) {
      if (walletBalance < promotionCost.totalCost) {
        toast.error(
          "❌ Số dư ví không đủ để thanh toán quảng cáo. Vui lòng nạp thêm hoặc chọn PayOS.",
          { duration: 5000 }
        );
        return;
      }
    }

    setLoading(true);

    // Show loading toast outside try block so we can dismiss it in catch
    let loadingToast;

    try {
      loadingToast = toast.loading("Đang tạo sản phẩm và xác thực hình ảnh...");

      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("condition", formData.condition);
      formDataToSend.append("category", formData.category);

      if (formData.subCategory) {
        formDataToSend.append("subCategory", formData.subCategory);
      }

      // Fix: Gửi pricing fields trực tiếp thay vì JSON string
      formDataToSend.append("pricing.dailyRate", formData.pricing.dailyRate);
      formDataToSend.append(
        "pricing.deposit.amount",
        formData.pricing.deposit.amount
      );
      formDataToSend.append(
        "pricing.deposit.type",
        formData.pricing.deposit.type
      );

      formDataToSend.append("location", JSON.stringify(formData.location));

      // Add images
      images.forEach((image) => {
        formDataToSend.append("images", image.file);
      });

      // Create product
      const response = await ownerProductApi.createOwnerProduct(formDataToSend);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (response.success) {
        const createdProduct = response.data;
        toast.success("🎉 Tạo sản phẩm thành công!");

        // Show AI validation results if available
        if (response.imageValidation) {
          const { summary } = response.imageValidation;

          if (summary.allImagesRelevant && summary.allImagesSafe) {
            toast.success("✅ Tất cả hình ảnh đã qua xác thực AI!");
          } else {
            toast("ℹ️ Hình ảnh được xác thực với độ tin cậy khác nhau", {
              icon: "ℹ️",
              style: {
                background: "#3B82F6",
                color: "#fff",
              },
            });
          }
        }

        // Create promotion if enabled
        if (formData.promotion.enabled && formData.promotion.tier) {
          try {
            toast.loading("Đang tạo quảng cáo...", { id: "promotion-loading" });

            const promotionData = {
              productId: createdProduct._id,
              tier: formData.promotion.tier,
              duration: formData.promotion.duration,
              paymentMethod: formData.promotion.paymentMethod,
            };

            const promotionResponse = await promotionService.createPromotion(
              promotionData
            );
            toast.dismiss("promotion-loading");

            if (formData.promotion.paymentMethod === "wallet") {
              toast.success("✨ Quảng cáo đã được kích hoạt!");
              // Navigate after short delay for wallet payment
              setTimeout(() => {
                navigate(`/products`, {
                  state: { newProduct: true },
                });
              }, 2000);
            } else {
              // PayOS: Redirect to payment page
              if (promotionResponse.paymentUrl) {
                toast.success("🔄 Chuyển đến trang thanh toán...", {
                  duration: 2000,
                });
                toast(
                  "⚠️ Sản phẩm sẽ được xuất bản sau khi thanh toán thành công",
                  {
                    duration: 4000,
                    icon: "⚠️",
                    style: {
                      background: "#3B82F6",
                      color: "#fff",
                    },
                  }
                );
                setTimeout(() => {
                  window.location.href = promotionResponse.paymentUrl;
                }, 2000);
                return; // Don't navigate away, let PayOS redirect handle it
              }
            }
          } catch (error) {
            toast.dismiss("promotion-loading");
            console.error("Promotion creation error:", error);
            toast.error(
              `⚠️ Sản phẩm đã tạo nhưng quảng cáo thất bại: ${error.message}`,
              { duration: 5000 }
            );
            // Still navigate to products for error case
            setTimeout(() => {
              navigate(`/products`, {
                state: { newProduct: true },
              });
            }, 2000);
          }
        } else {
          // No promotion: Navigate immediately
          setTimeout(() => {
            navigate(`/products`, {
              state: { newProduct: true },
            });
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Create product error:", error);

      // Dismiss loading toast if it exists
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      // Handle KYC/Bank Account requirement errors FIRST
      if (error.kycRequired) {
        const requirements = error.missingRequirements || {};

        if (!requirements.cccdVerified) {
          toast.error("❌ Cần xác thực CCCD trước khi đăng sản phẩm!", {
            duration: 5000,
          });
          setTimeout(() => {
            toast(
              (t) => (
                <div className="flex flex-col gap-3">
                  <p className="font-semibold text-gray-800">
                    🔐 Xác thực danh tính
                  </p>
                  <p className="text-sm text-gray-600">
                    Vui lòng hoàn thành xác thực CCCD để đăng sản phẩm.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        toast.dismiss(t.id);
                        navigate("/profile");
                      }}
                      className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Đi tới xác thực
                    </button>
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              ),
              { duration: Infinity }
            );
          }, 1000);
          return;
        }

        if (!requirements.bankAccountAdded) {
          toast.error(
            "❌ Cần thêm tài khoản ngân hàng trước khi đăng sản phẩm!",
            {
              duration: 5000,
            }
          );
          setTimeout(() => {
            toast(
              (t) => (
                <div className="flex flex-col gap-3">
                  <p className="font-semibold text-gray-800">
                    🏦 Tài khoản ngân hàng
                  </p>
                  <p className="text-sm text-gray-600">
                    Vui lòng thêm tài khoản ngân hàng để nhận thanh toán.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        toast.dismiss(t.id);
                        navigate("/wallet");
                      }}
                      className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Đi tới ví
                    </button>
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              ),
              { duration: Infinity }
            );
          }, 1000);
          return;
        }
      }

      // Handle specific error types with detailed breakdown
      if (error.errorType === "NSFW_VIOLATION") {
        toast.error(
          "🔞 Hình ảnh bị từ chối: Phát hiện nội dung không phù hợp",
          {
            duration: 6000,
          }
        );

        // Show which specific images failed NSFW check
        if (error.errorBreakdown?.details) {
          const nsfwImages = error.errorBreakdown.details
            .filter((e) => e.type === "NSFW_VIOLATION")
            .map((e) => e.fileName);

          if (nsfwImages.length > 0) {
            setTimeout(() => {
              toast.error(
                `Nội dung không phù hợp được tìm thấy trong:\n• ${nsfwImages.join(
                  "\n• "
                )}`,
                {
                  duration: 8000,
                }
              );
            }, 1000);
          }
        }

        setTimeout(() => {
          toast("💡 Mẹo: Vui lòng chỉ tải lên hình ảnh phù hợp với gia đình", {
            duration: 5000,
            icon: "💡",
            style: {
              background: "#3B82F6",
              color: "#fff",
            },
          });
        }, 2000);
      } else if (error.errorType === "CATEGORY_MISMATCH") {
        toast.error("📂 Hình ảnh không khớp với danh mục", {
          duration: 6000,
        });

        // Show which specific images failed category check
        if (error.errorBreakdown?.details) {
          const mismatchImages = error.errorBreakdown.details
            .filter((e) => e.type === "CATEGORY_MISMATCH")
            .map((e) => e.fileName);

          if (mismatchImages.length > 0) {
            setTimeout(() => {
              toast.warning(
                `Không khớp danh mục được tìm thấy trong:\n• ${mismatchImages.join(
                  "\n• "
                )}`,
                {
                  duration: 8000,
                }
              );
            }, 1000);
          }
        }

        setTimeout(() => {
          toast(
            "💡 Mẹo: Tải lên hình ảnh liên quan đến danh mục đã chọn hoặc chọn danh mục khác",
            {
              duration: 6000,
              icon: "💡",
              style: {
                background: "#3B82F6",
                color: "#fff",
              },
            }
          );
        }, 2000);
      } else if (error.errorType === "MIXED_VALIDATION_ERROR") {
        const breakdown = error.errorBreakdown;
        toast.error(
          `⚠️ Phát hiện nhiều vấn đề: ${breakdown.total} hình ảnh không đạt xác thực`,
          {
            duration: 6000,
          }
        );

        // Show breakdown of issues
        if (breakdown.nsfw > 0) {
          setTimeout(() => {
            const nsfwImages = breakdown.details
              .filter((e) => e.type === "NSFW_VIOLATION")
              .map((e) => e.fileName);
            toast.error(
              `🔞 Nội dung không phù hợp (${
                breakdown.nsfw
              }):\n• ${nsfwImages.join("\n• ")}`,
              {
                duration: 8000,
              }
            );
          }, 1000);
        }

        if (breakdown.category > 0) {
          setTimeout(() => {
            const categoryImages = breakdown.details
              .filter((e) => e.type === "CATEGORY_MISMATCH")
              .map((e) => e.fileName);
            toast.warning(
              `📂 Không khớp danh mục (${
                breakdown.category
              }):\n• ${categoryImages.join("\n• ")}`,
              {
                duration: 8000,
              }
            );
          }, 2000);
        }

        setTimeout(() => {
          toast("💡 Vui lòng sửa tất cả vấn đề trước khi tải lên", {
            duration: 5000,
            icon: "💡",
            style: {
              background: "#3B82F6",
              color: "#fff",
            },
          });
        }, 3000);
      } else if (error.errorType === "IMAGE_VALIDATION_ERROR") {
        toast.error(
          "🤖 Xác thực hình ảnh thất bại: " +
            (error.details?.reason || "Vui lòng kiểm tra hình ảnh và thử lại.")
        );

        // Show detailed breakdown if available
        if (error.errorBreakdown?.details) {
          const failedImages = error.errorBreakdown.details.map(
            (e) => e.fileName
          );
          setTimeout(() => {
            toast(`Hình ảnh thất bại:\n• ${failedImages.join("\n• ")}`, {
              duration: 6000,
              icon: "ℹ️",
              style: {
                background: "#3B82F6",
                color: "#fff",
              },
            });
          }, 1000);
        }
      } else if (error.errors) {
        // Handle validation errors from backend
        const backendErrors = {};
        error.errors.forEach((err) => {
          backendErrors[err.path || err.param] = err.msg || err.message;
        });
        setErrors(backendErrors);
        toast.error("Vui lòng sửa các lỗi xác thực");
      } else {
        toast.error(
          error.message || "Không thể tạo sản phẩm. Vui lòng thử lại."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const conditionOptions = [
    {
      value: "NEW",
      label: "Hoàn toàn mới",
      icon: icons.FiStar,
      color: "text-yellow-500",
    },
    {
      value: "LIKE_NEW",
      label: "Như mới",
      icon: icons.HiCheckCircle,
      color: "text-green-500",
    },
    {
      value: "GOOD",
      label: "Tình trạng tốt",
      icon: icons.FiCheck,
      color: "text-blue-500",
    },
    {
      value: "FAIR",
      label: "Tình trạng khá",
      icon: icons.BiInfoCircle,
      color: "text-orange-500",
    },
    {
      value: "POOR",
      label: "Tình trạng kém",
      icon: icons.HiExclamationCircle,
      color: "text-red-500",
    },
  ];

  const steps = [
    {
      id: 1,
      title: "Thông tin cơ bản",
      icon: icons.BiText,
      description: "Tên, mô tả và danh mục",
    },
    {
      id: 2,
      title: "Danh mục sản phẩm",
      icon: icons.BiCategory,
      description: "Phân loại sản phẩm",
    },
    {
      id: 3,
      title: "Hình ảnh",
      icon: icons.BiCamera,
      description: "Tải lên ảnh chất lượng cao",
    },
    {
      id: 4,
      title: "Giá cả",
      icon: icons.BiMoney,
      description: "Thiết lập giá thuê",
    },
    {
      id: 5,
      title: "Địa điểm",
      icon: icons.FiMapPin,
      description: "Vị trí giao nhận",
    },
    {
      id: 6,
      title: "Quảng cáo",
      icon: icons.HiSparkles,
      description: "Tăng độ hiển thị (không bắt buộc)",
    },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        className="bg-white rounded-2xl shadow-xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Progress Steps */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <motion.div
                  className="flex flex-col items-center text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                      currentStep >= step.id
                        ? "bg-white text-primary-600 shadow-lg"
                        : "bg-primary-500 text-white"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <icons.FiCheck className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <div
                    className={`mt-3 transition-colors ${
                      currentStep >= step.id ? "text-white" : "text-primary-200"
                    }`}
                  >
                    <div className="font-semibold text-sm">{step.title}</div>
                    <div className="text-xs opacity-75 hidden sm:block">
                      {step.description}
                    </div>
                  </div>
                </motion.div>

                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-4 transition-colors ${
                      currentStep > step.id ? "bg-white" : "bg-primary-400"
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <motion.div className="space-y-8" {...fadeInUp}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center mb-2">
                  <icons.BiText className="w-6 h-6 mr-3 text-primary-600" />
                  Thông Tin Cơ Bản
                </h2>
                <p className="text-gray-600">
                  Điền thông tin chi tiết về sản phẩm của bạn
                </p>
              </div>

              {/* Product Title */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">
                  <icons.FiEdit3 className="inline w-4 h-4 mr-2 text-primary-600" />
                  Tên Sản Phẩm *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  maxLength="100"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 ${
                    errors.title
                      ? "border-red-500 bg-red-50 focus:ring-red-200 focus:border-red-500 animate-shake"
                      : "border-gray-300 hover:border-primary-400 focus:border-primary-500 focus:ring-primary-200"
                  }`}
                  placeholder="Ví dụ: iPhone 14 Pro Max 256GB"
                />
                <div className="flex justify-between items-center">
                  {errors.title && (
                    <p className="text-red-600 text-sm flex items-center font-medium bg-red-50 px-3 py-1.5 rounded-lg">
                      <icons.BiInfoCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                      {errors.title}
                    </p>
                  )}
                  <p
                    className={`text-sm ml-auto ${
                      errors.title ? "text-red-400" : "text-gray-400"
                    }`}
                  >
                    {formData.title.length}/100
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">
                  <icons.BiText className="inline w-4 h-4 mr-2 text-primary-600" />
                  Mô Tả Chi Tiết *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  maxLength="1000"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 resize-none ${
                    errors.description
                      ? "border-red-500 bg-red-50 focus:ring-red-200 focus:border-red-500 animate-shake"
                      : "border-gray-300 hover:border-primary-400 focus:border-primary-500 focus:ring-primary-200"
                  }`}
                  placeholder="Mô tả chi tiết về sản phẩm, tình trạng, phụ kiện đi kèm..."
                />
                <div className="flex justify-between items-center">
                  {errors.description && (
                    <p className="text-red-600 text-sm flex items-center font-medium bg-red-50 px-3 py-1.5 rounded-lg">
                      <icons.BiInfoCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                      {errors.description}
                    </p>
                  )}
                  <p
                    className={`text-sm ml-auto ${
                      errors.description ? "text-red-400" : "text-gray-400"
                    }`}
                  >
                    {formData.description.length}/1000
                  </p>
                </div>
              </div>

              {/* Condition */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-800">
                  <icons.FiStar className="inline w-4 h-4 mr-2 text-primary-600" />
                  Tình Trạng Sản Phẩm *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {conditionOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                        formData.condition === option.value
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-200 hover:border-primary-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="condition"
                        value={option.value}
                        checked={formData.condition === option.value}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <option.icon className={`w-6 h-6 mb-2 ${option.color}`} />
                      <span className="text-sm font-medium text-center">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Category Selection */}
          {currentStep === 2 && (
            <motion.div className="space-y-8" {...fadeInUp}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center mb-2">
                  <icons.BiCategory className="w-6 h-6 mr-3 text-primary-600" />
                  Danh Mục Sản Phẩm
                </h2>
                <p className="text-gray-600">
                  Chọn danh mục phù hợp để người thuê dễ tìm thấy
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-800">
                    <icons.BiCategory className="inline w-4 h-4 mr-2 text-primary-600" />
                    Danh Mục *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 appearance-none ${
                      errors.category
                        ? "border-red-500 bg-red-50 focus:ring-red-200 focus:border-red-500 animate-shake"
                        : "border-gray-300 hover:border-primary-400 focus:border-primary-500 focus:ring-primary-200"
                    }`}
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-600 text-sm flex items-center font-medium bg-red-50 px-3 py-1.5 rounded-lg">
                      <icons.BiInfoCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                      {errors.category}
                    </p>
                  )}
                </div>

                {/* Subcategory */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-800">
                    <icons.BiCategory className="inline w-4 h-4 mr-2 text-primary-600" />
                    Danh Mục Con
                  </label>
                  <select
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleInputChange}
                    disabled={!formData.category || subCategories.length === 0}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-200 transition-all duration-200 appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed ${"border-gray-300 hover:border-primary-400 focus:border-primary-500"}`}
                  >
                    <option value="">
                      {!formData.category
                        ? "Chọn danh mục trước"
                        : "Chọn danh mục con (không bắt buộc)"}
                    </option>
                    {subCategories.map((subCategory) => (
                      <option key={subCategory._id} value={subCategory._id}>
                        {subCategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.category && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <div className="flex items-center mb-2">
                    <icons.HiLightBulb className="w-5 h-5 text-blue-600 mr-2" />
                    <h4 className="font-semibold text-blue-800">
                      Mẹo chọn danh mục
                    </h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    Chọn danh mục cụ thể nhất cho sản phẩm của bạn. Điều này
                    giúp hệ thống AI xác thực tốt hơn và người thuê dễ tìm thấy
                    sản phẩm.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Images */}
          {currentStep === 3 && (
            <motion.div className="space-y-8" {...fadeInUp}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center mb-2">
                  <icons.BiCamera className="w-6 h-6 mr-3 text-primary-600" />
                  Hình Ảnh Sản Phẩm
                </h2>
                <p className="text-gray-600">
                  Tải lên những hình ảnh chất lượng cao nhất
                </p>
              </div>

              <ImageUploader
                images={images}
                setImages={setImages}
                error={errors.images}
              />
            </motion.div>
          )}

          {/* Step 4: Pricing */}
          {currentStep === 4 && (
            <motion.div className="space-y-8" {...fadeInUp}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center mb-2">
                  <icons.BiMoney className="w-6 h-6 mr-3 text-primary-600" />
                  Thông Tin Giá Cả
                </h2>
                <p className="text-gray-600">
                  Thiết lập giá thuê cạnh tranh và hấp dẫn
                </p>
              </div>

              <PricingForm
                pricing={formData.pricing}
                onChange={handleInputChange}
                errors={errors}
              />
            </motion.div>
          )}

          {/* Step 5: Location */}
          {currentStep === 5 && (
            <motion.div className="space-y-8" {...fadeInUp}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center mb-2">
                  <icons.FiMapPin className="w-6 h-6 mr-3 text-primary-600" />
                  Địa Điểm Giao Nhận
                </h2>
                <p className="text-gray-600">
                  Chọn vị trí thuận tiện cho việc giao nhận
                </p>
              </div>

              <LocationSelector
                location={formData.location}
                onChange={handleInputChange}
                errors={errors}
              />
            </motion.div>
          )}

          {/* Step 6: Promotion */}
          {currentStep === 6 && (
            <motion.div className="space-y-8" {...fadeInUp}>
              <div className="text-center mb-8">
                <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full font-bold text-sm mb-4 shadow-lg">
                  🚀 TĂNG TỐC BÁN HÀNG
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Quảng Cáo Sản Phẩm
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Xuất hiện đầu trang, tăng 300% lượt xem và gấp 5 lần cơ hội
                  được thuê
                </p>
              </div>

              {/* Benefits Highlight */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border-2 border-blue-200">
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="font-bold text-gray-900 mb-1">
                    Hiển thị đầu tiên
                  </div>
                  <div className="text-sm text-gray-600">
                    Xuất hiện trên cùng kết quả tìm kiếm
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border-2 border-purple-200">
                  <div className="text-3xl mb-2">👑</div>
                  <div className="font-bold text-gray-900 mb-1">
                    Huy hiệu đặc biệt
                  </div>
                  <div className="text-sm text-gray-600">
                    Badge nổi bật thu hút khách hàng
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border-2 border-green-200">
                  <div className="text-3xl mb-2">📈</div>
                  <div className="font-bold text-gray-900 mb-1">
                    Tăng lượt xem
                  </div>
                  <div className="text-sm text-gray-600">
                    Nhiều người xem hơn 300%
                  </div>
                </div>
              </div>

              {/* "No Thanks" Option - Shown First */}
              <div className="space-y-4">
                <motion.button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      promotion: {
                        ...prev.promotion,
                        enabled: false,
                        tier: null,
                      },
                    }));
                  }}
                  className={`w-full p-5 rounded-2xl border-2 transition-all text-center ${
                    !formData.promotion.enabled
                      ? "border-gray-400 bg-gray-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center gap-3">
                    {formData.promotion.enabled ? (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                    ) : (
                      <div className="w-5 h-5 bg-primary-600 rounded flex items-center justify-center">
                        <icons.FiCheck className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="font-semibold text-gray-700">
                      Không, tôi sẽ đăng bình thường (Miễn phí)
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Sản phẩm sẽ xuất hiện theo thứ tự mặc định
                  </p>
                </motion.button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-dashed border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm font-bold text-gray-500 uppercase">
                    Hoặc chọn gói quảng cáo
                  </span>
                </div>
              </div>

              {/* Tier Selection - Always Visible */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center justify-center mb-6">
                  <icons.BiCrown className="w-6 h-6 mr-2 text-yellow-500" />
                  Chọn Gói Quảng Cáo Phù Hợp
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {Object.entries(promotionService.TIER_CONFIG).map(
                    ([tier, config]) => (
                      <motion.button
                        key={tier}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            promotion: {
                              ...prev.promotion,
                              enabled: true,
                              tier: parseInt(tier),
                            },
                          }));
                        }}
                        className={`relative p-6 rounded-2xl border-2 transition-all ${
                          formData.promotion.enabled &&
                          formData.promotion.tier === parseInt(tier)
                            ? `${config.borderColor} bg-gradient-to-br ${config.color} text-white shadow-lg transform scale-105`
                            : "border-gray-200 hover:border-primary-300 bg-white hover:shadow-md"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {tier === "1" && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                              PHỔ BIẾN NHẤT
                            </span>
                          </div>
                        )}
                        <div className="text-center">
                          <div className="text-4xl mb-3">{config.icon}</div>
                          <h4
                            className={`font-bold text-lg mb-1 ${
                              formData.promotion.enabled &&
                              formData.promotion.tier === parseInt(tier)
                                ? "text-white"
                                : "text-gray-900"
                            }`}
                          >
                            {config.name}
                          </h4>
                          <div
                            className={`text-xl font-bold mb-2 ${
                              formData.promotion.enabled &&
                              formData.promotion.tier === parseInt(tier)
                                ? "text-white"
                                : "text-primary-600"
                            }`}
                          >
                            {promotionService.formatCurrency(
                              promotionService.TIER_PRICES[tier]
                            )}
                            <span className="text-sm font-normal">/ngày</span>
                          </div>
                          <div
                            className={`text-xs space-y-1 text-left ${
                              formData.promotion.enabled &&
                              formData.promotion.tier === parseInt(tier)
                                ? "text-white/90"
                                : "text-gray-600"
                            }`}
                          >
                            {config.features.map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <icons.FiCheck className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span className="text-left">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {formData.promotion.enabled &&
                          formData.promotion.tier === parseInt(tier) && (
                            <motion.div
                              className="absolute top-2 right-2 bg-white text-primary-600 rounded-full p-1.5 shadow-lg"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <icons.FiCheck className="w-5 h-5" />
                            </motion.div>
                          )}
                      </motion.button>
                    )
                  )}
                </div>
              </div>

              {/* Show Duration and Payment only when a tier is selected */}
              {formData.promotion.enabled && formData.promotion.tier && (
                <>
                  {/* Duration Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <icons.BiCalendar className="w-5 h-5 mr-2 text-primary-600" />
                      Thời Gian Quảng Cáo
                    </h3>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="30"
                        value={formData.promotion.duration}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            promotion: {
                              ...prev.promotion,
                              duration: parseInt(e.target.value),
                            },
                          }));
                        }}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                      />
                      <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-xl border border-primary-200 min-w-[120px]">
                        <icons.BiCalendar className="w-5 h-5 text-primary-600" />
                        <span className="font-bold text-primary-700">
                          {formData.promotion.duration} ngày
                        </span>
                      </div>
                    </div>
                    {formData.promotion.duration >= 3 && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                        <icons.BiCheckCircle className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-green-800">
                            🎉 Giảm giá 10% cho quảng cáo từ 3 ngày trở lên!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Price Preview - Always visible when tier is selected */}
                  {formData.promotion.tier && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <icons.BiCalculator className="w-5 h-5 mr-2 text-yellow-600" />
                        Chi Phí Ước Tính
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Gói đã chọn:</span>
                          <span className="font-bold text-gray-900">
                            {
                              promotionService.TIER_CONFIG[
                                formData.promotion.tier
                              ]?.name
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Giá mỗi ngày:</span>
                          <span className="font-semibold text-gray-900">
                            {promotionService.formatCurrency(
                              promotionService.TIER_PRICES[
                                formData.promotion.tier
                              ]
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Thời gian:</span>
                          <span className="font-semibold text-gray-900">
                            {formData.promotion.duration} ngày
                          </span>
                        </div>
                        <div className="border-t-2 border-yellow-300 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">
                              Tổng trước giảm:
                            </span>
                            <span className="font-semibold text-gray-900">
                              {promotionService.formatCurrency(
                                promotionService.TIER_PRICES[
                                  formData.promotion.tier
                                ] * formData.promotion.duration
                              )}
                            </span>
                          </div>
                        </div>
                        {formData.promotion.duration >= 3 && (
                          <div className="flex justify-between items-center text-green-700">
                            <span className="font-semibold">
                              Giảm giá (10%):
                            </span>
                            <span className="font-bold">
                              -
                              {promotionService.formatCurrency(
                                promotionService.TIER_PRICES[
                                  formData.promotion.tier
                                ] *
                                  formData.promotion.duration *
                                  0.1
                              )}
                            </span>
                          </div>
                        )}
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4 mt-3">
                          <div className="flex justify-between items-center text-white">
                            <span className="text-lg font-bold">
                              Tổng thanh toán:
                            </span>
                            <span className="text-2xl font-extrabold">
                              {promotionService.formatCurrency(
                                formData.promotion.duration >= 3
                                  ? promotionService.TIER_PRICES[
                                      formData.promotion.tier
                                    ] *
                                      formData.promotion.duration *
                                      0.9
                                  : promotionService.TIER_PRICES[
                                      formData.promotion.tier
                                    ] * formData.promotion.duration
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Prompt to select tier */}
                  {!formData.promotion.tier && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                      <icons.BiInfoCircle className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                      <p className="text-blue-800 font-semibold">
                        👆 Vui lòng chọn gói quảng cáo ở trên để xem chi tiết
                        thanh toán
                      </p>
                    </div>
                  )}

                  {/* Payment Method - Only show when tier is selected */}
                  {formData.promotion.tier && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <icons.HiCash className="w-5 h-5 mr-2 text-primary-600" />
                        Phương Thức Thanh Toán
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Wallet Payment */}
                        <motion.button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              promotion: {
                                ...prev.promotion,
                                paymentMethod: "wallet",
                              },
                            }));
                          }}
                          className={`p-6 rounded-xl border-2 transition-all ${
                            formData.promotion.paymentMethod === "wallet"
                              ? "border-primary-500 bg-primary-50"
                              : "border-gray-200 hover:border-primary-300"
                          }`}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                              <icons.HiCash className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                              <h4 className="font-bold text-gray-900 mb-1">
                                Ví PIRA
                              </h4>
                              <p className="text-sm text-gray-600">
                                {walletLoading ? (
                                  "Đang tải..."
                                ) : (
                                  <>
                                    Số dư:{" "}
                                    {promotionService.formatCurrency(
                                      walletBalance || 0
                                    )}
                                  </>
                                )}
                              </p>
                            </div>
                            {formData.promotion.paymentMethod === "wallet" && (
                              <icons.FiCheck className="w-6 h-6 text-primary-600" />
                            )}
                          </div>
                        </motion.button>

                        {/* PayOS Payment */}
                        <motion.button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              promotion: {
                                ...prev.promotion,
                                paymentMethod: "payos",
                              },
                            }));
                          }}
                          className={`p-6 rounded-xl border-2 transition-all ${
                            formData.promotion.paymentMethod === "payos"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                              <icons.BiCreditCard className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                              <h4 className="font-bold text-gray-900 mb-1">
                                PayOS
                              </h4>
                              <p className="text-sm text-gray-600">
                                Thanh toán ngân hàng
                              </p>
                            </div>
                            {formData.promotion.paymentMethod === "payos" && (
                              <icons.FiCheck className="w-6 h-6 text-blue-600" />
                            )}
                          </div>
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* Cost Summary Loading */}
                  {formData.promotion.tier && calculatingCost && (
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
                      <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        <span className="text-lg font-semibold">
                          Đang tính chi phí...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Cost Summary */}
                  {formData.promotion.tier &&
                    !calculatingCost &&
                    promotionCost &&
                    promotionCost.totalCost && (
                      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
                        <h3 className="text-lg font-bold mb-4 flex items-center">
                          <icons.BiCalculator className="w-5 h-5 mr-2" />
                          Chi Tiết Chi Phí
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-primary-100">Giá gốc:</span>
                            <span className="font-semibold">
                              {promotionService.formatCurrency(
                                promotionCost.basePrice
                              )}
                            </span>
                          </div>
                          {promotionCost.discount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-primary-100">
                                Giảm giá (10%):
                              </span>
                              <span className="font-semibold text-yellow-300">
                                -
                                {promotionService.formatCurrency(
                                  promotionCost.discount
                                )}
                              </span>
                            </div>
                          )}
                          <div className="border-t border-primary-400 pt-3 flex justify-between">
                            <span className="text-lg font-bold">
                              Tổng cộng:
                            </span>
                            <span className="text-2xl font-bold text-yellow-300">
                              {promotionService.formatCurrency(
                                promotionCost.totalCost
                              )}
                            </span>
                          </div>
                        </div>

                        {formData.promotion.paymentMethod === "wallet" &&
                          walletBalance < promotionCost.totalCost && (
                            <div className="mt-4 bg-red-500 rounded-xl p-4 flex items-center gap-3">
                              <icons.BiErrorCircle className="w-5 h-5" />
                              <p className="text-sm">
                                Số dư ví không đủ. Vui lòng nạp thêm hoặc chọn
                                PayOS.
                              </p>
                            </div>
                          )}
                      </div>
                    )}
                </>
              )}
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-200">
            <motion.button
              type="button"
              onClick={() => {
                if (currentStep === 1) {
                  navigate("/owner/products");
                } else {
                  setCurrentStep(currentStep - 1);
                }
              }}
              className="flex items-center px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <icons.GrLinkPrevious className="w-4 h-4 mr-2" />
              {currentStep === 1 ? "Hủy bỏ" : "Quay lại"}
            </motion.button>

            <div className="flex space-x-4">
              {currentStep < 6 && (
                <motion.button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  Tiếp theo
                  <icons.GrNext className="w-4 h-4 ml-2" />
                </motion.button>
              )}

              {currentStep === 6 && (
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: loading ? 1 : 1.05 }}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <icons.FiCheck className="w-4 h-4 mr-2" />
                      Tạo Sản Phẩm
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateForm;
