import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ownerProductApi } from '../../services/ownerProduct.Api';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/constants';
import { Package, Calendar, User, CreditCard, ChevronRight, Filter } from 'lucide-react';
import ManageExtensionRequestsModal from '../../components/owner/ManageExtensionRequestsModal';
import OwnerShipmentModal from '../../components/owner/OwnerShipmentModal';
import { useI18n } from '../../hooks/useI18n';
import useOrderSocket from '../../hooks/useOrderSocket';

const OwnerRentalRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Initialize WebSocket with callbacks to reload orders
  const { isConnected } = useOrderSocket({
    onOrderCreated: () => {
      fetchSubOrders();
    },
    onOrderStatusChanged: () => {
      fetchSubOrders();
    },
    onContractSigned: () => {
      fetchSubOrders();
    },
    onContractCompleted: () => {
      fetchSubOrders();
    },
    onEarlyReturnRequest: () => {
      fetchSubOrders();
    },
    onExtensionRequest: () => {
      fetchSubOrders();
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
    { value: 'COMPLETED', label: t('ownerRentalRequests.filterCompleted') }
  ];

  useEffect(() => {
    if (user) {
      fetchSubOrders();
    }
  }, [user, statusFilter]);

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
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('ownerRentalRequests.statusDraft') },
      PENDING_CONFIRMATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('ownerRentalRequests.statusPendingConfirmation') },
      OWNER_CONFIRMED: { bg: 'bg-green-100', text: 'text-green-800', label: t('ownerRentalRequests.statusOwnerConfirmed') },
      OWNER_REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: t('ownerRentalRequests.statusOwnerRejected') },
      PARTIALLY_CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', label: t('ownerRentalRequests.statusPartiallyConfirmed') },
      RENTER_REJECTED: { bg: 'bg-orange-100', text: 'text-orange-800', label: t('ownerRentalRequests.statusRenterRejected') },
      READY_FOR_CONTRACT: { bg: 'bg-purple-100', text: 'text-purple-800', label: t('ownerRentalRequests.statusReadyForContract') },
      PENDING_OWNER: { bg: 'bg-blue-100', text: 'text-blue-800', label: t('ownerRentalRequests.statusPendingOwner') },
      PENDING_RENTER: { bg: 'bg-orange-100', text: 'text-orange-800', label: t('ownerRentalRequests.statusPendingRenter') },
      CONTRACT_SIGNED: { bg: 'bg-green-100', text: 'text-green-800', label: t('ownerRentalRequests.statusContractSigned') },
      DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', label: t('ownerRentalRequests.statusDelivered') },
      ACTIVE: { bg: 'bg-blue-100', text: 'text-blue-800', label: t('ownerRentalRequests.statusActive') },
      IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-800', label: t('ownerRentalRequests.statusInProgress') },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: t('ownerRentalRequests.statusCompleted') },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('ownerRentalRequests.statusCancelled') }
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t('ownerRentalRequests.title')}</h1>
            <p className="text-gray-600">{t('ownerRentalRequests.subtitle')}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => fetchSubOrders()}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              🔄 {t('ownerRentalRequests.reload')}
            </button>
            <button
              onClick={() => setShowExtensionModal(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
            >
              📅 {t('ownerRentalRequests.manageExtension')}
            </button>
            <button
              onClick={() => {
                setSelectedOrder(null);
                setShowShipmentModal(true);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              🚚 {t('ownerRentalRequests.manageShipment')}
            </button>
          </div>
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

        {/* Orders Table */}
        {subOrders.length === 0 ? (
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
        )}
      </div>

      {/* Extension Management Modal */}
      <ManageExtensionRequestsModal 
        isOpen={showExtensionModal}
        onClose={() => setShowExtensionModal(false)}
        onSuccess={() => fetchSubOrders()}
      />

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
          onConfirmReceived={() => fetchSubOrders()}
        />
      )}
    </div>
  );
};

export default OwnerRentalRequests;
