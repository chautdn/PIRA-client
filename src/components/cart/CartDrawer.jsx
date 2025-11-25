import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../context/CartContext";
import { ROUTES } from "../../utils/constants";
import CartItem from "./CartItem";

const CartDrawer = () => {
  const { cart, cartCount, cartTotal, isCartOpen, closeCart } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛒</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Giỏ Hàng</h2>
                  <p className="text-sm text-gray-500">{cartCount} sản phẩm</p>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-6xl mb-4">🛒</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Giỏ hàng trống
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Thêm sản phẩm vào giỏ để thuê
                  </p>
                  <Link
                    to={ROUTES.PRODUCTS}
                    onClick={closeCart}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Khám Phá Sản Phẩm
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Group items by owner */}
                  {Object.entries(
                    cart.reduce((groups, item) => {
                      const ownerId = item.product.owner?._id || 'unknown';
                      const ownerName = item.product.owner?.profile?.firstName || 'Chủ không rõ';
                      
                      if (!groups[ownerId]) {
                        groups[ownerId] = {
                          ownerName,
                          items: []
                        };
                      }
                      groups[ownerId].items.push(item);
                      return groups;
                    }, {})
                  ).map(([ownerId, group]) => (
                    <div key={ownerId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      {/* Owner Header */}
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-300">
                        <span className="text-blue-600">🏪</span>
                        <h3 className="font-medium text-gray-900">
                          Cửa hàng của {group.ownerName}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({group.items.length} sản phẩm)
                        </span>
                      </div>
                      
                      {/* Owner's Items */}
                      <div className="space-y-3">
                        {group.items.map((item) => (
                          <CartItem key={`${item.product._id}-${item._id}`} item={item} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer với Total và Checkout */}
            {cart.length > 0 && (
              <div className="border-t border-gray-200 p-6 space-y-4">
                {/* Subtotal */}
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Phí dịch vụ</span>
                    <span>Tính khi thanh toán</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-lg font-semibold text-gray-900">
                    Tổng cộng
                  </span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatPrice(cartTotal)}
                  </span>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                  <Link
                    to={ROUTES.CART}
                    onClick={closeCart}
                    className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                  >
                    Xem Giỏ Hàng & Thanh Toán
                  </Link>
                  <button
                    onClick={closeCart}
                    className="block w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 text-center py-3 rounded-xl font-semibold transition-all"
                  >
                    Tiếp Tục Mua Sắm
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;

