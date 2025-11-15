import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ownerProductApi } from "../../services/ownerProduct.Api";
import { FiArrowLeft, FiSave, FiImage, FiX } from "react-icons/fi";

export default function OwnerProductEdit() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    loadProduct();
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
      }
    } catch (err) {
      console.error("Error loading product:", err);
      setError("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + (product?.images?.length || 0) + newImages.length > 10) {
      alert("Maximum 10 images allowed");
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

  const removeExistingImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      await ownerProductApi.deleteImage(productId, imageId);
      setProduct((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img._id !== imageId),
      }));
    } catch (err) {
      console.error("Error deleting image:", err);
      alert("Failed to delete image");
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
        alert("Product updated successfully!");
        navigate("/owner/products");
      }
    } catch (err) {
      console.error("Error updating product:", err);
      setError(err.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
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
            Back to Products
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
            Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600 mt-2">
            Update product name, description, and images
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
                Limited Editing Mode
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                You can only update the product name, description, and images.
                Pricing, category, and other critical fields cannot be changed
                to ensure fairness to existing rental agreements.
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
              Product Name *
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
              placeholder="Enter product name"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
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
              placeholder="Describe your product..."
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.description.length}/2000 characters
            </p>
          </div>

          {/* Existing Images */}
          {product?.images && product.images.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Current Images ({product.images.length})
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {product.images.map((image) => (
                  <div key={image._id} className="relative group">
                    <img
                      src={typeof image === "string" ? image : image.url}
                      alt={image.alt || "Product"}
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
                        Main
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
              Add New Images (Optional)
            </label>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`New ${index + 1}`}
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
                      New
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
                  Click to upload images
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PNG, JPG up to 10MB (Max 10 images total)
                </span>
              </label>
            </div>
          </div>

          {/* Read-only Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Product Information (Read-only)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Category:</span>
                <span className="ml-2 font-medium">
                  {product?.category?.name}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Condition:</span>
                <span className="ml-2 font-medium">{product?.condition}</span>
              </div>
              <div>
                <span className="text-gray-600">Daily Rate:</span>
                <span className="ml-2 font-medium">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(product?.pricing?.dailyRate || 0)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Deposit:</span>
                <span className="ml-2 font-medium">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(product?.pricing?.deposit?.amount || 0)}
                </span>
              </div>
            </div>
          </div>

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
                  Saving...
                </>
              ) : (
                <>
                  <FiSave />
                  Save Changes
                </>
              )}
            </button>
            <Link
              to="/owner/products"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
