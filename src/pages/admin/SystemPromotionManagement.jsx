import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import systemPromotionService from "../../services/systemPromotion";
import toast from "react-hot-toast";
import {
  Plus,
  Tag,
  Calendar,
  Edit,
  Trash2,
  Eye,
  TrendingDown,
} from "lucide-react";

const SystemPromotionManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadPromotions();
  }, [statusFilter]);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await systemPromotionService.getAll(params);
      setPromotions(response.metadata.promotions || []);
    } catch (error) {
      toast.error("Failed to load promotions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm("Are you sure you want to deactivate this promotion?")) return;

    try {
      await systemPromotionService.deactivate(id);
      toast.success("Promotion deactivated successfully");
      loadPromotions();
    } catch (error) {
      toast.error("Failed to deactivate promotion");
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      ACTIVE: "bg-green-100 text-green-800",
      DRAFT: "bg-gray-100 text-gray-800",
      EXPIRED: "bg-red-100 text-red-800",
      DEACTIVATED: "bg-orange-100 text-orange-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            System Promotions
          </h1>
          <p className="text-gray-600 mt-1">
            Manage shipping discount promotions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Promotion
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="EXPIRED">Expired</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Promotions List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : promotions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No promotions found
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first system promotion to get started
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Promotion
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {promotions.map((promotion) => (
            <motion.div
              key={promotion._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {promotion.title}
                    </h3>
                    {getStatusBadge(promotion.status)}
                  </div>

                  <p className="text-gray-600 mb-4">{promotion.description}</p>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="font-mono font-semibold text-blue-600">
                        {promotion.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingDown className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        {promotion.systemPromotion.discountType === "PERCENTAGE"
                          ? `${promotion.systemPromotion.shippingDiscountValue}%`
                          : `${promotion.systemPromotion.shippingDiscountValue.toLocaleString(
                              "vi-VN"
                            )} VND`}{" "}
                        off shipping
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        {formatDate(promotion.startDate)} -{" "}
                        {formatDate(promotion.endDate)}
                      </span>
                    </div>
                  </div>

                  {promotion.banner.displayOnHome && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      <Eye className="w-3 h-3" />
                      Displayed on homepage
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setSelectedPromotion(promotion)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPromotion(promotion);
                      setShowCreateModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                    disabled={promotion.status === "DEACTIVATED"}
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeactivate(promotion._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Deactivate"
                    disabled={promotion.status === "DEACTIVATED"}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePromotionModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadPromotions();
            }}
          />
        )}
      </AnimatePresence>

      {/* View Details Modal */}
      <AnimatePresence>
        {selectedPromotion && (
          <ViewPromotionModal
            promotion={selectedPromotion}
            onClose={() => setSelectedPromotion(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Create Promotion Modal Component
const CreatePromotionModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    // No code needed - system promotions auto-apply
    startDate: "",
    endDate: "",
    systemPromotion: {
      shippingDiscountValue: "",
      discountType: "PERCENTAGE",
      applyTo: "ALL_ORDERS",
      minOrderValue: 0,
    },
    banner: {
      displayOnHome: true,
      bannerTitle: "",
      bannerDescription: "",
      bannerImage: "",
      backgroundColor: "#4F46E5",
      textColor: "#FFFFFF",
    },
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      console.log("📤 Form data being submitted:", formData);

      // Validate
      if (!formData.title || !formData.startDate || !formData.endDate) {
        toast.error("Please fill in all required fields");
        setLoading(false);
        return;
      }

      if (
        !formData.systemPromotion.shippingDiscountValue ||
        formData.systemPromotion.shippingDiscountValue <= 0
      ) {
        toast.error("Discount value must be greater than 0");
        setLoading(false);
        return;
      }

      console.log("✅ Validation passed, sending to API...");
      const response = await systemPromotionService.create(formData);
      console.log("✅ API response:", response);
      toast.success(
        "Promotion created successfully! Users have been notified."
      );
      onSuccess();
    } catch (error) {
      console.error("❌ Error creating promotion:", error);
      console.error("❌ Error response:", error.response?.data);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create promotion";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("systemPromotion.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        systemPromotion: {
          ...prev.systemPromotion,
          [field]: type === "number" ? parseFloat(value) : value,
        },
      }));
    } else if (name.startsWith("banner.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        banner: {
          ...prev.banner,
          [field]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">
            Create System Promotion
          </h2>
          <p className="text-gray-600 mt-1">
            Create a new shipping discount promotion
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Basic Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., 50% Off Shipping"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the promotion details..."
                rows="3"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Note:</strong> System promotions automatically apply
                to all eligible orders during the promotion period. No code
                needed!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Discount Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Discount Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type
                </label>
                <select
                  name="systemPromotion.discountType"
                  value={formData.systemPromotion.discountType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED_AMOUNT">Fixed Amount (VND)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="systemPromotion.shippingDiscountValue"
                  value={formData.systemPromotion.shippingDiscountValue}
                  onChange={handleChange}
                  placeholder={
                    formData.systemPromotion.discountType === "PERCENTAGE"
                      ? "e.g., 50"
                      : "e.g., 20000"
                  }
                  min="0"
                  max={
                    formData.systemPromotion.discountType === "PERCENTAGE"
                      ? "100"
                      : undefined
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apply To
              </label>
              <select
                name="systemPromotion.applyTo"
                value={formData.systemPromotion.applyTo}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL_ORDERS">All Orders</option>
                <option value="FIRST_ORDER">First Order Only</option>
                <option value="MIN_ORDER_VALUE">Minimum Order Value</option>
              </select>
            </div>

            {formData.systemPromotion.applyTo === "MIN_ORDER_VALUE" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Order Value (VND)
                </label>
                <input
                  type="number"
                  name="systemPromotion.minOrderValue"
                  value={formData.systemPromotion.minOrderValue}
                  onChange={handleChange}
                  placeholder="e.g., 100000"
                  min="0"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Banner Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Banner Settings</h3>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="banner.displayOnHome"
                checked={formData.banner.displayOnHome}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Display banner on homepage
              </label>
            </div>

            {formData.banner.displayOnHome && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banner Title
                  </label>
                  <input
                    type="text"
                    name="banner.bannerTitle"
                    value={formData.banner.bannerTitle}
                    onChange={handleChange}
                    placeholder="e.g., 🎉 50% OFF SHIPPING!"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banner Description
                  </label>
                  <input
                    type="text"
                    name="banner.bannerDescription"
                    value={formData.banner.bannerDescription}
                    onChange={handleChange}
                    placeholder="e.g., Limited time offer - Don't miss out!"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Background Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        name="banner.backgroundColor"
                        value={formData.banner.backgroundColor}
                        onChange={handleChange}
                        className="w-12 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={formData.banner.backgroundColor}
                        onChange={(e) =>
                          handleChange({
                            target: {
                              name: "banner.backgroundColor",
                              value: e.target.value,
                            },
                          })
                        }
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                        placeholder="#4F46E5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Text Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        name="banner.textColor"
                        value={formData.banner.textColor}
                        onChange={handleChange}
                        className="w-12 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={formData.banner.textColor}
                        onChange={(e) =>
                          handleChange({
                            target: {
                              name: "banner.textColor",
                              value: e.target.value,
                            },
                          })
                        }
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                </div>

                {/* Banner Preview */}
                <div className="border rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Banner Preview:
                  </p>
                  <div
                    className="rounded-lg p-6 text-center"
                    style={{
                      backgroundColor: formData.banner.backgroundColor,
                      color: formData.banner.textColor,
                    }}
                  >
                    <h3 className="text-2xl font-bold mb-2">
                      {formData.banner.bannerTitle || formData.title}
                    </h3>
                    <p className="text-lg">
                      {formData.banner.bannerDescription ||
                        formData.description}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Promotion"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// View Promotion Modal Component
const ViewPromotionModal = ({ promotion, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {promotion.title}
              </h2>
              <p className="text-gray-600 mt-1">{promotion.code}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600">{promotion.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  promotion.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {promotion.status}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Discount</h3>
              <p className="text-gray-900 font-medium">
                {promotion.systemPromotion.discountType === "PERCENTAGE"
                  ? `${promotion.systemPromotion.shippingDiscountValue}% off`
                  : `${promotion.systemPromotion.shippingDiscountValue.toLocaleString(
                      "vi-VN"
                    )} VND off`}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Duration</h3>
            <p className="text-gray-600">
              {new Date(promotion.startDate).toLocaleDateString("vi-VN")} -{" "}
              {new Date(promotion.endDate).toLocaleDateString("vi-VN")}
            </p>
          </div>

          {promotion.banner.displayOnHome && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Banner Preview
              </h3>
              <div
                className="rounded-lg p-6 text-center"
                style={{
                  backgroundColor: promotion.banner.backgroundColor,
                  color: promotion.banner.textColor,
                }}
              >
                <h3 className="text-2xl font-bold mb-2">
                  {promotion.banner.bannerTitle}
                </h3>
                <p className="text-lg">{promotion.banner.bannerDescription}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t">
          <button
            onClick={onClose}
            className="w-full px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SystemPromotionManagement;
