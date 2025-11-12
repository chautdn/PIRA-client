import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useRentalOrder } from '../context/RentalOrderContext';
import { toast } from '../components/common/Toast';
import { useAuth } from "../hooks/useAuth";
import disputeService from '../services/dispute';
import { 
  Package, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Eye, 
  FileText,
  Clock,
  Filter,
  Search,
  X,
  XCircle,
  User,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';

const RentalOrdersPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { 
    myOrders, 
    isLoadingOrders, 
    pagination,
    loadMyOrders
  } = useRentalOrder();

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [subOrderDisputes, setSubOrderDisputes] = useState({});

  // Load orders on mount and status change
  useEffect(() => {
    loadMyOrders({ status: statusFilter !== 'all' ? statusFilter : undefined });
  }, [statusFilter]);

  // Check for existing disputes when selected order changes
  useEffect(() => {
    const checkDisputes = async () => {
      if (!selectedOrder?.subOrders) return;
      
      const disputeChecks = {};
      for (const subOrder of selectedOrder.subOrders) {
        try {
          const result = await disputeService.checkDisputeExists(subOrder._id);
          disputeChecks[subOrder._id] = result.exists;
        } catch (error) {
          console.error('Error checking dispute for subOrder:', subOrder._id, error);
          disputeChecks[subOrder._id] = false;
        }
      }
      setSubOrderDisputes(disputeChecks);
    };
    
    checkDisputes();
  }, [selectedOrder]);

  // Check for success messages from navigation state or URL params
  useEffect(() => {
    // Check for message from navigation state (from order creation)
    if (location.state?.message && location.state?.justCreated) {
      toast.success(`🎉 ${location.state.message}\n\nĐơn hàng đã được tạo và sẽ hiển thị trong danh sách bên dưới.`, {
        duration: 8000,
        style: {
          maxWidth: '500px',
          padding: '16px',
        }
      });
      
      // Clear the state to prevent showing message again
      navigate('/rental-orders', { replace: true });
      return;
    }

    // Check for success messages from URL params
    const signed = searchParams.get('signed');
    if (signed === 'true') {
      // Show success notification
      toast.success('✅ Ký hợp đồng thành công!', { duration: 5000 });
    }
  }, [searchParams]);

  const getStatusColor = (status) => {
    const colors = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDING_PAYMENT': 'bg-yellow-100 text-yellow-800',
      'PAYMENT_COMPLETED': 'bg-blue-100 text-blue-800',
      'PENDING_CONFIRMATION': 'bg-orange-100 text-orange-800',
      'PENDING_OWNER_CONFIRMATION': 'bg-orange-100 text-orange-800',
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
      'PENDING_OWNER_CONFIRMATION': 'Chờ chủ xác nhận',
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
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedOrder(null);
    setShowDetailModal(false);
  };

  const currentOrders = myOrders;
  const currentPagination = pagination.myOrders || {};

  const filteredOrders = (currentOrders || []).filter(order => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const orderNumber = order.masterOrderNumber;
      
      return orderNumber.toLowerCase().includes(searchLower) ||
             order.subOrders?.some(sub => 
               sub.products?.some(p => p.product.name.toLowerCase().includes(searchLower))
             );
    }
    return true;
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Vui lòng đăng nhập</h2>
          <p className="text-gray-600 mb-4">Bạn cần đăng nhập để xem đơn hàng</p>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Quản lý đơn thuê</h1>
            <p className="text-gray-600">Theo dõi và quản lý các đơn hàng thuê của bạn</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => loadMyOrders()}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              🔄 Reload
            </button>
            <button
              onClick={() => navigate('/products')}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
            >
              🛍️ Thuê sản phẩm
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
            >
              <Package className="w-5 h-5" />
              <span>Tạo đơn mới</span>
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <div className="px-6 py-4">
              <h2 className="text-xl font-semibold text-blue-600">
                Đơn thuê của tôi ({(myOrders || []).length})
              </h2>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm đơn hàng..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="DRAFT">Nháp</option>
                    <option value="PENDING_PAYMENT">Chờ thanh toán</option>
                    <option value="PENDING_CONFIRMATION">Chờ xác nhận</option>
                    <option value="READY_FOR_CONTRACT">Sẵn sàng ký HĐ</option>
                    <option value="CONTRACT_SIGNED">Đã ký HĐ</option>
                    <option value="ACTIVE">Đang thuê</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                {filteredOrders.length} / {(currentOrders || []).length} đơn hàng
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {isLoadingOrders ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <span className="ml-3">Đang tải đơn hàng...</span>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchQuery || statusFilter !== 'all' 
                ? 'Không tìm thấy đơn hàng nào'
                : 'Chưa có đơn hàng nào'
              }
            </h3>
            <p className="text-gray-500 mb-4">
              Bạn chưa có đơn thuê nào. Hãy tạo đơn thuê đầu tiên!
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Xem sản phẩm
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Đơn thuê #{order.masterOrderNumber}</h3>
                        <p className="text-sm text-gray-600">
                          Tạo ngày {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Thời gian thuê</p>
                          <p className="font-medium">{calculateDuration(order.rentalPeriod.startDate, order.rentalPeriod.endDate)} ngày</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Package className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600">Số sản phẩm</p>
                          <p className="font-medium">{order.subOrders?.reduce((sum, sub) => sum + sub.products?.length || 0, 0) || 0}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="text-sm text-gray-600">Giao hàng</p>
                          <p className="font-medium">{order.deliveryMethod === 'PICKUP' ? 'Nhận trực tiếp' : 'Giao tận nơi'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="text-sm text-gray-600">Tổng tiền</p>
                          <p className="font-medium text-orange-600">
                            {(order.totalAmount + order.totalDepositAmount + order.totalShippingFee).toLocaleString('vi-VN')}đ
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sub Orders Preview */}
                    {order.subOrders && order.subOrders.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Chủ cho thuê ({order.subOrders.length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {order.subOrders.map((subOrder) => (
                            <div key={subOrder._id} className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                              <span className="text-sm">{subOrder.owner?.profile?.firstName || 'Không rõ'}</span>
                              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(subOrder.status)}`}>
                                {getStatusText(subOrder.status)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Cập nhật lúc {new Date(order.updatedAt).toLocaleString('vi-VN')}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetail(order)}
                          className="flex items-center space-x-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Xem chi tiết</span>
                        </button>
                        
                        {order.status === 'READY_FOR_CONTRACT' && (
                          <button
                            onClick={() => navigate('/rental-orders/contracts')}
                            className="flex items-center space-x-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Ký HĐ</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {currentPagination.pages && currentPagination.pages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <button
              onClick={() => {
                const newPage = Math.max(1, (currentPagination.page || 1) - 1);
                loadMyOrders({ page: newPage, status: statusFilter !== 'all' ? statusFilter : undefined });
              }}
              disabled={(currentPagination.page || 1) === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Trước
            </button>
            
            <span className="px-4 py-2">
              Trang {currentPagination.page || 1} / {currentPagination.pages || 1}
            </span>
            
            <button
              onClick={() => {
                const newPage = Math.min(currentPagination.pages || 1, (currentPagination.page || 1) + 1);
                loadMyOrders({ page: newPage, status: statusFilter !== 'all' ? statusFilter : undefined });
              }}
              disabled={(currentPagination.page || 1) === (currentPagination.pages || 1)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold">Chi tiết đơn thuê #{selectedOrder.masterOrderNumber}</h2>
                  <p className="text-gray-600">Tạo ngày {formatDate(selectedOrder.createdAt)}</p>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Thông tin đơn hàng</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Thời gian thuê</p>
                        <p className="font-medium">{calculateDuration(selectedOrder.rentalPeriod.startDate, selectedOrder.rentalPeriod.endDate)} ngày</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(selectedOrder.rentalPeriod.startDate)} - {formatDate(selectedOrder.rentalPeriod.endDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-sm text-gray-600">Giao hàng</p>
                        <p className="font-medium">{selectedOrder.deliveryMethod === 'PICKUP' ? 'Nhận trực tiếp' : 'Giao tận nơi'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-600">Phương thức thanh toán</p>
                        <p className="font-medium">
                          {selectedOrder.paymentMethod === 'WALLET' ? 'Ví điện tử' : 
                           selectedOrder.paymentMethod === 'PAYOS' ? 'Chuyển khoản' : 
                           selectedOrder.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 
                           selectedOrder.paymentMethod}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub Orders */}
                {selectedOrder.subOrders && selectedOrder.subOrders.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Chi tiết từng chủ cho thuê ({selectedOrder.subOrders.length})</h3>
                    <div className="space-y-4">
                      {selectedOrder.subOrders.map((subOrder, index) => (
                        <div key={subOrder._id} className="border border-gray-200 rounded-lg p-4">
                          {/* Sub Order Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                Chủ thuê #{index + 1}
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(subOrder.status)}`}>
                                {getStatusText(subOrder.status)}
                              </span>
                            </div>
                            
                            {/* Action Buttons for SHIPPED status */}
                            {subOrder.status === 'SHIPPED' && !subOrderDisputes[subOrder._id] && (
                              <button
                                onClick={() => {
                                  closeDetailModal();
                                  navigate(`/disputes/create?subOrderId=${subOrder._id}&type=delivery-refusal`);
                                }}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center space-x-2 text-sm"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Từ chối giao hàng</span>
                              </button>
                            )}
                            
                            {subOrder.status === 'SHIPPED' && subOrderDisputes[subOrder._id] && (
                              <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg flex items-center space-x-2 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>Đã tạo tranh chấp</span>
                              </div>
                            )}
                          </div>

                          {/* Owner Info */}
                          <div className="bg-gray-50 rounded p-3 mb-4">
                            <div className="flex items-center space-x-3">
                              <User className="w-5 h-5 text-gray-600" />
                              <div>
                                <p className="font-medium">{subOrder.owner?.profile?.firstName || 'Không rõ tên'} {subOrder.owner?.profile?.lastName || ''}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  {subOrder.owner?.profile?.phoneNumber && (
                                    <div className="flex items-center space-x-1">
                                      <Phone className="w-4 h-4" />
                                      <span>{subOrder.owner.profile.phoneNumber}</span>
                                    </div>
                                  )}
                                  {subOrder.owner?.email && (
                                    <div className="flex items-center space-x-1">
                                      <Mail className="w-4 h-4" />
                                      <span>{subOrder.owner.email}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Products */}
                          {subOrder.products && subOrder.products.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-3">Sản phẩm ({subOrder.products.length})</h4>
                              <div className="space-y-3">
                                {subOrder.products.map((productItem) => (
                                  <div key={productItem.product._id} className="flex items-center space-x-4 bg-white border rounded p-3">
                                    <img
                                      src={productItem.product.images?.[0].url || '/placeholder.jpg'}
                                      alt={productItem.product.name}
                                      className="w-16 h-16 object-cover rounded"
                                    />
                                    <div className="flex-1">
                                      <h5 className="font-medium">{productItem.product.name}</h5>
                                      <p className="text-sm text-gray-600">Số lượng: {productItem.quantity}</p>
                                      <p className="text-sm text-gray-600">
                                        Giá thuê: {productItem.product.pricing?.rentalPrice?.toLocaleString('vi-VN')}đ/ngày
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium text-blue-600">
                                        {productItem.totalRental?.toLocaleString('vi-VN')}đ
                                      </p>
                                      <p className="text-sm text-gray-600">Tiền thuê</p>
                                      {productItem.totalDeposit > 0 && (
                                        <p className="text-sm text-orange-600">
                                          +{productItem.totalDeposit?.toLocaleString('vi-VN')}đ cọc
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Sub Order Total */}
                              <div className="mt-4 p-3 bg-gray-50 rounded">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">Tổng tiền thuê:</span>
                                  <span className="font-bold text-blue-600">
                                    {subOrder.pricing?.totalRental?.toLocaleString('vi-VN')}đ
                                  </span>
                                </div>
                                {subOrder.pricing?.totalDeposit > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">Tổng tiền cọc:</span>
                                    <span className="font-bold text-orange-600">
                                      {subOrder.pricing?.totalDeposit?.toLocaleString('vi-VN')}đ
                                    </span>
                                  </div>
                                )}
                                {subOrder.shipping?.fee > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">Phí vận chuyển:</span>
                                    <span className="font-medium">
                                      {subOrder.shipping?.fee?.toLocaleString('vi-VN')}đ
                                    </span>
                                  </div>
                                )}
                                <div className="border-t pt-2 mt-2">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold">Tổng thanh toán:</span>
                                    <span className="font-bold text-lg text-green-600">
                                      {subOrder.pricing?.totalAmount?.toLocaleString('vi-VN')}đ
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Total */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Tổng thanh toán đơn hàng</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Tổng tiền thuê:</span>
                      <span className="font-bold text-blue-600">
                        {selectedOrder.totalAmount?.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Tổng tiền cọc:</span>
                      <span className="font-bold text-orange-600">
                        {selectedOrder.totalDepositAmount?.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Phí vận chuyển:</span>
                      <span className="font-medium">
                        {selectedOrder.totalShippingFee?.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold">Tổng cộng:</span>
                        <span className="text-xl font-bold text-green-600">
                          {(selectedOrder.totalAmount + selectedOrder.totalDepositAmount + selectedOrder.totalShippingFee)?.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                {selectedOrder.status === 'READY_FOR_CONTRACT' && (
                  <button
                    onClick={() => {
                      closeDetailModal();
                      navigate('/rental-orders/contracts');
                    }}
                    className="flex items-center space-x-2 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Ký hợp đồng</span>
                  </button>
                )}
                <button
                  onClick={closeDetailModal}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalOrdersPage;