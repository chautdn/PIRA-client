import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productService } from '../services/product';

export default function ProductList() {
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
    search: '',
    category: '',
    minPrice: 0,
    maxPrice: 10000000,
    sort: 'createdAt',
    order: 'desc',
    district: '',
    condition: '',
    status: ''
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    loadCategories();
    loadProducts();
    
    // Set default categories immediately while API loads
    setCategories([
      { _id: 'cameras', name: 'Máy ảnh & Quay phim' },
      { _id: 'camping', name: 'Thiết bị cắm trại' },
      { _id: 'luggage', name: 'Vali & Túi xách' },
      { _id: 'sports', name: 'Thiết bị thể thao' },
      { _id: 'accessories', name: 'Phụ kiện du lịch' }
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
      { _id: 'cameras', name: 'Máy ảnh & Quay phim' },
      { _id: 'camping', name: 'Thiết bị cắm trại' },
      { _id: 'luggage', name: 'Vali & Túi xách' },
      { _id: 'sports', name: 'Thiết bị thể thao' },
      { _id: 'accessories', name: 'Phụ kiện du lịch' }
    ]);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Map frontend filter names to backend API names
      const apiFilters = { ...filters };
      if ('minPrice' in apiFilters && apiFilters.minPrice) {
        apiFilters.priceMin = apiFilters.minPrice;
        delete apiFilters.minPrice;
      }
      if ('maxPrice' in apiFilters && apiFilters.maxPrice) {
        apiFilters.priceMax = apiFilters.maxPrice;
        delete apiFilters.maxPrice;
      }
      
      const res = await productService.list(apiFilters);
      
      if (res.data?.success) {
        setProducts(res.data.data.products || []);
        setPagination(res.data.data.pagination || {});
      } else {
        const list = res.data?.data || [];
        setProducts(list);
        setPagination(res.data?.pagination || { total: list.length, page: 1, pages: 1 });
      }
    } catch (e) {
      console.error('Error loading products:', e);
      setError('Không tải được danh sách sản phẩm');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const toggleFavorite = (productId) => {
    setFavorites(prev => {
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
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Khám Phá Thiết Bị Du Lịch
          </h1>
          <p className="text-xl text-gray-600">
            Thuê những thiết bị tốt nhất cho chuyến đi của bạn
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm thiết bị du lịch..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
              />
              <svg className="absolute left-4 top-4 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* (Removed rental duration select as requested) */}
            
            {/* (Sort moved to sidebar) */}
          </div>

          {/* Results count */}
          <div className="mt-4 flex justify-between items-center text-sm">
            <div className="text-gray-600">
              Tìm thấy <span className="font-medium text-green-600">{pagination.total || 0}</span> sản phẩm
            </div>
            <button 
              onClick={() => updateFilters({
                search: '',
                category: '',
                minPrice: 0,
                maxPrice: 10000000,
                sort: 'createdAt',
                order: 'desc'
              })}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h3 className="text-white font-semibold text-lg">
                  🔍 Bộ Lọc
                </h3>
              </div>
              
              <div className="p-6 space-y-8">
                {/* Category Filter */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">📂 Danh Mục</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!filters.category}
                        onChange={() => updateFilters({ category: '' })}
                        className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-gray-700">Tất cả danh mục</span>
                    </label>
                    {categories.map((cat) => (
                      <label key={cat._id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={filters.category === cat._id}
                          onChange={() => updateFilters({ category: filters.category === cat._id ? '' : cat._id })}
                          className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-gray-700">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Khoảng Giá</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Dưới 100k', min: 0, max: 100000 },
                      { label: '100k - 500k', min: 100000, max: 500000 },
                      { label: '500k - 1tr', min: 500000, max: 1000000 },
                      { label: 'Trên 1tr', min: 1000000, max: 10000000 }
                    ].map((range) => (
                      <label key={range.label} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="price-range"
                          checked={filters.minPrice === range.min && filters.maxPrice === range.max}
                          onChange={() => updateFilters({ minPrice: range.min, maxPrice: range.max })}
                          className="w-5 h-5 border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-gray-700">{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* District Filter */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Quận/Huyện</h4>
                  <select
                    value={filters.district}
                    onChange={(e) => updateFilters({ district: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
                  >
                    <option value="">Tất cả</option>
                    <option value="hai-chau">Hải Châu</option>
                    <option value="thanh-khe">Thanh Khê</option>
                    <option value="son-tra">Sơn Trà</option>
                    <option value="ngu-hanh-son">Ngũ Hành Sơn</option>
                    <option value="lien-chieu">Liên Chiểu</option>
                    <option value="cam-le">Cẩm Lệ</option>
                  </select>
                </div>

                {/* Product Condition Filter (moved to select) */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Tình trạng sản phẩm</h4>
                  <select
                    value={filters.condition}
                    onChange={(e) => updateFilters({ condition: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
                  >
                    <option value="">Tất cả</option>
                    <option value="new">Mới</option>
                    <option value="like-new">Như mới</option>
                  </select>
                </div>

                {/* Product Status Filter */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Trạng thái sản phẩm</h4>
                  <div className="space-y-3">
                    {[
                      { value: '', label: 'Tất cả' },
                      { value: 'active', label: 'Đang hoạt động' }
                    ].map((status) => (
                      <label key={status.value} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="status"
                          checked={filters.status === status.value}
                          onChange={() => updateFilters({ status: status.value })}
                          className="w-5 h-5 border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-gray-700">{status.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                </div>

                {/* Sort Filter (moved from top bar) */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Sắp xếp</h4>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
                    value={`${filters.sort}-${filters.order}`}
                    onChange={(e) => {
                      const [sort, order] = e.target.value.split('-');
                      updateFilters({ sort, order });
                    }}
                  >
                    <option value="createdAt-desc">Mới nhất</option>
                    <option value="price-asc">Giá thấp đến cao</option>
                    <option value="price-desc">Giá cao đến thấp</option>
                    <option value="rating-desc">Đánh giá cao nhất</option>
                  </select>
                </div>

                {/* Clear Filters Button (moved below Sort) */}
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setFilters({
                        page: 1,
                        limit: 12,
                        search: '',
                        category: '',
                        minPrice: 0,
                        maxPrice: 10000000,
                        sort: 'createdAt',
                        order: 'desc',
                        district: '',
                        condition: '',
                        status: ''
                      });
                    }}
                    className="w-full py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Xóa tất cả bộ lọc
                  </button>
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
            
            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <motion.div 
                    key={product._id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col h-full cursor-pointer"
                    whileHover={{ y: -5, scale: 1.02 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    {/* Product Image */}
                    <div className="relative h-56 overflow-hidden">
                      <img 
                        src={(product.images && product.images[0]?.url) || '/images/camera.png'} 
                        alt={product.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      />
                      
                      {/* Stock Badge */}
                      <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                        Còn {product.inventory?.quantity || 5} cái
                      </div>

                      {/* Favorite Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(product._id);
                        }}
                        className={`absolute top-3 right-3 w-10 h-10 rounded-full backdrop-blur-sm border border-gray-200 shadow-lg flex items-center justify-center transition-all transform hover:scale-110 ${
                          favorites.has(product._id) 
                            ? 'bg-red-50 text-red-500 border-red-200' 
                            : 'bg-white/95 text-gray-600 hover:text-red-500'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>
                    </div>

                    {/* Product Info */}
                    <div className="p-6 flex-1 flex flex-col">
                      {/* Location & Views */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <span>📍 {product.location?.address?.city || 'Đà Nẵng'}</span>
                        <span>👁️ {product.metrics?.viewCount || 0}</span>
                      </div>

                      {/* Title - Fixed height */}
                      <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-green-600 transition-colors line-clamp-2 h-14">
                        {product.title}
                      </h3>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-sm ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ⭐
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {product.metrics?.averageRating || 4.8} ({product.metrics?.reviewCount || 0} đánh giá)
                        </span>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        <div className="text-2xl font-bold text-green-600">
                          {formatPrice(product.pricing?.dailyRate || 0)}đ
                          <span className="text-sm text-gray-500 font-normal">/ngày</span>
                        </div>
                      </div>

                      {/* Spacer to push buttons to bottom */}
                      <div className="flex-1"></div>

                      {/* Action Button - Always at bottom */}
                      <div className="mt-auto">
                        {/* Rent Now Button - Navigate to detail to select dates */}
                        <Link 
                          to={`/product/${product._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          📅 Thuê Ngay
                        </Link>
                      </div>
                    </div>
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
                
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-xl border transition-all ${
                        page === pagination.page 
                          ? 'bg-green-500 text-white border-green-500 shadow-lg' 
                          : 'border-gray-300 hover:bg-gray-50'
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