import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRentalOrder } from '../../context/RentalOrderContext';
import { useAuth } from "../../hooks/useAuth";
import { useI18n } from "../../hooks/useI18n";
import { CheckCircle, Clock, CreditCard, MapPin, Phone, User, Package, Truck } from 'lucide-react';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { currentOrder, loadOrderDetail, confirmOrder, processPayment, isLoadingOrderDetail } = useRentalOrder();
  
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('PAYOS');

  useEffect(() => {
    if (orderId) {
      loadOrderDetail(orderId);
    }
  }, [orderId, loadOrderDetail]);

  if (isLoadingOrderDetail) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3">Đang tải thông tin đơn hàng...</span>
        </div>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy đơn hàng</h2>
          <button
            onClick={() => navigate('/rental-orders')}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Xem danh sách đơn hàng
          </button>
        </div>
      </div>
    );
  }

  const handleConfirmOrder = async () => {
    setIsConfirming(true);
    try {
      await confirmOrder(orderId);
      // Order will be updated via context
    } catch (error) {
      console.error('Lỗi xác nhận đơn hàng:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    try {
      const paymentData = {
        method: paymentMethod,
        amount: currentOrder.totalAmount + currentOrder.totalDepositAmount + currentOrder.totalShippingFee,
        transactionId: `TXN_${Date.now()}`
      };
      
      await processPayment(orderId, paymentData);
      
      // Navigate to success page or show success message
      navigate(`/rental-orders/${orderId}/payment-success`);
    } catch (error) {
      console.error('Lỗi thanh toán:', error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDING_PAYMENT': 'bg-yellow-100 text-yellow-800',
      'PAYMENT_COMPLETED': 'bg-blue-100 text-blue-800',
      'PENDING_CONFIRMATION': 'bg-orange-100 text-orange-800',
      'READY_FOR_CONTRACT': 'bg-purple-100 text-purple-800',
      'CONTRACT_SIGNED': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'DRAFT': 'Nháp',
      'PENDING_PAYMENT': 'Chờ thanh toán',
      'PAYMENT_COMPLETED': 'Đã thanh toán',
      'PENDING_CONFIRMATION': 'Chờ xác nhận',
      'READY_FOR_CONTRACT': 'Sẵn sàng ký hợp đồng',
      'CONTRACT_SIGNED': 'Đã ký hợp đồng'
    };
    return texts[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = () => {
    const start = new Date(currentOrder.rentalPeriod.startDate);
    const end = new Date(currentOrder.rentalPeriod.endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Đơn thuê #{currentOrder.masterOrderNumber}</h1>
              <p className="text-gray-600">Tạo lúc {new Date(currentOrder.createdAt).toLocaleString('vi-VN')}</p>
            </div>
            <div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentOrder.status)}`}>
                {getStatusText(currentOrder.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rental Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Thông tin thuê tổng quan
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu chung</label>
                  <p className="text-lg">{formatDate(currentOrder.rentalPeriod.startDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc chung</label>
                  <p className="text-lg">{formatDate(currentOrder.rentalPeriod.endDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian thuê chung</label>
                  <p className="text-lg font-medium text-blue-600">{calculateDuration()} ngày</p>
                </div>
              </div>

              {/* Sub Orders Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">📋 Tổng quan đơn hàng</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Số đơn hàng con:</span>
                    <span className="ml-2 font-medium text-blue-600">{currentOrder.subOrders?.length || 0} đơn hàng</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tổng sản phẩm:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {currentOrder.subOrders?.reduce((total, subOrder) => 
                        total + (subOrder.products?.reduce((sum, p) => sum + p.quantity, 0) || 0), 0
                      ) || 0} sản phẩm
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  💡 Mỗi đơn hàng con có thể có thời gian thuê riêng biệt (xem chi tiết bên dưới)
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                Thông tin giao hàng
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hình thức</label>
                  <p className="flex items-center">
                    {currentOrder.deliveryMethod === 'PICKUP' ? (
                      <>
                        <Package className="w-4 h-4 mr-2 text-green-600" />
                        Nhận trực tiếp (Miễn phí)
                      </>
                    ) : (
                      <>
                        <Truck className="w-4 h-4 mr-2 text-blue-600" />
                        Giao tận nơi
                      </>
                    )}
                  </p>
                </div>
                
                {currentOrder.deliveryMethod === 'DELIVERY' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng</label>
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 mr-2 text-red-600 mt-1" />
                        <div>
                          <p>{currentOrder.deliveryAddress.streetAddress}</p>
                          {currentOrder.deliveryAddress.ward && (
                            <p className="text-gray-600">{currentOrder.deliveryAddress.ward}, {currentOrder.deliveryAddress.district}</p>
                          )}
                          <p className="text-gray-600">{currentOrder.deliveryAddress.city}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Người nhận</label>
                        <p className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-600" />
                          {currentOrder.deliveryAddress.contactName}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                        <p className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-600" />
                          {currentOrder.deliveryAddress.contactPhone}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Sub Orders */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Chi tiết sản phẩm</h2>
              <div className="space-y-6">
                {currentOrder.subOrders?.map((subOrder, index) => (
                  <div key={subOrder._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Chủ cho thuê: {subOrder.owner?.profile?.fullName}</h3>
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(subOrder.status)}`}>
                        {getStatusText(subOrder.status)}
                      </span>
                    </div>

                    {/* Rental Period for this Sub Order */}
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Thời gian thuê đơn hàng #{index + 1}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Bắt đầu:</span>
                          <div className="font-medium text-gray-800">
                            {subOrder.rentalPeriod?.startDate 
                              ? formatDate(subOrder.rentalPeriod.startDate)
                              : formatDate(currentOrder.rentalPeriod.startDate)
                            }
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Kết thúc:</span>
                          <div className="font-medium text-gray-800">
                            {subOrder.rentalPeriod?.endDate 
                              ? formatDate(subOrder.rentalPeriod.endDate)
                              : formatDate(currentOrder.rentalPeriod.endDate)
                            }
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Thời lượng:</span>
                          <div className="font-medium text-blue-600">
                            {(() => {
                              const startDate = new Date(subOrder.rentalPeriod?.startDate || currentOrder.rentalPeriod.startDate);
                              const endDate = new Date(subOrder.rentalPeriod?.endDate || currentOrder.rentalPeriod.endDate);
                              const diffTime = Math.abs(endDate - startDate);
                              const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              return `${duration} ngày`;
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {subOrder.products?.map((productItem) => (
                        <div key={productItem.product._id} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                          <img
                            src={productItem.product.images?.[0] || '/placeholder.jpg'}
                            alt={productItem.product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{productItem.product.name}</h4>
                            <p className="text-sm text-gray-600">Số lượng: {productItem.quantity}</p>
                            <div className="flex items-center space-x-4 text-sm">
                              <span>Giá thuê: {productItem.rentalRate.toLocaleString('vi-VN')}đ/ngày</span>
                              <span>Cọc: {productItem.depositRate.toLocaleString('vi-VN')}đ</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{productItem.totalRental.toLocaleString('vi-VN')}đ</p>
                            <p className="text-sm text-gray-600">Tổng thuê</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Shipping fee for this suborder */}
                    {subOrder.pricing?.shippingFee > 0 && (
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                        <span className="text-sm">Phí vận chuyển:</span>
                        <span className="font-medium text-green-600">{subOrder.pricing.shippingFee.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-md p-6">
              {currentOrder.status === 'DRAFT' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Bước tiếp theo</h3>
                  <p className="text-gray-600">Xác nhận đơn hàng để chuyển sang bước thanh toán.</p>
                  <button
                    onClick={handleConfirmOrder}
                    disabled={isConfirming}
                    className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConfirming ? 'Đang xác nhận...' : 'Xác nhận đơn hàng'}
                  </button>
                </div>
              )}

              {currentOrder.status === 'PENDING_PAYMENT' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    {t('common.checkout')}
                  </h3>
                  <p className="text-gray-600">{t('paymentMethodSelector.title')} để hoàn tất đơn hàng.</p>
                  
                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-blue-500">
                      <input
                        type="radio"
                        value="PAYOS"
                        checked={paymentMethod === 'PAYOS'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-500"
                      />
                      <div>
                        <p className="font-medium">PayOS</p>
                        <p className="text-sm text-gray-600">Thanh toán qua QR Code hoặc Internet Banking</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-blue-500">
                      <input
                        type="radio"
                        value="WALLET"
                        checked={paymentMethod === 'WALLET'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-500"
                      />
                      <div>
                        <p className="font-medium">Ví PIRA</p>
                        <p className="text-sm text-gray-600">Thanh toán từ số dư ví của bạn</p>
                      </div>
                    </label>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={isProcessingPayment}
                    className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingPayment ? 'Đang xử lý...' : 'Thanh toán ngay'}
                  </button>
                </div>
              )}

              {currentOrder.status === 'PENDING_CONFIRMATION' && (
                <div className="text-center space-y-4">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                  <h3 className="text-lg font-semibold text-green-600">Thanh toán thành công!</h3>
                  <p className="text-gray-600">Đơn hàng đang chờ các chủ cho thuê xác nhận.</p>
                </div>
              )}

              {['READY_FOR_CONTRACT', 'CONTRACT_SIGNED'].includes(currentOrder.status) && (
                <div className="text-center space-y-4">
                  <CheckCircle className="w-16 h-16 text-blue-500 mx-auto" />
                  <h3 className="text-lg font-semibold text-blue-600">Đơn hàng đã được xác nhận!</h3>
                  <p className="text-gray-600">
                    {currentOrder.status === 'READY_FOR_CONTRACT' 
                      ? 'Hợp đồng đang được chuẩn bị. Bạn sẽ nhận được thông báo khi có thể ký hợp đồng.'
                      : 'Hợp đồng đã được ký. Đơn hàng đang được xử lý.'
                    }
                  </p>
                  <button
                    onClick={() => navigate('/rental-orders/contracts')}
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                  >
                    Xem hợp đồng
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Tổng kết đơn hàng</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Tiền thuê:</span>
                  <span>{currentOrder.totalAmount.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiền cọc:</span>
                  <span>{currentOrder.totalDepositAmount.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <span>{currentOrder.totalShippingFee.toLocaleString('vi-VN')}đ</span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Tổng cộng:</span>
                  <span className="text-blue-600">
                    {(currentOrder.totalAmount + currentOrder.totalDepositAmount + currentOrder.totalShippingFee).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-medium mb-2">Thông tin thanh toán</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Trạng thái:</span>
                    <span className={`font-medium ${
                      currentOrder.paymentStatus === 'PAID' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {currentOrder.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </div>
                  {currentOrder.paymentMethod && (
                    <div className="flex justify-between">
                      <span>Phương thức:</span>
                      <span>{currentOrder.paymentMethod}</span>
                    </div>
                  )}
                  {currentOrder.paymentInfo?.paymentDate && (
                    <div className="flex justify-between">
                      <span>Thời gian:</span>
                      <span>{new Date(currentOrder.paymentInfo.paymentDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => navigate('/rental-orders')}
                  className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Quay về danh sách
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;