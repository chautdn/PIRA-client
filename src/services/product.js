import api from "./api";

export const productService = {
  // Get products with filtering and pagination
  list: (params) => api.get("/products", { params }),

  // Get product by ID
  getById: (id) => api.get(`/products/${id}`),

  // Get all categories for filtering
  getCategories: () => api.get("/products/categories"),

  // Get search suggestions
  getSearchSuggestions: (query) =>
    api.get("/products/search-suggestions", {
      params: { q: query },
    }),

  // Get filter options (price range, locations, etc.)
  getFilterOptions: () => api.get("/products/filter-options"),

  // Search products with specific filters
  search: (filters) => api.get("/products", { params: filters }),

  // Get featured products for homepage
  getFeatured: (limit = 6) =>
    api.get("/products/featured", { params: { limit } }),
};
