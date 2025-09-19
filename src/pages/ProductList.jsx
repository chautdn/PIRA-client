import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productService } from '../services/product';

export default function ProductList() {
  console.log('🚀 ProductList component loaded!'); // Debug log
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState({});
  const [favorites, setFavorites] = useState(new Set());
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: '',
    category: '',
    minPrice: 0,
    maxPrice: 10000000,
    sort: 'createdAt',
    order: 'desc'
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
      console.log('Categories response:', res.data); // Debug log
      
      if (res.data?.success) {
        const cats = res.data.data?.categories || [];
        console.log('Categories from API:', cats); // Debug log
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
      console.error('Load categories failed', e);
    }
    
    // Only use fake categories if API completely failed
    console.log('Using fallback categories'); // Debug log
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
      
      console.log('Loading products with filters:', apiFilters); // Debug log
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
      console.error('Load products failed', e);
      setError('Không tải được danh sách sản phẩm');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters) => {
    console.log('updateFilters called with:', newFilters); // Debug log
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => ({
      ...prev,
      [product._id]: (prev[product._id] || 0) + quantity
    }));
    console.log(`Đã thêm ${quantity} ${product.title} vào giỏ hàng`);
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
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Tìm kiếm thiết bị du lịch..."
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
              />
              <svg className="absolute left-4 top-5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Sort */}
            <select 
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
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
            
            {/* Results count */}
            <div className="text-gray-600 font-medium bg-green-50 px-4 py-2 rounded-lg">
              Tìm thấy <span className="text-green-600 font-bold">{pagination.total || 0}</span> sản phẩm
            </div>
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
              
              <div className="p-6 space-y-6">
                {/* Category Filter */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">📂 Danh Mục</h4>
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        console.log('All categories clicked'); // Debug log
                        updateFilters({ category: '' });
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                        !filters.category 
                          ? 'bg-green-500 text-white shadow-lg' 
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      Tất cả danh mục
                    </button>
                    {categories.map((cat) => (
                      <button 
                        key={cat._id}
                        onClick={() => {
                          console.log('Category clicked:', cat.name, cat._id); // Debug log
                          updateFilters({ category: cat._id });
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                          filters.category === cat._id 
                            ? 'bg-green-500 text-white shadow-lg' 
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">💰 Khoảng Giá</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Tối thiểu"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        value={filters.minPrice || ''}
                        onChange={(e) => updateFilters({ minPrice: parseInt(e.target.value) || 0 })}
                      />
                      <input
                        type="number"
                        placeholder="Tối đa"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        value={filters.maxPrice || ''}
                        onChange={(e) => updateFilters({ maxPrice: parseInt(e.target.value) || 10000000 })}
                      />
                    </div>
                    
                    {/* Quick price filters */}
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: 'Dưới 100k', min: 0, max: 100000 },
                        { label: '100k - 500k', min: 100000, max: 500000 },
                        { label: '500k - 1tr', min: 500000, max: 1000000 },
                        { label: 'Trên 1tr', min: 1000000, max: 10000000 }
                      ].map((range) => (
                        <button
                          key={range.label}
                          onClick={() => {
                            console.log('Price filter clicked:', range); // Debug log
                            updateFilters({ minPrice: range.min, maxPrice: range.max });
                          }}
                          className={`w-full px-3 py-2 text-sm rounded-lg transition-all text-left ${
                            filters.minPrice === range.min && filters.maxPrice === range.max
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-50 hover:bg-green-50 hover:text-green-600'
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
            
            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <motion.div 
                    key={product._id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col h-full"
                    whileHover={{ y: -5, scale: 1.02 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
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
                        onClick={() => toggleFavorite(product._id)}
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

                      {/* Quantity & Add to Cart - Always at bottom */}
                      <div className="space-y-3 mt-auto">
                        {/* Quantity Selector */}
                        <div className="flex items-center justify-center border border-gray-200 rounded-lg overflow-hidden">
                          <button 
                            onClick={() => {
                              if (cartItems[product._id] > 0) {
                                setCartItems(prev => ({
                                  ...prev,
                                  [product._id]: prev[product._id] - 1
                                }));
                              }
                            }}
                            className="flex-1 py-2 hover:bg-gray-100 transition-colors font-bold text-lg"
                            disabled={!cartItems[product._id]}
                          >
                            -
                          </button>
                          <div className="flex-1 py-2 text-center font-bold bg-gray-50 border-x border-gray-200">
                            {cartItems[product._id] || 0}
                          </div>
                          <button 
                            onClick={() => addToCart(product, 1)}
                            className="flex-1 py-2 hover:bg-gray-100 transition-colors font-bold text-lg"
                          >
                            +
                          </button>
                        </div>
                        
                        {/* Add to Cart Button */}
                        <button
                          onClick={() => addToCart(product, 1)}
                          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          🛒 Thêm vào giỏ
                        </button>

                        {/* View Details */}
                        <Link 
                          to={`/product/${product._id}`} 
                          className="block text-center text-green-600 hover:text-green-800 font-medium transition-colors py-2"
                        >
                          Xem chi tiết →
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