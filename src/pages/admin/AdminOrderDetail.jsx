import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';
import { translateCategory } from '../../utils/categoryTranslation';

const AdminOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useI18n();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      
      const orderData = await adminService.getOrderById(orderId);
      console.log('Fetched order data:', orderData);
      
      if (orderData) {
        setOrder(orderData);
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
                  Chi tiết đơn hàng #{order.masterOrderNumber || order._id?.slice(-6)}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Tạo lúc: {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(order.status)}
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
                  Thông tin người thuê
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-gray-600 min-w-[100px]">Họ và tên:</span>
                    <p className="text-sm text-gray-900 font-medium">
                      {order.renter?.profile?.firstName && order.renter?.profile?.lastName
                        ? `${order.renter.profile.firstName} ${order.renter.profile.lastName}`
                        : order.renter?.username || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-gray-600 min-w-[100px]">Email:</span>
                    <p className="text-sm text-gray-900">{order.renter?.email || 'N/A'}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-gray-600 min-w-[100px]">Số điện thoại:</span>
                    <p className="text-sm text-gray-900">{order.renter?.phone || 'N/A'}</p>
                  </div>
                  
                  {/* Địa chỉ thường trú của renter */}
                  {order.renter?.address && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm text-gray-600 min-w-[100px]">Địa chỉ:</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{formatAddress(order.renter.address)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SubOrders - Products by Owner */}
            {order.subOrders && order.subOrders.length > 0 && (
              <div className="space-y-4">
                {order.subOrders.map((subOrder, index) => (
                  <div key={subOrder._id || index} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <span>🏪</span>
                          Đơn con #{subOrder.subOrderNumber || index + 1}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {subOrder.products?.length || 0} sản phẩm
                        </span>
                      </div>
                      {/* Owner info - Brief */}
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Chủ cho thuê:</span>
                        <span className="font-medium text-purple-700">
                          {subOrder.owner?.profile?.firstName && subOrder.owner?.profile?.lastName
                            ? `${subOrder.owner.profile.firstName} ${subOrder.owner.profile.lastName}`
                            : subOrder.owner?.username || subOrder.owner?.email || 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Owner Full Information */}
                    <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
                      <h4 className="text-sm font-semibold text-purple-900 mb-3">📋 Thông tin chủ sở hữu</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-purple-700 min-w-[80px]">Họ và tên:</span>
                            <p className="text-xs text-purple-900 font-medium">
                              {subOrder.owner?.profile?.firstName && subOrder.owner?.profile?.lastName
                                ? `${subOrder.owner.profile.firstName} ${subOrder.owner.profile.lastName}`
                                : subOrder.owner?.username || 'N/A'}
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-purple-700 min-w-[80px]">Email:</span>
                            <p className="text-xs text-purple-900">{subOrder.owner?.email || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-purple-700 min-w-[80px]">Số điện thoại:</span>
                            <p className="text-xs text-purple-900">{subOrder.owner?.phone || 'N/A'}</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-purple-700 min-w-[80px]">Địa chỉ:</span>
                            <p className="text-xs text-purple-900">{formatAddress(subOrder.owner?.address) || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Products in this subOrder */}
                    <div className="p-6">
                      <div className="space-y-4">
                        {subOrder.products && subOrder.products.map((item, idx) => (
                          <div key={item._id || idx} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            {item.product?.images?.[0] && (
                              <div className="flex-shrink-0">
                                <img
                                  src={item.product.images[0].url}
                                  alt={item.product.title}
                                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-medium text-gray-900 mb-1">
                                {item.product?.title || 'N/A'}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {item.product?.description || 'Không có mô tả'}
                              </p>
                              <div className="flex items-center gap-3 flex-wrap">
                                {item.product?.category?.name && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                                    📁 {translateCategory(item.product.category.name, i18n.language)}
                                  </span>
                                )}
                                <span className="text-xs text-gray-600">
                                  Số lượng: <span className="font-semibold">{item.quantity || 1}</span>
                                </span>
                                {item.rentalRate && (
                                  <span className="text-xs text-green-600 font-medium">
                                    💰 {formatCurrency(item.rentalRate)}
                                  </span>
                                )}
                                {item.productStatus&& (
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    item.productStatus=== 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                    item.productStatus=== 'REJECTED' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {item.confirmationStatus}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* SubOrder totals */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tổng tiền thuê:</span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(subOrder.pricing.subtotalDeposit + subOrder.pricing.subtotalRental || 0)}
                          </span>
                        </div>
                        {subOrder.totalDepositAmount > 0 && (
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-600">Tiền cọc:</span>
                            <span className="font-semibold text-orange-600">
                              {formatCurrency(subOrder.totalDepositAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                        {order.deliveryMethod === 'DELIVERY' ? '🚚 Giao hàng tận nơi' : 
                         order.deliveryMethod === 'PICKUP' ? '🏪 Tự lấy' : 'N/A'}
                      </p>
                      {order.deliveryAddress?.contactPhone && (
                        <p className="text-sm text-gray-600">
                          📞 SĐT liên hệ: {order.deliveryAddress.contactPhone}
                        </p>
                      )}
                      {order.deliveryAddress?.contactName && (
                        <p className="text-sm text-gray-600">
                          👤 Người nhận: {order.deliveryAddress.contactName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Chi phí</h4>
                    <p className="text-sm text-gray-900 font-medium text-green-600">
                      💰 Phí giao hàng: {formatCurrency(order.totalShippingFee || 0)}
                    </p>
                  </div>
                </div>
                
                {/* Địa chỉ nhận hàng */}
                {order.deliveryAddress && order.deliveryMethod === 'DELIVERY' && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">📍 Địa chỉ nhận hàng</h4>
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800 font-medium">
                        {formatAddress(order.deliveryAddress)}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        * Đây là địa chỉ mà người thuê yêu cầu giao hàng đến
                      </p>
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
                  <span className="text-gray-600">Tổng tiền thuê:</span>
                  <span className="font-medium">{formatCurrency(order.totalAmount || 0)}</span>
                </div>
                {order.totalDepositAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tổng tiền cọc:</span>
                    <span className="font-medium text-orange-600">{formatCurrency(order.totalDepositAmount)}</span>
                  </div>
                )}
                {order.totalShippingFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí giao hàng:</span>
                    <span className="font-medium">{formatCurrency(order.totalShippingFee)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-base font-medium text-gray-900">Tổng thanh toán:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency((order.totalAmount || 0) + (order.totalDepositAmount || 0) + (order.totalShippingFee || 0))}
                    </span>
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
                {order.rentalPeriod?.startDate && order.rentalPeriod?.endDate ? (
                  <>
                    <div>
                      <span className="text-sm text-gray-600">Ngày bắt đầu:</span>
                      <p className="font-medium">{formatDate(order.rentalPeriod.startDate)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Ngày kết thúc:</span>
                      <p className="font-medium">{formatDate(order.rentalPeriod.endDate)}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Thời gian thuê được quy định riêng cho từng sản phẩm trong đơn con
                  </p>
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