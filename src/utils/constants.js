export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  TIMEOUT: 10000,
  CLIENT_URL: import.meta.env.VITE_CLIENT_URL || "http://localhost:3000",
  CLIENT_ID_GG:
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    "536051892913-10fe1n8rm27jai1u1sfkjh9k24vaaksm.apps.googleusercontent.com",
};

export const ROUTES = {
  HOME: "/",
  PRODUCTS: "/products",
  PRODUCT_DETAIL: "/product/:id",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  VERIFY_EMAIL: "/auth/verify-email",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  // Chat routes
  CHAT: "/chat",
  CHAT_CONVERSATION: "/chat/:conversationId",
  // Product conversation route for direct messaging about products
  CHAT_PRODUCT: "/chat/product/:productId/:ownerId",
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  USER: "user",
  Theme: "theme",
};

export const USER_ROLES = {
  ADMIN: "ADMIN",
  OWNER: "OWNER",
  RENTER: "RENTER",
  SHIPPER: "SHIPPER",
};

export const USER_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BANNED: "BANNED",
  SUSPENDED: "SUSPENDED",
};
