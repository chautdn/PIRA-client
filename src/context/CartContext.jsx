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
  const [cartData, setCartData] = useState(null); // Full cart data from backend

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
          const response = await cartApiService.getCart();
          cartItems = response.items || [];
          setCartData(response); // Store full response including expiredItems
        } catch (error) {
          console.error("Error loading cart from backend:", error);
          // If error, set empty cart
          cartItems = [];
          setCartData(null);
        }
      } else {
        // Guest users have no cart
        cartItems = [];
        setCartData(null);
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
      
      // Validation quantity
      const maxStock = product.availability?.quantity || 0;
      
      if (quantity < 1) {
        return { success: false, error: "Số lượng phải lớn hơn 0" };
      }
      
      if (quantity > maxStock) {
        return { 
          success: false, 
          error: `Số lượng không được vượt quá ${maxStock} cái` 
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
        const now = new Date();
        
        // Kiểm tra thời gian: trước 12h trưa có thể chọn hôm nay, sau 12h phải chọn ngày mai
        const minStartDate = new Date();
        if (now.getHours() >= 12) {
          minStartDate.setDate(minStartDate.getDate() + 1);
        }
        minStartDate.setHours(0, 0, 0, 0);

        if (start < minStartDate) {
          const timeMessage = now.getHours() >= 12 
            ? "Sau 12h trưa, ngày bắt đầu phải từ ngày mai trở đi"
            : "Ngày bắt đầu phải từ hôm nay trở đi";
          return { 
            success: false, 
            error: timeMessage
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

  // Remove from cart by itemId
  const removeFromCartById = async (itemId) => {
    try {
      setLoading(true);
      
      if (!isAuthenticated()) {
        return { success: false, error: "Vui lòng đăng nhập" };
      }
      
      let cartItems = [];

      try {
        cartItems = await cartApiService.removeItemById(itemId);
      } catch (error) {
        console.error("Backend error:", error);
        return { success: false, error: error.response?.data?.message || "Không thể xóa item" };
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

  // Remove from cart by productId (removes all items with this productId)
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

  // Update quantity by itemId (new method for multiple items per product)
  const updateQuantityByItemId = async (itemId, quantity) => {
    try {
      setLoading(true);
      
      if (!isAuthenticated()) {
        return { success: false, error: "Vui lòng đăng nhập" };
      }
      
      // Find item by itemId
      const currentItem = cart.find(item => item._id === itemId);
      if (!currentItem) {
        return { success: false, error: "Item không tồn tại trong giỏ hàng" };
      }

      if (quantity < 1) {
        return { success: false, error: "Số lượng phải lớn hơn 0" };
      }

      let cartItems = [];

      try {
        cartItems = await cartApiService.updateQuantityByItemId(itemId, quantity);
      } catch (error) {
        console.error("Backend error:", error);
        return { success: false, error: error.response?.data?.message || "Không thể cập nhật số lượng" };
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

  // Update quantity (legacy method - works with first item found)
  const updateQuantity = async (productId, quantity) => {
    const item = cart.find(item => item.product._id === productId);
    if (!item) {
      return { success: false, error: "Sản phẩm không tồn tại trong giỏ hàng" };
    }
    return updateQuantityByItemId(item._id, quantity);
  };

  // Update rental dates
  const updateRental = async (productId, rental) => {
    try {
      setLoading(true);
      
      if (!isAuthenticated()) {
        return { success: false, error: "Vui lòng đăng nhập" };
      }

      // Validation rental dates
      if (!rental || !rental.startDate || !rental.endDate) {
        return { success: false, error: "Vui lòng chọn ngày thuê hợp lệ" };
      }

      const startDate = new Date(rental.startDate);
      const endDate = new Date(rental.endDate);
      const now = new Date();
      
      // Kiểm tra thời gian: trước 12h trưa có thể chọn hôm nay, sau 12h phải chọn ngày mai
      const minStartDate = new Date();
      if (now.getHours() >= 12) {
        minStartDate.setDate(minStartDate.getDate() + 1);
      }
      minStartDate.setHours(0, 0, 0, 0);

      if (startDate < minStartDate) {
        const timeMessage = now.getHours() >= 12 
          ? "Sau 12h trưa, ngày bắt đầu phải từ ngày mai trở đi"
          : "Ngày bắt đầu phải từ hôm nay trở đi";
        return { success: false, error: timeMessage };
      }

      if (endDate <= startDate) {
        return { success: false, error: "Ngày kết thúc phải sau ngày bắt đầu" };
      }

      let cartItems = [];

      try {
        cartItems = await cartApiService.updateRental(productId, rental);
      } catch (error) {
        console.error("Backend error:", error);
        return { success: false, error: error.response?.data?.message || "Không thể cập nhật thời gian thuê" };
      }

      setCart(cartItems);
      updateCartStats(cartItems);
      return { success: true };
    } catch (error) {
      console.error("Update rental error:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update rental dates by itemId
  const updateRentalByItemId = async (itemId, rental) => {
    try {
      setLoading(true);
      
      if (!isAuthenticated()) {
        return { success: false, error: "Vui lòng đăng nhập" };
      }

      // Validation rental dates
      if (!rental || !rental.startDate || !rental.endDate) {
        return { success: false, error: "Vui lòng chọn ngày thuê hợp lệ" };
      }

      const startDate = new Date(rental.startDate);
      const endDate = new Date(rental.endDate);

      if (endDate <= startDate) {
        return { success: false, error: "Ngày kết thúc phải sau ngày bắt đầu" };
      }

      let cartItems = [];

      try {
        cartItems = await cartApiService.updateRentalByItemId(itemId, rental);
      } catch (error) {
        console.error("Backend error:", error);
        return { success: false, error: error.response?.data?.message || "Không thể cập nhật thời gian thuê" };
      }

      setCart(cartItems);
      updateCartStats(cartItems);
      return { success: true };
    } catch (error) {
      console.error("Update rental error:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
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
    cartData,
    isCartOpen,
    loading,
    addToCart,
    removeFromCart,
    removeFromCartById,
    updateQuantity,
    updateQuantityByItemId,
    updateRental,
    updateRentalByItemId,
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
