import api from "./api";

export const wishlistService = {
  add: (userId, productId) => api.post("/wishlist/add", { userId, productId }),
  remove: (userId, productId) =>
    api.post("/wishlist/remove", { userId, productId }),
  list: (userId) => api.get(`/wishlist/${userId}`),
};
