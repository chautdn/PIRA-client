import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin';

const ProductManagement = () => {
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
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [filters]);

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
      
      console.log('Loaded categories:', sortedCategories);
      setCategories(sortedCategories);
    } catch (err) {
      console.error('Load categories error:', err);
      setCategories([]);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('ProductManagement - Loading products with filters:', filters);
      const response = await adminService.getProducts(filters);
      
      console.log('ProductManagement - API response:', response);
      
      // Safe check for response structure
      if (response && typeof response === 'object') {
        const products = response.products || response.data?.products || response.data || [];
        const totalProducts = response.total || response.data?.total || products.length;
        const totalPages = response.totalPages || response.data?.totalPages || Math.ceil(totalProducts / filters.limit);
        
        console.log('ProductManagement - Products count:', products.length);
        console.log('ProductManagement - Total products:', totalProducts);
        console.log('ProductManagement - Total pages calculated:', totalPages);
        console.log('ProductManagement - Current limit:', filters.limit);
        
        console.log('ProductManagement - Products:', products);
        console.log('ProductManagement - Sample product owner:', products[0]?.owner);
        console.log('ProductManagement - Sample product status:', products[0]?.status);
        
        setProducts(products);
        setTotalPages(totalPages);
        setTotalProducts(totalProducts);
      } else {
        // Fallback for unexpected response structure
        setProducts([]);
        setTotalPages(1);
        setTotalProducts(0);
      }
    } catch (err) {
      setError('Không thể tải danh sách sản phẩm');
      console.error('Load products error:', err);
      // Set default values on error
      setProducts([]);
      setTotalPages(1);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    console.log('ProductManagement - Filter change:', { key, value });
    const newFilters = {
      ...filters,
      [key]: value,
      page: key !== 'page' ? 1 : value
    };
    console.log('ProductManagement - New filters:', newFilters);
    setFilters(newFilters);
    
    // Force reload if page change
    if (key === 'page') {
      setTimeout(() => loadProducts(), 100);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadProducts();
  };

  // Removed approval actions - only keep delete functionality

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    
    try {
      await adminService.deleteProduct(productId);
      loadProducts();
      alert('Xóa sản phẩm thành công!');
    } catch (err) {
      console.error('Delete product error:', err);
      alert('Có lỗi xảy ra khi xóa sản phẩm!');
    }
  };

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

  const handleBulkAction = async (action) => {
    if (selectedProducts.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    try {
      if (action === 'delete') {
        if (!confirm('Bạn có chắc chắn muốn xóa các sản phẩm đã chọn?')) return;
        for (const productId of selectedProducts) {
          await adminService.deleteProduct(productId);
        }
        alert('Xóa thành công!');
        setSelectedProducts([]);
        loadProducts();
      }
    } catch (err) {
      console.error('Bulk action error:', err);
      alert('Có lỗi xảy ra khi thực hiện thao tác!');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { 
        color: 'bg-gray-100 text-gray-700 border-gray-200', 
        text: '📝 Bản nháp',
        icon: '📝'
      },
      PENDING: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        text: '⏳ Chờ duyệt',
        icon: '⏳'
      },
      ACTIVE: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        text: ' Đang hoạt động',
        icon: '✅'
      },
      RENTED: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        text: ' Đã cho thuê',
        icon: '🏠'
      },
      INACTIVE: { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        text: 'Tạm ngừng',
        icon: '⏸️'
      },
      SUSPENDED: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        text: ' Bị khóa',
        icon: '🚫'
      }
    };

    const config = statusConfig[status] || statusConfig.INACTIVE;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
        <span>{config.icon}</span>
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
          ❓ Chưa phân loại
        </span>
      );
    }

    const elements = [];

    if (category) {
      const categoryLevel = category.level || 0;
      const categoryIcon = categoryLevel === 0 ? '📁' : categoryLevel === 1 ? '📂' : '📄';
      const priorityIcon = (category.priority || 1) > 5 ? ' ⭐' : '';
      
      elements.push(
        <span 
          key={category._id}
          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-200"
        >
          {categoryIcon} {category.name}{priorityIcon}
        </span>
      );
    }

    if (subCategory) {
      elements.push(
        <span 
          key={subCategory._id}
          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-md border border-purple-200"
        >
          📄 {subCategory.name}
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-blue-600">📦</span>
            Quản lý Sản phẩm
          </h1>
          <div className="flex items-center gap-6 mt-2">
            <p className="text-gray-600 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-md">
                📊 Tổng cộng: {totalProducts.toLocaleString('vi-VN')} sản phẩm
              </span>
            </p>
            <p className="text-gray-600 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-md">
                📄 Trang {filters.page}/{totalPages} (10 sản phẩm/trang)
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              console.log('DEBUG - Current state:');
              console.log('filters:', filters);
              console.log('totalPages:', totalPages);
              console.log('totalProducts:', totalProducts);
              console.log('products.length:', products.length);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Debug
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Tên sản phẩm, mô tả..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sắp xếp</label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt-desc">Mới nhất</option>
              <option value="createdAt-asc">Cũ nhất</option>
              <option value="title-asc">Tên A-Z</option>
              <option value="title-desc">Tên Z-A</option>
              <option value="price-asc">Giá thấp → cao</option>
              <option value="price-desc">Giá cao → thấp</option>
            </select>
          </div>
        </form>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-red-800">
              Đã chọn {selectedProducts.length} sản phẩm
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Xóa các sản phẩm đã chọn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chủ sở hữu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá thuê
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày đăng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product._id)}
                      onChange={() => handleSelectProduct(product._id)}
                      className="rounded border-gray-300"
                    />
                  </td>
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
                            <span className="text-gray-500 text-lg">📦</span>
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
                              {product.category.level === 0 ? '�' : product.category.level === 1 ? '�📂' : '📄'} 
                              {product.category.name}
                              {product.category.priority > 5 && <span className="text-yellow-600">⭐</span>}
                            </span>
                          )}
                          {product.subCategory && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-md border border-purple-200">
                              � {product.subCategory.name}
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
                        💰 {formatPrice(product.pricing?.dailyRate || product.dailyRate || 0)}/ngày
                      </div>
                      {product.pricing?.weeklyRate && (
                        <div className="text-xs text-blue-600">
                          📅 {formatPrice(product.pricing.weeklyRate)}/tuần
                        </div>
                      )}
                      {product.pricing?.monthlyRate && (
                        <div className="text-xs text-purple-600">
                          📆 {formatPrice(product.pricing.monthlyRate)}/tháng
                        </div>
                      )}
                      {(product.pricing?.deposit?.amount || product.deposit) && (
                        <div className="text-xs text-orange-600">
                          🔒 Cọc: {formatPrice(product.pricing?.deposit?.amount || product.deposit)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {getStatusBadge(product.status || 'INACTIVE')}
                      {product.availability?.isAvailable === false && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                          ❌ Không khả dụng
                        </div>
                      )}
                      {product.featuredTier && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-md border border-yellow-200">
                          ⭐ Featured T{product.featuredTier}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(product.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium space-x-2">
                    <Link
                      to={`/admin/products/${product._id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Chi tiết
                    </Link>
                    <button
                      onClick={() => handleDeleteProduct(product._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination */}
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-t border-gray-200 rounded-b-lg">
          {/* Mobile Pagination */}
          <div className="flex justify-between items-center sm:hidden">
            <button
              onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
              disabled={filters.page <= 1}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Trước
            </button>
            
            <span className="text-sm font-medium text-gray-700 bg-white px-3 py-2 rounded-lg border">
              {filters.page} / {totalPages}
            </span>
            
            <button
              onClick={() => handleFilterChange('page', Math.min(totalPages, filters.page + 1))}
              disabled={filters.page >= totalPages}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Sau
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Desktop Pagination */}
          <div className="hidden sm:flex sm:items-center sm:justify-between">
            {/* Info Section */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  Hiển thị <span className="text-blue-600 font-bold">{(filters.page - 1) * filters.limit + 1}</span> - 
                  <span className="text-blue-600 font-bold">{Math.min(filters.page * filters.limit, totalProducts)}</span> 
                  trong <span className="text-gray-900 font-bold">{totalProducts}</span> sản phẩm
                </span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-semibold text-blue-700">
                  Trang {filters.page}/{totalPages} ({filters.limit} sản phẩm/trang)
                </span>
              </div>
            </div>

            {/* Navigation Section */}
            <div className="flex items-center">
              <nav className="flex items-center gap-1">
                {/* First & Previous Buttons */}
                <button
                  onClick={() => handleFilterChange('page', 1)}
                  disabled={filters.page <= 1}
                  className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200"
                  title="Trang đầu"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                  </svg>
                  Đầu
                </button>
                
                <button
                  onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                  disabled={filters.page <= 1}
                  className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200"
                  title="Trang trước"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Trước
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 mx-2">
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    const isCurrentPage = page === filters.page;
                    const showPage = page === 1 || 
                                   page === totalPages || 
                                   (page >= filters.page - 2 && page <= filters.page + 2);
                    
                    if (!showPage) {
                      if (page === filters.page - 3 || page === filters.page + 3) {
                        return (
                          <span key={page} className="px-2 py-2 text-gray-400 text-sm font-medium">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => handleFilterChange('page', page)}
                        className={`min-w-[40px] h-10 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm ${
                          isCurrentPage
                            ? 'bg-blue-600 text-white border-2 border-blue-600 shadow-lg scale-105'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
                        }`}
                        title={`Trang ${page}`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                {/* Next & Last Buttons */}
                <button
                  onClick={() => handleFilterChange('page', Math.min(totalPages, filters.page + 1))}
                  disabled={filters.page >= totalPages}
                  className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200"
                  title="Trang sau"
                >
                  Sau
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                <button
                  onClick={() => handleFilterChange('page', totalPages)}
                  disabled={filters.page >= totalPages}
                  className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200"
                  title="Trang cuối"
                >
                  Cuối
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>



      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;