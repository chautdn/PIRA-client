import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin';
import { useAuth } from '../../hooks/useAuth';

const OrderManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentStatus: '',
    page: 1
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Bạn cần đăng nhập để xem danh sách đơn hàng');
        setOrders([]);
        return;
      }
      
      const response = await adminService.getOrders(filters);
      
      // Handle different response structures
      if (response && response.success && response.data) {
        const { orders: ordersData, total, totalPages, currentPage } = response.data;
        
        setOrders(ordersData || []);
        setPagination({
          currentPage: currentPage || 1,
          totalPages: totalPages || 1,
          total: total || 0,
          limit: 10
        });
      } else if (response && response.orders) {
        // Direct orders response
        setOrders(response.orders || []);
        setPagination({
          currentPage: response.currentPage || 1,
          totalPages: response.totalPages || 1,
          total: response.total || 0,
          limit: 10
        });
      } else {
        setOrders([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          total: 0,
          limit: 10
        });
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      
      // Handle specific error types
      if (err.response?.status === 401) {
        setError('Bạn không có quyền truy cập. Vui lòng đăng nhập lại.');
        // Clear invalid token
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      } else if (err.response?.status === 403) {
        setError('Bạn không có quyền admin để xem danh sách đơn hàng.');
      } else if (err.response?.status === 500) {
        setError('Lỗi server. Vui lòng thử lại sau.');
      } else if (err.code === 'NETWORK_ERROR') {
        setError('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.');
      } else {
        setError('Lỗi khi tải danh sách đơn hàng: ' + (err.response?.data?.message || err.message));
      }
      
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1
    }));
  };

  const handlePageChange = (page) => {
    handleFilterChange('page', page);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      // Refresh orders after status update
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Lỗi khi cập nhật trạng thái đơn hàng');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 VND';
    return `${Number(amount).toLocaleString('vi-VN')} VND`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        text: 'Chờ xử lý',
        icon: '⏳'
      },
      'CONFIRMED': { 
        color: 'bg-purple-100 text-purple-800 border-purple-200', 
        text: 'Đã xác nhận',
        icon: '✅'
      },
      'PAID': { 
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200', 
        text: 'Đã thanh toán',
        icon: '💳'
      },
      'SHIPPED': { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        text: 'Đã gửi hàng',
        icon: '🚚'
      },
      'DELIVERED': { 
        color: 'bg-cyan-100 text-cyan-800 border-cyan-200', 
        text: 'Đã giao hàng',
        icon: '📦'
      },
      'ACTIVE': { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        text: 'Đang thuê',
        icon: '🟢'
      },
      'RETURNED': { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        text: 'Đã trả',
        icon: '↩️'
      },
      'COMPLETED': { 
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
        text: 'Hoàn thành',
        icon: '🎉'
      },
      'CANCELLED': { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        text: 'Đã hủy',
        icon: '❌'
      }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const statusConfig = {
      'PENDING': { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        text: 'Chờ thanh toán',
        icon: '⏳'
      },
      'PAID': { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        text: 'Đã thanh toán',
        icon: '✅'
      },
      'PARTIALLY_PAID': { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        text: 'Thanh toán một phần',
        icon: '🔄'
      },
      'FAILED': { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        text: 'Thất bại',
        icon: '❌'
      },
      'REFUNDED': { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        text: 'Đã hoàn tiền',
        icon: '💸'
      }
    };

    const config = statusConfig[paymentStatus] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-blue-600">📋</span>
            Quản lý Đơn hàng
          </h1>
          <div className="flex items-center gap-6 mt-2">
            <p className="text-gray-600 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-md">
                📊 Tổng cộng: {pagination.total.toLocaleString('vi-VN')} đơn hàng
              </span>
            </p>
            <p className="text-gray-600 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-md">
                📄 Trang {pagination.currentPage}/{pagination.totalPages}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span>🔍</span>
            Bộ lọc & Tìm kiếm
          </h2>
          <button
            onClick={() => setFilters({ search: '', status: '', paymentStatus: '', page: 1 })}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            <span>🗑️</span>
            Xóa bộ lọc
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <span>🔍</span>
                Tìm kiếm
              </span>
            </label>
            <input
              type="text"
              placeholder="Mã đơn hàng, tên khách hàng..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <span>📋</span>
                Trạng thái đơn hàng
              </span>
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">⏳ Chờ xử lý</option>
              <option value="CONFIRMED">✅ Đã xác nhận</option>
              <option value="PAID">💳 Đã thanh toán</option>
              <option value="SHIPPED">🚚 Đã gửi hàng</option>
              <option value="DELIVERED">📦 Đã giao hàng</option>
              <option value="ACTIVE">🟢 Đang thuê</option>
              <option value="RETURNED">↩️ Đã trả</option>
              <option value="COMPLETED">🎉 Hoàn thành</option>
              <option value="CANCELLED">❌ Đã hủy</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <span>💳</span>
                Trạng thái thanh toán
              </span>
            </label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Tất cả thanh toán</option>
              <option value="PENDING">⏳ Chờ thanh toán</option>
              <option value="PAID">✅ Đã thanh toán</option>
              <option value="PARTIALLY_PAID">🔄 Thanh toán một phần</option>
              <option value="FAILED">❌ Thất bại</option>
              <option value="REFUNDED">💸 Đã hoàn tiền</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-red-800">{error}</p>
            {(error.includes('không có quyền') || error.includes('đăng nhập')) && (
              <button
                onClick={() => navigate('/auth/login')}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span>📋</span>
            Danh sách đơn hàng ({orders.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá trị
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian thuê
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Không có đơn hàng</h3>
                      <p className="mt-1 text-sm text-gray-500">Chưa có đơn hàng nào trong hệ thống.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNumber || `#${order._id?.slice(-6)}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.renter?.fullName || order.renter?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.renter?.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {order.product?.title || order.product?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Chủ: {order.owner?.fullName || order.owner?.name || 'N/A'}
                        </div>
                        {order.product?.category && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-200">
                              📁 {order.product.category.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-green-700">
                          💰 {formatCurrency(order.pricing?.total)}
                        </div>
                        {order.pricing?.deposit && (
                          <div className="text-xs text-orange-600">
                            🔒 Cọc: {formatCurrency(order.pricing.deposit)}
                          </div>
                        )}
                        {order.pricing?.deliveryFee && (
                          <div className="text-xs text-blue-600">
                            🚚 Ship: {formatCurrency(order.pricing.deliveryFee)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {getStatusBadge(order.status)}
                        {getPaymentStatusBadge(order.paymentStatus)}
                        {order.delivery?.method && (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                            {order.delivery.method === 'DELIVERY' ? '🚚 Giao hàng' : '🏪 Tự lấy'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.rentalPeriod?.duration || 'N/A'} {order.rentalPeriod?.unit === 'DAY' ? 'ngày' : order.rentalPeriod?.unit === 'WEEK' ? 'tuần' : order.rentalPeriod?.unit === 'MONTH' ? 'tháng' : ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.rentalPeriod?.startDate ? formatDate(order.rentalPeriod.startDate) : 'N/A'}
                      </div>
                      {order.pricing?.rentalRate && (
                        <div className="text-xs text-green-600">
                          📅 {formatCurrency(order.pricing.rentalRate)}/{order.rentalPeriod?.unit === 'DAY' ? 'ngày' : order.rentalPeriod?.unit === 'WEEK' ? 'tuần' : 'tháng'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <button
                          onClick={() => navigate(`/admin/orders/${order._id}`)}
                          className="w-full px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-1"
                        >
                          👁️ Xem chi tiết
                        </button>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="PENDING">⏳ Chờ xử lý</option>
                          <option value="CONFIRMED">✅ Đã xác nhận</option>
                          <option value="PAID">💳 Đã thanh toán</option>
                          <option value="SHIPPED">🚚 Đã gửi hàng</option>
                          <option value="DELIVERED">📦 Đã giao hàng</option>
                          <option value="ACTIVE">🟢 Đang thuê</option>
                          <option value="RETURNED">↩️ Đã trả</option>
                          <option value="COMPLETED">🎉 Hoàn thành</option>
                          <option value="CANCELLED">❌ Đã hủy</option>
                        </select>
                        {(order.confirmedAt || order.completedAt) && (
                          <div className="text-xs text-gray-500">
                            {order.confirmedAt && <div>✅ {formatDate(order.confirmedAt)}</div>}
                            {order.completedAt && <div>🎉 {formatDate(order.completedAt)}</div>}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
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
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">{(pagination.currentPage - 1) * pagination.limit + 1}</span> đến{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * pagination.limit, pagination.total)}
                </span>{' '}
                trong <span className="font-medium">{pagination.total}</span> kết quả
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
  );
};

export default OrderManagement;
