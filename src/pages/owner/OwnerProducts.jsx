import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ownerProductApi } from "../../services/ownerProduct.Api";
import ProductCard from "../../components/common/ProductCard";
import { FiPlus } from "react-icons/fi";

export default function OwnerProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: "",
    sort: "createdAt",
    order: "desc",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await ownerProductApi.getOwnerProducts(filters);

      if (res.success) {
        setProducts(res.data?.products || []);
        setPagination(res.data?.pagination || {});
      } else {
        setProducts([]);
        setPagination({});
      }
    } catch (e) {
      console.error("Error loading owner products:", e);
      setError("Không tải được danh sách sản phẩm");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Sản Phẩm Của Tôi
            </h1>
            <p className="text-gray-600 mt-2">
              Quản lý các sản phẩm cho thuê của bạn
            </p>
          </div>
          <Link
            to="/owner/products/create"
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            <FiPlus className="w-5 h-5" />
            <span className="font-medium">Thêm Sản Phẩm</span>
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm của bạn..."
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

            <select
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={`${filters.sort}-${filters.order}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split("-");
                updateFilters({ sort, order });
              }}
            >
              <option value="createdAt-desc">Mới nhất</option>
              <option value="createdAt-asc">Cũ nhất</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
            </select>

            <div className="text-gray-600 font-medium bg-green-50 px-4 py-2 rounded-lg">
              <span className="text-green-600 font-bold">
                {pagination.total || 0}
              </span>{" "}
              sản phẩm
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20 text-red-600">{error}</div>
        )}

        {/* Empty State - No Products */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-12 max-w-2xl mx-auto"
            >
              <div className="text-6xl mb-6">📦</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Chưa có sản phẩm nào
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                Bắt đầu cho thuê sản phẩm của bạn ngay hôm nay!
              </p>
              <button
                onClick={() => navigate("/owner/products/create")}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl hover:shadow-2xl transition-all transform hover:scale-105 text-lg font-semibold"
              >
                <FiPlus className="w-6 h-6" />
                Tạo Sản Phẩm Đầu Tiên
              </button>
            </motion.div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                <ProductCard product={product} isOwnerView={true} />
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
                Trước
              </button>
            )}

            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
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
            })}

            {pagination.page < pagination.pages && (
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all"
              >
                Sau
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
