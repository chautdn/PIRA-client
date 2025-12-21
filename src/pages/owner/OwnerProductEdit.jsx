import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ownerProductApi } from "../../services/ownerProduct.Api";
import {
  FiArrowLeft,
  FiSave,
  FiImage,
  FiX,
  FiCheckCircle,
} from "react-icons/fi";
import ConfirmModal from "../../components/owner/ConfirmModal";

export default function OwnerProductEdit() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [canEditPricing, setCanEditPricing] = useState(false);
  const [checkingPricing, setCheckingPricing] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    quantity: "",
  });

  const [pricingData, setPricingData] = useState({
    dailyRate: "",
    weeklyRate: "",
    monthlyRate: "",
    depositAmount: "",
    depositDescription: "",
  });

  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]); // Track images to delete
  const [newVideos, setNewVideos] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [videosToDelete, setVideosToDelete] = useState([]); // Track videos to delete
  const [quantityValidation, setQuantityValidation] = useState(null);
  const [imageValidationError, setImageValidationError] = useState(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    imageId: null,
    message: null,
    quantityConflict: null,
  });

  useEffect(() => {
    loadProduct();
    checkPricingEditPermission();
  }, [productId]);

  // Cleanup image previews on unmount or when navigating away
  useEffect(() => {
    return () => {
      // Revoke all object URLs to prevent memory leaks
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
      videoPreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews, videoPreviews]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const res = await ownerProductApi.getOwnerProductById(productId);

      if (res.success) {
        setProduct(res.data);
        setFormData({
          title: res.data.title || "",
          description: res.data.description || "",
          quantity: res.data.availability?.quantity || "",
        });
        setPricingData({
          dailyRate: res.data.pricing?.dailyRate || "",
          weeklyRate: res.data.pricing?.weeklyRate || "",
          monthlyRate: res.data.pricing?.monthlyRate || "",
          depositAmount: res.data.pricing?.deposit?.amount || "",
          depositDescription: res.data.pricing?.deposit?.description || "",
        });
      }
    } catch (err) {
      console.error("Error loading product:", err);
      setError("Không thể tải sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const checkPricingEditPermission = async () => {
    try {
      setCheckingPricing(true);
      const res = await ownerProductApi.canEditPricing(productId);
      if (res.success) {
        setCanEditPricing(res.data.canEditPricing);
      }
    } catch (err) {
      console.error("Error checking pricing permission:", err);
    } finally {
      setCheckingPricing(false);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // If quantity changed, validate it
    if (name === "quantity" && value && product?.availability?.quantity) {
      const newQuantity = parseInt(value);
      if (
        !isNaN(newQuantity) &&
        newQuantity !== product.availability.quantity
      ) {
        try {
          const validation = await ownerProductApi.validateQuantityChange(
            productId,
            newQuantity
          );
          setQuantityValidation(validation.data);
        } catch (err) {
          console.error("Error validating quantity:", err);
          setQuantityValidation(null);
        }
      } else {
        setQuantityValidation(null);
      }
    }
  };

  const handlePricingChange = (e) => {
    const { name, value } = e.target;
    setPricingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setImageValidationError(null);

    // Calculate total after adding new images (excluding images marked for deletion)
    const currentExistingImages = product?.images?.length || 0;
    const imagesToDeleteCount = imagesToDelete.length;
    const remainingExistingImages = currentExistingImages - imagesToDeleteCount;
    const currentNewImages = newImages.length;
    const totalAfterAdd =
      remainingExistingImages + currentNewImages + files.length;

    if (totalAfterAdd > 10) {
      setModalState({
        isOpen: true,
        type: "error",
        message: `Tối đa 10 hình ảnh. Sau khi tính toán: ${remainingExistingImages} hình cũ (đã trừ ${imagesToDeleteCount} hình đánh dấu xóa) + ${currentNewImages} hình mới. Bạn chỉ có thể thêm tối đa ${
          10 - remainingExistingImages - currentNewImages
        } hình nữa.`,
      });
      return;
    }

    setNewImages((prev) => [...prev, ...files]);

    // Create previews
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...previews]);
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId) => {
    // Check if removing this image would bring total below 3
    const currentExistingImages = product?.images?.length || 0;
    const alreadyMarkedForDeletion = imagesToDelete.length;
    const currentNewImages = newImages.length;
    const totalAfterRemove =
      currentExistingImages - alreadyMarkedForDeletion - 1 + currentNewImages;

    if (totalAfterRemove < 3) {
      setModalState({
        isOpen: true,
        type: "error",
        message: `Không thể xóa hình này. Sản phẩm cần ít nhất 3 hình ảnh. Sau khi xóa sẽ còn ${totalAfterRemove} hình. Vui lòng thêm hình mới trước khi xóa hình này.`,
      });
      return;
    }

    setModalState({
      isOpen: true,
      type: "deleteImage",
      imageId: imageId,
    });
  };

  const handleVideoSelect = (e) => {
    const files = Array.from(e.target.files);

    // Validate file count
    const currentExisting = product?.videos?.length || 0;
    const currentMarkedForDelete = videosToDelete.length;
    const currentNew = newVideos.length;
    const totalAfterAdd =
      currentExisting - currentMarkedForDelete + currentNew + files.length;

    if (totalAfterAdd > 5) {
      setModalState({
        isOpen: true,
        type: "error",
        message: `Tối đa 5 video. Hiện có ${
          currentExisting - currentMarkedForDelete
        } video cũ + ${currentNew} video mới. Bạn chỉ có thể thêm tối đa ${
          5 - (currentExisting - currentMarkedForDelete + currentNew)
        } video nữa.`,
      });
      return;
    }

    // Validate file size (100MB max per video)
    const maxSize = 100 * 1024 * 1024;
    const oversizedFiles = files.filter((f) => f.size > maxSize);

    if (oversizedFiles.length > 0) {
      setModalState({
        isOpen: true,
        type: "error",
        message: `Một số video vượt quá giới hạn 100MB: ${oversizedFiles
          .map((f) => f.name)
          .join(", ")}`,
      });
      return;
    }

    // Validate file type
    const invalidFiles = files.filter((f) => !f.type.startsWith("video/"));
    if (invalidFiles.length > 0) {
      setModalState({
        isOpen: true,
        type: "error",
        message: "Chỉ cho phép tệp video",
      });
      return;
    }

    setNewVideos((prev) => [...prev, ...files]);

    // Create previews
    const previews = files.map((file) => URL.createObjectURL(file));
    setVideoPreviews((prev) => [...prev, ...previews]);
  };

  const removeNewVideo = (index) => {
    setNewVideos((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(videoPreviews[index]);
    setVideoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingVideo = (videoId) => {
    setModalState({
      isOpen: true,
      type: "deleteVideo",
      videoId: videoId,
      message: "Bạn có chắc chắn muốn xóa video này không?",
    });
  };

  const confirmDeleteVideo = () => {
    // Stage the video for deletion
    setVideosToDelete((prev) => [...prev, modalState.videoId]);
    setModalState({ isOpen: false, type: null, videoId: null });
  };

  const confirmDeleteImage = () => {
    // Stage the image for deletion (don't delete from backend yet)
    setImagesToDelete((prev) => [...prev, modalState.imageId]);
    setModalState({ isOpen: false, type: null, imageId: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setImageValidationError(null);

      // Calculate final image count (existing - to delete + new to upload)
      const existingCount = product?.images?.length || 0;
      const deleteCount = imagesToDelete.length;
      const newCount = newImages.length;
      const finalImageCount = existingCount - deleteCount + newCount;

      // Validate minimum images requirement (3 images)
      if (finalImageCount < 3) {
        setImageValidationError(
          `Sản phẩm cần ít nhất 3 hình ảnh. Hiện có ${existingCount} hình cũ - ${deleteCount} hình sẽ xóa + ${newCount} hình mới (tổng: ${finalImageCount}). Vui lòng thêm ${
            3 - finalImageCount
          } hình ảnh nữa.`
        );
        setSaving(false);
        return;
      }

      // Validate quantity change if changed
      if (
        formData.quantity &&
        parseInt(formData.quantity) !== product?.availability?.quantity
      ) {
        const newQuantity = parseInt(formData.quantity);
        const validation = await ownerProductApi.validateQuantityChange(
          productId,
          newQuantity
        );

        if (!validation.data.canChange) {
          setModalState({
            isOpen: true,
            type: "quantityConflict",
            quantityConflict: validation.data,
          });
          setSaving(false);
          return;
        }
      }

      // Step 1: Delete images marked for deletion
      for (const imageId of imagesToDelete) {
        try {
          await ownerProductApi.deleteImage(productId, imageId);
        } catch (err) {
          console.error("Error deleting image:", err);
          const errorMsg = err?.message || "Không thể xóa hình ảnh";
          setError(`${errorMsg}`);
          setSaving(false);
          return;
        }
      }

      // Step 1.5: Delete videos marked for deletion
      for (const videoId of videosToDelete) {
        try {
          await ownerProductApi.deleteVideo(productId, videoId);
        } catch (err) {
          console.error("Error deleting video:", err);
          const errorMsg = err?.message || "Không thể xóa video";
          setError(`${errorMsg}`);
          setSaving(false);
          return;
        }
      }

      // Step 2: Update product with new data
      const updateData = new FormData();
      updateData.append("title", formData.title);
      updateData.append("description", formData.description);

      // Add quantity if changed
      if (
        formData.quantity &&
        parseInt(formData.quantity) !== product?.availability?.quantity
      ) {
        updateData.append("availability[quantity]", formData.quantity);
      }

      // Add new images if any (these will be validated by backend AI)
      newImages.forEach((image) => {
        updateData.append("images", image);
      });

      // Add new videos if any (these will be validated by backend AI)
      newVideos.forEach((video) => {
        updateData.append("videos", video);
      });

      // Debug logging
      console.log('📤 Submitting form data:');
      console.log('  - Title:', formData.title);
      console.log('  - Description:', formData.description);
      console.log('  - Quantity:', formData.quantity);
      console.log('  - New Images:', newImages.length);
      console.log('  - New Videos:', newVideos.length);
      console.log('  - Images to delete:', imagesToDelete.length);
      console.log('  - Videos to delete:', videosToDelete.length);

      const res = await ownerProductApi.updateProductSafeFields(
        productId,
        updateData
      );
      
      // Step 3: Update pricing if allowed and changed
      let pricingUpdateSuccess = true;
      if (canEditPricing && (parseFloat(pricingData.dailyRate) !== product?.pricing?.dailyRate || 
          parseFloat(pricingData.depositAmount) !== product?.pricing?.deposit?.amount)) {
        try {
          const pricingUpdate = {
            dailyRate: parseFloat(pricingData.dailyRate),
            depositAmount: parseFloat(pricingData.depositAmount),
          };
          await ownerProductApi.updatePricing(productId, pricingUpdate);
        } catch (pricingErr) {
          console.error("Error updating pricing:", pricingErr);
          // Don't fail the entire operation if pricing update fails
          const pricingErrorMsg = pricingErr?.message || "Không thể cập nhật giá";
          pricingUpdateSuccess = false;
          setError(`Giá chưa được cập nhật: ${pricingErrorMsg}`);
        }
      }

      if (res.success) {
        // Clear all staged changes after successful upload
        setNewImages([]);
        imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
        setImagePreviews([]);
        setImagesToDelete([]);
        setNewVideos([]);
        videoPreviews.forEach((preview) => URL.revokeObjectURL(preview));
        setVideoPreviews([]);
        setVideosToDelete([]);

        // Reload product data to reflect changes
        await loadProduct();
        await checkPricingEditPermission();

        if (pricingUpdateSuccess) {
          setModalState({
            isOpen: true,
            type: "success",
            message: "Cập nhật sản phẩm và giá thành công!",
          });
        } else {
          setModalState({
            isOpen: true,
            type: "success",
            message: "Cập nhật sản phẩm thành công!",
          });
        }
      }
    } catch (err) {
      console.error("Error updating product:", err);

      // Helper function to get error message
      const getErrorMessage = (error) => {
        if (typeof error === 'string') return error;
        return error?.message || error?.error?.message || "Không thể cập nhật sản phẩm";
      };

      // Handle image validation errors from backend AI
      if (
        err.errorType === "IMAGE_VALIDATION_ERROR" ||
        err.errorType === "NSFW_VIOLATION" ||
        err.errorType === "CATEGORY_MISMATCH"
      ) {
        setImageValidationError(
          err.details?.reason || getErrorMessage(err) || "Hình ảnh không hợp lệ"
        );
        setModalState({
          isOpen: true,
          type: "imageValidationError",
          message: err.details?.reason || getErrorMessage(err),
          details: err.details,
        });
      } else if (err.errorType === "QUANTITY_CONFLICT") {
        setModalState({
          isOpen: true,
          type: "quantityConflict",
          quantityConflict: err.validationDetails,
        });
      } else {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setModalState({
          isOpen: true,
          type: "error",
          message: errorMessage,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePricingSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const pricingUpdate = {
        dailyRate: parseFloat(pricingData.dailyRate),
        depositAmount: parseFloat(pricingData.depositAmount),
      };

      const res = await ownerProductApi.updatePricing(productId, pricingUpdate);

      if (res.success) {
        setModalState({
          isOpen: true,
          type: "success",
          message: "Cập nhật giá thành công!",
        });
        await loadProduct();
        await checkPricingEditPermission();
      }
    } catch (err) {
      console.error("Error updating pricing:", err);
      const errorMessage = err?.message || err?.error?.message || "Không thể cập nhật giá";
      setError(errorMessage);
      setModalState({
        isOpen: true,
        type: "error",
        message: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-bold text-red-600 mb-4">{error}</h3>
          <Link to="/owner/products" className="text-blue-600 hover:underline">
            Quay lại danh sách sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/owner/products"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft />
            Quay lại
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Chỉnh Sửa Sản Phẩm
          </h1>
          <p className="text-gray-600 mt-2">
            Cập nhật tên, mô tả và hình ảnh sản phẩm
          </p>
        </div>

        {/* Alert about limited editing */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Chỉnh sửa sản phẩm
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                Bạn có thể cập nhật tên, mô tả và hình ảnh sản phẩm bất kỳ lúc
                nào.
                {canEditPricing ? (
                  <strong className="text-green-700">
                    {" "}
                    Giá cả có thể được chỉnh sửa vì sản phẩm không có yêu cầu
                    thuê đang chờ hoặc đang được thuê.
                  </strong>
                ) : (
                  <strong className="text-orange-700">
                    {" "}
                    Giá cả không thể thay đổi vì sản phẩm có yêu cầu thuê đang
                    chờ xử lý hoặc đang được thuê.
                  </strong>
                )}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Edit Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-6 space-y-6"
        >
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên Sản Phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              minLength={3}
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Nhập tên sản phẩm"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.title.length}/100 ký tự
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              minLength={10}
              maxLength={2000}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Mô tả chi tiết về sản phẩm của bạn..."
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.description.length}/2000 ký tự
            </p>
          </div>

          {/* Product Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lượng sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              required
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Nhập số lượng sản phẩm"
            />
            {quantityValidation && !quantityValidation.canChange && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ {quantityValidation.message}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Có {quantityValidation.conflicts?.length} ngày bị ảnh hưởng
                  với tổng {quantityValidation.totalAffectedOrders} đơn hàng
                </p>
              </div>
            )}
            {quantityValidation &&
              quantityValidation.canChange &&
              formData.quantity !== product?.availability?.quantity && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✓ Có thể thay đổi số lượng an toàn
                  </p>
                </div>
              )}
          </div>

          {/* Existing Images */}
          {product?.images && product.images.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Hình ảnh Hiện tại (
                {
                  product.images.filter(
                    (img) => !imagesToDelete.includes(img._id)
                  ).length
                }
                )
                {imagesToDelete.length > 0 && (
                  <span className="ml-2 text-orange-600 text-xs">
                    ({imagesToDelete.length} hình sẽ bị xóa khi lưu)
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {product.images.map((image) => {
                  const isMarkedForDeletion = imagesToDelete.includes(
                    image._id
                  );
                  return (
                    <div
                      key={image._id}
                      className={`relative group ${
                        isMarkedForDeletion ? "opacity-50" : ""
                      }`}
                    >
                      <img
                        src={typeof image === "string" ? image : image.url}
                        alt={image.alt || "Hình ảnh sản phẩm"}
                        className={`w-full h-32 object-cover rounded-lg ${
                          isMarkedForDeletion ? "grayscale" : ""
                        }`}
                      />
                      {isMarkedForDeletion ? (
                        <>
                          <div className="absolute inset-0 bg-red-500 bg-opacity-30 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm bg-red-600 px-2 py-1 rounded">
                              Sẽ xóa
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setImagesToDelete((prev) =>
                                prev.filter((id) => id !== image._id)
                              )
                            }
                            className="absolute top-2 right-2 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700"
                            title="Hủy xóa hình ảnh"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeExistingImage(image._id)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          title="Xóa hình ảnh"
                        >
                          <FiX size={16} />
                        </button>
                      )}
                      {image.isMain && !isMarkedForDeletion && (
                        <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                          Chính
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Thêm Hình ảnh Mới
              {(() => {
                const remaining =
                  (product?.images?.length || 0) -
                  imagesToDelete.length +
                  newImages.length;
                return remaining < 3 ? (
                  <span className="ml-2 text-red-600 text-xs font-semibold">
                    (Cần ít nhất 3 hình - Hiện có: {remaining}/3)
                  </span>
                ) : (
                  <span className="ml-2 text-green-600 text-xs font-semibold">
                    (Tổng: {remaining} hình ảnh)
                  </span>
                );
              })()}
            </label>

            {imageValidationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ {imageValidationError}
                </p>
              </div>
            )}

            {/* Info box about image requirements */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-2">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">
                    Yêu cầu hình ảnh
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>
                      • Tối thiểu: <strong>3 hình ảnh</strong>
                    </li>
                    <li>
                      • Tối đa: <strong>10 hình ảnh</strong>
                    </li>
                    <li>
                      • Hình ảnh sẽ được kiểm tra bởi AI (nội dung phù hợp &
                      đúng danh mục)
                    </li>
                    <li>• Bạn có thể xóa hình cũ nếu tổng số hình vẫn ≥ 3</li>
                    <li>• Hình mới chỉ được lưu khi bấm "Lưu Thay đổi"</li>
                  </ul>
                </div>
              </div>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Mới ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                    >
                      <FiX size={16} />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Mới
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <FiImage className="w-12 h-12 text-gray-400 mb-3" />
                <span className="text-sm font-medium text-gray-700">
                  Nhấp để tải lên hình ảnh
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PNG, JPG tối đa 10MB (Tối đa 10 hình ảnh)
                </span>
              </label>
            </div>
          </div>

          {/* Videos Section */}
          {product?.videos && product.videos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Video Hiện Tại{" "}
                {videosToDelete.length > 0 && (
                  <span className="ml-2 text-orange-600 text-xs">
                    ({videosToDelete.length} video sẽ bị xóa khi lưu)
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {product.videos.map((video) => {
                  const isMarkedForDeletion = videosToDelete.includes(
                    video._id
                  );
                  return (
                    <div
                      key={video._id}
                      className={`relative group ${
                        isMarkedForDeletion ? "opacity-50" : ""
                      }`}
                    >
                      <video
                        src={video.url}
                        className={`w-full h-32 object-cover rounded-lg ${
                          isMarkedForDeletion ? "grayscale" : ""
                        }`}
                        controls
                      />
                      {isMarkedForDeletion ? (
                        <>
                          <div className="absolute inset-0 bg-red-500 bg-opacity-30 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm bg-red-600 px-2 py-1 rounded">
                              Sẽ xóa
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setVideosToDelete((prev) =>
                                prev.filter((id) => id !== video._id)
                              )
                            }
                            className="absolute top-2 right-2 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700"
                            title="Hủy xóa video"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeExistingVideo(video._id)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          title="Xóa video"
                        >
                          <FiX size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New Videos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Thêm Video Mới (Tùy chọn)
              {(() => {
                const remaining =
                  (product?.videos?.length || 0) -
                  videosToDelete.length +
                  newVideos.length;
                return remaining > 0 ? (
                  <span className="ml-2 text-green-600 text-xs font-semibold">
                    (Tổng: {remaining}/5 video)
                  </span>
                ) : null;
              })()}
            </label>

            {/* Info box about video requirements */}
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex gap-2">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">
                    Video sẽ được kiểm tra tự động bởi AI
                  </h4>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    <li>
                      • Tối đa: <strong>5 video</strong>
                    </li>
                    <li>
                      • Dung lượng tối đa: <strong>100MB mỗi video</strong>
                    </li>
                    <li>• AI sẽ kiểm tra nội dung phù hợp & đúng danh mục</li>
                    <li>• Video không phù hợp sẽ bị từ chối</li>
                    <li>• Video mới chỉ được lưu khi bấm "Lưu Thay đổi"</li>
                  </ul>
                </div>
              </div>
            </div>

            {videoPreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {videoPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <video
                      src={preview}
                      className="w-full h-32 object-cover rounded-lg"
                      controls
                    />
                    <button
                      type="button"
                      onClick={() => removeNewVideo(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                    >
                      <FiX size={16} />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Mới
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={handleVideoSelect}
                className="hidden"
                id="video-upload"
              />
              <label
                htmlFor="video-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg
                  className="w-12 h-12 text-gray-400 mb-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  Nhấp để tải lên video
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  MP4, WebM, MOV tối đa 100MB (Tối đa 5 video)
                </span>
              </label>
            </div>
          </div>

          {/* Read-only Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Thông tin Sản phẩm
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Danh mục:</span>
                <span className="ml-2 font-medium">
                  {product?.category?.name}
                </span>
              </div>
              {/* <div>
                <span className="text-gray-600">Tình trạng:</span>
                <span className="ml-2 font-medium">{product?.condition}</span>
              </div> */}
            </div>
          </div>

          {/* Pricing Section - Editable if allowed */}
          <div className={canEditPricing ? "bg-green-50 rounded-lg p-6 border-2 border-green-200" : "bg-gray-50 rounded-lg p-4 border border-gray-200"}>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-medium text-gray-700">
                💰 Giá Cả
              </h3>
              {checkingPricing ? (
                <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full">
                  Đang kiểm tra...
                </span>
              ) : canEditPricing ? (
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                  Có thể chỉnh sửa
                </span>
              ) : (
                <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded-full">
                  Không thể chỉnh sửa
                </span>
              )}
            </div>

            {canEditPricing ? (
              <>
                <p className="text-sm text-green-700 mb-4">
                  Sản phẩm không có yêu cầu thuê đang chờ xử lý hoặc đang được
                  thuê. Bạn có thể cập nhật giá.
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá thuê / ngày <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="dailyRate"
                        value={pricingData.dailyRate ? new Intl.NumberFormat('vi-VN').format(parseFloat(pricingData.dailyRate) || 0) : ''}
                        onChange={(e) => {
                          // Remove non-numeric characters
                          const numericValue = e.target.value.replace(/[^\d]/g, '');
                          handlePricingChange({
                            target: {
                              name: 'dailyRate',
                              value: numericValue
                            }
                          });
                        }}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Nhập giá thuê mỗi ngày"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Đặt cọc <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="depositAmount"
                        value={pricingData.depositAmount ? new Intl.NumberFormat('vi-VN').format(parseFloat(pricingData.depositAmount) || 0) : ''}
                        onChange={(e) => {
                          // Remove non-numeric characters
                          const numericValue = e.target.value.replace(/[^\d]/g, '');
                          handlePricingChange({
                            target: {
                              name: 'depositAmount',
                              value: numericValue
                            }
                          });
                        }}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Số tiền đặt cọc"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs text-orange-600 mb-3">
                  ⚠️ Không thể chỉnh sửa giá vì sản phẩm có yêu cầu thuê đang chờ xử lý hoặc đang được thuê
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Giá thuê / ngày:</span>
                    <span className="ml-2 font-medium">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(product?.pricing?.dailyRate || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Đặt cọc:</span>
                    <span className="ml-2 font-medium">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(product?.pricing?.deposit?.amount || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={
                saving ||
                // Only check minimum images if user is actively changing images
                (imagesToDelete.length > 0 || newImages.length > 0) &&
                  ((product?.images?.length || 0) -
                    imagesToDelete.length +
                    newImages.length <
                    3)
              }
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              title={
                (imagesToDelete.length > 0 || newImages.length > 0) &&
                  ((product?.images?.length || 0) -
                    imagesToDelete.length +
                    newImages.length <
                    3)
                  ? "Cần ít nhất 3 hình ảnh"
                  : ""
              }
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <FiSave />
                  Lưu Thay đổi
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                // Cleanup image previews before navigating
                imagePreviews.forEach((preview) =>
                  URL.revokeObjectURL(preview)
                );
                // Reset all staged changes
                setNewImages([]);
                setImagePreviews([]);
                setImagesToDelete([]);
                navigate("/owner/products");
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {modalState.type === "quantityConflict" ? (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() =>
              setModalState({
                isOpen: false,
                type: null,
                quantityConflict: null,
              })
            }
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() =>
                  setModalState({
                    isOpen: false,
                    type: null,
                    quantityConflict: null,
                  })
                }
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold text-red-700 mb-4">
                ⚠️ Không thể giảm số lượng
              </h2>

              <p className="text-gray-700 mb-6">
                Bạn không thể giảm số lượng từ{" "}
                {modalState.quantityConflict?.currentQuantity} xuống{" "}
                {modalState.quantityConflict?.requestedQuantity}
                vì có đơn hàng đã xác nhận sẽ bị ảnh hưởng.
              </p>

              {modalState.quantityConflict?.conflicts &&
                modalState.quantityConflict.conflicts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-3">
                      Các ngày bị ảnh hưởng (
                      {modalState.quantityConflict.conflicts.length} ngày)
                    </h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {modalState.quantityConflict.conflicts
                        .slice(0, 5)
                        .map((conflict, idx) => (
                          <div
                            key={idx}
                            className="bg-red-50 border border-red-200 rounded-lg p-3"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-red-800">
                                {conflict.date}
                              </span>
                              <span className="text-sm text-red-600">
                                Cần: {conflict.requiredQuantity} | Thiếu:{" "}
                                {conflict.deficit}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              {conflict.ordersOnDate?.length} đơn hàng vào ngày
                              này
                            </div>
                          </div>
                        ))}
                      {modalState.quantityConflict.conflicts.length > 5 && (
                        <p className="text-sm text-gray-500 text-center">
                          ... và{" "}
                          {modalState.quantityConflict.conflicts.length - 5}{" "}
                          ngày khác
                        </p>
                      )}
                    </div>
                  </div>
                )}

              {modalState.quantityConflict?.recommendation?.options && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">
                    Bạn có thể làm gì?
                  </h3>
                  <div className="space-y-3">
                    {modalState.quantityConflict.recommendation.options.map(
                      (option, idx) => (
                        <div
                          key={idx}
                          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                        >
                          <h4 className="font-medium text-blue-900 mb-1">
                            {option.title}
                          </h4>
                          <p className="text-sm text-blue-700 mb-2">
                            {option.description}
                          </p>
                          <p className="text-xs text-gray-600">
                            <strong>Hành động:</strong> {option.action}
                          </p>
                          {option.warning && (
                            <p className="text-xs text-orange-600 mt-2">
                              ⚠️ {option.warning}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setModalState({
                      isOpen: false,
                      type: null,
                      quantityConflict: null,
                      imageId: null,
                      message: null,
                    });
                  }}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : modalState.type === "imageValidationError" ? (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() =>
              setModalState({
                isOpen: false,
                type: null,
                imageId: null,
                message: null,
                details: null,
              })
            }
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
              <button
                onClick={() =>
                  setModalState({
                    isOpen: false,
                    type: null,
                    imageId: null,
                    message: null,
                    details: null,
                  })
                }
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>

              <div className="flex justify-center mb-4">
                <FiCheckCircle className="w-12 h-12 text-red-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Hình ảnh không hợp lệ
              </h3>

              <p className="text-gray-600 text-center mb-4">
                {modalState.message}
              </p>

              {modalState.details?.suggestion && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-700">
                    💡 {modalState.details.suggestion}
                  </p>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setModalState({
                      isOpen: false,
                      type: null,
                      imageId: null,
                      message: null,
                      details: null,
                    });
                  }}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ConfirmModal
          isOpen={modalState.isOpen}
          onClose={() => {
            setModalState({
              isOpen: false,
              type: null,
              imageId: null,
              message: null,
              quantityConflict: null,
              details: null,
            });
            if (modalState.type === "success") {
              navigate("/owner/products");
            }
          }}
          onConfirm={() => {
            if (modalState.type === "deleteImage") {
              confirmDeleteImage();
            } else if (modalState.type === "deleteVideo") {
              confirmDeleteVideo();
            } else if (modalState.type === "success") {
              navigate("/owner/products");
            } else {
              setModalState({
                isOpen: false,
                type: null,
                imageId: null,
                videoId: null,
                message: null,
                quantityConflict: null,
                details: null,
              });
            }
          }}
          type={modalState.type}
          title={
            modalState.type === "deleteImage"
              ? "Xóa Hình ảnh"
              : modalState.type === "deleteVideo"
              ? "Xóa Video"
              : modalState.type === "success"
              ? "Thành công"
              : modalState.type === "error"
              ? "Lỗi"
              : ""
          }
          message={
            modalState.message ||
            (modalState.type === "deleteImage"
              ? "Bạn có chắc chắn muốn xóa hình ảnh này không?"
              : "")
          }
          confirmText={
            modalState.type === "deleteImage" ||
            modalState.type === "deleteVideo"
              ? "Xóa"
              : "Đóng"
          }
          cancelText={
            modalState.type === "success" || modalState.type === "error"
              ? null
              : "Hủy"
          }
        />
      )}
    </div>
  );
}
