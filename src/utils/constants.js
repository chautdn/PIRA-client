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
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
  DASHBOARD: "/dashboard",
  OWNER_DASHBOARD: "/owner/dashboard",
  SHIPPER_DASHBOARD: "/shipper/dashboard",
  ADMIN_DASHBOARD: "/admin/dashboard",
  PRODUCTS: "/products",
  PRODUCT_DETAIL: "/product/:id",
  PROFILE: "/profile",
  VERIFY_EMAIL: "/auth/verify-email",
  CHAT: "/chat",
  CHAT_CONVERSATION: "/chat/:conversationId",
  // Product conversation route for direct messaging about products
  CHAT_PRODUCT: "/chat/product/:productId/:ownerId",
  OWNER_PRODUCTS: "/owner/products",
  OWNER_CREATE_PRODUCT: "/owner/products/create",
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
