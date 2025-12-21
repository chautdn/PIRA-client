import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "../hooks/useI18n";
import { productService } from "../services/product";
import { categoryApi } from "../services/category.Api";
import recommendationService from "../services/recommendation";
import { translateCategory, translateSubCategory } from "../utils/categoryTranslation";
import ProductCard from "../components/common/ProductCard";
import VoiceSearch from "../components/common/VoiceSearch";
import VisualSearch from "../components/common/VisualSearch";
import ChatbotAI from "../components/common/ChatbotAI";
import { GoTriangleDown, GoTriangleRight } from "react-icons/go";
import { FiTrendingUp, FiStar, FiChevronLeft, FiChevronRight } from "react-icons/fi";

// === ACCORDION COMPONENT ===
const Accordion = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-3 flex items-center justify-between text-left text-sm font-medium text-gray-800 hover:text-green-600 transition-colors"
      >
        {title}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <GoTriangleDown className="w-4 h-4" />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="pb-3 pt-1 text-sm">{children}</div>
      </motion.div>
    </div>
  );
};

// === CATEGORY FILTER ===
const CategoryFilter = ({
  parentCategories,
  subCategories,
  expandedCategory,
  selectedCategory,
  onParentClick,
  onSubClick,
  onAllClick,
  t,
  i18n,
}) => {
  // Check if selected category is a subcategory
  const isSubcategorySelected = (subcategoryId) => selectedCategory === subcategoryId;
  
  // Check if parent category should be highlighted (either directly selected or has selected subcategory)
  const isParentCategoryActive = (parentId) => {
    if (selectedCategory === parentId) return true;
    // Check if any subcategory of this parent is selected
    return subCategories.some(sub => sub._id === selectedCategory && expandedCategory === parentId);
  };

  return (
    <div className="space-y-1.5">
      <button
        onClick={onAllClick}
        className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
          !selectedCategory
            ? "bg-green-50 text-green-700 font-medium"
            : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        {t("productList.allCategories")}
      </button>

      {parentCategories.map((cat) => (
        <div key={cat._id}>
          <button
            onClick={() => onParentClick(cat)}
            className={`w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center gap-1 transition-colors ${
              isParentCategoryActive(cat._id)
                ? "bg-green-50 text-green-700 font-medium"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            {expandedCategory === cat._id ? (
              <GoTriangleDown className="w-3.5 h-3.5" />
            ) : (
              <GoTriangleRight className="w-3.5 h-3.5" />
            )}
            {translateCategory(cat.name, i18n.language)}
            {/* Show indicator if this category or its subcategories are filtered */}
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
                      ? "text-green-700 font-medium bg-green-100 border-l-2 border-green-500"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  • {translateCategory(sub.name, i18n.language)}
                  {/* Show indicator if this subcategory is selected */}
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

// === PRICE FILTER ===
const PriceFilter = ({ minPrice, maxPrice, onChange, t }) => {
  const ranges = [
    { label: t("productList.under100k"), min: 0, max: 100000 },
    { label: t("productList.price100to500k"), min: 100000, max: 500000 },
    { label: t("productList.price500kto1m"), min: 500000, max: 1000000 },
    { label: t("productList.over1m"), min: 1000000, max: 10000000 },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          placeholder={t("productList.from")}
          className="px-3 py-1.5 text-sm border rounded-md focus:border-green-500 focus:outline-none"
          value={minPrice || ""}
          onChange={(e) => onChange(parseInt(e.target.value) || 0, maxPrice)}
        />
        <input
          type="number"
          placeholder={t("productList.to")}
          className="px-3 py-1.5 text-sm border rounded-md focus:border-green-500 focus:outline-none"
          value={maxPrice || ""}
          onChange={(e) => onChange(minPrice, parseInt(e.target.value) || 10000000)}
        />
      </div>
      <div className="space-y-1">
        {ranges.map((r) => (
          <button
            key={r.label}
            onClick={() => onChange(r.min, r.max)}
            className={`block w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
              minPrice === r.min && maxPrice === r.max
                ? "bg-green-50 text-green-700 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// === DISTRICT FILTER ===
const DistrictFilter = ({ selected, onSelect, t }) => {
  const districts = [
    { value: "", label: t("productList.allDistricts") },
    { value: "hai-chau", label: "Hải Châu" },
    { value: "thanh-khe", label: "Thanh Khê" },
    { value: "son-tra", label: "Sơn Trà" },
    { value: "ngu-hanh-son", label: "Ngũ Hành Sơn" },
    { value: "lien-chieu", label: "Liên Chiểu" },
    { value: "cam-le", label: "Cẩm Lệ" },
  ];

  return (
    <div className="space-y-1">
      {districts.map((d) => (
        <button
          key={d.value}
          onClick={() => onSelect(d.value)}
          className={`block w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
            selected === d.value
              ? "bg-green-50 text-green-700 font-medium"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
};

// === CONDITION FILTER ===
const ConditionFilter = ({ selected, onSelect, t }) => {
  const conditions = [
    { value: "", label: t("productList.allConditions") },
    { value: "new", label: t("productList.conditionNew") },
    { value: "like-new", label: t("productList.conditionLikeNew") },
    { value: "good", label: t("productList.conditionGood") },
    { value: "fair", label: t("productList.conditionFair") },
  ];

  return (
    <div className="space-y-1">
      {conditions.map((c) => (
        <button
          key={c.value}
          onClick={() => onSelect(c.value)}
          className={`block w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
            selected === c.value
              ? "bg-green-50 text-green-700 font-medium"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
};

// === MAIN COMPONENT ===
export default function ProductList() {
  const navigate = useNavigate();
  const { t, i18n } = useI18n();
  const [products, setProducts] = useState([]);
  const [parentCategories, setParentCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [carouselsLoading, setCarouselsLoading] = useState(false);
  const trendingScrollRef = useRef(null);
  const recommendedScrollRef = useRef(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: "",
    category: "",
    minPrice: 0,
    maxPrice: 10000000,
    sort: "createdAt",
    order: "desc",
    district: "",
    condition: "",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    loadParentCategories();
    loadProducts();
    loadTrendingProducts();
    loadRecommendedProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters]);

  // Auto-scroll carousels
  useEffect(() => {
    const scrollInterval = setInterval(() => {
      if (trendingScrollRef.current && trendingProducts.length > 0) {
        const container = trendingScrollRef.current;
        const scrollAmount = container.offsetWidth;
        if (container.scrollLeft + container.offsetWidth >= container.scrollWidth - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }

      if (recommendedScrollRef.current && recommendedProducts.length > 0) {
        const container = recommendedScrollRef.current;
        const scrollAmount = container.offsetWidth;
        if (container.scrollLeft + container.offsetWidth >= container.scrollWidth - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }
    }, 3000);

    return () => clearInterval(scrollInterval);
  }, [trendingProducts.length, recommendedProducts.length]);

  const loadParentCategories = async () => {
    try {
      const res = await categoryApi.getParentCategories();
      if (res.success && res.data) {
        setParentCategories(res.data);
      }
    } catch (error) {
      setParentCategories([
        { _id: "cameras", name: "Máy ảnh & Quay phim" },
        { _id: "camping", name: "Thiết bị cắm trại" },
        { _id: "luggage", name: "Vali & Túi xách" },
        { _id: "sports", name: "Thiết bị thể thao" },
        { _id: "accessories", name: "Phụ kiện du lịch" },
      ]);
    }
  };

  const loadSubCategories = async (parentId) => {
    try {
      const res = await categoryApi.getSubCategories(parentId);
      if (res.success && res.data) {
        setSubCategories(res.data);
      }
    } catch (error) {
      setSubCategories([]);
    }
  };

  const handleCategoryClick = async (category) => {
    // If already selected and expanded, collapse it
    if (filters.category === category._id && expandedCategory === category._id) {
      setExpandedCategory(null);
      setSubCategories([]);
      updateFilters({ category: "" }); // Clear filter
    } else {
      // Select this category and expand to show subcategories
      updateFilters({ category: category._id });
      setExpandedCategory(category._id);
      await loadSubCategories(category._id);
    }
  };

  const handleSubcategoryClick = (subCategory) => {
    updateFilters({ category: subCategory._id });
    // Keep the parent expanded when selecting subcategory
    // The parent category should remain expanded to show the selected subcategory
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const apiFilters = { ...filters };
      if (apiFilters.minPrice) apiFilters.priceMin = apiFilters.minPrice;
      if (apiFilters.maxPrice) apiFilters.priceMax = apiFilters.maxPrice;
      delete apiFilters.minPrice;
      delete apiFilters.maxPrice;

      const res = await productService.list(apiFilters);

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
      setError("Không tải được danh sách sản phẩm");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingProducts = async () => {
    try {
      setCarouselsLoading(true);
      const response = await recommendationService.getHotProducts({ limit: 12 });
      if (response.success || response.metadata) {
        const data = response.metadata || response.data || response;
        setTrendingProducts(data.products || []);
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setCarouselsLoading(false);
    }
  };

  const loadRecommendedProducts = async () => {
    try {
      setCarouselsLoading(true);
      const response = await recommendationService.getRecommendedProducts({ limit: 12 });
      if (response.success || response.metadata) {
        const data = response.metadata || response.data || response;
        setRecommendedProducts(data.products || []);
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setCarouselsLoading(false);
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
      newFavorites.has(productId) ? newFavorites.delete(productId) : newFavorites.add(productId);
      return newFavorites;
    });
  };

  const formatPrice = (price) => new Intl.NumberFormat("vi-VN").format(price);

  const hasActiveFilters =
    filters.category ||
    filters.minPrice > 0 ||
    filters.maxPrice < 10000000 ||
    filters.district ||
    filters.condition;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              {t("productList.pageTitle")}
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-gray-600">
            {t("productList.pageSubtitle")}
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={t("productList.search")}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                />
                <svg className="absolute left-4 top-5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Voice Search & Visual Search */}
              <div className="flex gap-2">
                <VoiceSearch 
                  onSearch={(transcript) => {
                    updateFilters({ search: transcript });
                  }}
                  language="vi-VN"
                />
                
                <VisualSearch 
                  onSearch={(searchTerm) => {
                    updateFilters({ search: searchTerm });
                  }}
                />
              </div>

              <select
                className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={`${filters.sort}-${filters.order}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split("-");
                  updateFilters({ sort, order });
                }}
              >
                <option value="createdAt-desc">{t("productList.sortNewest")}</option>
                <option value="price-asc">{t("productList.sortPriceLow")}</option>
                <option value="price-desc">{t("productList.sortPriceHigh")}</option>
                <option value="rating-desc">{t("productList.sortRating")}</option>
              </select>

              <div className="text-gray-600 font-medium bg-green-50 px-4 py-2 rounded-lg">
                {t("productList.found")}{" "}
                <span className="text-green-600 font-bold">{pagination.total || 0}</span> {t("productList.products")}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* === SIDEBAR FILTERS - TỐI ƯU === */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 sticky top-6">
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {t("productList.filters")}
                </h3>
              </div>

              <div className="p-4 space-y-3">
                {[
                  {
                    title: t("productList.category"),
                    content: (
                      <CategoryFilter
                        parentCategories={parentCategories}
                        subCategories={subCategories}
                        expandedCategory={expandedCategory}
                        selectedCategory={filters.category}
                        onParentClick={handleCategoryClick}
                        onSubClick={handleSubcategoryClick}
                        onAllClick={() => {
                          updateFilters({ category: "" });
                          setExpandedCategory(null);
                          setSubCategories([]);
                        }}
                        t={t}
                        i18n={i18n}
                      />
                    ),
                  },
                  {
                    title: t("productList.priceRange"),
                    content: (
                      <PriceFilter
                        minPrice={filters.minPrice}
                        maxPrice={filters.maxPrice}
                        onChange={(min, max) => updateFilters({ minPrice: min, maxPrice: max })}
                        t={t}
                      />
                    ),
                  },
                  {
                    title: t("productList.district"),
                    content: <DistrictFilter selected={filters.district} onSelect={(val) => updateFilters({ district: val })} t={t} />,
                  },
                  {
                    title: t("productList.condition"),
                    content: <ConditionFilter selected={filters.condition} onSelect={(val) => updateFilters({ condition: val })} t={t} />,
                  },
                ].map((section, i) => (
                  <Accordion key={i} title={section.title} defaultOpen={i === 0}>
                    {section.content}
                  </Accordion>
                ))}

                {hasActiveFilters && (
                  <div className="pt-3 border-t border-gray-200 mt-3">
                    <button
                      onClick={() => {
                        setFilters({
                          ...filters,
                          category: "",
                          minPrice: 0,
                          maxPrice: 10000000,
                          district: "",
                          condition: "",
                          page: 1,
                        });
                        setExpandedCategory(null);
                        setSubCategories([]);
                      }}
                      className="w-full text-sm text-red-600 hover:text-red-700 font-medium py-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      {t("productList.clearAllFilters")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* === PRODUCTS GRID === */}
          <section className="lg:col-span-3">
            {loading && (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                <p className="mt-4 text-gray-600">{t("productList.loading")}</p>
              </div>
            )}

            {error && <div className="text-center py-20 text-red-600">{error}</div>}

            {!loading && !error && products.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {t("productList.noProducts")}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t("productList.tryChangeFilter")}
                </p>
              </div>
            )}

            {!loading && !error && products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05, type: "spring", stiffness: 100 }}
                    whileHover={{ y: product.isPromoted ? -8 : -5, scale: product.isPromoted ? 1.03 : 1.02 }}
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
                    {t("productList.previous")}
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
                    {t("productList.next")}
                  </button>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Trending Products Carousel */}
        {!loading && trendingProducts.length > 0 && (
          <motion.div
            className="mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                  <FiTrendingUp className="w-8 h-8 text-orange-600" />
                  <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {t("productList.trendingTitle")}
                  </span>
                </h2>
                <p className="text-sm text-gray-600 mt-2">{t("productList.trendingDesc")}</p>
              </div>
            </div>
            <div className="relative">
              {/* Left Arrow */}
              <button
                onClick={() => {
                  if (trendingScrollRef.current) {
                    trendingScrollRef.current.scrollBy({ left: -280, behavior: 'smooth' });
                  }
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all hover:scale-110"
                aria-label="Previous"
              >
                <FiChevronLeft className="w-6 h-6 text-gray-800" />
              </button>
              
              {/* Right Arrow */}
              <button
                onClick={() => {
                  if (trendingScrollRef.current) {
                    trendingScrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all hover:scale-110"
                aria-label="Next"
              >
                <FiChevronRight className="w-6 h-6 text-gray-800" />
              </button>

              {/* Scroll Container */}
              <div 
                ref={trendingScrollRef}
                className="overflow-x-auto pb-4 scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onMouseEnter={() => trendingScrollRef.current?.style.setProperty('--pause', 'paused')}
                onMouseLeave={() => trendingScrollRef.current?.style.setProperty('--pause', 'running')}
              >
                <div className="flex gap-4" style={{ scrollSnapType: 'x mandatory' }}>
                  {trendingProducts.map((item, index) => (
                    <motion.div
                      key={item._id}
                      className="flex-shrink-0 w-64"
                      style={{ scrollSnapAlign: 'start' }}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -5 }}
                    >
                      <Link to={`/product/${item._id}`} className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden h-full">
                        <div className="aspect-square overflow-hidden bg-gray-100">
                          <img
                            src={item.images?.[0]?.url || item.images?.[0] || 'https://via.placeholder.com/400x400?text=No+Image'}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'; }}
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 h-12">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400">⭐</span>
                              <span className="font-medium text-gray-700">
                                {item.metrics?.averageRating?.toFixed(1) || '0.0'}
                              </span>
                            </div>
                            <span className="text-gray-400 text-sm">
                              ({item.metrics?.reviewCount || 0})
                            </span>
                          </div>
                          <p className="text-green-600 font-bold text-lg">
                            {new Intl.NumberFormat('vi-VN').format(item.pricing?.dailyRate || 0)}đ
                            <span className="text-sm text-gray-500 font-normal">{t("productList.perDay")}</span>
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recommended Products Carousel */}
        {!loading && recommendedProducts.length > 0 && (
          <motion.div
            className="mt-12 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FiStar className="w-8 h-8 text-purple-600" />
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {t("productList.recommendedTitle")}
                </span>
              </h2>
              <p className="text-sm text-gray-600 mt-2">{t("productList.recommendedDesc")}</p>
            </div>
            <div className="relative">
              {/* Left Arrow */}
              <button
                onClick={() => {
                  if (recommendedScrollRef.current) {
                    recommendedScrollRef.current.scrollBy({ left: -280, behavior: 'smooth' });
                  }
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all hover:scale-110"
                aria-label="Previous"
              >
                <FiChevronLeft className="w-6 h-6 text-gray-800" />
              </button>
              
              {/* Right Arrow */}
              <button
                onClick={() => {
                  if (recommendedScrollRef.current) {
                    recommendedScrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all hover:scale-110"
                aria-label="Next"
              >
                <FiChevronRight className="w-6 h-6 text-gray-800" />
              </button>

              {/* Scroll Container */}
              <div 
                ref={recommendedScrollRef}
                className="overflow-x-auto pb-4 scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onMouseEnter={() => recommendedScrollRef.current?.style.setProperty('--pause', 'paused')}
                onMouseLeave={() => recommendedScrollRef.current?.style.setProperty('--pause', 'running')}
              >
                <div className="flex gap-4" style={{ scrollSnapType: 'x mandatory' }}>
                  {recommendedProducts.map((item, index) => (
                    <motion.div
                      key={item._id}
                      className="flex-shrink-0 w-64"
                      style={{ scrollSnapAlign: 'start' }}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -5 }}
                    >
                      <Link to={`/product/${item._id}`} className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden h-full">
                        <div className="aspect-square overflow-hidden bg-gray-100">
                          <img
                            src={item.images?.[0]?.url || item.images?.[0] || 'https://via.placeholder.com/400x400?text=No+Image'}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'; }}
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 h-12">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400">⭐</span>
                              <span className="font-medium text-gray-700">
                                {item.metrics?.averageRating?.toFixed(1) || '0.0'}
                              </span>
                            </div>
                            <span className="text-gray-400 text-sm">
                              ({item.metrics?.reviewCount || 0})
                            </span>
                          </div>
                          <p className="text-green-600 font-bold text-lg">
                            {new Intl.NumberFormat('vi-VN').format(item.pricing?.dailyRate || 0)}đ
                            <span className="text-sm text-gray-500 font-normal">{t("productList.perDay")}</span>
                          </p>
                          <div className="mt-2 text-xs text-gray-500">
                            {t("productList.from")}: {item.owner?.profile?.fullName || item.owner?.email?.split('@')[0]}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* AI Chatbot */}
      <ChatbotAI />
    </div>
  );
}