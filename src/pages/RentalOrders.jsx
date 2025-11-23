import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useRentalOrder } from '../context/RentalOrderContext';
import { useCart } from '../context/CartContext';
import { toast } from '../components/common/Toast';
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from 'react-i18next';
import ExtensionRequestModal from '../components/rental/ExtensionRequestModal';
import ExtensionRequestsModal from '../components/rental/ExtensionRequestsModal';
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
  User,
  Phone,
  Mail
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
    loadMyOrders,
    renterCancelSubOrder
  } = useRentalOrder();

  const { addToCart } = useCart();

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [selectedSubOrder, setSelectedSubOrder] = useState(null);
  const [isOwnerView, setIsOwnerView] = useState(false);

  // Load orders on mount and status change
  useEffect(() => {
    loadMyOrders({ status: statusFilter !== 'all' ? statusFilter : undefined });
  }, [statusFilter]);

  // Check for success messages from navigation state or URL params
  useEffect(() => {
    // Check for message from navigation state (from order creation)
    if (location.state?.message && location.state?.justCreated) {
      toast.success(`🎉 ${location.state.message}\n\n${t('orders.createdMessage')}`, {
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
      toast.success(`✅ ${t('orders.contractSignedMessage')}`, { duration: 5000 });
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

  const { t, i18n } = useTranslation();
  const getStatusText = (status) => t(`orders.status.${status}`);

  const localeForFormat = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const currencySuffix = i18n.language === 'vi' ? 'đ' : ' VND';
  const formatCurrency = (value) => (value == null ? '0' : new Intl.NumberFormat(localeForFormat).format(value));

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(localeForFormat);
    } catch (e) {
      return dateString;
    }
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
          <h2 className="text-2xl font-bold mb-4">{t('orders.notLoggedIn')}</h2>
          <p className="text-gray-600 mb-4">{t('orders.loginToView')}</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            {t('orders.login')}
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
            <h1 className="text-3xl font-bold">{t('orders.title')}</h1>
            <p className="text-gray-600">{t('orders.subtitle')}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => loadMyOrders()}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              🔄 {t('orders.reload')}
            </button>
            <button
              onClick={() => navigate('/products')}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
            >
              🛍️ {t('orders.rentProduct')}
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
            >
              <Package className="w-5 h-5" />
              <span>{t('orders.createOrder')}</span>
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <div className="px-6 py-4">
              <h2 className="text-xl font-semibold text-blue-600">
                {t('orders.myOrders')} ({(myOrders || []).length})
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
                    placeholder={t('orders.searchPlaceholder')}
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
                    <option value="all">{t('orders.allStatus')}</option>
                    <option value="DRAFT">{t('orders.status.DRAFT')}</option>
                    <option value="PENDING_PAYMENT">{t('orders.status.PENDING_PAYMENT')}</option>
                    <option value="PENDING_CONFIRMATION">{t('orders.status.PENDING_CONFIRMATION')}</option>
                    <option value="READY_FOR_CONTRACT">{t('orders.status.READY_FOR_CONTRACT')}</option>
                    <option value="CONTRACT_SIGNED">{t('orders.status.CONTRACT_SIGNED')}</option>
                    <option value="ACTIVE">{t('orders.status.ACTIVE')}</option>
                    <option value="COMPLETED">{t('orders.status.COMPLETED')}</option>
                    <option value="CANCELLED">{t('orders.status.CANCELLED')}</option>
                  </select>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                {filteredOrders.length} / {(currentOrders || []).length} {t('orders.myOrders')}
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {isLoadingOrders ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <span className="ml-3">{t('common.loading.general')}</span>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchQuery || statusFilter !== 'all' 
                ? t('orders.notFound')
                : t('orders.noOrders')
              }
            </h3>
            <p className="text-gray-500 mb-4">
              {t('orders.noOrdersDesc')}
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              {t('orders.viewProducts')}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số mục</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giao hàng</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.masterOrderNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.subOrders?.reduce((sum, sub) => sum + (sub.products?.length || 0), 0) || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.rentalPeriod?.startDate && order.rentalPeriod?.endDate ? (
                        <span>{calculateDuration(order.rentalPeriod.startDate, order.rentalPeriod.endDate)} ngày</span>
                      ) : (
                        <span className="text-sm text-blue-600">Nhiều thời gian</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.deliveryMethod === 'PICKUP' ? 'Nhận trực tiếp' : 'Giao tận nơi'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-orange-600">{((order.totalAmount || 0) + (order.totalDepositAmount || 0) + (order.totalShippingFee || 0)).toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>{getStatusText(order.status)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button onClick={() => handleViewDetail(order)} className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Xem</button>
                        {/* Extension Button - For ACTIVE SubOrders (Renter) */}
                        {user?.role === 'RENTER' && order.status === 'ACTIVE' && order.subOrders?.some(so => so.status === 'ACTIVE') && (
                          <button
                            onClick={() => {
                              const activeSubOrder = order.subOrders.find(so => so.status === 'ACTIVE');
                              setSelectedSubOrder(activeSubOrder);
                              setIsOwnerView(false);
                              setShowExtensionModal(true);
                            }}
                            className="text-sm bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600"
                            title="Gửi yêu cầu gia hạn"
                          >
                            ⏳ Gia hạn
                          </button>
                        )}
                        {/* Extension Requests Button - For ACTIVE SubOrders (Owner) */}
                        {user?.role === 'OWNER' && order.status === 'ACTIVE' && order.subOrders?.some(so => so.status === 'ACTIVE' && so.owner?._id?.toString() === user._id?.toString()) && (
                          <button
                            onClick={() => {
                              const activeSubOrder = order.subOrders.find(so => so.status === 'ACTIVE' && so.owner?._id?.toString() === user._id?.toString());
                              setSelectedSubOrder(activeSubOrder);
                              setIsOwnerView(true);
                              setShowExtensionModal(true);
                            }}
                            className="text-sm bg-teal-500 text-white px-3 py-1 rounded hover:bg-teal-600"
                            title="Xem yêu cầu gia hạn"
                          >
                            📄 Yêu cầu gia hạn
                          </button>
                        )}
                        {order.status === 'READY_FOR_CONTRACT' && (
                          <button onClick={() => navigate('/rental-orders/contracts')} className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">Ký HĐ</button>
                        )}
                        {/* Button Hủy đơn cho renter nếu có subOrder OWNER_CONFIRMED và chưa ký HĐ/CANCELLED */}
                        {user?.role === 'RENTER' && order.subOrders?.some(so => so.status === 'OWNER_CONFIRMED') && order.status !== 'CONTRACT_SIGNED' && order.status !== 'CANCELLED' && (
                          <button
                            onClick={async () => {
                              if (!window.confirm('Bạn có chắc muốn hủy đơn này? Sản phẩm sẽ được trả về giỏ hàng và hoàn tiền vào ví nếu có.')) return;
                              let refundAmount = 0;
                              for (const so of order.subOrders) {
                                if (so.status === 'OWNER_CONFIRMED') {
                                  // Gọi API hủy subOrder
                                  const response = await renterCancelSubOrder(so._id);
                                  // Nếu backend trả về thông tin hoàn tiền
                                  if (response?.metadata?.subOrder?.refundAmount) {
                                    refundAmount += response.metadata.subOrder.refundAmount;
                                  }
                                  // Trả sản phẩm về giỏ hàng bằng API addToCart
                                  if (so.products && so.products.length > 0) {
                                    for (const productItem of so.products) {
                                      await addToCart(productItem.product, productItem.quantity, productItem.rental);
                                    }
                                  }
                                }
                              }
                              await loadMyOrders();
                              let msg = 'Đã hủy đơn và trả sản phẩm về giỏ hàng';
                              if (refundAmount > 0) {
                                msg += `. Hoàn lại ${refundAmount.toLocaleString('vi-VN')}đ vào ví.`;
                              }
                              toast.success(msg);
                            }}
                            className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                          >Hủy đơn</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              {t('orders.prev')}
            </button>
            
            <span className="px-4 py-2">
              {t('orders.page')} {currentPagination.page || 1} {t('orders.of')} {currentPagination.pages || 1}
            </span>
            
            <button
              onClick={() => {
                const newPage = Math.min(currentPagination.pages || 1, (currentPagination.page || 1) + 1);
                loadMyOrders({ page: newPage, status: statusFilter !== 'all' ? statusFilter : undefined });
              }}
              disabled={(currentPagination.page || 1) === (currentPagination.pages || 1)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {t('orders.next')}
            </button>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" 
               onClick={closeDetailModal}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" 
                 onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold">{t('orders.viewDetail')} #{selectedOrder.masterOrderNumber}</h2>
                  <p className="text-gray-600">{t('orders.createdAt')} {formatDate(selectedOrder.createdAt)}</p>
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
                  <h3 className="text-lg font-semibold mb-4">{t('orders.ownerDetail')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Thời gian thuê</p>
                        {selectedOrder.rentalPeriod?.startDate && selectedOrder.rentalPeriod?.endDate ? (
                          <>
                            <p className="font-medium">{calculateDuration(selectedOrder.rentalPeriod.startDate, selectedOrder.rentalPeriod.endDate)} ngày</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(selectedOrder.rentalPeriod.startDate)} - {formatDate(selectedOrder.rentalPeriod.endDate)}
                            </p>
                          </>
                        ) : (
                          <p className="font-medium text-blue-600">Nhiều thời gian khác nhau</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-sm text-gray-600">{t('orders.delivery')}</p>
                        <p className="font-medium">{selectedOrder.deliveryMethod === 'PICKUP' ? t('orders.deliveryPickup') : t('orders.deliveryShip')}</p>
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
                        <p className="text-sm text-gray-600">{t('orders.paymentMethod')}</p>
                        <p className="font-medium">
                          {selectedOrder.paymentMethod === 'WALLET' ? t('orders.paymentWallet') :
                           selectedOrder.paymentMethod === 'PAYOS' ? t('orders.paymentBank') :
                           selectedOrder.paymentMethod === 'COD' ? t('orders.paymentCOD') :
                           selectedOrder.paymentMethod}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub Orders */}
                {selectedOrder.subOrders && selectedOrder.subOrders.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">{t('orders.ownerDetail')} ({selectedOrder.subOrders.length})</h3>
                    <div className="space-y-4">
                      {selectedOrder.subOrders.map((subOrder, index) => (
                        <div key={subOrder._id} className="border border-gray-200 rounded-lg p-4">
                          {/* Sub Order Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                {t('orders.owner')} #{index + 1}
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(subOrder.status)}`}>
                                {getStatusText(subOrder.status)}
                              </span>
                            </div>
                          </div>

                          {/* Owner Info */}
                          <div className="bg-gray-50 rounded p-3 mb-4">
                            <div className="flex items-center space-x-3">
                              <User className="w-5 h-5 text-gray-600" />
                              <div>
                                <p className="font-medium">{subOrder.owner?.profile?.firstName || t('orders.ownerNameUnknown')} {subOrder.owner?.profile?.lastName || ''}</p>
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
                              <h4 className="font-medium mb-3">{t('orders.product')} ({subOrder.products.length})</h4>
                              <div className="space-y-3">
                                {subOrder.products.map((productItem, productIndex) => (
                                  <div key={`${productItem.product._id}-${productIndex}`} className="flex items-start space-x-4 bg-white border rounded p-3">
                                    <img
                                      src={productItem.product.images?.[0].url || '/placeholder.jpg'}
                                      alt={productItem.product.name}
                                      className="w-16 h-16 object-cover rounded"
                                    />
                                    <div className="flex-1">
                                      <h5 className="font-medium">{productItem.product.name}</h5>
                                      <p className="text-sm text-gray-600">{t('orders.quantity')}: {productItem.quantity}</p>
                                      <p className="text-sm text-gray-600">
                                        Giá thuê: {productItem.rentalRate?.toLocaleString('vi-VN')}đ/ngày
                                      </p>
                                      {/* Hiển thị rental period riêng của sản phẩm */}
                                      {productItem.rentalPeriod && (
                                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                          <div className="flex items-center space-x-1 text-blue-700">
                                            <Calendar className="w-4 h-4" />
                                            <span className="font-medium">Thời gian thuê:</span>
                                          </div>
                                          <p className="text-blue-600 mt-1">
                                            {formatDate(productItem.rentalPeriod.startDate)} - {formatDate(productItem.rentalPeriod.endDate)}
                                          </p>
                                          <p className="text-blue-600 text-xs">
                                            ({productItem.rentalPeriod.duration?.value || calculateDuration(productItem.rentalPeriod.startDate, productItem.rentalPeriod.endDate)} ngày)
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium text-blue-600">
                                        {formatCurrency(productItem.totalRental)}{currencySuffix}
                                      </p>
                                      <p className="text-sm text-gray-600">{t('orders.totalRental')}</p>
                                      {productItem.totalDeposit > 0 && (
                                        <p className="text-sm text-orange-600">
                                          +{formatCurrency(productItem.totalDeposit)}{currencySuffix} {t('orders.deposit')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Sub Order Total */}
                              <div className="mt-4 p-3 bg-gray-50 rounded">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{t('orders.totalRental')}:</span>
                                    <span className="font-bold text-blue-600">
                                    {formatCurrency(subOrder.pricing?.totalRental)}{currencySuffix}
                                  </span>
                                </div>
                                {subOrder.pricing?.totalDeposit > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{t('orders.totalDeposit')}:</span>
                                    <span className="font-bold text-orange-600">
                                      {formatCurrency(subOrder.pricing?.totalDeposit)}{currencySuffix}
                                    </span>
                                  </div>
                                )}
                                {subOrder.shipping?.fee > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{t('orders.shippingFee')}:</span>
                                    <span className="font-medium">
                                      {formatCurrency(subOrder.shipping?.fee)}{currencySuffix}
                                    </span>
                                  </div>
                                )}
                                <div className="border-t pt-2 mt-2">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold">{t('orders.totalAmount')}:</span>
                                    <span className="font-bold text-lg text-green-600">
                                      {formatCurrency(subOrder.pricing?.totalAmount)}{currencySuffix}
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
                  <h3 className="text-lg font-semibold mb-4">{t('orders.totalAmount')}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{t('orders.totalRental')}:</span>
                        <span className="font-bold text-blue-600">
                        {formatCurrency(selectedOrder.totalAmount)}{currencySuffix}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{t('orders.totalDeposit')}:</span>
                      <span className="font-bold text-orange-600">
                        {formatCurrency(selectedOrder.totalDepositAmount)}{currencySuffix}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{t('orders.shippingFee')}:</span>
                        <span className="font-medium">
                        {formatCurrency(selectedOrder.totalShippingFee)}{currencySuffix}
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold">{t('orders.totalAmount')}:</span>
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency((selectedOrder.totalAmount + selectedOrder.totalDepositAmount + selectedOrder.totalShippingFee))}{currencySuffix}
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
                    <span>{t('orders.signContract')}</span>
                  </button>
                )}
                <button
                  onClick={closeDetailModal}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                >
                  {t('orders.close')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Extension Request Modal - For Renter */}
        {selectedSubOrder && !isOwnerView && (
          <ExtensionRequestModal
            isOpen={showExtensionModal}
            onClose={() => {
              setShowExtensionModal(false);
              setSelectedSubOrder(null);
            }}
            subOrder={selectedSubOrder}
            onSuccess={() => {
              loadMyOrders({ status: statusFilter !== 'all' ? statusFilter : undefined });
              alert('Yêu cầu gia hạn đã được gửi cho chủ cho thuê');
            }}
          />
        )}

        {/* Extension Requests Modal - For Owner */}
        {selectedSubOrder && isOwnerView && (
          <ExtensionRequestsModal
            isOpen={showExtensionModal}
            onClose={() => {
              setShowExtensionModal(false);
              setSelectedSubOrder(null);
            }}
            subOrder={selectedSubOrder}
            onSuccess={() => {
              loadMyOrders({ status: statusFilter !== 'all' ? statusFilter : undefined });
            }}
          />
        )}
      </div>
    </div>
  );
};

export default RentalOrdersPage;