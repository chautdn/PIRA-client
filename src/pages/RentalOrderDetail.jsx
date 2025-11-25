import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useRentalOrder } from '../context/RentalOrderContext';
import { useAuth } from "../hooks/useAuth";
import toast from 'react-hot-toast';
import api from '../services/api';
import { 
  ArrowLeft,
  Package, 
  Calendar, 
  MapPin, 
  DollarSign, 
  User,
  Phone,
  Mail,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  MessageCircle
} from 'lucide-react';

const RentalOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { 
    currentOrder, 
    isLoadingOrderDetail, // Changed from isLoading
    confirmOwnerOrder,
    rejectOwnerOrder,
    loadOrderDetail 
  } = useRentalOrder();

  const [activeTab, setActiveTab] = useState('overview');
  const [confirmAction, setConfirmAction] = useState(null); // 'confirm' or 'reject'
  const [rejectReason, setRejectReason] = useState('');

  // Check if this is a payment return
  const payment = searchParams.get('payment');
  const orderCode = searchParams.get('orderCode');

  // Load order detail first
  useEffect(() => {
    if (id) {
      console.log('📥 Loading order detail for ID:', id);
      loadOrderDetail(id);
    }
  }, [id]);

  // Then handle payment verification if needed
  useEffect(() => {
    const handlePaymentReturn = async () => {
      if (!payment || !orderCode || !id || !currentOrder) {
        return;
      }

      if (payment === 'cancel') {
        toast.error('Thanh toán đã bị hủy');
        return;
      }

      if (payment === 'success') {
        try {
          console.log('🔄 Verifying payment return:', { id, orderCode });
          
          const response = await api.post(`/rental-orders/${id}/verify-payment`, {
            orderCode: orderCode
          });

          if (response.data.success) {
            toast.success('🎉 Thanh toán thành công! Đơn hàng đã được xác nhận.', {
              duration: 4000,
              icon: '✅'
            });

            // Reload order detail to show updated status
            setTimeout(() => {
              loadOrderDetail(id);
            }, 1000);
          }
        } catch (error) {
          console.error('❌ Payment verification failed:', error);
          
          // Only show error if it's not already verified
          if (!error.response?.data?.message?.includes('đã được thanh toán')) {
            toast.error('Xác nhận thanh toán thất bại: ' + (error.response?.data?.message || error.message));
          }
        }
      }
    };

    // Wait a bit for order to load first
    const timer = setTimeout(() => {
      handlePaymentReturn();
    }, 500);

    return () => clearTimeout(timer);
  }, [payment, orderCode, id, currentOrder]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Vui lòng đăng nhập</h2>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingOrderDetail || (!currentOrder && id)) {
    console.log('⏳ Loading state:', { isLoadingOrderDetail, id, hasCurrentOrder: !!currentOrder });
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3">Đang tải chi tiết đơn hàng...</span>
        </div>
      </div>
    );
  }

  if (!currentOrder) {
    console.error('❌ No current order found:', { 
      id, 
      isLoadingOrderDetail, 
      currentOrder,
      payment,
      orderCode 
    });
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy đơn hàng</h2>
          <p className="text-gray-600 mb-4">Order ID: {id}</p>
          <p className="text-sm text-gray-500 mb-4">
            {payment && `Payment: ${payment}, OrderCode: ${orderCode}`}
          </p>
          <button
            onClick={() => navigate('/rental-orders')}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  console.log('✅ Rendering order detail:', {
    orderId: currentOrder._id,
    status: currentOrder.status,
    paymentStatus: currentOrder.paymentStatus
  });

  const getStatusColor = (status) => {
    const colors = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDING_PAYMENT': 'bg-yellow-100 text-yellow-800',
      'PAYMENT_COMPLETED': 'bg-blue-100 text-blue-800',
      'PENDING_CONFIRMATION': 'bg-orange-100 text-orange-800',
      'PENDING_CONFIRMATION': 'bg-orange-100 text-orange-800',
      'OWNER_CONFIRMED': 'bg-blue-100 text-blue-800',
      'OWNER_REJECTED': 'bg-red-100 text-red-800',
      'READY_FOR_CONTRACT': 'bg-purple-100 text-purple-800',
      'CONTRACT_SIGNED': 'bg-green-100 text-green-800',
      'ACTIVE': 'bg-green-100 text-green-800',
      'COMPLETED': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'DRAFT': 'Nháp',
      'PENDING_PAYMENT': 'Chờ thanh toán',
      'PAYMENT_COMPLETED': 'Đã thanh toán',
      'PENDING_CONFIRMATION': 'Chờ xác nhận',
      'PENDING_CONFIRMATION': 'Chờ chủ xác nhận',
      'OWNER_CONFIRMED': 'Chủ đã xác nhận',
      'OWNER_REJECTED': 'Chủ từ chối',
      'READY_FOR_CONTRACT': 'Sẵn sàng ký HĐ',
      'CONTRACT_SIGNED': 'Đã ký HĐ',
      'ACTIVE': 'Đang thuê',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Đã hủy'
    };
    return texts[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isOwner = currentOrder.subOrders?.some(subOrder => 
    subOrder.owner?._id === user._id
  );
  
  const isRenter = currentOrder.renter?._id === user._id;

  const handleOwnerAction = async (action, subOrderId, reason = null) => {
    try {
      if (action === 'confirm') {
        await confirmOwnerOrder(subOrderId);
      } else if (action === 'reject') {
        await rejectOwnerOrder(subOrderId, reason);
      }
      setConfirmAction(null);
      setRejectReason('');
      // Reload order details
      await loadOrderDetail(id);
    } catch (error) {
      console.error('Error handling owner action:', error);
      alert('Có lỗi xảy ra khi thực hiện hành động');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/rental-orders')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Quay lại</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold">Chi tiết đơn hàng</h1>
              <p className="text-gray-600">#{currentOrder.masterOrderNumber}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(currentOrder.status)}`}>
              {getStatusText(currentOrder.status)}
            </span>
            
            {currentOrder.status === 'READY_FOR_CONTRACT' && isRenter && (
              <button
                onClick={() => navigate('/rental-orders/contracts')}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex items-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Ký hợp đồng</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sản phẩm ({currentOrder.subOrders?.reduce((sum, sub) => sum + (sub.products?.length || 0), 0) || 0})
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'timeline'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Lịch sử
              </button>
              {currentOrder.contracts && currentOrder.contracts.length > 0 && (
                <button
                  onClick={() => setActiveTab('contracts')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === 'contracts'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Hợp đồng
                </button>
              )}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Thời gian thuê</p>
                        <p className="font-bold text-lg">{calculateDuration(currentOrder.rentalPeriod.startDate, currentOrder.rentalPeriod.endDate)} ngày</p>
                        <p className="text-sm text-gray-600">
                          {new Date(currentOrder.rentalPeriod.startDate).toLocaleDateString('vi-VN')} - {' '}
                          {new Date(currentOrder.rentalPeriod.endDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Package className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Tổng sản phẩm</p>
                        <p className="font-bold text-lg">
                          {currentOrder.subOrders?.reduce((sum, sub) => sum + (sub.products?.length || 0), 0) || 0}
                        </p>
                        <p className="text-sm text-gray-600">
                          {currentOrder.subOrders?.length || 0} chủ cho thuê
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-8 h-8 text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-600">Giao hàng</p>
                        <p className="font-bold text-lg">
                          {currentOrder.deliveryMethod === 'PICKUP' ? 'Nhận trực tiếp' : 'Giao tận nơi'}
                        </p>
                        {currentOrder.shippingAddress && (
                          <p className="text-sm text-gray-600 truncate">
                            {currentOrder.shippingAddress.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Tổng thanh toán</p>
                        <p className="font-bold text-lg text-purple-600">
                          {(currentOrder.totalAmount + currentOrder.totalDepositAmount + currentOrder.totalShippingFee).toLocaleString('vi-VN')}đ
                        </p>
                        <div className="text-xs text-gray-600">
                          <div>Thuê: {currentOrder.totalAmount?.toLocaleString('vi-VN')}đ</div>
                          <div>Cọc: {currentOrder.totalDepositAmount?.toLocaleString('vi-VN')}đ</div>
                          <div>Ship: {currentOrder.totalShippingFee?.toLocaleString('vi-VN')}đ</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parties Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Renter Info */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <span>Người thuê</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium">{currentOrder.renter?.profile?.fullName || 'Không rõ'}</p>
                        <p className="text-sm text-gray-600">ID: {currentOrder.renter?._id}</p>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{currentOrder.renter?.profile?.phoneNumber || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{currentOrder.renter?.email || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <span>Địa chỉ giao hàng</span>
                    </h3>
                    {currentOrder.shippingAddress ? (
                      <div className="space-y-2">
                        <p className="font-medium">{currentOrder.shippingAddress.receiverName}</p>
                        <p className="text-sm text-gray-600">{currentOrder.shippingAddress.receiverPhone}</p>
                        <p className="text-sm text-gray-600">{currentOrder.shippingAddress.address}</p>
                        <p className="text-sm text-gray-600">
                          {currentOrder.shippingAddress.ward}, {currentOrder.shippingAddress.district}, {currentOrder.shippingAddress.province}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500">Nhận trực tiếp tại cửa hàng</p>
                    )}
                  </div>
                </div>

                {/* Sub Orders Status */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Trạng thái từ các chủ cho thuê</h3>
                  <div className="space-y-4">
                    {currentOrder.subOrders?.map((subOrder) => (
                      <div key={subOrder._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className="font-medium">{subOrder.owner?.profile?.fullName || 'Không rõ'}</p>
                              <p className="text-sm text-gray-600">#{subOrder.subOrderNumber}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subOrder.status)}`}>
                              {getStatusText(subOrder.status)}
                            </span>
                            
                            {isOwner && subOrder.owner?._id === user._id && subOrder.status === 'PENDING_CONFIRMATION' && (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setConfirmAction(`confirm-${subOrder._id}`)}
                                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 flex items-center space-x-1"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Xác nhận</span>
                                </button>
                                <button
                                  onClick={() => setConfirmAction(`reject-${subOrder._id}`)}
                                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 flex items-center space-x-1"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>Từ chối</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Sản phẩm:</p>
                            <p className="font-medium">{subOrder.products?.length || 0} sản phẩm</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Tổng tiền:</p>
                            <p className="font-medium">{subOrder.pricing?.totalAmount?.toLocaleString('vi-VN')}đ</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Cập nhật:</p>
                            <p className="font-medium">{new Date(subOrder.updatedAt).toLocaleDateString('vi-VN')}</p>
                          </div>
                        </div>

                        {subOrder.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm font-medium text-red-800">Lý do từ chối:</p>
                            <p className="text-sm text-red-600">{subOrder.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-6">
                {currentOrder.subOrders?.map((subOrder) => (
                  <div key={subOrder._id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Chủ cho thuê: {subOrder.owner?.profile?.fullName || 'Không rõ'}</h3>
                        <p className="text-sm text-gray-600">#{subOrder.subOrderNumber}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subOrder.status)}`}>
                        {getStatusText(subOrder.status)}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {subOrder.products?.map((productItem) => (
                        <div key={productItem.product._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                          <img
                            src={productItem.product.images?.[0] || '/placeholder.jpg'}
                            alt={productItem.product.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold">{productItem.product.name}</h4>
                            <p className="text-sm text-gray-600">{productItem.product.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span>Số lượng: {productItem.quantity}</span>
                              <span>Giá thuê: {productItem.product.rentalPrice?.toLocaleString('vi-VN')}đ/ngày</span>
                              <span>Tiền cọc: {productItem.product.depositPrice?.toLocaleString('vi-VN')}đ</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">{productItem.totalRental?.toLocaleString('vi-VN')}đ</p>
                            <p className="text-sm text-gray-600">Tổng tiền thuê</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span>Tổng tiền thuê:</span>
                        <span className="font-semibold">{subOrder.pricing?.rentalAmount?.toLocaleString('vi-VN')}đ</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tổng tiền cọc:</span>
                        <span className="font-semibold">{subOrder.pricing?.depositAmount?.toLocaleString('vi-VN')}đ</span>
                      </div>
                      {subOrder.shipping?.fee && (
                        <div className="flex justify-between text-sm">
                          <span>Phí giao hàng:</span>
                          <span className="font-semibold">{subOrder.shipping.fee.toLocaleString('vi-VN')}đ</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>Tổng cộng:</span>
                        <span className="text-lg">{subOrder.pricing?.totalAmount?.toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <div className="space-y-4">
                  {/* Order created */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Đơn hàng được tạo</p>
                      <p className="text-sm text-gray-600">{formatDate(currentOrder.createdAt)}</p>
                    </div>
                  </div>

                  {/* Payment status */}
                  {currentOrder.status !== 'DRAFT' && (
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Thanh toán hoàn tất</p>
                        <p className="text-sm text-gray-600">Đã thanh toán thành công</p>
                      </div>
                    </div>
                  )}

                  {/* Sub orders timeline */}
                  {currentOrder.subOrders?.map((subOrder) => (
                    <div key={subOrder._id} className="pl-11 border-l-2 border-gray-200">
                      <div className="flex items-start space-x-3 -ml-6">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          subOrder.status === 'OWNER_CONFIRMED' ? 'bg-green-500' :
                          subOrder.status === 'OWNER_REJECTED' ? 'bg-red-500' :
                          subOrder.status === 'PENDING_CONFIRMATION' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`}>
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {subOrder.owner?.profile?.fullName || 'Chủ cho thuê'} - {getStatusText(subOrder.status)}
                          </p>
                          <p className="text-sm text-gray-600">#{subOrder.subOrderNumber}</p>
                          <p className="text-sm text-gray-600">{formatDate(subOrder.updatedAt)}</p>
                          {subOrder.rejectionReason && (
                            <p className="text-sm text-red-600 mt-1">Lý do: {subOrder.rejectionReason}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Contract signing */}
                  {currentOrder.status === 'CONTRACT_SIGNED' && (
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Hợp đồng đã được ký</p>
                        <p className="text-sm text-gray-600">Tất cả bên đã ký hợp đồng</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'contracts' && currentOrder.contracts && (
              <div className="space-y-4">
                {currentOrder.contracts.map((contract) => (
                  <div key={contract._id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Hợp đồng #{contract.contractNumber}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                        {getStatusText(contract.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Ngày tạo:</p>
                        <p className="font-medium">{formatDate(contract.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Ngày ký:</p>
                        <p className="font-medium">
                          {contract.signedDate ? formatDate(contract.signedDate) : 'Chưa ký'}
                        </p>
                      </div>
                    </div>

                    {contract.signatures && contract.signatures.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Chữ ký:</h4>
                        <div className="space-y-2">
                          {contract.signatures.map((signature, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{signature.signerName} ({signature.role})</span>
                              <span className="text-green-600">✓ Đã ký</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => window.open(`/api/contracts/${contract._id}/download`, '_blank')}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Tải hợp đồng</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {confirmAction.includes('confirm') ? 'Xác nhận đơn hàng' : 'Từ chối đơn hàng'}
            </h3>
            
            {confirmAction.includes('reject') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do từ chối:
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập lý do từ chối..."
                />
              </div>
            )}
            
            <p className="text-gray-600 mb-6">
              {confirmAction.includes('confirm') 
                ? 'Bạn có chắc chắn muốn xác nhận đơn hàng này?'
                : 'Bạn có chắc chắn muốn từ chối đơn hàng này?'
              }
            </p>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const subOrderId = confirmAction.split('-')[1];
                  const action = confirmAction.includes('confirm') ? 'confirm' : 'reject';
                  handleOwnerAction(action, subOrderId, rejectReason);
                }}
                disabled={confirmAction.includes('reject') && !rejectReason.trim()}
                className={`px-4 py-2 rounded-lg text-white ${
                  confirmAction.includes('confirm')
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {confirmAction.includes('confirm') ? 'Xác nhận' : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalOrderDetailPage;