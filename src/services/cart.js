import { STORAGE_KEYS } from "../utils/constants";

const CART_STORAGE_KEY = STORAGE_KEYS.CART;

/**
 * Cart Service - Quản lý cart trong localStorage
 * CartContext sẽ handle việc sync với backend API
 */
class CartService {
  /**
   * Get cart from localStorage
   */
  getCart() {
    try {
      const cart = localStorage.getItem(CART_STORAGE_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error("Error getting cart:", error);
      return [];
    }
  }

  /**
   * Save cart to localStorage
   */
  saveCart(cart) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      return true;
    } catch (error) {
      console.error("Error saving cart:", error);
      return false;
    }
  }

  /**
   * Clear cart from localStorage
   */
  clearCart() {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error("Error clearing cart:", error);
      return false;
    }
  }

  /**
   * Add item to localStorage cart
   */
  addToCart(product, quantity = 1, rental = null) {
    try {
      const cart = this.getCart();
      
      const existingItemIndex = cart.findIndex(
        (item) => item.product._id === product._id
      );

      if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
        if (rental) {
          cart[existingItemIndex].rental = rental;
        }
      } else {
        cart.push({
          product,
          quantity,
          rental: rental || {
            startDate: null,
            endDate: null,
            duration: 1,
          },
          addedAt: new Date().toISOString(),
        });
      }

      this.saveCart(cart);
      return cart;
    } catch (error) {
      console.error("Error adding to cart:", error);
      return this.getCart();
    }
  }

  /**
   * Remove item from localStorage cart
   */
  removeFromCart(productId) {
    try {
      const cart = this.getCart();
      const updatedCart = cart.filter((item) => item.product._id !== productId);
      this.saveCart(updatedCart);
      return updatedCart;
    } catch (error) {
      console.error("Error removing from cart:", error);
      return this.getCart();
    }
  }

  /**
   * Update quantity in localStorage cart
   */
  updateQuantity(productId, quantity) {
    try {
      const cart = this.getCart();
      
      if (quantity < 1) {
        return this.removeFromCart(productId);
      }

      const itemIndex = cart.findIndex(
        (item) => item.product._id === productId
      );

      if (itemIndex > -1) {
        cart[itemIndex].quantity = quantity;
        this.saveCart(cart);
      }

      return cart;
    } catch (error) {
      console.error("Error updating quantity:", error);
      return this.getCart();
    }
  }

  /**
   * Get item quantity
   */
  getProductQuantity(productId) {
    const cart = this.getCart();
    const item = cart.find((item) => item.product._id === productId);
    return item ? item.quantity : 0;
  }

  /**
   * Check if product is in cart
   */
  isInCart(productId) {
    const cart = this.getCart();
    return cart.some((item) => item.product._id === productId);
  }

  /**
   * Get cart count
   */
  getCartCount() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Get cart total
   */
  getCartTotal() {
    const cart = this.getCart();
    return cart.reduce((total, item) => {
      const price = item.product.pricing?.dailyRate || 0;
      const days = item.rental?.duration || 1;
      return total + price * days * item.quantity;
    }, 0);
  }
}

export const cartService = new CartService();
export default cartService;
