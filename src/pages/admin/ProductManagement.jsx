import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin';
import { useI18n } from '../../hooks/useI18n';
import { translateCategory, translateSubCategory } from '../../utils/categoryTranslation';
import icons from "../../utils/icons";

const { FiPackage, BiCheckCircle, BiLoaderAlt, FiClipboard, FiSearch, FiTrash2, BiClipboard, BsBuildings, BiRefresh, FiUser, FiDollarSign, FiBell, FiCalendar, FiSettings, FiAlertTriangle, FiEye, BiInfoCircle, FiStar, FiX, FiLock } = icons;

const ProductManagement = () => {
  const { i18n } = useI18n();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    category: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 10
  });
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [filters]);

  // Sync searchQuery with filters.search when filters change externally
  useEffect(() => {
    // Only sync if search query is different and not in typing mode
    if (!searchTimeout && filters.search !== searchQuery) {
      setSearchQuery(filters.search);
    }
  }, [filters.search, searchQuery, searchTimeout]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const loadCategories = async () => {
    try {
      const response = await adminService.getCategories({ 
        status: 'ACTIVE',
        limit: 100,
        sortBy: 'level',
        sortOrder: 'asc'
      });
      
      const categoriesData = response.categories || response.data?.categories || response.data || [];
      
      // Sort categories by level and priority, then by name for better hierarchy display
      const sortedCategories = categoriesData.sort((a, b) => {
        // First sort by level (parent categories first)
        if ((a.level || 0) !== (b.level || 0)) {
          return (a.level || 0) - (b.level || 0);
        }
        // Then by priority (higher priority first)
        if ((a.priority || 1) !== (b.priority || 1)) {
          return (b.priority || 1) - (a.priority || 1);
        }
        // Finally by name alphabetically
        return (a.name || '').localeCompare(b.name || '', 'vi-VN');
      });
      
      setCategories(sortedCategories);
    } catch (err) {
      setCategories([]);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Bạn cần đăng nhập để xem danh sách sản phẩm');
        setProducts([]);
        return;
      }
      
      const response = await adminService.getProducts(filters);
      
      // Handle response structure similar to OrderManagement
      if (response && response.success && response.data) {
        const { products: productsData, pagination: paginationData } = response.data;
        
        setProducts(productsData || []);
        setPagination({
          currentPage: paginationData?.currentPage || 1,
          totalPages: paginationData?.totalPages || 1,
          totalProducts: paginationData?.totalProducts || 0,
          limit: paginationData?.limit || 10
        });
      } else if (response && response.products) {
        // Direct products response
        setProducts(response.products || []);
        const total = response.totalProducts || response.total || response.products?.length || 0;
        const totalPages = response.totalPages || Math.ceil(total / filters.limit);
        
        setPagination({
          currentPage: response.currentPage || filters.page,
          totalPages: totalPages,
          totalProducts: total,
          limit: filters.limit
        });
      } else if (response && response.pagination) {
        // Backend format with pagination object
        setProducts(response.products || []);
        setPagination({
          currentPage: response.pagination.currentPage || 1,
          totalPages: response.pagination.totalPages || 1,
          totalProducts: response.pagination.totalProducts || 0,
          limit: response.pagination.limit || 10
        });
      } else {
        // Fallback for unexpected response structure
        setProducts([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalProducts: 0,
          limit: 10
        });
      }
      
    } catch (err) {
      
      // Handle specific error types
      if (err.response?.status === 401) {
        setError('Bạn không có quyền truy cập. Vui lòng đăng nhập lại.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      } else if (err.response?.status === 403) {
        setError('Bạn không có quyền admin để xem danh sách sản phẩm.');
      } else if (err.response?.status === 500) {
        setError('Lỗi server. Vui lòng thử lại sau.');
      } else {
        setError('Không thể tải danh sách sản phẩm: ' + (err.response?.data?.message || err.message));
      }
      
      // Set default values on error
      setProducts([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0,
        limit: 10
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    
    if (key === 'search') {
      // Update search query immediately (for UI)
      setSearchQuery(value);
      
      // Clear existing timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Set new timeout to update actual filter
      const newTimeout = setTimeout(() => {
        setFilters(prev => ({
          ...prev,
          search: value,
          page: 1
        }));
      }, 500);

      setSearchTimeout(newTimeout);
    } else {
      // For other filters, update immediately
      setFilters(prev => ({
        ...prev,
        [key]: value,
        page: key === 'page' ? value : 1
      }));
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      handleFilterChange('page', page);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadProducts();
  };

  // Product selection handlers (no delete functionality)

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(product => product._id));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { 
        color: 'bg-gray-100 text-gray-700 border-gray-200', 
        text: ' Bản nháp',
        icon: <FiClipboard className="text-sm" />
      },
      PENDING: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        text: ' Chờ duyệt',
        icon: <BiLoaderAlt className="text-sm" />
      },
      ACTIVE: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        text: ' Đang hoạt động',
        icon: <BiCheckCircle className="text-sm" />
      },
      RENTED: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        text: ' Đã cho thuê',
        icon: <FiPackage className="text-sm" />
      },
      INACTIVE: { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        text: 'Tạm ngừng',
        icon: <FiX className="text-sm" />
      },
      SUSPENDED: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        text: ' Bị khóa',
        icon: <FiLock className="text-sm" />
      }
    };

    const config = statusConfig[status] || statusConfig.INACTIVE;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
        {config.icon}
        <span>{config.text}</span>
      </span>
    );
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Helper function to get category hierarchy display
  const getCategoryDisplay = (category, subCategory) => {
    if (!category && !subCategory) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-500 text-xs font-medium rounded-md border border-gray-200">
          <BiInfoCircle className="text-sm" /> Chưa phân loại
        </span>
      );
    }

    const elements = [];

    if (category) {
      const categoryLevel = category.level || 0;
      const categoryIcon = categoryLevel === 0 ? <BsBuildings className="text-sm" /> : categoryLevel === 1 ? <BsBuildings className="text-sm" /> : <FiClipboard className="text-sm" />;
      const priorityIcon = (category.priority || 1) > 5 ? <FiStar className="text-yellow-600 text-sm" /> : null;
      
      elements.push(
        <span 
          key={category._id}
          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-200"
        >
          {categoryIcon} {translateCategory(category.name, i18n.language)}{priorityIcon}
        </span>
      );
    }

    if (subCategory) {
      elements.push(
        <span 
          key={subCategory._id}
          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-md border border-purple-200"
        >
          <FiClipboard className="text-sm" /> {translateSubCategory(subCategory.name, i18n.language)}
        </span>
      );
    }

    return <div className="flex items-center gap-1">{elements}</div>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
              <FiPackage className="text-5xl" />
              Quản lý Sản phẩm
            </h1>
            <p className="text-blue-100 text-lg">Quản lý và theo dõi toàn bộ sản phẩm cho thuê trong hệ thống</p>
          </div>
          <button className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2">
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Tổng Sản phẩm</p>
              <p className="text-3xl font-bold text-gray-900">{pagination.totalProducts.toLocaleString('vi-VN')}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-full">
              <FiPackage className="text-3xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Đang hoạt động</p>
              <p className="text-3xl font-bold text-gray-900">{products.filter(p => p.status === 'ACTIVE').length}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-full">
              <BiCheckCircle className="text-3xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Chờ duyệt</p>
              <p className="text-3xl font-bold text-gray-900">{products.filter(p => p.status === 'PENDING').length}</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded-full">
              <BiLoaderAlt className="text-3xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Trang hiện tại</p>
              <p className="text-3xl font-bold text-gray-900">{pagination.currentPage}<span className="text-lg text-gray-500">/{pagination.totalPages}</span></p>
            </div>
            <div className="bg-purple-100 p-4 rounded-full">
              <FiClipboard className="text-3xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FiSearch className="text-2xl" />
            Bộ lọc & Tìm kiếm
          </h2>
          <button
            onClick={() => {
              setFilters({ 
                page: 1, 
                limit: 10, 
                search: '', 
                status: '', 
                category: '', 
                sortBy: 'createdAt', 
                sortOrder: 'desc' 
              });
              setSearchQuery('');
              if (searchTimeout) {
                clearTimeout(searchTimeout);
                setSearchTimeout(null);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-semibold rounded-lg hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <FiTrash2 />
            Xóa bộ lọc
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <FiSearch />
                Tìm kiếm
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Tên sản phẩm, mô tả..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {searchTimeout && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <BiClipboard />
                Trạng thái
              </span>
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="DRAFT">📝 Bản nháp</option>
              <option value="PENDING">⏳ Chờ duyệt</option>
              <option value="ACTIVE">✅ Đang hoạt động</option>
              <option value="RENTED">🏠 Đã cho thuê</option>
              <option value="INACTIVE">⏸️ Tạm ngừng</option>
              <option value="SUSPENDED">🚫 Bị khóa</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <BsBuildings />
                Danh mục
              </span>
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {translateCategory(category.name, i18n.language)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <BiRefresh />
                Sắp xếp
              </span>
            </label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="createdAt-desc">🆕 Mới nhất</option>
              <option value="createdAt-asc">🕰️ Cũ nhất</option>
              <option value="title-asc">🔤 Tên A-Z</option>
              <option value="title-desc">🔤 Tên Z-A</option>
              <option value="price-asc">💰 Giá thấp → cao</option>
              <option value="price-desc">💰 Giá cao → thấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <FiPackage className="text-2xl" />
              Danh sách sản phẩm
              <span className="ml-2 px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">
                {products.length}
              </span>
            </h3>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Hiển thị trên trang này</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <FiPackage className="inline mr-1" /> Sản phẩm
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <FiUser className="inline mr-1" /> Chủ sở hữu
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <FiDollarSign className="inline mr-1" /> Giá thuê
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <FiBell className="inline mr-1" /> Trạng thái
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <FiCalendar className="inline mr-1" /> Ngày đăng
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <FiSettings className="inline mr-1" /> Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-300 rounded-lg flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <div className="relative">
                            <img
                              src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url || product.images[0]}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover border-2 border-gray-200"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/48x48?text=No+Image';
                              }}
                            />
                            {product.images.length > 1 && (
                              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                {product.images.length}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-gray-200">
                            <FiPackage className="text-gray-500 text-lg" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {product.title || product.name || 'Tên sản phẩm'}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {product.category && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-200">
                              {product.category.level === 0 ? '📁' : product.category.level === 1 ? '📂' : '📄'} 
                              {translateCategory(product.category.name, i18n.language)}
                              {product.category.priority > 5 && <span className="text-yellow-600">⭐</span>}
                            </span>
                          )}
                          {product.subCategory && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-md border border-purple-200">
                              📄 {translateSubCategory(product.subCategory.name, i18n.language)}
                            </span>
                          )}
                          {!product.category && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-500 text-xs font-medium rounded-md border border-gray-200">
                              ❓ Chưa phân loại
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {product.owner?.name || product.owner?.fullName || product.owner?.username || 'Chưa có tên'}
                    </div>
                    <div className="text-sm text-gray-500">{product.owner?.email || 'Chưa có email'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-green-700">
                        <FiDollarSign className="inline mr-1" /> {formatPrice(product.pricing?.dailyRate || product.dailyRate || 0)}/ngày
                      </div>
                      {product.pricing?.weeklyRate && (
                        <div className="text-xs text-blue-600">
                          <FiCalendar className="inline mr-1" /> {formatPrice(product.pricing.weeklyRate)}/tuần
                        </div>
                      )}
                      {product.pricing?.monthlyRate && (
                        <div className="text-xs text-purple-600">
                          <FiCalendar className="inline mr-1" /> {formatPrice(product.pricing.monthlyRate)}/tháng
                        </div>
                      )}
                      {(product.pricing?.deposit?.amount || product.deposit) && (
                        <div className="text-xs text-orange-600">
                          <FiLock className="inline mr-1" /> Cọc: {formatPrice(product.pricing?.deposit?.amount || product.deposit)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {getStatusBadge(product.status || 'INACTIVE')}
                      {product.availability?.isAvailable === false && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                          <FiX className="text-sm" /> Không khả dụng
                        </div>
                      )}
                      {product.featuredTier && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-md border border-yellow-200">
                          <FiStar className="text-sm" /> Featured T{product.featuredTier}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(product.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <Link
                      to={`/admin/products/${product._id}`}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 inline-flex"
                    >
                      <FiEye className="text-sm" /> Chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
            {/* Mobile Pagination */}
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  pagination.currentPage === 1
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Trước
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  pagination.currentPage === pagination.totalPages
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Sau
              </button>
            </div>
            
            {/* Desktop Pagination */}
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{(pagination.currentPage - 1) * pagination.limit + 1}</span> đến{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalProducts)}
                  </span>{' '}
                  trong <span className="font-medium">{pagination.totalProducts}</span> kết quả
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                      pagination.currentPage === 1
                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'text-gray-500 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    let page;
                    if (pagination.totalPages <= 5) {
                      page = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      page = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      page = pagination.totalPages - 4 + i;
                    } else {
                      page = pagination.currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                      pagination.currentPage === pagination.totalPages
                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'text-gray-500 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>



      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <FiAlertTriangle className="text-red-500 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;