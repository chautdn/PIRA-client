import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { ownerProductApi } from '../../services/ownerProduct.Api';
import rentalOrderService from '../../services/rentalOrder';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/constants';
import ContractSigningModal from '../../components/common/ContractSigningModal';

const OwnerRentalRequests = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, DRAFT, CONFIRMED, REJECTED
  const [showContractSigning, setShowContractSigning] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchSubOrders();
    }
  }, [user, filter]);

  const fetchSubOrders = async () => {
    try {
      setLoading(true);
      // API để lấy các SubOrder của owner
      const response = await ownerProductApi.getSubOrders({
        status: filter === 'ALL' ? undefined : filter
      });

      console.log('API Response:', response); // Debug log

      // Robust extraction for various server response shapes:
      // - response may already be the data array
      // - response may be the server body: { status, message, data, metadata }
      // - our service often returns: { data: [...], pagination: {...} }
      // - controller may wrap under metadata: { message: '...', metadata: { subOrders: { data: [...], pagination } } }

      const extractSubOrders = (resp) => {
        if (!resp) return [];

        // Candidates to inspect
        const candidates = [
          resp,
          resp.data,
          resp.metadata,
          resp.data && resp.data.metadata,
          resp.data && resp.data.data,
          resp.metadata && resp.metadata.subOrders,
          resp.data && resp.data.subOrders,
          resp.data && resp.data.data && resp.data.data.subOrders,
          resp.data && resp.data.metadata && resp.data.metadata.subOrders
        ];

        for (const c of candidates) {
          if (Array.isArray(c)) return c;
        }

        // Some responses wrap list under { data: [...], pagination }
        for (const c of candidates) {
          if (c && typeof c === 'object' && Array.isArray(c.data)) return c.data;
          if (c && typeof c === 'object' && Array.isArray(c.subOrders)) return c.subOrders;
          // support nested metadata.subOrders.data
          if (c && c.subOrders && Array.isArray(c.subOrders.data)) return c.subOrders.data;
          if (c && c.metadata && Array.isArray(c.metadata.data)) return c.metadata.data;
        }

        return [];
      };

      const subOrdersList = extractSubOrders(response);
      setSubOrders(subOrdersList);
    } catch (error) {
      console.error('Lỗi tải danh sách yêu cầu thuê:', error);
      toast.error(t('owner.rentalRequests.loadError'));
      setSubOrders([]); // Đảm bảo luôn là array
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubOrder = async (subOrderId) => {
    try {
      await ownerProductApi.confirmSubOrder(subOrderId);
      toast.success(t('owner.rentalRequests.successConfirm'));
      fetchSubOrders(); // Refresh list
    } catch (error) {
      console.error('Lỗi xác nhận yêu cầu:', error);
      toast.error(t('owner.rentalRequests.errorConfirm'));
    }
  };

  const handleRejectSubOrder = async (subOrderId, reason) => {
    try {
      await ownerProductApi.rejectSubOrder(subOrderId, { reason });
      toast.success(t('owner.rentalRequests.successReject'));
      fetchSubOrders(); // Refresh list
    } catch (error) {
      console.error('Lỗi từ chối yêu cầu:', error);
      toast.error(t('owner.rentalRequests.errorReject'));
    }
  };

  const handleGenerateContract = async (masterOrderId) => {
    try {
      const response = await rentalOrderService.generateContracts(masterOrderId);
      toast.success(t('owner.rentalRequests.successGenerateContract'));
      fetchSubOrders(); // Refresh list to show updated status
      console.log('Generated contracts:', response);
    } catch (error) {
      console.error('Lỗi tạo hợp đồng:', error);
      toast.error(t('owner.rentalRequests.errorGenerateContract'));
    }
  };



  const handleSignContract = async (contractId, signatureData) => {
    try {
      await rentalOrderService.signContract(contractId, signatureData);
      toast.success(t('owner.rentalRequests.successSign'));
      fetchSubOrders(); // Refresh list
    } catch (error) {
      console.error('Lỗi ký hợp đồng:', error);
      toast.error(t('owner.rentalRequests.errorSign'));
      throw error; // Re-throw để ContractSigningModal xử lý loading state
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-800', // Old status - rare
      PENDING_OWNER_CONFIRMATION: 'bg-yellow-100 text-yellow-800', // New main status
      OWNER_CONFIRMED: 'bg-green-100 text-green-800',
      OWNER_REJECTED: 'bg-red-100 text-red-800',
      READY_FOR_CONTRACT: 'bg-blue-100 text-blue-800',
      PENDING_CONTRACT: 'bg-blue-100 text-blue-800',
      CONTRACTED: 'bg-purple-100 text-purple-800'
    };

    const labels = t('owner.rentalRequests.statusLabels');

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('owner.rentalRequests.title')}</h1>
        
        {/* Filter */}
        <div className="flex space-x-2">
          {['ALL', 'PENDING_OWNER_CONFIRMATION', 'OWNER_CONFIRMED', 'OWNER_REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status === 'ALL' ? t('owner.rentalRequests.filters.all') : 
               status === 'PENDING_OWNER_CONFIRMATION' ? t('owner.rentalRequests.filters.pending') :
               status === 'OWNER_CONFIRMED' ? t('owner.rentalRequests.filters.confirmed') : t('owner.rentalRequests.filters.rejected')}
            </button>
          ))}
        </div>
      </div>

      {!Array.isArray(subOrders) || subOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {t('owner.rentalRequests.noRequests')}
          </h3>
          <p className="text-gray-500">
            {filter === 'ALL' 
              ? t('owner.rentalRequests.noRequestsDesc')
              : t('owner.rentalRequests.noRequestsFilterDesc')
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.isArray(subOrders) && subOrders.map((subOrder) => (
            <SubOrderCard 
              key={subOrder._id}
              subOrder={subOrder}
              onConfirm={handleConfirmSubOrder}
              onReject={handleRejectSubOrder}
              onGenerateContract={handleGenerateContract}
              getStatusBadge={getStatusBadge}
              setSelectedContractId={setSelectedContractId}
              setShowContractSigning={setShowContractSigning}
            />
          ))}
        </div>
      )}

      {/* Contract Signing Modal */}
      {showContractSigning && (
        <ContractSigningModal
          contractId={selectedContractId}
          onSign={handleSignContract}
          onClose={() => {
            setShowContractSigning(false);
            setSelectedContractId(null);
          }}
        />
      )}
    </div>
  );
};

