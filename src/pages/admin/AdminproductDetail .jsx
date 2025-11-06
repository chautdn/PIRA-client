import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin';

const AdminProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching product with ID:', productId);
      const data = await adminService.getProductById(productId);
      console.log('Received product data:', data);
      
      if (data) {
        setProduct(data);
      } else {
        setError('Không tìm thấy sản phẩm');
      }
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin sản phẩm');
      console.error('Load product error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setActionLoading(true);
      
      console.log('Updating product status:', productId, newStatus);
      const updatedData = await adminService.updateProductStatus(productId, newStatus);
      console.log('Status update response:', updatedData);
      
      // Update local state
      setProduct(prev => ({ ...prev, status: newStatus }));
      
      const statusMessages = {
        'ACTIVE': 'kích hoạt',
        'SUSPENDED': 'tạm khóa',
        'INACTIVE': 'vô hiệu hóa',
        'PENDING': 'đưa về chờ duyệt'
      };
      
      alert(`Đã ${statusMessages[newStatus]} sản phẩm thành công!`);
    } catch (err) {
      alert(err.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
      console.error('Update status error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

    try {
      setActionLoading(true);
      
      console.log('Deleting product:', productId);
      await adminService.deleteProduct(productId);
      console.log('Product deleted successfully');
      
      alert('Đã xóa sản phẩm thành công!');
      navigate('/admin/products');
    } catch (err) {
      alert(err.message || 'Có lỗi xảy ra khi xóa sản phẩm');
      console.error('Delete product error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Nháp' },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ duyệt' },
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Hoạt động' },
      RENTED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đã thuê' },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Không hoạt động' },
      SUSPENDED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Bị khóa' }
    };
    
    const badge = badges[status] || badges.DRAFT;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getConditionBadge = (condition) => {
    const badges = {
      NEW: { bg: 'bg-green-100', text: 'text-green-800', label: 'Mới' },
      LIKE_NEW: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Như mới' },
      GOOD: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Tốt' },
      FAIR: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Khá' },
      POOR: { bg: 'bg-red-100', text: 'text-red-800', label: 'Kém' }
    };
    
    const badge = badges[condition] || badges.GOOD;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-500 mr-2">⚠️</span>
          <span className="text-red-800">{error || 'Không tìm thấy sản phẩm'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold">{product.title}</h1>
                <p className="text-white/80 mt-1">Chi tiết sản phẩm</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                {getStatusBadge(product.status)}
              </div>
              {product.featuredTier && (
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Featured Tier {product.featuredTier}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Product Images Gallery - Enhanced Design */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            Hình ảnh sản phẩm
          </h3>
        
          {product.images && product.images.length > 0 ? (
            <div className="space-y-6">
              {/* Main Image */}
              <div className="w-full h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-inner">
                <img
                  src={product.images[selectedImageIndex]?.url}
                  alt={product.images[selectedImageIndex]?.alt || `Product image ${selectedImageIndex + 1}`}
                  className="w-full h-full object-contain hover:object-cover transition-all duration-300 cursor-zoom-in"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x400?text=No+Image';
                  }}
                  onClick={() => window.open(product.images[selectedImageIndex]?.url, '_blank')}
                />
              </div>

              {/* Thumbnail Gallery */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-8 gap-3">
                  {product.images.map((image, index) => (
                    <div 
                      key={index} 
                      className={`aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer border-3 transition-all duration-200 hover:scale-105 ${
                        selectedImageIndex === index 
                          ? 'border-gradient-to-r from-purple-500 to-pink-500 ring-4 ring-purple-200 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img
                        src={image.url}
                        alt={image.alt || `Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Image Info */}
              <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <span className="text-gray-700 font-semibold">
                  📷 Hình {selectedImageIndex + 1} / {product.images.length}
                </span>
                <span className="text-gray-600">
                  🔍 Nhấp vào hình để xem chi tiết
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xl font-semibold">Không có hình ảnh</p>
                <p className="text-gray-400 mt-2">Sản phẩm này chưa có hình ảnh nào</p>
              </div>
            </div>
          )}
      </div>

        {/* Action Buttons - Enhanced Design */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            Quản lý sản phẩm
          </h3>
          <div className="flex flex-wrap gap-4">
            {product.status === 'PENDING' && (
              <button
                onClick={() => handleStatusChange('ACTIVE')}
                disabled={actionLoading}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Duyệt sản phẩm
              </button>
            )}
            
            {product.status === 'ACTIVE' && (
              <button
                onClick={() => handleStatusChange('SUSPENDED')}
                disabled={actionLoading}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 disabled:opacity-50 font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
                Tạm khóa
              </button>
            )}
            
            {product.status === 'SUSPENDED' && (
              <button
                onClick={() => handleStatusChange('ACTIVE')}
                disabled={actionLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                Mở khóa
              </button>
            )}
            
            <button
              onClick={handleDeleteProduct}
              disabled={actionLoading}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 disabled:opacity-50 font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Xóa sản phẩm
            </button>
          </div>
        </div>

        {/* Product Info Grid - Enhanced Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Info - Enhanced Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Thông tin cơ bản
              </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Tên sản phẩm</label>
                <p className="text-gray-900 font-medium">{product.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Tình trạng</label>
                <div className="mt-1">{getConditionBadge(product.condition)}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-600">Danh mục</label>
                    <p className="text-lg font-semibold text-gray-900">{product.category?.name || 'Chưa phân loại'}</p>
                  </div>
                  {product.category?.name && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Đã phân loại
                    </span>
                  )}
                </div>
              </div>
              {product.category && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Mức độ ưu tiên</label>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i} 
                          className={`w-4 h-4 ${i < (product.category.priority || 1) ? 'text-yellow-400' : 'text-gray-300'}`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="text-sm font-medium text-gray-600 ml-1">
                        ({product.category.priority || 1}/5)
                      </span>
                    </div>
                  </div>
                 
                </>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">Thương hiệu</label>
                <p className="text-gray-900">{product.brand?.name || 'N/A'} {product.brand?.model || ''}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Số lượng</label>
                <p className="text-gray-900">{product.availability?.quantity || 1}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Ngày tạo</label>
                <p className="text-gray-900">{new Date(product.createdAt).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600">Mô tả</label>
              <p className="text-gray-900 mt-1 whitespace-pre-wrap">{product.description}</p>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Giá cho thuê</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Giá theo ngày</label>
                <p className="text-xl font-bold text-green-600">
                  {product.pricing?.dailyRate?.toLocaleString('vi-VN')} VND
                </p>
              </div>
              {product.pricing?.weeklyRate && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Giá theo tuần</label>
                  <p className="text-xl font-bold text-blue-600">
                    {product.pricing.weeklyRate.toLocaleString('vi-VN')} VND
                  </p>
                </div>
              )}
              {product.pricing?.monthlyRate && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Giá theo tháng</label>
                  <p className="text-xl font-bold text-purple-600">
                    {product.pricing.monthlyRate.toLocaleString('vi-VN')} VND
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">Tiền cọc</label>
                <p className="text-lg font-medium text-orange-600">
                  {product.pricing?.deposit?.amount?.toLocaleString('vi-VN')} VND
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📍 Địa điểm</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Địa chỉ</label>
                <p className="text-gray-900">
                  {product.location?.address?.streetAddress}, {product.location?.address?.ward},<br/>
                  {product.location?.address?.district}, {product.location?.address?.city}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Tùy chọn giao hàng</label>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className={product.location?.deliveryOptions?.pickup ? 'text-green-600' : 'text-red-600'}>
                      {product.location?.deliveryOptions?.pickup ? '✅' : '❌'} Tự đến lấy
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className={product.location?.deliveryOptions?.delivery ? 'text-green-600' : 'text-red-600'}>
                      {product.location?.deliveryOptions?.delivery ? '✅' : '❌'} Giao hàng
                    </span>
                  </p>
                  {product.location?.deliveryOptions?.deliveryFee > 0 && (
                    <p className="text-sm text-gray-600">
                      Phí giao hàng: {product.location.deliveryOptions.deliveryFee.toLocaleString('vi-VN')} VND
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Side Panel - Enhanced Sidebar */}
          <div className="space-y-8">
            {/* Owner Info - Enhanced Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                Chủ sở hữu
              </h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-lg text-gray-900">{product.owner?.fullName || product.owner?.username}</p>
                  <p className="text-gray-600">{product.owner?.email}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">📞 Điện thoại:</span>
                  <span className="font-semibold text-gray-900">{product.owner?.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600 font-medium">📅 Ngày tham gia:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(product.owner?.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics - Enhanced Stats */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl p-8 border border-indigo-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                Thống kê
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 bg-white/50 rounded-xl px-4">
                  <span className="text-gray-700 font-medium">👁️ Lượt xem:</span>
                  <span className="font-black text-2xl text-indigo-600">{product.metrics?.viewCount || 0}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-white/50 rounded-xl px-4">
                  <span className="text-gray-700 font-medium">🏠 Lượt thuê:</span>
                  <span className="font-black text-2xl text-purple-600">{product.metrics?.rentalCount || 0}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-white/50 rounded-xl px-4">
                  <span className="text-gray-700 font-medium">⭐ Đánh giá:</span>
                  <div className="text-right">
                    <span className="font-black text-2xl text-yellow-600">
                      {product.metrics?.averageRating || 0}/5
                    </span>
                    <p className="text-sm text-gray-600">
                      ({product.metrics?.reviewCount || 0} đánh giá)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Image Preview - Enhanced Gallery */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                Tổng quan hình ảnh
              </h3>
              <div className="text-center mb-4">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-100 to-rose-100 rounded-xl">
                  <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-bold text-pink-700">
                    Tổng cộng: {product.images?.length || 0} hình ảnh
                  </span>
                </span>
              </div>
              {product.images?.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {product.images.slice(0, 6).map((image, index) => (
                    <div 
                      key={index} 
                      className="aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 border-2 border-gray-200 hover:border-pink-300"
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img
                        src={image.url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/60x60?text=No+Image';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              {product.images?.length > 6 && (
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    +{product.images.length - 6} ảnh khác
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductDetail;