import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin';

const OrderManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrders, setSelectedOrders] = useState([]);

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('OrderManagement - Loading orders with filters:', filters);
      const response = await adminService.getOrders(filters);
      
      console.log('OrderManagement - API response:', response);
      
      // Safe check for response structure
      if (response && typeof response === 'object') {
        const orders = response.orders || response.data?.orders || response.data || [];
        const totalOrders = response.total || response.data?.total || orders.length;
        const totalPages = response.totalPages || response.data?.totalPages || Math.ceil(totalOrders / filters.limit);
        
        console.log('OrderManagement - Orders count:', orders.length);
        console.log('OrderManagement - Total orders:', totalOrders);
        console.log('OrderManagement - Total pages calculated:', totalPages);
        console.log('OrderManagement - Current limit:', filters.limit);
        
        setOrders(orders);
        setTotalPages(totalPages);
        setTotalOrders(totalOrders);
      } else {
        // Fallback for unexpected response structure
        setOrders([]);
        setTotalPages(1);
        setTotalOrders(0);
      }
    } catch (err) {
      setError('Không thể tải danh sách đơn hàng');
      console.error('Load orders error:', err);
      // Set default values on error
      setOrders([]);
      setTotalPages(1);
      setTotalOrders(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    console.log('OrderManagement - Filter change:', { key, value });
    const newFilters = {
      ...filters,
      [key]: value,
      page: key !== 'page' ? 1 : value
    };
    console.log('OrderManagement - New filters:', newFilters);
    setFilters(newFilters);
    
    // Force reload if page change
    if (key === 'page') {
      setTimeout(() => loadOrders(), 100);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadOrders();
  };

  const handleSort = (field) => {
    const newOrder = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    handleFilterChange('sortBy', field);
    handleFilterChange('sortOrder', newOrder);
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAllOrders = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order._id));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        border: 'border-yellow-200',
        icon: '⏳',
        label: 'Chờ xử lý' 
      },
      CONFIRMED: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800', 
        border: 'border-blue-200',
        icon: '✅',
        label: 'Đã xác nhận' 
      },
      PROCESSING: { 
        bg: 'bg-purple-100', 
        text: 'text-purple-800', 
        border: 'border-purple-200',
        icon: '⚙️',
        label: 'Đang xử lý' 
      },
      SHIPPED: { 
        bg: 'bg-indigo-100', 
        text: 'text-indigo-800', 
        border: 'border-indigo-200',
        icon: '🚚',
        label: 'Đã giao hàng' 
      },
      DELIVERED: { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        border: 'border-green-200',
        icon: '📦',
        label: 'Đã nhận hàng' 
      },
      COMPLETED: { 
        bg: 'bg-emerald-100', 
        text: 'text-emerald-800', 
        border: 'border-emerald-200',
        icon: '🎉',
        label: 'Hoàn thành' 
      },
      CANCELLED: { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        border: 'border-red-200',
        icon: '❌',
        label: 'Đã hủy' 
      },
      REFUNDED: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800', 
        border: 'border-gray-200',
        icon: '💰',
        label: 'Đã hoàn tiền' 
      }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${config.bg} ${config.text} ${config.border}`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      HIGH: { bg: 'bg-red-100', text: 'text-red-800', icon: '🔥', label: 'Cao' },
      MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⚡', label: 'Trung bình' },
      LOW: { bg: 'bg-green-100', text: 'text-green-800', icon: '📋', label: 'Thấp' }
    };

    const config = priorityConfig[priority] || priorityConfig.MEDIUM;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-500 mr-2">⚠️</span>
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
              <p className="text-blue-100 mt-1">Quản lý và theo dõi tất cả đơn hàng trong hệ thống</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 mt-2">
            <p className="text-white flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-md">
                📊 Tổng cộng: {totalOrders.toLocaleString('vi-VN')} đơn hàng
              </span>
            </p>
            <p className="text-white flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-md">
                📄 Trang {filters.page}/{totalPages} (10 đơn hàng/trang)
              </span>
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <button 
            onClick={() => {
              console.log('DEBUG - Current state:');
              console.log('filters:', filters);
              console.log('totalPages:', totalPages);
              console.log('totalOrders:', totalOrders);
              console.log('orders.length:', orders.length);
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm theo mã đơn, khách hàng..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="PROCESSING">Đang xử lý</option>
              <option value="SHIPPED">Đã giao hàng</option>
              <option value="DELIVERED">Đã nhận hàng</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="REFUNDED">Đã hoàn tiền</option>
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
              <option value="totalAmount-desc">Giá trị cao nhất</option>
              <option value="totalAmount-asc">Giá trị thấp nhất</option>
              <option value="orderNumber-asc">Mã đơn hàng A-Z</option>
              <option value="orderNumber-desc">Mã đơn hàng Z-A</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadOrders}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === orders.length && orders.length > 0}
                    onChange={handleSelectAllOrders}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('orderNumber')}>
                  <div className="flex items-center gap-1">
                    <span>Mã đơn hàng</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('totalAmount')}>
                  <div className="flex items-center gap-1">
                    <span>Tổng tiền</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}>
                  <div className="flex items-center gap-1">
                    <span>Ngày tạo</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <p className="text-gray-500 text-lg font-medium">Không có đơn hàng nào</p>
                      <p className="text-gray-400 mt-1">Chưa có đơn hàng nào trong hệ thống</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order._id)}
                        onChange={() => handleSelectOrder(order._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{order.orderNumber || order._id?.slice(-8)}
                          </div>
                          {order.priority && (
                            <div className="mt-1">
                              {getPriorityBadge(order.priority)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customer?.name || order.customer?.fullName || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customer?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items?.length > 0 ? (
                          <div>
                            <div className="font-medium">
                              {order.items[0].product?.title || 'Sản phẩm không xác định'}
                            </div>
                            {order.items.length > 1 && (
                              <div className="text-gray-500 text-xs">
                                +{order.items.length - 1} sản phẩm khác
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">Không có sản phẩm</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        {(order.totalAmount || 0).toLocaleString('vi-VN')} VNĐ
                      </div>
                      {order.paymentMethod && (
                        <div className="text-xs text-gray-500">
                          {order.paymentMethod}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/orders/${order._id}`)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Xem chi tiết"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  Hiển thị <span className="text-blue-600 font-bold">{(filters.page - 1) * filters.limit + 1}</span> - 
                  <span className="text-blue-600 font-bold">{Math.min(filters.page * filters.limit, totalOrders)}</span> 
                  trong <span className="text-gray-900 font-bold">{totalOrders}</span> đơn hàng
                </span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-semibold text-blue-700">
                  Trang {filters.page}/{totalPages} ({filters.limit} đơn hàng/trang)
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
    </div>
  );
};

export default OrderManagement;