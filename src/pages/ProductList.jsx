import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { productService } from "../services/product";
import { ownerProductApi } from "../services/ownerProduct.Api";
import ProductCard from "../components/common/ProductCard";

export default function ProductList({ isOwnerView = false }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: "",
    category: "",
    minPrice: 0,
    maxPrice: 10000000,
    sort: "createdAt",
    order: "desc",
    status: "", // For owner view
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    loadCategories();
    loadProducts();

    // Set default categories immediately while API loads
    setCategories([
      { _id: "cameras", name: "Máy ảnh & Quay phim" },
      { _id: "camping", name: "Thiết bị cắm trại" },
      { _id: "luggage", name: "Vali & Túi xách" },
      { _id: "sports", name: "Thiết bị thể thao" },
      { _id: "accessories", name: "Phụ kiện du lịch" },
    ]);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadCategories = async () => {
    try {
      const res = await productService.getCategories();

      if (res.data?.success) {
        const cats = res.data.data?.categories || [];
        if (cats.length > 0) {
          setCategories(cats);
          return; // Exit early if we got real categories
        }
      } else if (res.data?.categories) {
        // Fallback for different API format
        const cats = res.data.categories;
        if (cats.length > 0) {
          setCategories(cats);
          return;
        }
      } else if (Array.isArray(res.data)) {
        // Direct array response
        if (res.data.length > 0) {
          setCategories(res.data);
          return;
        }
      }
    } catch (e) {
      // Handle load categories error
    }

    // Only use fake categories if API completely failed
    setCategories([
      { _id: "cameras", name: "Máy ảnh & Quay phim" },
      { _id: "camping", name: "Thiết bị cắm trại" },
      { _id: "luggage", name: "Vali & Túi xách" },
      { _id: "sports", name: "Thiết bị thể thao" },
      { _id: "accessories", name: "Phụ kiện du lịch" },
    ]);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);

      // Map frontend filter names to backend API names
      const apiFilters = { ...filters };
      if ("minPrice" in apiFilters && apiFilters.minPrice) {
        apiFilters.priceMin = apiFilters.minPrice;
        delete apiFilters.minPrice;
      }
      if ("maxPrice" in apiFilters && apiFilters.maxPrice) {
        apiFilters.priceMax = apiFilters.maxPrice;
        delete apiFilters.maxPrice;
      }

      // Use different API based on isOwnerView prop
      const res = isOwnerView
        ? await ownerProductApi.getOwnerProducts(apiFilters)
        : await productService.list(apiFilters);

      if (res.success || res.data?.success) {
        const data = res.data || res;
        setProducts(data.data?.products || data.products || []);
        setPagination(data.data?.pagination || data.pagination || {});
      } else {
        const list = res.data?.data || [];
        setProducts(list);
        setPagination(
          res.data?.pagination || { total: list.length, page: 1, pages: 1 }
        );
      }
    } catch (e) {
      console.error("Error loading products:", e);
      setError(
        isOwnerView
          ? "Không tải được sản phẩm của bạn"
          : "Không tải được danh sách sản phẩm"
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const toggleFavorite = (productId) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              {isOwnerView ? "Sản Phẩm Của Tôi" : "Khám Phá Thiết Bị Du Lịch"}
            </h1>
            {isOwnerView && (
              <button
                onClick={() => navigate("/owner/products/create")}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <span className="text-xl">➕</span>
                <span>Đăng Sản Phẩm Mới</span>
              </button>
            )}
          </div>
          <p className="text-xl text-gray-600">
            {isOwnerView
              ? "Quản lý tất cả sản phẩm cho thuê của bạn"
              : "Thuê những thiết bị tốt nhất cho chuyến đi của bạn"}
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={
                    isOwnerView
                      ? "Tìm kiếm sản phẩm của tôi..."
                      : "Tìm kiếm thiết bị du lịch..."
                  }
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                />
                <svg
                  className="absolute left-4 top-5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Sort */}
              <select
                className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={`${filters.sort}-${filters.order}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split("-");
                  updateFilters({ sort, order });
                }}
              >
                <option value="createdAt-desc">Mới nhất</option>
                <option value="price-asc">Giá thấp đến cao</option>
                <option value="price-desc">Giá cao đến thấp</option>
                <option value="rating-desc">Đánh giá cao nhất</option>
              </select>

              {/* Results count */}
              <div className="text-gray-600 font-medium bg-green-50 px-4 py-2 rounded-lg">
                Tìm thấy{" "}
                <span className="text-green-600 font-bold">
                  {pagination.total || 0}
                </span>{" "}
                sản phẩm
              </div>
            </div>

            {/* Status filter for owner view */}
            {isOwnerView && (
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: "", label: "Tất cả", color: "gray" },
                  { value: "DRAFT", label: "Nháp", color: "gray" },
                  { value: "PENDING", label: "Chờ duyệt", color: "yellow" },
                  { value: "ACTIVE", label: "Đang hoạt động", color: "green" },
                  { value: "RENTED", label: "Đang cho thuê", color: "blue" },
                  { value: "INACTIVE", label: "Ngừng hoạt động", color: "red" },
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() => updateFilters({ status: status.value })}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filters.status === status.value
                        ? `bg-${status.color}-500 text-white shadow-lg`
                        : `bg-${status.color}-50 text-${status.color}-700 hover:bg-${status.color}-100`
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h3 className="text-white font-semibold text-lg">🔍 Bộ Lọc</h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Category Filter */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">
                    📂 Danh Mục
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        updateFilters({ category: "" });
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                        !filters.category
                          ? "bg-green-500 text-white shadow-lg"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      Tất cả danh mục
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => {
                          updateFilters({ category: cat._id });
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                          filters.category === cat._id
                            ? "bg-green-500 text-white shadow-lg"
                            : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">
                    💰 Khoảng Giá
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Tối thiểu"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        value={filters.minPrice || ""}
                        onChange={(e) =>
                          updateFilters({
                            minPrice: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                      <input
                        type="number"
                        placeholder="Tối đa"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        value={filters.maxPrice || ""}
                        onChange={(e) =>
                          updateFilters({
                            maxPrice: parseInt(e.target.value) || 10000000,
                          })
                        }
                      />
                    </div>

                    {/* Quick price filters */}
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: "Dưới 100k", min: 0, max: 100000 },
                        { label: "100k - 500k", min: 100000, max: 500000 },
                        { label: "500k - 1tr", min: 500000, max: 1000000 },
                        { label: "Trên 1tr", min: 1000000, max: 10000000 },
                      ].map((range) => (
                        <button
                          key={range.label}
                          onClick={() => {
                            updateFilters({
                              minPrice: range.min,
                              maxPrice: range.max,
                            });
                          }}
                          className={`w-full px-3 py-2 text-sm rounded-lg transition-all text-left ${
                            filters.minPrice === range.min &&
                            filters.maxPrice === range.max
                              ? "bg-green-500 text-white"
                              : "bg-gray-50 hover:bg-green-50 hover:text-green-600"
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <section className="lg:col-span-3">
            {loading && (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-20 text-red-600">{error}</div>
            )}

            {!loading && !error && products.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {isOwnerView
                    ? "Bạn chưa có sản phẩm nào"
                    : "Không tìm thấy sản phẩm"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {isOwnerView
                    ? "Hãy tạo sản phẩm đầu tiên của bạn để bắt đầu kinh doanh!"
                    : "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"}
                </p>
                {isOwnerView && (
                  <button
                    onClick={() => navigate("/owner/products/create")}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
                  >
                    <span className="text-xl">➕</span>
                    <span>Đăng Sản Phẩm Đầu Tiên</span>
                  </button>
                )}
              </div>
            )}

            {!loading && !error && products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 100,
                    }}
                    whileHover={{
                      y: product.isPromoted ? -8 : -5,
                      scale: product.isPromoted ? 1.03 : 1.02,
                    }}
                  >
                    <ProductCard product={product} isOwnerView={isOwnerView} />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                {pagination.page > 1 && (
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    ← Trước
                  </button>
                )}

                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-xl border transition-all ${
                          page === pagination.page
                            ? "bg-green-500 text-white border-green-500 shadow-lg"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                )}

                {pagination.page < pagination.pages && (
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    Sau →
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
