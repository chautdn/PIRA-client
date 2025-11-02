import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRentalOrder } from '../context/RentalOrderContext';
import { Clock, CheckCircle, XCircle, FileText, CreditCard, Package, User } from 'lucide-react';
import { toast } from 'react-toastify';

const RentalOrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { loadOrderDetail, orderDetail, isLoadingDetail } = useRentalOrder();
  
  useEffect(() => {
    if (orderId) {
      loadOrderDetail(orderId);
    }
  }, [orderId, loadOrderDetail]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING_CONFIRMATION':
      case 'PENDING_OWNER_CONFIRMATION':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'OWNER_CONFIRMED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'OWNER_REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'CONTRACT_SIGNED':
        return <FileText className="w-5 h-5 text-purple-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'PENDING_CONFIRMATION':
        return 'Đơn hàng đã được tạo và thanh toán thành công. Đang chờ chủ sản phẩm xác nhận.';
      case 'PENDING_OWNER_CONFIRMATION':
        return 'Đang chờ chủ sản phẩm xác nhận yêu cầu thuê của bạn.';
      case 'OWNER_CONFIRMED':
        return 'Chủ sản phẩm đã xác nhận. Hợp đồng điện tử đã được tạo và đang chờ ký.';
      case 'OWNER_REJECTED':
        return 'Chủ sản phẩm đã từ chối yêu cầu thuê. Tiền sẽ được hoàn lại vào ví của bạn.';
      case 'CONTRACT_SIGNED':
        return 'Hợp đồng đã được ký thành công. Đơn thuê đã hoàn tất.';
      case 'REFUNDED':
        return 'Đơn hàng đã bị hủy và tiền đã được hoàn lại.';
      default:
        return 'Trạng thái đơn hàng: ' + status;
    }
  };

  if (isLoadingDetail) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!orderDetail) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Không tìm thấy đơn hàng</h2>
          <button
            onClick={() => navigate('/orders')}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Quay lại danh sách đơn hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Theo dõi đơn thuê #{orderDetail.masterOrderNumber}
            </h1>
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-green-500" />
              <span className="text-green-600 font-medium">Đã thanh toán</span>
            </div>
          </div>
          
          {/* Order Status */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              {getStatusIcon(orderDetail.status)}
              <div>
                <h3 className="font-semibold text-gray-900">{getStatusMessage(orderDetail.status)}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Cập nhật lúc: {new Date(orderDetail.updatedAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Thông tin thanh toán</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Phương thức thanh toán</p>
              <p className="font-medium">{orderDetail.paymentMethod || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng tiền đã thanh toán</p>
              <p className="font-medium text-green-600">
                {orderDetail.totalAmount?.toLocaleString('vi-VN')}đ
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Mã giao dịch</p>
              <p className="font-medium">{orderDetail.paymentInfo?.transactionId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Trạng thái thanh toán</p>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {orderDetail.paymentStatus === 'PAID' ? 'Đã thanh toán' : orderDetail.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Sub Orders */}
        <div className="space-y-4">
          {orderDetail.subOrders?.map((subOrder, index) => (
            <div key={subOrder._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Đơn hàng phụ #{index + 1} - {subOrder.owner?.profile?.fullName || 'Chủ sản phẩm'}
                </h3>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(subOrder.status)}
                  <span className="text-sm font-medium">
                    {subOrder.status === 'PENDING_OWNER_CONFIRMATION' ? 'Chờ xác nhận' :
                     subOrder.status === 'OWNER_CONFIRMED' ? 'Đã xác nhận' :
                     subOrder.status === 'OWNER_REJECTED' ? 'Đã từ chối' :
                     subOrder.status}
                  </span>
                </div>
              </div>

              {/* Products */}
              <div className="space-y-3">
                {subOrder.products?.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <img 
                      src={item.product?.images?.[0]?.url || '/placeholder.jpg'} 
                      alt={item.product?.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product?.name}</h4>
                      <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{(item.subtotal || 0).toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rejection Reason */}
              {subOrder.status === 'OWNER_REJECTED' && subOrder.ownerConfirmation?.rejectionReason && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Lý do từ chối:</strong> {subOrder.ownerConfirmation.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 text-center space-x-4">
          <button
            onClick={() => navigate('/orders')}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Quay lại đơn hàng
          </button>
          
          {orderDetail.status === 'CONTRACT_SIGNED' && (
            <button
              onClick={() => navigate(`/contracts/${orderDetail._id}`)}
              className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
            >
              Xem hợp đồng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RentalOrderTracking;