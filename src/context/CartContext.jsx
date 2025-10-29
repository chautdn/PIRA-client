import React, { createContext, useContext, useState, useEffect } from "react";
import { cartService } from "../services/cart";
import { cartApiService } from "../services/cartApi";
import { STORAGE_KEYS } from "../utils/constants";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  };

  // Load cart khi component mount
  useEffect(() => {
    loadCart();
  }, []);

  // Load cart from backend or localStorage
  const loadCart = async () => {
    try {
      setLoading(true);
      let cartItems = [];

      if (isAuthenticated()) {
        try {
          // Try to load from backend
          cartItems = await cartApiService.getCart();
        } catch (error) {
          console.error("Error loading cart from backend:", error);
          // If error, set empty cart
          cartItems = [];
        }
      } else {
        // Guest users have no cart
        cartItems = [];
      }

      setCart(cartItems);
      updateCartStats(cartItems);
    } catch (error) {
      console.error("Error loading cart:", error);
      const localCart = cartService.getCart();
      setCart(localCart);
      updateCartStats(localCart);
    } finally {
      setLoading(false);
    }
  };

  // Update cart stats
  const updateCartStats = (currentCart) => {
    const count = currentCart.reduce((total, item) => total + item.quantity, 0);
    const total = currentCart.reduce((sum, item) => {
      const price = item.product.pricing?.dailyRate || 0;
      const days = item.rental?.duration || 1;
      return sum + price * days * item.quantity;
    }, 0);

    setCartCount(count);
    setCartTotal(total);
  };

  // Add to cart
  const addToCart = async (product, quantity = 1, rental = null) => {
    try {
      setLoading(true);
      
      // Check if user is logged in
      if (!isAuthenticated()) {
        return { 
          success: false, 
          error: "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng",
          requireLogin: true 
        };
      }
      
      // Validation
      const maxQuantity = product.availability?.quantity || 1;
      
      if (quantity < 1) {
        return { success: false, error: "Số lượng phải lớn hơn 0" };
      }
      
      if (quantity > maxQuantity) {
        return { 
          success: false, 
          error: `Chỉ còn ${maxQuantity} sản phẩm có sẵn` 
        };
      }

      // Validate rental dates
      if (rental) {
        if (!rental.startDate || !rental.endDate) {
          return { 
            success: false, 
            error: "Vui lòng chọn ngày thuê" 
          };
        }

        const start = new Date(rental.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
          return { 
            success: false, 
            error: "Ngày bắt đầu phải từ hôm nay trở đi" 
          };
        }

        if (rental.duration < 1) {
          return { 
            success: false, 
            error: "Thời gian thuê phải ít nhất 1 ngày" 
          };
        }
      }

      let cartItems = [];
      let warning = null;

      if (isAuthenticated()) {
        try {
          // Add to backend
          const result = await cartApiService.addToCart(product._id, quantity, rental);
          cartItems = result.items || result; // Handle both new and old format
          warning = result.warning;
        } catch (error) {
          console.error("Backend error:", error);
          return { success: false, error: error.response?.data?.message || "Không thể thêm vào giỏ hàng" };
        }
      } else {
        // Should not reach here due to check above, but just in case
        return { success: false, error: "Vui lòng đăng nhập", requireLogin: true };
      }

      setCart(cartItems);
      updateCartStats(cartItems);
      setIsCartOpen(true);
      return { success: true, warning: warning };
    } catch (error) {
      console.error("Add to cart error:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Remove from cart
  const removeFromCart = async (productId) => {
    try {
      setLoading(true);
      
      if (!isAuthenticated()) {
        return { success: false, error: "Vui lòng đăng nhập" };
      }
      
      let cartItems = [];

      try {
        cartItems = await cartApiService.removeItem(productId);
      } catch (error) {
        console.error("Backend error:", error);
        return { success: false, error: "Không thể xóa sản phẩm" };
      }

      setCart(cartItems);
      updateCartStats(cartItems);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update quantity
  const updateQuantity = async (productId, quantity) => {
    try {
      setLoading(true);
      
      if (!isAuthenticated()) {
        return { success: false, error: "Vui lòng đăng nhập" };
      }
      
      // Validation: tìm sản phẩm trong cart để kiểm tra quantity available
      const currentItem = cart.find(item => item.product._id === productId);
      if (!currentItem) {
        return { success: false, error: "Sản phẩm không tồn tại trong giỏ hàng" };
      }

      const maxQuantity = currentItem.product.availability?.quantity || 1;
      
      // Validate quantity
      if (quantity < 1) {
        return { success: false, error: "Số lượng phải lớn hơn 0" };
      }
      
      if (quantity > maxQuantity) {
        return { 
          success: false, 
          error: `Số lượng tối đa là ${maxQuantity}` 
        };
      }

      let cartItems = [];

      try {
        cartItems = await cartApiService.updateQuantity(productId, quantity);
      } catch (error) {
        console.error("Backend error:", error);
        return { success: false, error: "Không thể cập nhật số lượng" };
      }

      setCart(cartItems);
      updateCartStats(cartItems);
      return { success: true };
    } catch (error) {
      console.error("Update quantity error:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update rental dates
  const updateRental = (productId, rental) => {
    const cartItems = [...cart];
    const itemIndex = cartItems.findIndex(
      (item) => item.product._id === productId
    );

    if (itemIndex > -1) {
      cartItems[itemIndex].rental = rental;
      
      // Save to localStorage or backend
      if (isAuthenticated()) {
        // TODO: Implement backend API for updating rental
        cartService.saveCart(cartItems);
      } else {
        cartService.saveCart(cartItems);
      }

      setCart(cartItems);
      updateCartStats(cartItems);
      return { success: true };
    }
    
    return { success: false, error: "Product not found in cart" };
  };

  // Clear cart
  const clearCart = async () => {
    try {
      setLoading(true);

      if (!isAuthenticated()) {
        return { success: false, error: "Vui lòng đăng nhập" };
      }

      try {
        await cartApiService.clearCart();
      } catch (error) {
        console.error("Backend error:", error);
        return { success: false, error: "Không thể xóa giỏ hàng" };
      }
      
      setCart([]);
      setCartCount(0);
      setCartTotal(0);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sync cart when user logs in
  const syncCart = async () => {
    try {
      setLoading(true);
      const localCart = cartService.getCart();
      
      if (localCart.length === 0 || !isAuthenticated()) {
        return { success: true };
      }

      // Sync to backend
      const syncedCart = await cartApiService.syncCart(localCart);
      
      // Clear localStorage after successful sync
      cartService.clearCart();
      
      setCart(syncedCart);
      updateCartStats(syncedCart);
      return { success: true };
    } catch (error) {
      console.error("Error syncing cart:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Refresh cart from backend
  const refreshCart = async () => {
    await loadCart();
  };

  // Toggle cart drawer
  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Check if product is in cart
  const isInCart = (productId) => {
    return cart.some((item) => item.product._id === productId);
  };

  // Get product quantity
  const getProductQuantity = (productId) => {
    const item = cart.find((item) => item.product._id === productId);
    return item ? item.quantity : 0;
  };

  const value = {
    cart,
    cartCount,
    cartTotal,
    isCartOpen,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateRental,
    clearCart,
    syncCart,
    refreshCart,
    toggleCart,
    openCart,
    closeCart,
    isInCart,
    getProductQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
