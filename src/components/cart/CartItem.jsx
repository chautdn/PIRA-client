import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useCart } from "../../context/CartContext";
import { ROUTES } from "../../utils/constants";

const CartItem = ({ item }) => {
  const { t } = useTranslation();
  const { updateQuantity, removeFromCart } = useCart();
  const { product, quantity, rental } = item;

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) {
      handleRemove();
    } else {
      updateQuantity(product._id, newQuantity);
    }
  };

  const handleRemove = () => {
    if (window.confirm(t('cart.confirmRemove'))) {
      removeFromCart(product._id);
    }
  };

  const dailyRate = product.pricing?.dailyRate || 0;
  const days = rental?.duration || 1;
  const itemTotal = dailyRate * days * quantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
    >
      {/* Image */}
      <Link
        to={ROUTES.PRODUCT_DETAIL.replace(":id", product._id)}
        className="flex-shrink-0"
      >
        <img
          src={product.images?.[0]?.url || "/images/placeholder.jpg"}
          alt={product.title}
          className="w-24 h-24 object-cover rounded-lg"
        />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          to={ROUTES.PRODUCT_DETAIL.replace(":id", product._id)}
          className="block"
        >
          <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-2 mb-1">
            {product.title}
          </h3>
        </Link>

        <div className="text-sm text-gray-600 mb-2">
          <div>{formatPrice(dailyRate)}{t('cart.pricePerDay')}</div>
          {rental?.duration > 0 && (
            <div className="text-xs text-gray-500">
              {rental.duration} {t('cart.days')} {t('cart.rentalDuration').toLowerCase()}
            </div>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              className="px-3 py-1 hover:bg-gray-200 transition-colors text-gray-700"
            >
              −
            </button>
            <span className="px-4 py-1 bg-white text-center min-w-[40px] border-x border-gray-300">
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              className="px-3 py-1 hover:bg-gray-200 transition-colors text-gray-700"
            >
              +
            </button>
          </div>

          <button
            onClick={handleRemove}
            className="text-red-500 hover:text-red-700 p-1 transition-colors"
            title={t('cart.removeItem')}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        {/* Item Total */}
        <div className="mt-2 text-right font-bold text-primary-600">
          {formatPrice(itemTotal)}
        </div>
      </div>
    </motion.div>
  );
};

export default CartItem;