const SubOrderCard = ({ 
  subOrder, 
  onConfirm, 
  onReject, 
  onGenerateContract, 
  getStatusBadge,
  setSelectedContractId,
  setShowContractSigning
}) => {
  const { t } = useTranslation();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(subOrder._id, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(t('language') === 'en' ? 'en-US' : 'vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('owner.rentalRequests.subOrderNumber')}: {subOrder.subOrderNumber}
          </h3>
          <p className="text-sm text-gray-600">
            {t('owner.rentalRequests.masterOrderNumber')}: {subOrder.masterOrder?.masterOrderNumber}
          </p>
        </div>
        {getStatusBadge(subOrder.status)}
      </div>

      {/* Thông tin người thuê */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">{t('owner.rentalRequests.renterInfo')}</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">{t('owner.rentalRequests.renterName')}:</span>{' '}
            <span className="font-medium">{subOrder.masterOrder?.renter?.profile?.firstName}</span>
          </div>
          <div>
            <span className="text-gray-600">{t('owner.rentalRequests.renterPhone')}:</span>{' '}
            <span className="font-medium">{subOrder.masterOrder?.renter?.phone}</span>
          </div>
        </div>
      </div>

      {/* Thời gian thuê */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">{t('owner.rentalRequests.rentalTime')}</h4>
        <div className="flex items-center space-x-4 text-sm">
          <div>
            <span className="text-gray-600">{t('owner.rentalRequests.from')}:</span>{' '}
            <span className="font-medium">{formatDate(subOrder.rentalPeriod.startDate)}</span>
          </div>
          <div>
            <span className="text-gray-600">{t('owner.rentalRequests.to')}:</span>{' '}
            <span className="font-medium">{formatDate(subOrder.rentalPeriod.endDate)}</span>
          </div>
          <div>
            <span className="text-gray-600">{t('owner.rentalRequests.rentalDays')}:</span>{' '}
            <span className="font-medium">
              {Math.ceil((new Date(subOrder.rentalPeriod.endDate) - new Date(subOrder.rentalPeriod.startDate)) / (1000 * 60 * 60 * 24))} {t('orders.days')}
            </span>
          </div>
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Sản phẩm thuê</h4>
        <div className="space-y-2">
          {(subOrder.products || []).map((item, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <img 
                  src={item.product?.images?.[0].url} 
                  alt={item.product?.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div>
                  <p className="font-medium">{item.product?.name}</p>
                  <p className="text-sm text-gray-600">Số lượng: {item.product?.availability?.quantity}</p>
                </div>
              </div>
              <div className="text-right">

                <p className="text-sm text-gray-600">
                  {formatCurrency(item.product?.pricing?.dailyRate)}/ngày
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tổng tiền */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span>Tiền thuê:</span>
            <span className="font-medium">{formatCurrency(subOrder.pricing?.subtotalRental)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tiền cọc:</span>
            <span className="font-medium">{formatCurrency(subOrder.pricing?.subtotalDeposit)}</span>
          </div>
          <div className="flex justify-between">
  <span>Phương thức vận chuyển:</span>
  <span className="font-medium">
    {subOrder.masterOrder?.deliveryMethod === 'DELIVERY' ? (
      <>Giao hàng - {formatCurrency(subOrder.pricing?.shippingFee || subOrder.delivery?.shippingFee || 0)}</>
    ) : subOrder.masterOrder?.deliveryMethod === 'PICKUP' ? (
      'Nhận hàng tại nơi'
    ) : (
      'Không xác định'
    )}
  </span>
</div>
          <div className="flex justify-between text-lg font-semibold">
            <span>Tổng cộng:</span>
            <span>{formatCurrency(
              (subOrder.pricing?.subtotalRental || 0) + 
              (subOrder.pricing?.subtotalDeposit || 0) + 
              (subOrder.pricing?.shippingFee || 0)
            )}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {subOrder.status === 'PENDING_OWNER_CONFIRMATION' && (
        <div className="flex space-x-4">
          <button
            onClick={() => onConfirm(subOrder._id)}
            className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            ✅ Xác nhận thuê
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            ❌ Từ chối
          </button>
        </div>
      )}

      {subOrder.status === 'OWNER_CONFIRMED' && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              // Assume contract ID is available from subOrder.contract or generate from masterOrder
              const contractId = subOrder.contract?._id || subOrder.contract || `contract-${subOrder.masterOrder._id || subOrder.masterOrder}`;
              setSelectedContractId(contractId);
              setShowContractSigning(true);
            }}
            className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors font-medium"
          >
            ✍️ Ký hợp đồng
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Lý do từ chối</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              className="w-full p-3 border rounded-lg resize-none h-24 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerRentalRequests;