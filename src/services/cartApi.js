import api from "./api";

/**
 * Cart API Service - Handle backend cart API calls
 */
class CartApiService {
  /**
   * Get cart from backend
   */
  async getCart() {
    const response = await api.get("/cart");
    // Backend returns: { success, data: { user, items, expiredItems? } }
    return response.data.data || { items: [] };
  }

  /**
   * Add item to backend cart
   */
  async addToCart(productId, quantity = 1, rental = null) {
    const response = await api.post("/cart", {
      productId,
      quantity,
      rental: rental || {
        startDate: null,
        endDate: null,
        duration: 1,
      },
    });

    // Backend returns: { success, data: cart } where cart = { user, items, availabilityWarning? }
    const cart = response.data.data;
    return {
      items: cart?.items || [],
      warning: cart?.availabilityWarning || null,
    };
  }

  /**
   * Update quantity in backend cart (legacy - works with first item)
   */
  async updateQuantity(productId, quantity) {
    const response = await api.put(`/cart/${productId}`, { quantity });
    return response.data.data?.items || [];
  }

  /**
   * Update quantity by itemId in backend cart
   */
  async updateQuantityByItemId(itemId, quantity) {
    const response = await api.put(`/cart/item/${itemId}`, { quantity });
    return response.data.data?.items || [];
  }

  /**
   * Update rental dates in backend cart
   */
  async updateRental(productId, rental) {
    const response = await api.put(`/cart/${productId}/rental`, { rental });
    return response.data.data?.items || [];
  }

  /**
   * Update rental dates by itemId in backend cart
   */
  async updateRentalByItemId(itemId, rental) {
    const response = await api.put(`/cart/item/${itemId}/rental`, { rental });
    return response.data.data?.items || [];
  }

  /**
   * Remove item from backend cart (removes all items with this productId)
   */
  async removeItem(productId) {
    const response = await api.delete(`/cart/${productId}`);
    return response.data.data?.items || [];
  }

  /**
   * Remove item by itemId from backend cart
   */
  async removeItemById(itemId) {
    const response = await api.delete(`/cart/item/${itemId}`);
    return response.data.data?.items || [];
  }

  /**
   * Clear backend cart
   */
  async clearCart() {
    await api.delete("/cart");
    return [];
  }

  /**
   * Sync localStorage cart to backend
   */
  async syncCart(items) {
    const response = await api.post("/cart/sync", { items });
    return response.data.data.items || [];
  }

  /**
   * Validate cart before checkout
   */
  async validateCart() {
    const response = await api.post("/cart/validate");
    return response.data.data;
  }

  /**
   * Get month availability for product
   */
  async getMonthAvailability(productId, year, month) {
    const response = await api.get(
      `/cart/month-availability/${productId}/${year}/${month}`
    );
    return response.data.data;
  }

  /**
   * Validate cart availability against real bookings
   */
  async validateCartAvailability() {
    const response = await api.post("/cart/validate-availability");
    return response.data.data;
  }

  /**
   * Check product availability for specific dates
   */
  async checkAvailability(productId, startDate, endDate) {
    const response = await api.post("/cart/check-availability", {
      productId,
      startDate,
      endDate,
    });
    return response.data.data;
  }

  /**
   * Get detailed availability info for date range
   */
  async getDetailedAvailability(productId, startDate, endDate) {
    const response = await api.post("/cart/check-availability", {
      productId,
      startDate,
      endDate,
    });
    return response.data.data;
  }
}

export const cartApiService = new CartApiService();
export default cartApiService;
