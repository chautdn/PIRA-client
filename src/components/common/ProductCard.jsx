import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Eye } from "lucide-react";
import promotionService from "../../services/promotion";

const ProductCard = ({ product }) => {
  // Get promotion tier badge
  const getTierBadge = () => {
    if (!product.isPromoted || !product.promotionTier) return null;

    const config = promotionService.TIER_CONFIG[product.promotionTier];
    if (!config) return null;

    // Special styling for Tier 1 (Premium)
    const isPremium = product.promotionTier === 1;

    return (
      <div
        className={`absolute top-2 right-2 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r ${
          config.color
        } text-white shadow-lg z-10 flex items-center gap-1 ${
          isPremium ? "animate-pulse" : ""
        }`}
      >
        <span className={isPremium ? "animate-bounce" : ""}>{config.icon}</span>
        <span>{config.badge}</span>
      </div>
    );
  };

  // Get card border and shadow classes based on promotion tier
  const getCardClasses = () => {
    if (!product.isPromoted || !product.promotionTier) {
      return "border border-gray-200 hover:shadow-lg";
    }

    const config = promotionService.TIER_CONFIG[product.promotionTier];

    const baseClasses = "relative border-2 transition-all duration-300";
    const tierClasses = {
      1: `${config.borderColor} shadow-2xl ${config.shadowColor} hover:shadow-yellow-300 hover:border-yellow-500 animate-glow-gold`,
      2: `${config.borderColor} shadow-xl ${config.shadowColor} hover:shadow-gray-300 hover:border-gray-500`,
      3: `${config.borderColor} shadow-lg ${config.shadowColor} hover:shadow-orange-200 hover:border-orange-500`,
      4: `${config.borderColor} shadow-md ${config.shadowColor} hover:shadow-blue-200 hover:border-blue-500`,
      5: `${config.borderColor} shadow-md ${config.shadowColor} hover:shadow-green-200 hover:border-green-500`,
    };

    return `${baseClasses} ${tierClasses[product.promotionTier] || ""}`;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Get main image
  const getMainImage = () => {
    if (!product.images || product.images.length === 0) {
      return "/images/placeholder-product.jpg";
    }

    if (typeof product.images[0] === "string") {
      return product.images[0];
    }

    return product.images[0]?.url || "/images/placeholder-product.jpg";
  };

  return (
    <Link
      to={`/product/${product._id || product.id}`}
      className={`rounded-xl overflow-hidden bg-white transition-all duration-300 block ${getCardClasses()}`}
    >
      {/* Promotion Badge */}
      {product.isPromoted && getTierBadge()}

      {/* Product Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={getMainImage()}
          alt={product.title}
          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />

        {/* View Count Overlay */}
        {product.metrics?.viewCount > 0 && (
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Eye size={12} />
            {product.metrics.viewCount}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
          {product.title}
        </h3>

        {/* Location */}
        {product.location?.address?.city && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
            <MapPin size={14} />
            <span className="truncate">{product.location.address.city}</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-2xl font-bold text-blue-600">
            {formatCurrency(product.pricing?.dailyRate || 0)}
          </span>
          <span className="text-sm text-gray-500">/day</span>
        </div>

        {/* Condition & Rating */}
        <div className="flex items-center justify-between text-sm">
          {product.condition && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                product.condition === "NEW"
                  ? "bg-green-100 text-green-700"
                  : product.condition === "LIKE_NEW"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {product.condition.replace("_", " ")}
            </span>
          )}

          {product.metrics?.averageRating > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span className="font-medium">
                {product.metrics.averageRating.toFixed(1)}
              </span>
              <span className="text-gray-500">
                ({product.metrics.reviewCount})
              </span>
            </div>
          )}
        </div>

        {/* Availability Status */}
        {product.availability?.isAvailable === false && (
          <div className="mt-2 text-xs text-red-600 font-medium">
            Currently Unavailable
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
