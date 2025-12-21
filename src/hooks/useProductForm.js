import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { categoryApi } from "../services/category.Api";
import { ownerProductApi } from "../services/ownerProduct.Api";
import promotionService from "../services/promotion";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "./useAuth";
import { ROUTES } from "../utils/constants";

const INITIAL_FORM_DATA = {
  title: "",
  description: "",
  quantity: 1,
  category: "",
  subCategory: "",
  pricing: {
    dailyRate: "",
    deposit: {
      amount: "",
      type: "FIXED",
    },
  },
  images: [],
  videos: [],
  location: {
    address: {
      streetAddress: "",
      ward: "",
      district: "",
    },
    city: "Đà Nẵng",
    coordinates: {
      latitude: 16.0544,
      longitude: 108.2022,
    },
    deliveryOptions: {
      pickup: true,
      delivery: false,
      deliveryFee: 0,
    },
  },
  promotion: {
    enabled: false,
    tier: null,
    duration: 1,
    paymentMethod: "wallet",
  },
  agreedToTerms: false,
};

const TOTAL_STEPS = 7;

const DRAFT_KEY = "pira_product_draft";

export const useProductForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { balance: walletBalance, loading: walletLoading } = useWallet();
  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingMedia, setIsValidatingMedia] = useState(false);

  // Categories state
  const [categories, setCategories] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryApi.getCategories();
        // Handle both response.data and direct array
        const data = Array.isArray(response) ? response : response.data || [];
        console.log("📦 Fetched categories:", data);
        setCategories(data);

        const map = {};
        data.forEach((cat) => {
          // Normalize subcategories key (handle both 'subcategories' and 'subCategories')
          const subCategories = cat.subCategories || cat.subcategories || [];
          console.log(`📁 Category ${cat.name}:`, {
            id: cat._id,
            subCategories,
            subCategoryCount: subCategories.length,
          });

          // Create a clean object with camelCase subCategories
          const { subcategories, ...restCat } = cat; // Remove lowercase version
          const normalizedCat = {
            ...restCat,
            subCategories, // Add camelCase version
          };

          console.log(`✅ Normalized ${cat.name}:`, {
            hasSubCategories: !!normalizedCat.subCategories,
            hasSubcategories: !!normalizedCat.subcategories,
            subCategoriesLength: normalizedCat.subCategories?.length,
          });

          map[cat._id] = normalizedCat;
        });
        setCategoryMap(map);
        console.log("🗺️ Category map:", map);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Không thể tải danh mục");
      }
    };

    fetchCategories();
  }, []);

  // Load draft and populate user address on mount
  useEffect(() => {
    // Check if returning from profile update
    const returningFromProfile = location.state?.fromProfile;

    // Try to load draft from localStorage
    const savedDraft = localStorage.getItem(DRAFT_KEY);

    if (savedDraft && returningFromProfile) {
      try {
        const draft = JSON.parse(savedDraft);
        console.log("📝 Restored draft from localStorage:", draft);
        setFormData(draft);
        toast.success("✅ Đã khôi phục bản nháp của bạn!");

        // Clear the draft after restoring
        localStorage.removeItem(DRAFT_KEY);
      } catch (error) {
        console.error("Error loading draft:", error);
        localStorage.removeItem(DRAFT_KEY);
      }
    } else if (user?.address) {
      // Populate user's address if no draft
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          address: {
            streetAddress: user.address.streetAddress || "",
          },
          district: user.address.district || "",
          ward: "", // Ward needs to be selected manually
          city: user.address.city || "Đà Nẵng",
        },
      }));
      console.log("📍 Populated user address:", user.address);
    }
  }, [user, location.state]);

  // Function to save draft to localStorage
  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      console.log("💾 Saved draft to localStorage");
      return true;
    } catch (error) {
      console.error("Error saving draft:", error);
      return false;
    }
  };

  // Function to clear draft
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    console.log("🗑️ Cleared draft from localStorage");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Special handling for location object (from MapSelector)
    if (name === "location" && typeof value === "object") {
      console.log("🔄 handleInputChange received location object:", value);
      setFormData((prev) => {
        console.log("🔄 Previous formData.location:", prev.location);
        const newFormData = {
          ...prev,
          location: value,
        };
        console.log("🔄 New formData.location:", newFormData.location);
        return newFormData;
      });

      // Clear location error
      if (errors.location) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.location;
          return newErrors;
        });
      }
      return;
    }

    // Handle nested object updates (e.g., "pricing.dailyRate", "pricing.deposit.amount")
    if (name.includes(".")) {
      const keys = name.split(".");
      setFormData((prev) => {
        const updated = { ...prev };
        let current = updated;

        // Navigate to the parent object
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          } else {
            current[keys[i]] = { ...current[keys[i]] };
          }
          current = current[keys[i]];
        }

        // Set the final value
        current[keys[keys.length - 1]] = value;

        return updated;
      });

      // Clear error for the field
      // Map the field path to the error key
      const errorKeyMap = {
        "pricing.dailyRate": "dailyRate",
        "pricing.deposit.amount": "depositAmount",
        "pricing.deposit.type": "depositType",
        location: "location",
      };

      const errorKey = errorKeyMap[name] || keys[keys.length - 1];
      if (errors[errorKey]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
    } else {
      // Handle flat field updates
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Clear error for this field
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1: // Basic Info
        if (!formData.title.trim()) {
          newErrors.title = "Vui lòng nhập tên sản phẩm";
        }
        if (!formData.description.trim()) {
          newErrors.description = "Vui lòng nhập mô tả sản phẩm";
        }
        if (!formData.quantity || formData.quantity < 1) {
          newErrors.quantity = "Số lượng phải lớn hơn 0";
        }
        break;

      case 2: // Category
        if (!formData.category) {
          newErrors.category = "Vui lòng chọn danh mục";
        }
        if (!formData.subCategory) {
          newErrors.subCategory = "Vui lòng chọn danh mục con";
        }
        break;

      case 3: // Images
        if (!formData.images || formData.images.length === 0) {
          newErrors.images = "Vui lòng thêm ít nhất 3 hình ảnh";
        } else if (formData.images.length < 3) {
          newErrors.images = `Cần thêm ${
            3 - formData.images.length
          } hình ảnh nữa (tối thiểu 3 hình ảnh)`;
        }
        break;

      case 4: // Videos (optional, no validation required)
        // Videos are optional, so no validation errors
        break;

      case 5: // Pricing
        if (
          !formData.pricing?.dailyRate ||
          parseFloat(formData.pricing.dailyRate) <= 0
        ) {
          newErrors.dailyRate = "Vui lòng nhập giá thuê";
        }
        if (
          !formData.pricing?.deposit?.amount ||
          parseFloat(formData.pricing.deposit.amount) <= 0
        ) {
          newErrors.depositAmount = "Vui lòng nhập tiền đặt cọc";
        }
        break;

      case 6: // Location
        // More flexible location validation - require either address OR coordinates
        const hasAddress = formData.location?.address?.streetAddress?.trim();
        const hasCoordinates =
          formData.location?.coordinates?.latitude &&
          formData.location?.coordinates?.longitude;

        if (!hasAddress && !hasCoordinates) {
          newErrors.location = "Vui lòng chọn địa chỉ trên bản đồ";
        }
        break;

      case 7: // Promotion Step
        if (!formData.agreedToTerms) {
          newErrors.agreedToTerms =
            "Bạn phải đồng ý với điều khoản và điều kiện để tạo sản phẩm";
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast.error("Vui lòng điền đầy đủ thông tin");
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStepClick = (step) => {
    if (step <= currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const calculatePromotionCost = () => {
    if (!formData.promotion?.enabled || !formData.promotion?.tier) {
      return 0;
    }

    const basePrice =
      promotionService.TIER_PRICES[formData.promotion.tier] *
      formData.promotion.duration;

    const discount = formData.promotion.duration >= 3 ? basePrice * 0.1 : 0;
    return basePrice - discount;
  };

  const handleSubmit = async () => {
    // Validate all steps
    for (let step = 1; step <= TOTAL_STEPS; step++) {
      if (!validateStep(step)) {
        toast.error(`Vui lòng hoàn thành bước ${step}`);
        setCurrentStep(step);
        return;
      }
    }

    // Check wallet balance if using wallet payment
    const promotionCost = calculatePromotionCost();
    if (
      formData.promotion?.enabled &&
      formData.promotion?.paymentMethod === "wallet" &&
      promotionCost > walletBalance
    ) {
      toast.error("Số dư ví không đủ để thanh toán quảng cáo");
      document.getElementById("promotion-section")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("quantity", formData.quantity);
      formDataToSend.append("category", formData.category);

      // Add default condition since server still expects it
      formDataToSend.append("condition", "GOOD");

      if (formData.subCategory) {
        formDataToSend.append("subCategory", formData.subCategory);
      }

      // Add pricing fields (trim whitespace)
      formDataToSend.append(
        "pricing.dailyRate",
        String(formData.pricing.dailyRate).trim()
      );
      formDataToSend.append(
        "pricing.deposit.amount",
        String(formData.pricing.deposit.amount).trim()
      );
      formDataToSend.append(
        "pricing.deposit.type",
        formData.pricing.deposit.type
      );

      // Add location as JSON string
      formDataToSend.append("location", JSON.stringify(formData.location));

      // Add promotion intention flag (for PayOS payment that needs to be completed)
      if (
        formData.promotion.enabled &&
        formData.promotion.tier &&
        formData.promotion.paymentMethod === "payos"
      ) {
        formDataToSend.append("promotionIntended", "true");
      }

      // Add images (assuming formData.images is an array of file objects)
      if (formData.images && formData.images.length > 0) {
        formData.images.forEach((image) => {
          // Check if it's a file object or has a file property
          const file = image.file || image;
          formDataToSend.append("images", file);
        });
      }

      // Add videos (assuming formData.videos is an array of file objects)
      if (formData.videos && formData.videos.length > 0) {
        formData.videos.forEach((video) => {
          // Videos are already File objects from VideoUploadStep
          formDataToSend.append("videos", video);
        });
      }

      // Show AI validation loading overlay
      setIsValidatingMedia(true);

      const response = await ownerProductApi.createOwnerProduct(formDataToSend);
      
      // Dismiss loading
      setIsValidatingMedia(false);

      if (response.success) {
        const createdProduct = response.data;
        toast.success("🎉 Tạo sản phẩm thành công!");

        // Clear draft after successful creation
        clearDraft();

        // Refresh user data to get updated role (RENTER -> OWNER)
        // Only refresh if user is currently a RENTER to avoid unnecessary API calls
        try {
          if (user?.role === "RENTER") {
            await refreshUser();
          }
        } catch (error) {
          console.warn("Could not refresh user role:", error);
          // Non-critical error, continue
        }

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

        // Show video validation results if available
        if (response.videoValidation) {
          const { summary } = response.videoValidation;

          if (summary.allVideosRelevant) {
            toast.success("🎬 Tất cả video đã qua kiểm duyệt AI!");
          } else {
            toast("ℹ️ Video được kiểm duyệt với độ tin cậy khác nhau", {
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
            const loadingToastId = toast.loading("Đang tạo quảng cáo...");

            const promotionData = {
              productId: createdProduct._id,
              tier: formData.promotion.tier,
              duration: formData.promotion.duration,
              paymentMethod: formData.promotion.paymentMethod,
            };

            const promotionService = (await import("../services/promotion"))
              .default;
            const promotionResponse = await promotionService.createPromotion(
              promotionData
            );

            toast.dismiss(loadingToastId);

            if (formData.promotion.paymentMethod === "wallet") {
              toast.success(
                "✨ Sản phẩm đã được xuất bản và quảng cáo kích hoạt!",
                {
                  duration: 3000,
                }
              );
              setTimeout(() => {
                navigate(ROUTES.OWNER_PRODUCTS, {
                  state: { newProduct: true },
                });
              }, 2000);
            } else {
              // PayOS: Show info and redirect to payment page
              if (promotionResponse.paymentUrl) {
                toast.success("✅ Sản phẩm đã được tạo!", {
                  duration: 2000,
                });

                setTimeout(() => {
                  toast.loading("🔄 Chuyển đến trang thanh toán...", {
                    duration: 2000,
                  });
                }, 500);

                setTimeout(() => {
                  toast(
                    "⚠️ Sản phẩm sẽ được xuất bản SAU KHI thanh toán thành công",
                    {
                      duration: 4000,
                      icon: "⚠️",
                      style: {
                        background: "#F59E0B",
                        color: "#fff",
                        fontWeight: "600",
                      },
                    }
                  );
                }, 1000);

                setTimeout(() => {
                  window.location.href = promotionResponse.paymentUrl;
                }, 3000);
                return; // Don't navigate away
              }
            }
          } catch (error) {
            console.error("Promotion creation error:", error);
            toast.error(
              `⚠️ Sản phẩm đã tạo nhưng quảng cáo thất bại: ${
                error.message || "Lỗi không xác định"
              }`,
              { duration: 5000 }
            );
            // Still navigate to products
            setTimeout(() => {
              navigate(ROUTES.OWNER_PRODUCTS, {
                state: { newProduct: true },
              });
            }, 2000);
          }
        } else {
          // No promotion: Navigate immediately
          toast.success("✅ Sản phẩm đã được xuất bản thành công!", {
            duration: 2000,
          });
          setTimeout(() => {
            navigate(ROUTES.OWNER_PRODUCTS, {
              state: { newProduct: true },
            });
          }, 1500);
        }
      }
    } catch (error) {
      console.error("❌ Error creating product:", error);

      // Handle KYC/Bank Account requirement errors
      if (error.kycRequired) {
        const requirements = error.missingRequirements || {};

        if (!requirements.cccdVerified) {
          toast.error("❌ Cần xác thực CCCD trước khi đăng sản phẩm!", {
            duration: 5000,
          });
          return;
        }

        if (!requirements.bankAccountAdded) {
          toast.error(
            "❌ Cần thêm tài khoản ngân hàng trước khi đăng sản phẩm!",
            {
              duration: 5000,
            }
          );
          return;
        }
      }

      // Dismiss loading if error occurs
      setIsValidatingMedia(false);
      
      // Handle AI validation errors
      if (error.errorType === "EXPLICIT_CONTENT" || error.errorType === "NSFW_VIOLATION") {
        const hasVideos = formData.videos && formData.videos.length > 0;
        const mediaType = hasVideos ? "video" : "hình ảnh";
        const reason = error.details?.reason || `Phát hiện nội dung không phù hợp trong ${mediaType}`;
        
        toast.error(
          `🔞 ${reason}\n\n💡 Vui lòng chỉ tải lên ${mediaType} phù hợp với gia đình`,
          { duration: 8000 }
        );
      } else if (error.errorType === "CATEGORY_MISMATCH") {
        const hasVideos = formData.videos && formData.videos.length > 0;
        const mediaType = hasVideos ? "video" : "hình ảnh";
        const reason = error.details?.reason || `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} không khớp với danh mục đã chọn`;
        const suggestion = error.details?.suggestion || `Tải lên ${mediaType} liên quan đến danh mục của bạn`;
        
        toast.error(
          `📂 ${reason}\n\n💡 ${suggestion}`,
          { duration: 8000 }
        );
      } else if (error.errorType === "MIXED_VALIDATION_ERROR") {
        const breakdown = error.errorBreakdown;
        let message = `⚠️ Phát hiện ${breakdown.total} vấn đề:`;
        if (breakdown.nsfw > 0) message += `\n🔞 ${breakdown.nsfw} nội dung không phù hợp`;
        if (breakdown.category > 0) message += `\n📂 ${breakdown.category} không khớp danh mục`;
        message += `\n\n💡 Vui lòng sửa tất cả trước khi tải lên`;
        
        toast.error(message, { duration: 8000 });
      } else {
        // Generic error handling
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Không thể tạo sản phẩm";

        toast.error(errorMessage);

        // Handle specific error cases
        if (
          errorMessage.includes("wallet") ||
          errorMessage.includes("balance")
        ) {
          setCurrentStep(6);
          document.getElementById("promotion-section")?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // Form state
    formData,
    setFormData,
    currentStep,
    errors,
    isSubmitting,
    isValidatingMedia,

    // Categories
    categories,
    categoryMap,

    // Wallet
    walletBalance,
    walletLoading,

    // Handlers
    handleInputChange,
    handleNext,
    handlePrevious,
    handleStepClick,
    handleSubmit,
    saveDraft,
    clearDraft,

    // Constants
    TOTAL_STEPS,
  };
};
