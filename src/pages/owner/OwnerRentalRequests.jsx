import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ownerProductApi } from '../../services/ownerProduct.Api';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/constants';
import { Package, Calendar, User, CreditCard, ChevronRight, Filter, Check, XCircle } from 'lucide-react';
import OwnerShipmentModal from '../../components/owner/OwnerShipmentModal';
import { useI18n } from '../../hooks/useI18n';
import useOrderSocket from '../../hooks/useOrderSocket';
import api from '../../services/api';

const OwnerRentalRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const [searchParams] = useSearchParams();
  
  const [subOrders, setSubOrders] = useState([]);
  const [extensionRequests, setExtensionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedExtension, setSelectedExtension] = useState(null);

  // Check URL params for filter on mount
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      setStatusFilter(filterParam);
    }
  }, [searchParams]);

  // Initialize WebSocket with callbacks to reload orders
  const { isConnected } = useOrderSocket({
    onOrderCreated: () => {
      console.log('🔔 [OwnerRentalRequests] onOrderCreated triggered');
      fetchData();
    },
    onOrderStatusChanged: () => {
      console.log('🔔 [OwnerRentalRequests] onOrderStatusChanged triggered');
      fetchData();
    },
    onContractSigned: () => {
      console.log('🔔 [OwnerRentalRequests] onContractSigned triggered');
      fetchData();
    },
    onContractCompleted: () => {
      console.log('🔔 [OwnerRentalRequests] onContractCompleted triggered');
      fetchData();
    },
    onEarlyReturnRequest: () => {
      console.log('🔔 [OwnerRentalRequests] onEarlyReturnRequest triggered');
      fetchData();
    },
    onExtensionRequest: (data) => {
      console.log('🔔 [OwnerRentalRequests] onExtensionRequest triggered with data:', data);
      // Force fetch extension requests immediately
      if (statusFilter === 'extension_requests') {
        console.log('📋 [OwnerRentalRequests] Currently viewing extension requests - reloading...');
        fetchExtensionRequests();
      }
      fetchData();
    },
  });

  const filterOptions = [
    { value: 'all', label: t('ownerRentalRequests.filterAll') },
    { value: 'PENDING_CONFIRMATION', label: t('ownerRentalRequests.filterPendingConfirmation') },
    { value: 'PARTIALLY_CONFIRMED', label: t('ownerRentalRequests.filterPartiallyConfirmed') },
    { value: 'OWNER_CONFIRMED', label: t('ownerRentalRequests.filterOwnerConfirmed') },
    { value: 'READY_FOR_CONTRACT', label: t('ownerRentalRequests.filterReadyForContract') },
    { value: 'CONTRACT_SIGNED', label: t('ownerRentalRequests.filterContractSigned') },
    { value: 'ACTIVE', label: t('ownerRentalRequests.filterActive') },
    { value: 'COMPLETED', label: t('ownerRentalRequests.filterCompleted') },
    { value: 'extension_requests', label:t('ownerRentalRequests.manageExtension') }
  ];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, statusFilter]);

  const fetchData = async () => {
    if (statusFilter === 'extension_requests') {
      await fetchExtensionRequests();
    } else {
      await fetchSubOrders();
    }
  };

  const fetchExtensionRequests = async () => {
    try {
      setLoading(true);
      console.log('🔍 [OwnerRentalRequests] Fetching extension requests...');
      const response = await api.get('/extensions/owner-requests?status=PENDING');
      const requests = response.data?.data || response.data?.metadata?.requests || [];
      const requestsArray = Array.isArray(requests) ? requests : (requests ? [requests] : []);
      console.log('✅ [OwnerRentalRequests] Extension requests fetched:', requestsArray.length, 'requests');
      setExtensionRequests(requestsArray);
    } catch (error) {
      console.error('❌ [OwnerRentalRequests] Error fetching extension requests:', error);
      toast.error(t('manageExtensionRequests.loadError'));
      setExtensionRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveExtension = async (extensionId, productId) => {
    try {
      setSubmitting(true);
      await api.put(`/extensions/${extensionId}/approve`, { productId });
      toast.success(t('manageExtensionRequests.approveSuccess'));
      await fetchExtensionRequests();
    } catch (error) {
      console.error('Error approving extension:', error);
      toast.error(error.response?.data?.message || t('manageExtensionRequests.approveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectExtension = async () => {
    if (!rejectReason.trim()) {
      toast.error(t('manageExtensionRequests.rejectReasonRequired'));
      return;
    }

    try {
      setSubmitting(true);
      await api.put(`/extensions/${selectedExtension.extensionId}/reject`, {
        productId: selectedExtension.productId,
        rejectionReason: rejectReason
      });
      toast.success(t('manageExtensionRequests.rejectSuccess'));
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedExtension(null);
      await fetchExtensionRequests();
    } catch (error) {
      console.error('Error rejecting extension:', error);
      toast.error(error.response?.data?.message || t('manageExtensionRequests.rejectError'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const fetchSubOrders = async () => {
    try {
      setLoading(true);
      const response = await ownerProductApi.getRentalRequests({
        status: statusFilter === 'all' ? undefined : statusFilter
      });

      // Extract subOrders from various response shapes
      const extractSubOrders = (resp) => {
        if (!resp) return [];
        const candidates = [
          resp,
          resp.data,
          resp.metadata,
          resp.data?.metadata,
          resp.data?.data,
          resp.metadata?.subOrders,
          resp.data?.subOrders,
          resp.data?.data?.subOrders,
          resp.data?.metadata?.subOrders
        ];

        for (const c of candidates) {
          if (Array.isArray(c)) return c;
          if (c && typeof c === 'object' && Array.isArray(c.data)) return c.data;
          if (c && typeof c === 'object' && Array.isArray(c.subOrders)) return c.subOrders;
          if (c && c.subOrders && Array.isArray(c.subOrders.data)) return c.subOrders.data;
          if (c && c.metadata && Array.isArray(c.metadata.data)) return c.metadata.data;
        }
        return [];
      };

      const subOrdersList = extractSubOrders(response);
      setSubOrders(subOrdersList);
    } catch (error) {
      console.error('Lỗi tải danh sách yêu cầu thuê:', error);
      toast.error(t('ownerRentalRequests.errorLoading'));
      setSubOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Nháp' },
      PENDING_CONFIRMATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ xác nhận' },
      OWNER_CONFIRMED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã xác nhận' },
      OWNER_REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Đã từ chối' },
      PARTIALLY_CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Xác nhận 1 phần' },
      RENTER_REJECTED: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Người thuê từ chối' },
      READY_FOR_CONTRACT: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Sẵn sàng hợp đồng' },
      PENDING_OWNER: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Chờ chủ ký' },
      PENDING_RENTER: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Chờ người thuê ký' },
      CONTRACT_SIGNED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã ký hợp đồng' },
      DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã giao' },
      ACTIVE: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đang thuê' },
      IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đang thuê' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Hoàn thành' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Đã hủy' },
      PENDING_RENTER_DECISION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ quyết định người thuê' },
      RETURN_FAILED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Trả hàng thất bại' }
    };

    const style = config[status] || config.DRAFT;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text} whitespace-nowrap`}>
        {style.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('ownerRentalRequests.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('ownerRentalRequests.title')}</h1>
          <p className="text-gray-600">{t('ownerRentalRequests.subtitle')}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Filter size={20} className="text-gray-600" />
            <h3 className="font-semibold text-gray-900">{t('ownerRentalRequests.filterByStatus')}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Extension Requests Table */}
        {statusFilter === 'extension_requests' ? (
          extensionRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('manageExtensionRequests.noRequests')}</h3>
              <p className="text-gray-600">{t('manageExtensionRequests.noRequestsDesc')}</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('ownerRentalRequests.orderId')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('ownerRentalRequests.renter')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('ownerRentalRequests.product')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày kết thúc hiện tại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số ngày muốn gia hạn
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày kết thúc mới
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('ownerRentalRequests.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {extensionRequests.map((request) => {
                      const productData = request.product;
                      const productDetail = request.productDetail;
                      const currentEndDate = new Date(productData.currentEndDate);
                      const newEndDate = new Date(productData.newEndDate);
                      const extensionDays = productData.extensionDays;
                      
                      // Get product image from various sources
                      const productImage = productDetail?.thumbnail || 
                        (productDetail?.images && productDetail.images.length > 0 ? 
                          (typeof productDetail.images[0] === 'string' ? productDetail.images[0] : productDetail.images[0]?.url) 
                          : null) || 
                        productDetail?.image || 
                        productDetail?.mainImage;

                      return (
                        <tr key={`${request.extensionId}-${productData.productId}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{request.masterOrder?.masterOrderNumber}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User size={16} className="text-gray-400 mr-2" />
                              <div className="text-sm font-medium text-gray-900">
                                {request.renter?.profile?.fullName || request.renter?.profile?.firstName + ' ' + request.renter?.profile?.lastName || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {productImage ? (
                                <img 
                                  src={productImage}
                                  alt={productDetail?.name || productData.productName}
                                  className="w-12 h-12 object-cover rounded"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className="w-12 h-12 bg-gray-200 rounded items-center justify-center" style={{display: productImage ? 'none' : 'flex'}}>
                                <Package size={20} className="text-gray-400" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                  {productDetail?.name || productDetail?.title || productData.productName}
                                </div>
                                {productDetail?.sku && (
                                  <div className="text-xs text-gray-500">SKU: {productDetail.sku}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(currentEndDate)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-orange-600">{extensionDays} ngày</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-green-600">{formatDate(newEndDate)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleApproveExtension(request.extensionId, productData.productId)}
                                disabled={submitting}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors text-sm font-medium"
                              >
                                Chấp nhận
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedExtension({ 
                                    extensionId: request.extensionId, 
                                    productId: productData.productId,
                                    productName: productDetail?.name || productData.productName
                                  });
                                  setShowRejectModal(true);
                                }}
                                disabled={submitting}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-colors text-sm font-medium"
                              >
                                Từ chối
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {extensionRequests.map((request) => {
                  const productData = request.product;
                  const productDetail = request.productDetail;
                  const currentEndDate = new Date(productData.currentEndDate);
                  const newEndDate = new Date(productData.newEndDate);
                  const extensionDays = productData.extensionDays;
                  
                  // Get product image from various sources
                  const productImage = productDetail?.thumbnail || 
                    (productDetail?.images && productDetail.images.length > 0 ? 
                      (typeof productDetail.images[0] === 'string' ? productDetail.images[0] : productDetail.images[0]?.url) 
                      : null) || 
                    productDetail?.image || 
                    productDetail?.mainImage;

                  return (
                    <div key={`${request.extensionId}-${productData.productId}`} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-900">{request.masterOrder?.masterOrderNumber}</span>
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex items-center space-x-3 mb-3">
                        {productImage ? (
                          <img 
                            src={productImage}
                            alt={productDetail?.name || productData.productName}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-16 h-16 bg-gray-200 rounded items-center justify-center" style={{display: productImage ? 'none' : 'flex'}}>
                          <Package size={24} className="text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {productDetail?.name || productDetail?.title || productData.productName}
                          </div>
                          {productDetail?.sku && (
                            <div className="text-xs text-gray-500">SKU: {productDetail.sku}</div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm mb-3">
                        <div className="flex items-center text-gray-600">
                          <User size={14} className="mr-2" />
                          {request.renter?.profile?.fullName || request.renter?.profile?.firstName + ' ' + request.renter?.profile?.lastName || 'N/A'}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ngày kết thúc hiện tại:</span>
                          <span className="font-medium">{formatDate(currentEndDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Số ngày muốn gia hạn:</span>
                          <span className="font-bold text-orange-600">{extensionDays} ngày</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ngày kết thúc mới:</span>
                          <span className="font-medium text-green-600">{formatDate(newEndDate)}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveExtension(request.extensionId, productData.productId)}
                          disabled={submitting}
                          className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors font-semibold flex items-center justify-center"
                        >
                          Chấp nhận
                        </button>
                        <button
                          onClick={() => {
                            setSelectedExtension({ 
                              extensionId: request.extensionId, 
                              productId: productData.productId,
                              productName: productDetail?.name || productData.productName
                            });
                            setShowRejectModal(true);
                          }}
                          disabled={submitting}
                          className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-colors font-semibold flex items-center justify-center"
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          /* Orders Table */
          subOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('ownerRentalRequests.noRequests')}</h3>
            <p className="text-gray-600">
              {statusFilter !== 'all' 
                ? t('ownerRentalRequests.noRequestsFiltered')
                : t('ownerRentalRequests.noRequestsMessage')
              }
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('ownerRentalRequests.orderId')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('ownerRentalRequests.renter')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('ownerRentalRequests.product')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('ownerRentalRequests.total')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('ownerRentalRequests.status')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subOrders.map((subOrder) => (
                    <tr
                      key={subOrder._id}
                      onClick={() => navigate(`/owner/rental-requests/${subOrder._id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{subOrder.subOrderNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User size={16} className="text-gray-400 mr-2" />
                          <div className="text-sm font-medium text-gray-900">
                            {subOrder.masterOrder?.renter?.profile?.fullName || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{subOrder.products?.length || 0} {t('ownerRentalRequests.products')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CreditCard size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(subOrder.pricing?.subtotalRental + subOrder.pricing?.subtotalDeposit)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(subOrder.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <ChevronRight size={20} className="text-gray-400 inline" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {subOrders.map((subOrder) => (
                <div
                  key={subOrder._id}
                  onClick={() => navigate(`/owner/rental-requests/${subOrder._id}`)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">{subOrder.subOrderNumber}</span>
                    {getStatusBadge(subOrder.status)}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <User size={14} className="mr-2" />
                      {subOrder.masterOrder?.renter?.profile?.fullName || 'N/A'}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Package size={14} className="mr-2" />
                      {subOrder.products?.length || 0} {t('ownerRentalRequests.products')}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">
                        <CreditCard size={14} className="inline mr-2" />
                        {t('ownerRentalRequests.total')}:
                      </span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(subOrder.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && selectedExtension && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="bg-red-600 text-white p-4 rounded-t-xl">
              <h3 className="text-lg font-bold">❌ {t('manageExtensionRequests.rejectModalTitle')}</h3>
              <p className="text-sm text-red-100 mt-1">{t('manageExtensionRequests.product')} {selectedExtension.productName}</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700 font-semibold">
                {t('manageExtensionRequests.rejectReasonPrompt')}
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t('manageExtensionRequests.rejectReasonPlaceholder')}
                className="w-full p-3 border-2 border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                    setSelectedExtension(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  {t('manageExtensionRequests.cancel')}
                </button>
                <button
                  onClick={() => handleRejectExtension()}
                  disabled={!rejectReason.trim() || submitting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                >
                  {submitting ? t('manageExtensionRequests.submitting') : t('manageExtensionRequests.submitReject')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipment Management Modal */}
      {selectedOrder && (
        <OwnerShipmentModal
          isOpen={showShipmentModal}
          onClose={() => {
            setShowShipmentModal(false);
            setSelectedOrder(null);
          }}
          subOrder={selectedOrder}
          masterOrder={selectedOrder?.masterOrder}
          onConfirmReceived={() => fetchData()}
        />
      )}
    </div>
  );
};

export default OwnerRentalRequests;
