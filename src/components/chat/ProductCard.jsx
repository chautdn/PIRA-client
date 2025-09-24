import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const ProductCard = ({ product, isFirst = false }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const productDetailPath = `/product/${product._id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-200 shadow-sm ${
        isFirst ? "mb-4" : "mt-2 mb-2"
      }`}
    >
      <div className="flex items-center space-x-3">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={product.images?.[0]?.url || "/images/camera.png"}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "/images/camera.png";
              }}
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {product.title}
              </h4>
              <div className="mt-1">
                <span className="text-lg font-bold text-green-600">
                  {formatPrice(product.pricing?.dailyRate || 0)}đ
                </span>
                <span className="text-sm text-gray-500 ml-1">/ngày</span>
              </div>
              <div className="mt-1 flex items-center text-xs text-gray-500">
                <span className="mr-2">
                  📍 {product.location?.address?.city || "Đà Nẵng"}
                </span>
                <span>⭐ {product.metrics?.averageRating || 4.8}</span>
              </div>
            </div>

            {/* Action Button */}
            <Link
              to={productDetailPath}
              className="flex-shrink-0 ml-3 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>

      {/* Product description preview */}
      {product.description && (
        <div className="mt-3 pt-3 border-t border-blue-100">
          <p className="text-xs text-gray-600 line-clamp-2">
            {product.description.length > 100
              ? `${product.description.substring(0, 100)}...`
              : product.description}
          </p>
        </div>
      )}

      {/* Status Badge */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✅ Có sẵn
          </span>
          {product.condition && (
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                product.condition === "NEW"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {product.condition === "NEW" ? "🆕 Mới" : "👍 Tốt"}
            </span>
          )}
        </div>

        <div className="text-xs text-gray-400">
          💬 Đang thảo luận sản phẩm này
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
