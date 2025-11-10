import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin';
import { useAuth } from '../../hooks/useAuth';

const AdminOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Bạn cần đăng nhập để xem chi tiết đơn hàng');
        return;
      }
      
      // Fetch order detail (assuming we have this API)
      const response = await adminService.getOrderById(orderId);
      
      if (response && response.success && response.data) {
        setOrder(response.data);
      } else {
        setError('Không tìm thấy đơn hàng');
      }
    } catch (err) {
      console.error('Error fetching order detail:', err);
      setError('Lỗi khi tải chi tiết đơn hàng: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      await adminService.updateOrderStatus(orderId, newStatus);
      setOrder(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Lỗi khi cập nhật trạng thái: ' + (err.message || 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  // Status badge functions
  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { text: '⏳ Chờ xử lý', color: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
      CONFIRMED: { text: '✅ Đã xác nhận', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
      PAID: { text: '💳 Đã thanh toán', color: 'bg-green-50 text-green-700 border border-green-200' },
      SHIPPED: { text: '🚚 Đã gửi hàng', color: 'bg-purple-50 text-purple-700 border border-purple-200' },
      DELIVERED: { text: '📦 Đã giao hàng', color: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
      ACTIVE: { text: '🟢 Đang thuê', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
      RETURNED: { text: '↩️ Đã trả', color: 'bg-orange-50 text-orange-700 border border-orange-200' },
      COMPLETED: { text: '🎉 Hoàn thành', color: 'bg-green-50 text-green-700 border border-green-200' },
      CANCELLED: { text: '❌ Đã hủy', color: 'bg-red-50 text-red-700 border border-red-200' }
    };
    
    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-50 text-gray-700 border border-gray-200' };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const statusMap = {
      PENDING: { text: '⏳ Chờ thanh toán', color: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
      PARTIAL: { text: '🔄 Thanh toán một phần', color: 'bg-orange-50 text-orange-700 border border-orange-200' },
      PAID: { text: '💳 Đã thanh toán', color: 'bg-green-50 text-green-700 border border-green-200' },
      REFUNDED: { text: '💰 Đã hoàn tiền', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
      FAILED: { text: '❌ Thất bại', color: 'bg-red-50 text-red-700 border border-red-200' }
    };
    
    const statusInfo = statusMap[paymentStatus] || { text: paymentStatus, color: 'bg-gray-50 text-gray-700 border border-gray-200' };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    
    // If address is a string, return it directly
    if (typeof address === 'string') {
      return address;
    }
    
    // If address is an object, format it
    if (typeof address === 'object') {
      const parts = [];
      if (address.streetAddress) parts.push(address.streetAddress);
      if (address.ward) parts.push(address.ward);
      if (address.district) parts.push(address.district);
      if (address.city) parts.push(address.city);
      if (address.province) parts.push(address.province);
      
      return parts.length > 0 ? parts.join(', ') : 'N/A';
    }
    
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Đang tải chi tiết đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow max-w-md w-full">
          <div className="text-red-600 text-center">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Có lỗi xảy ra</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/admin/orders')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">Không tìm thấy đơn hàng</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/orders')}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Quay lại
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="text-3xl">📋</span>
                  Chi tiết đơn hàng #{order.orderNumber || order._id?.slice(-6)}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Tạo lúc: {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(order.status)}
              {getPaymentStatusBadge(order.paymentStatus)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span>👤</span>
                  Thông tin khách hàng
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Người thuê</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-900 font-medium">
                        {order.renter?.cccd?.fullName || order.renter?.profile?.firstName + ' ' + order.renter?.profile?.lastName || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">{order.renter?.email || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{order.renter?.phone || 'N/A'}</p>
                      
                      {/* Địa chỉ thường trú của renter */}
                      {order.renter?.address && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h5 className="text-xs font-medium text-blue-800 mb-1">🏠 Địa chỉ thường trú</h5>
                          <p className="text-xs text-blue-700">{formatAddress(order.renter.address)}</p>
                        </div>
                      )}
                      
                      {/* Địa chỉ trên CCCD của renter */}
                      {order.renter?.cccd?.address && (
                        <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                          <h5 className="text-xs font-medium text-green-800 mb-1">🆔 Địa chỉ trên CCCD</h5>
                          <p className="text-xs text-green-700">{order.renter.cccd.address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Chủ sở hữu</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-900 font-medium">
                        {order.owner?.cccd?.fullName || order.owner?.profile?.firstName + ' ' + order.owner?.profile?.lastName || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">{order.owner?.email || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{order.owner?.phone || 'N/A'}</p>
                      
                      {/* Địa chỉ thường trú của owner */}
                      {order.owner?.address && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <h5 className="text-xs font-medium text-purple-800 mb-1">🏠 Địa chỉ thường trú</h5>
                          <p className="text-xs text-purple-700">{formatAddress(order.owner.address)}</p>
                        </div>
                      )}
                      
                      {/* Địa chỉ trên CCCD của owner */}
                      {order.owner?.cccd?.address && (
                        <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <h5 className="text-xs font-medium text-orange-800 mb-1">🆔 Địa chỉ trên CCCD</h5>
                          <p className="text-xs text-orange-700">{order.owner.cccd.address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span>📦</span>
                  Thông tin sản phẩm
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {order.product?.images?.length > 0 && (
                    <div className="flex-shrink-0">
                      <img
                        src={order.product.images[0]}
                        alt={order.product.title}
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      {order.product?.title || order.product?.name || 'N/A'}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {order.product?.description || 'Không có mô tả'}
                    </p>
                    <div className="flex items-center space-x-4">
                      {order.product?.category && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200">
                          📁 {order.product.category.name}
                        </span>
                      )}
                      {order.product?.condition && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200">
                          ⭐ {order.product.condition}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span>🚚</span>
                  Thông tin giao hàng
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Phương thức giao hàng</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-900">
                        {order.delivery?.method === 'DELIVERY' ? '🚚 Giao hàng tận nơi' : 
                         order.delivery?.method === 'PICKUP' ? '🏪 Tự lấy' : 'N/A'}
                      </p>
                      {order.delivery?.contactPhone && (
                        <p className="text-sm text-gray-600">
                          📞 SĐT liên hệ: {order.delivery.contactPhone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Chi phí</h4>
                    <p className="text-sm text-gray-900 font-medium text-green-600">
                      💰 Phí giao hàng: {formatCurrency(order.pricing?.deliveryFee)}
                    </p>
                  </div>
                </div>
                
                {/* Địa chỉ nhận hàng */}
                {order.delivery?.address && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">📍 Địa chỉ nhận hàng</h4>
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800 font-medium">
                        {formatAddress(order.delivery.address)}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        * Đây là địa chỉ mà người thuê yêu cầu giao hàng đến
                      </p>
                    </div>
                  </div>
                )}
                
                {/* So sánh với địa chỉ thường trú */}
                {order.delivery?.address && order.renter?.address && (
                  <div className="mt-4">
                    <div className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
                      <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-600">
                          <strong>So sánh:</strong> Địa chỉ nhận hàng {
                            formatAddress(order.delivery.address) === formatAddress(order.renter.address) 
                              ? '✅ trùng khớp' 
                              : '⚠️ khác với địa chỉ thường trú'
                          } với địa chỉ thường trú của người thuê
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span>📅</span>
                  Lịch sử đơn hàng
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Đơn hàng được tạo</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  {order.confirmedAt && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Đơn hàng được xác nhận</p>
                        <p className="text-xs text-gray-500">{formatDate(order.confirmedAt)}</p>
                      </div>
                    </div>
                  )}
                  {order.completedAt && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Đơn hàng hoàn thành</p>
                        <p className="text-xs text-gray-500">{formatDate(order.completedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span>💰</span>
                  Tổng quan giá
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Giá thuê:</span>
                  <span className="font-medium">{formatCurrency(order.pricing?.rentalRate)}</span>
                </div>
                {order.pricing?.deposit && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tiền cọc:</span>
                    <span className="font-medium text-orange-600">{formatCurrency(order.pricing.deposit)}</span>
                  </div>
                )}
                {order.pricing?.deliveryFee && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí giao hàng:</span>
                    <span className="font-medium">{formatCurrency(order.pricing.deliveryFee)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-base font-medium text-gray-900">Tổng cộng:</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(order.pricing?.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rental Period */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span>📅</span>
                  Thời gian thuê
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-sm text-gray-600">Thời lượng:</span>
                  <p className="font-medium">
                    {order.rentalPeriod?.duration || 'N/A'} {
                      order.rentalPeriod?.unit === 'DAY' ? 'ngày' : 
                      order.rentalPeriod?.unit === 'WEEK' ? 'tuần' : 
                      order.rentalPeriod?.unit === 'MONTH' ? 'tháng' : ''
                    }
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Ngày bắt đầu:</span>
                  <p className="font-medium">{formatDate(order.rentalPeriod?.startDate)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Ngày kết thúc:</span>
                  <p className="font-medium">{formatDate(order.rentalPeriod?.endDate)}</p>
                </div>
              </div>
            </div>

            {/* Status Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span>⚙️</span>
                  Quản lý trạng thái
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái đơn hàng
                  </label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                </div>
                {updating && (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Đang cập nhật...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;