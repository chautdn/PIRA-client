import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ownerProductApi } from "../../services/ownerProduct.Api";
import { FiArrowLeft, FiSave, FiImage, FiX } from "react-icons/fi";
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
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    imageId: null,
    message: null,
  });

  useEffect(() => {
    loadProduct();
    checkPricingEditPermission();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const res = await ownerProductApi.getOwnerProductById(productId);

      if (res.success) {
        setProduct(res.data);
        setFormData({
          title: res.data.title || "",
          description: res.data.description || "",
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

    if (files.length + (product?.images?.length || 0) + newImages.length > 10) {
      setModalState({
        isOpen: true,
        type: "error",
        message: "Tối đa 10 hình ảnh. Vui lòng xóa một số hình ảnh hiện tại trước khi thêm mới.",
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
    setModalState({
      isOpen: true,
      type: "deleteImage",
      imageId: imageId,
    });
  };

  const confirmDeleteImage = async () => {
    try {
      await ownerProductApi.deleteImage(productId, modalState.imageId);
      setProduct((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img._id !== modalState.imageId),
      }));
      setModalState({ isOpen: false, type: null, imageId: null });
    } catch (err) {
      console.error("Error deleting image:", err);
      setModalState({
        isOpen: true,
        type: "error",
        message: err.message || "Không thể xóa hình ảnh",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const updateData = new FormData();
      updateData.append("title", formData.title);
      updateData.append("description", formData.description);

      // Add new images if any
      newImages.forEach((image) => {
        updateData.append("images", image);
      });

      const res = await ownerProductApi.updateProductSafeFields(
        productId,
        updateData
      );

      if (res.success) {
        setModalState({
          isOpen: true,
          type: "success",
          message: "Cập nhật sản phẩm thành công!",
        });
      }
    } catch (err) {
      console.error("Error updating product:", err);
      setError(err.message || "Không thể cập nhật sản phẩm");
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
      setError(err.message || "Không thể cập nhật giá");
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
          <h1 className="text-3xl font-bold text-gray-900">Chỉnh Sửa Sản Phẩm</h1>
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
                Bạn có thể cập nhật tên, mô tả và hình ảnh sản phẩm bất kỳ lúc nào. 
                {canEditPricing ? (
                  <strong className="text-green-700"> Giá cả có thể được chỉnh sửa vì sản phẩm không có yêu cầu thuê đang chờ hoặc đang được thuê.</strong>
                ) : (
                  <strong className="text-orange-700"> Giá cả không thể thay đổi vì sản phẩm có yêu cầu thuê đang chờ xử lý hoặc đang được thuê.</strong>
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

          {/* Existing Images */}
          {product?.images && product.images.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Hình ảnh Hiện tại ({product.images.length})
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {product.images.map((image) => (
                  <div key={image._id} className="relative group">
                    <img
                      src={typeof image === "string" ? image : image.url}
                      alt={image.alt || "Hình ảnh sản phẩm"}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(image._id)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                    >
                      <FiX size={16} />
                    </button>
                    {image.isMain && (
                      <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                        Chính
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Thêm Hình ảnh Mới (Không bắt buộc)
            </label>

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

          {/* Read-only Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Thông tin Sản phẩm (Chỉ đọc)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Danh mục:</span>
                <span className="ml-2 font-medium">
                  {product?.category?.name}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Tình trạng:</span>
                <span className="ml-2 font-medium">{product?.condition}</span>
              </div>
            </div>
          </div>

          {/* Pricing Section - Editable if allowed */}
          {canEditPricing ? (
            <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-green-900">
                  💰 Cập Nhật Giá
                </h3>
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                  Có thể chỉnh sửa
                </span>
              </div>
              <p className="text-sm text-green-700 mb-4">
                Sản phẩm không có yêu cầu thuê đang chờ xử lý hoặc đang được thuê. Bạn có thể cập nhật giá.
              </p>

              <form onSubmit={handlePricingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá thuê / ngày <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="dailyRate"
                      value={pricingData.dailyRate}
                      onChange={handlePricingChange}
                      required
                      min="0"
                      step="1000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Nhập giá thuê mỗi ngày"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đặt cọc <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="depositAmount"
                      value={pricingData.depositAmount}
                      onChange={handlePricingChange}
                      required
                      min="0"
                      step="1000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Số tiền đặt cọc"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {saving ? "Đang cập nhật..." : "💾 Cập Nhật Giá"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Thông tin Giá (Chỉ đọc)
                </h3>
                {checkingPricing ? (
                  <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full">
                    Đang kiểm tra...
                  </span>
                ) : (
                  <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded-full">
                    Không thể chỉnh sửa
                  </span>
                )}
              </div>
              <p className="text-xs text-orange-600 mb-3 bg-orange-50 p-2 rounded">
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
                {product?.pricing?.weeklyRate && (
                  <div>
                    <span className="text-gray-600">Giá thuê / tuần:</span>
                    <span className="ml-2 font-medium">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(product?.pricing?.weeklyRate)}
                    </span>
                  </div>
                )}
                {product?.pricing?.monthlyRate && (
                  <div>
                    <span className="text-gray-600">Giá thuê / tháng:</span>
                    <span className="ml-2 font-medium">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(product?.pricing?.monthlyRate)}
                    </span>
                  </div>
                )}
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

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
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
            <Link
              to="/owner/products"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Hủy
            </Link>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={() => {
          setModalState({ isOpen: false, type: null, imageId: null, message: null });
          if (modalState.type === "success") {
            navigate("/owner/products");
          }
        }}
        onConfirm={() => {
          if (modalState.type === "deleteImage") {
            confirmDeleteImage();
          } else if (modalState.type === "success") {
            navigate("/owner/products");
          }
        }}
        type={modalState.type}
        title={
          modalState.type === "deleteImage"
            ? "Xóa Hình ảnh"
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
          modalState.type === "deleteImage"
            ? "Xóa"
            : "Đóng"
        }
        cancelText={
          modalState.type === "success" || modalState.type === "error" ? null : "Hủy"
        }
      />
    </div>
  );
}
