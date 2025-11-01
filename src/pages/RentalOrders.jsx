import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRentalOrder } from '../context/RentalOrderContext';
import { useAuth } from "../hooks/useAuth";
import { 
  Package, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Eye, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Search
} from 'lucide-react';

const RentalOrdersPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { 
    myOrders, 
    ownerOrders, 
    isLoadingOrders, 
    pagination,
    loadMyOrders,
    loadOwnerOrders 
  } = useRentalOrder();

  const [activeTab, setActiveTab] = useState('renter');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load orders on mount and tab change
  useEffect(() => {
    if (activeTab === 'renter') {
      loadMyOrders({ status: statusFilter !== 'all' ? statusFilter : undefined });
    } else {
      loadOwnerOrders({ status: statusFilter !== 'all' ? statusFilter : undefined });
    }
  }, [activeTab, statusFilter]);

  // Check for success messages from URL params
  useEffect(() => {
    const signed = searchParams.get('signed');
    if (signed === 'true') {
      // Show success notification
      alert('Ký hợp đồng thành công!');
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

  const currentOrders = activeTab === 'renter' ? myOrders : ownerOrders;
  const currentPagination = activeTab === 'renter' ? pagination.myOrders : pagination.ownerOrders;

  const filteredOrders = currentOrders.filter(order => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const orderNumber = activeTab === 'renter' 
        ? order.masterOrderNumber 
        : order.subOrderNumber;
      
      return orderNumber.toLowerCase().includes(searchLower) ||
             (activeTab === 'renter' && order.subOrders?.some(sub => 
               sub.products?.some(p => p.product.name.toLowerCase().includes(searchLower))
             )) ||
             (activeTab === 'owner' && order.products?.some(p => 
               p.product.name.toLowerCase().includes(searchLower)
             ));
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
          <button
            onClick={() => navigate('/cart')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
          >
            <Package className="w-5 h-5" />
            <span>Tạo đơn mới</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('renter')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'renter'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Đơn thuê của tôi ({myOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('owner')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'owner'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Đơn cho thuê ({ownerOrders.length})
              </button>
            </nav>
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
                {filteredOrders.length} / {currentOrders.length} đơn hàng
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
              {activeTab === 'renter' 
                ? 'Bạn chưa có đơn thuê nào. Hãy tạo đơn thuê đầu tiên!'
                : 'Bạn chưa có đơn cho thuê nào từ khách hàng.'
              }
            </p>
            {activeTab === 'renter' && (
              <button
                onClick={() => navigate('/products')}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              >
                Xem sản phẩm
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                {activeTab === 'renter' ? (
                  // Renter view - MasterOrder
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
                              <span className="text-sm">{subOrder.owner?.profile?.fullName || 'Không rõ'}</span>
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
                          onClick={() => navigate(`/rental-orders/${order._id}`)}
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
                ) : (
                  // Owner view - SubOrder
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Đơn #{order.subOrderNumber}</h3>
                        <p className="text-sm text-gray-600">
                          Người thuê: {order.masterOrder?.renter?.profile?.fullName || 'Không rõ'}
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
                          <p className="font-medium">{order.products?.length || 0}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="text-sm text-gray-600">Giao hàng</p>
                          <p className="font-medium">{order.shipping?.method === 'PICKUP' ? 'Nhận trực tiếp' : 'Giao tận nơi'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="text-sm text-gray-600">Tổng tiền</p>
                          <p className="font-medium text-orange-600">
                            {order.pricing?.totalAmount?.toLocaleString('vi-VN')}đ
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Products Preview */}
                    {order.products && order.products.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Sản phẩm</h4>
                        <div className="space-y-2">
                          {order.products.slice(0, 2).map((productItem) => (
                            <div key={productItem.product._id} className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
                              <img
                                src={productItem.product.images?.[0] || '/placeholder.jpg'}
                                alt={productItem.product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1">
                                <p className="font-medium">{productItem.product.name}</p>
                                <p className="text-sm text-gray-600">Số lượng: {productItem.quantity}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{productItem.totalRental?.toLocaleString('vi-VN')}đ</p>
                              </div>
                            </div>
                          ))}
                          {order.products.length > 2 && (
                            <p className="text-sm text-gray-600 text-center">
                              và {order.products.length - 2} sản phẩm khác...
                            </p>
                          )}
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
                          onClick={() => navigate(`/rental-orders/${order.masterOrder._id}`)}
                          className="flex items-center space-x-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Xem chi tiết</span>
                        </button>
                        
                        {order.status === 'PENDING_OWNER_CONFIRMATION' && (
                          <>
                            <button
                              onClick={() => {
                                // Handle confirm - would need to implement
                                console.log('Confirm order', order._id);
                              }}
                              className="flex items-center space-x-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Xác nhận</span>
                            </button>
                            <button
                              onClick={() => {
                                // Handle reject - would need to implement
                                console.log('Reject order', order._id);
                              }}
                              className="flex items-center space-x-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Từ chối</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {currentPagination.pages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <button
              onClick={() => {
                const newPage = Math.max(1, currentPagination.page - 1);
                if (activeTab === 'renter') {
                  loadMyOrders({ page: newPage, status: statusFilter !== 'all' ? statusFilter : undefined });
                } else {
                  loadOwnerOrders({ page: newPage, status: statusFilter !== 'all' ? statusFilter : undefined });
                }
              }}
              disabled={currentPagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Trước
            </button>
            
            <span className="px-4 py-2">
              Trang {currentPagination.page} / {currentPagination.pages}
            </span>
            
            <button
              onClick={() => {
                const newPage = Math.min(currentPagination.pages, currentPagination.page + 1);
                if (activeTab === 'renter') {
                  loadMyOrders({ page: newPage, status: statusFilter !== 'all' ? statusFilter : undefined });
                } else {
                  loadOwnerOrders({ page: newPage, status: statusFilter !== 'all' ? statusFilter : undefined });
                }
              }}
              disabled={currentPagination.page === currentPagination.pages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalOrdersPage;