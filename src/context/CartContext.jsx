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
          // Fallback to localStorage
          cartItems = cartService.getCart();
        }
      } else {
        // Load from localStorage if not logged in
        cartItems = cartService.getCart();
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
      let cartItems = [];

      if (isAuthenticated()) {
        try {
          // Add to backend
          cartItems = await cartApiService.addToCart(product._id, quantity, rental);
        } catch (error) {
          console.error("Backend error:", error);
          // Fallback to localStorage
          cartItems = cartService.addToCart(product, quantity, rental);
          throw new Error(error.response?.data?.message || "Có lỗi xảy ra");
        }
      } else {
        // Add to localStorage
        cartItems = cartService.addToCart(product, quantity, rental);
      }

      setCart(cartItems);
      updateCartStats(cartItems);
      setIsCartOpen(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Remove from cart
  const removeFromCart = async (productId) => {
    try {
      setLoading(true);
      let cartItems = [];

      if (isAuthenticated()) {
        try {
          cartItems = await cartApiService.removeItem(productId);
        } catch (error) {
          console.error("Backend error:", error);
          cartItems = cartService.removeFromCart(productId);
        }
      } else {
        cartItems = cartService.removeFromCart(productId);
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
      let cartItems = [];

      if (isAuthenticated()) {
        try {
          cartItems = await cartApiService.updateQuantity(productId, quantity);
        } catch (error) {
          console.error("Backend error:", error);
          cartItems = cartService.updateQuantity(productId, quantity);
          throw new Error(error.response?.data?.message || "Có lỗi xảy ra");
        }
      } else {
        cartItems = cartService.updateQuantity(productId, quantity);
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

      if (isAuthenticated()) {
        try {
          await cartApiService.clearCart();
        } catch (error) {
          console.error("Backend error:", error);
        }
      }
      
      cartService.clearCart();
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
