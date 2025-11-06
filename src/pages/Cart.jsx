import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import { ROUTES } from "../utils/constants";

const Cart = () => {
  const { cart, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Tính phí nền tảng (5-10% tùy loại sản phẩm)
  const calculatePlatformFee = () => {
    return cart.reduce((total, item) => {
      const { product, quantity, rental } = item;
      const dailyRate = product.pricing?.dailyRate || 0;
      const days = rental?.duration || 1;
      const itemTotal = dailyRate * days * quantity;
      
      // Phí nền tảng: 5% cho sản phẩm thông thường, 10% cho sản phẩm cao cấp
      const feeRate = product.pricing?.dailyRate > 500000 ? 0.10 : 0.05;
      return total + (itemTotal * feeRate);
    }, 0);
  };

  const platformFee = calculatePlatformFee();
  const finalTotal = cartTotal + platformFee;

  const handleCheckout = () => {
    // TODO: Implement checkout logic
    alert("Chức năng thanh toán đang được phát triển!");
  };

  const handleClearCart = () => {
    if (window.confirm("Bạn có chắc muốn xóa toàn bộ giỏ hàng?")) {
      clearCart();
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-md w-full text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-8xl mb-6">🛒</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Giỏ Hàng Trống
            </h1>
            <p className="text-gray-600 mb-8">
              Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các sản phẩm của chúng tôi!
            </p>
            <Link
              to={ROUTES.PRODUCTS}
              className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              <span className="mr-2">🔍</span>
              Khám Phá Sản Phẩm
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Giỏ Hàng</h1>
          <p className="text-gray-600">
            Bạn có {cart.length} sản phẩm trong giỏ hàng
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
              {/* Clear Cart Button */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Sản Phẩm ({cart.length})
                </h2>
                <button
                  onClick={handleClearCart}
                  className="text-red-500 hover:text-red-700 text-sm font-semibold transition-colors"
                >
                  Xóa Tất Cả
                </button>
              </div>

              {/* Cart Items List */}
              <div className="space-y-4">
                {cart.map((item) => {
                  const { product, quantity, rental } = item;
                  const dailyRate = product.pricing?.dailyRate || 0;
                  const days = rental?.duration || 1;
                  const itemTotal = dailyRate * days * quantity;

                  return (
                    <motion.div
                      key={product._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex gap-6 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      {/* Image */}
                      <Link
                        to={ROUTES.PRODUCT_DETAIL.replace(":id", product._id)}
                        className="flex-shrink-0"
                      >
                        <img
                          src={product.images?.[0]?.url || "/images/placeholder.jpg"}
                          alt={product.title}
                          className="w-32 h-32 object-cover rounded-xl"
                        />
                      </Link>

                      {/* Info */}
                      <div className="flex-1">
                        <Link
                          to={ROUTES.PRODUCT_DETAIL.replace(":id", product._id)}
                          className="block mb-2"
                        >
                          <h3 className="font-bold text-lg text-gray-900 hover:text-primary-600 transition-colors line-clamp-2">
                            {product.title}
                          </h3>
                        </Link>

                        <div className="text-gray-600 mb-4">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatPrice(dailyRate)}<span className="text-sm font-normal text-gray-500">/ngày</span>
                          </div>
                          {rental && (
                            <div className="text-sm text-gray-600 mt-2 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-blue-500">📅</span>
                                <span>Thuê: <strong>{days} ngày</strong></span>
                              </div>
                              {rental.startDate && (
                                <div className="text-xs text-gray-500">
                                  {new Date(rental.startDate).toLocaleDateString('vi-VN')} 
                                  {' → '}
                                  {new Date(rental.endDate).toLocaleDateString('vi-VN')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center bg-gray-50 rounded-lg overflow-hidden border-2 border-gray-200">
                            <button
                              onClick={() => updateQuantity(product._id, Math.max(1, quantity - 1))}
                              disabled={quantity <= 1}
                              className="px-4 py-2 hover:bg-gray-200 transition-colors font-bold text-xl disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Giảm số lượng"
                            >
                              −
                            </button>
                            <span className="px-6 py-2 bg-white text-center min-w-[60px] font-bold text-lg">
                              {quantity}
                            </span>
                            <button
                              onClick={() => {
                                const maxQty = product.availability?.quantity || 1;
                                if (quantity < maxQty) {
                                  updateQuantity(product._id, quantity + 1);
                                }
                              }}
                              disabled={quantity >= (product.availability?.quantity || 1)}
                              className="px-4 py-2 hover:bg-gray-200 transition-colors font-bold text-xl disabled:opacity-30 disabled:cursor-not-allowed"
                              title={`Tăng số lượng (tối đa: ${product.availability?.quantity || 1})`}
                            >
                              +
                            </button>
                          </div>

                          <div className="text-xs text-gray-500">
                            Tối đa: {product.availability?.quantity || 1} cái
                          </div>

                          <button
                            onClick={() => removeFromCart(product._id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all ml-auto"
                            title="Xóa sản phẩm"
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
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600">
                          {formatPrice(itemTotal)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Tóm Tắt Đơn Hàng
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span className="font-semibold">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí nền tảng</span>
                  <span className="font-semibold text-orange-600">{formatPrice(platformFee)}</span>
                </div>
                <div className="text-xs text-gray-500 ml-4">
                  (5% cho sản phẩm thường, 10% cho sản phẩm cao cấp)
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Giảm giá</span>
                  <span className="text-green-600 font-semibold">-0₫</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Tổng cộng
                  </span>
                  <span className="text-3xl font-bold text-green-600">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/rental-orders/create')}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl mb-4"
              >
                📋 Tạo Đơn Thuê
              </button>

              <Link
                to={ROUTES.PRODUCTS}
                className="block w-full text-center border-2 border-green-500 hover:border-green-600 text-green-600 hover:text-green-700 hover:bg-green-50 py-3 rounded-xl font-semibold transition-all"
              >
                ← Tiếp Tục Mua Sắm
              </Link>

              {/* Security Info */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>🔒</span>
                  <span>Thanh toán bảo mật 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Hỗ trợ 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🚚</span>
                  <span>Miễn phí vận chuyển</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

