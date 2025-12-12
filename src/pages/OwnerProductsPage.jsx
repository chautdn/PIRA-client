import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useI18n } from '../hooks/useI18n';
import recommendationService from '../services/recommendation';
import { categoryApi } from '../services/category.Api';
import { translateCategory, translateSubCategory } from '../utils/categoryTranslation';
import ProductCard from '../components/common/ProductCard';
import { GoTriangleDown, GoTriangleRight } from 'react-icons/go';
import { FiPackage, FiTrendingUp, FiStar } from 'react-icons/fi';

// Category Filter Component (simplified from ProductList)
const CategoryFilter = ({
  parentCategories,
  subCategories,
  expandedCategory,
  selectedCategory,
  onParentClick,
  onSubClick,
  onAllClick,
  t,
  language,
}) => {
  const isSubcategorySelected = (subcategoryId) => selectedCategory === subcategoryId;
  
  const isParentCategoryActive = (parentId) => {
    if (selectedCategory === parentId) return true;
    return subCategories.some(sub => sub._id === selectedCategory && expandedCategory === parentId);
  };

  return (
    <div className="space-y-1.5">
      <button
        onClick={onAllClick}
        className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
          !selectedCategory
            ? 'bg-green-50 text-green-700 font-medium'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        {t("ownerProductsPage.allCategories")}
      </button>

      {parentCategories.map((cat) => (
        <div key={cat._id}>
          <button
            onClick={() => onParentClick(cat)}
            className={`w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center gap-1 transition-colors ${
              isParentCategoryActive(cat._id)
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {expandedCategory === cat._id ? (
              <GoTriangleDown className="w-3.5 h-3.5" />
            ) : (
              <GoTriangleRight className="w-3.5 h-3.5" />
            )}
            {translateCategory(cat.name, language)}
            {isParentCategoryActive(cat._id) && (
              <span className="ml-auto text-green-600 text-xs">●</span>
            )}
          </button>

          {expandedCategory === cat._id && subCategories.length > 0 && (
            <div className="ml-5 mt-1 space-y-1">
              {subCategories.map((sub) => (
                <button
                  key={sub._id}
                  onClick={() => onSubClick(sub)}
                  className={`block w-full text-left px-2 py-1 rounded-md text-sm transition-colors ${
                    isSubcategorySelected(sub._id)
                      ? 'text-green-700 font-medium bg-green-100 border-l-2 border-green-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  • {translateCategory(sub.name, language)}
                  {isSubcategorySelected(sub._id) && (
                    <span className="ml-auto text-green-600 text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default function OwnerProductsPage() {
  const { ownerId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'hot', 'recommended'
  
  // Products state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [responseMessage, setResponseMessage] = useState(''); // For backend messages
  const [ownerInfo, setOwnerInfo] = useState(null); // Owner information
  
  // Category state
  const [parentCategories, setParentCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: '',
    category: '',
    sort: 'createdAt',
    order: 'desc'
  });

  // Load parent categories on mount
  useEffect(() => {
    loadParentCategories();
  }, []);

  // Load products when tab or filters change
  useEffect(() => {
    loadProducts();
  }, [activeTab, filters, ownerId]);

  const loadParentCategories = async () => {
    try {
      const res = await categoryApi.getParentCategories();
      if (res.success && res.data) {
        setParentCategories(res.data);
      }
    } catch (error) {
      console.error('Failed to load parent categories:', error);
    }
  };

  const loadSubCategories = async (parentId) => {
    try {
      const res = await categoryApi.getSubCategories(parentId);
      if (res.success && res.data) {
        setSubCategories(res.data);
      }
    } catch (error) {
      console.error('Failed to load subcategories:', error);
      setSubCategories([]);
    }
  };

  const handleCategoryClick = async (category) => {
    if (filters.category === category._id && expandedCategory === category._id) {
      setExpandedCategory(null);
      setSubCategories([]);
      updateFilters({ category: '' });
    } else {
      updateFilters({ category: category._id });
      setExpandedCategory(category._id);
      await loadSubCategories(category._id);
    }
  };

  const handleSubcategoryClick = (subCategory) => {
    updateFilters({ category: subCategory._id });
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setResponseMessage(''); // Clear previous messages
      let response;

      switch (activeTab) {
        case 'hot':
          response = await recommendationService.getProductsByOwner(ownerId, {
            ...filters,
            hotOnly: true
          });
          break;
        
        case 'recommended':
          response = await recommendationService.getProductsByOwner(ownerId, {
            ...filters,
            recommendedOnly: true
          });
          break;
        
        case 'all':
        default:
          response = await recommendationService.getProductsByOwner(ownerId, filters);
          break;
      }

      if (response.success || response.metadata) {
        const data = response.metadata || response.data || response;
        setProducts(data.products || []);
        setPagination(data.pagination || {});
        setResponseMessage(data.message || ''); // Store backend message
        
        // Extract owner info from first product
        if (data.products && data.products.length > 0 && data.products[0].owner) {
          setOwnerInfo(data.products[0].owner);
        }
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Không thể tải sản phẩm');
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

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Owner Profile Section */}
        {ownerInfo && (
          <motion.div
            className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {ownerInfo.profile?.fullName?.charAt(0)?.toUpperCase() || ownerInfo.email?.charAt(0)?.toUpperCase() || 'O'}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-800">
                  Sản phẩm của{' '}
                  <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    {ownerInfo.profile?.fullName || ownerInfo.email?.split('@')[0] || 'Chủ sở hữu'}
                  </span>
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <FiPackage className="w-4 h-4" />
                    {pagination.total || 0} sản phẩm
                  </span>
                  {ownerInfo.profile?.address && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {ownerInfo.profile.address}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Header - Fallback when no owner info */}
        {!ownerInfo && !loading && (
          <div className="text-center mb-8">
            <motion.h1
              className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Sản phẩm của chủ sở hữu
            </motion.h1>
          </div>
        )}

        {/* Tabs Section */}
        <div className="mb-8">
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiPackage className="w-5 h-5" />
              {t("ownerProductsPage.allProducts")}
            </button>
            <button
              onClick={() => setActiveTab('hot')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'hot'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiTrendingUp className="w-5 h-5" />
              {t("ownerProductsPage.hotProducts")}
            </button>
            <button
              onClick={() => setActiveTab('recommended')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'recommended'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiStar className="w-5 h-5" />
              {t("ownerProductsPage.recommendedProducts")}
            </button>
          </div>
        </div>

        {/* Search & Sort Bar (only for 'all' tab) */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={t("ownerProductsPage.search")}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                />
                <svg className="absolute left-4 top-5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <select
                className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={`${filters.sort}-${filters.order}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-');
                  updateFilters({ sort, order });
                }}
              >
                <option value="createdAt-desc">Mới nhất</option>
                <option value="pricing.dailyRate-asc">Giá thấp đến cao</option>
                <option value="pricing.dailyRate-desc">Giá cao đến thấp</option>
                <option value="metrics.averageRating-desc">Đánh giá cao nhất</option>
              </select>

              <div className="text-gray-600 font-medium bg-green-50 px-4 py-2 rounded-lg">
                Tìm thấy{' '}
                <span className="text-green-600 font-bold">{pagination.total || 0}</span> sản phẩm
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Only show for 'all' tab */}
          {activeTab === 'all' && (
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 sticky top-6 p-5">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {t("ownerProductsPage.category")}
                </h3>

                <CategoryFilter
                  parentCategories={parentCategories}
                  subCategories={subCategories}
                  expandedCategory={expandedCategory}
                  selectedCategory={filters.category}
                  onParentClick={handleCategoryClick}
                  onSubClick={handleSubcategoryClick}
                  onAllClick={() => {
                    updateFilters({ category: '' });
                    setExpandedCategory(null);
                    setSubCategories([]);
                  }}
                  t={t}
                  language={i18n.language}
                />
              </div>
            </aside>
          )}

          {/* Products Grid */}
          <section className={activeTab === 'all' ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {loading && (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                <p className="mt-4 text-gray-600">{t("ownerProductsPage.loading")}</p>
              </div>
            )}

            {!loading && products.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">
                  <FiPackage className="w-24 h-24 mx-auto text-gray-300" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {t("ownerProductsPage.noProducts")}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {activeTab === 'all' 
                    ? t("ownerProductsPage.tryChangeFilter")
                    : t("ownerProductsPage.ownerNoProducts")}
                </p>
              </div>
            )}

            {!loading && products.length > 0 && (
              <div className={`grid grid-cols-1 ${activeTab === 'all' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-6`}>
                {products.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <ProductCard product={product} />
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
                    Previous
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
                    Next
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
