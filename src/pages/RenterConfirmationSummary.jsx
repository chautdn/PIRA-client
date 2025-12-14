import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../hooks/useI18n';
import rentalOrderService from '../services/rentalOrder';
import { toast } from '../components/common/Toast';
import RenterPartialDecisionModal from '../components/rental/RenterPartialDecisionModal';
import {
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Package,
  AlertCircle,
  ArrowLeft,
  Loader2,
  FileText
} from 'lucide-react';

/**
 * Component hiển thị tổng quan confirmation cho Renter
 * - Hiển thị confirmationSummary
 * - Danh sách sản phẩm confirmed/rejected
 * - Thông tin hoàn tiền
 */
const RenterConfirmationSummary = () => {
  const { masterOrderId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useI18n();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [rejectingSubOrder, setRejectingSubOrder] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPartialDecisionModal, setShowPartialDecisionModal] = useState(false);
  const [partialDecisionSubOrder, setPartialDecisionSubOrder] = useState(null);
  const [showCancelPendingModal, setShowCancelPendingModal] = useState(false);
  const [cancelingSubOrder, setCancelingSubOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadConfirmationSummary();
  }, [masterOrderId]);

  // Check for pending decision subOrder
  useEffect(() => {
    if (data && data.subOrders) {
      const pendingSubOrder = data.subOrders.find(
        sub => sub.status === 'PENDING_RENTER_DECISION'
      );
      
      if (pendingSubOrder) {
        setPartialDecisionSubOrder(pendingSubOrder);
        setShowPartialDecisionModal(true);
      }
    }
  }, [data]);

  const handleRenterDecision = async (decision, result) => {
    console.log('Renter decision:', decision, result);
    setShowPartialDecisionModal(false);
    setPartialDecisionSubOrder(null);
    
    if (decision === 'CANCELLED') {
      toast.success(`${t('renterConfirmationSummary.cancelOrder')} ${result.metadata?.refundAmount?.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}đ`);
    } else if (decision === 'ACCEPTED') {
      toast.success(`${t('renterConfirmationSummary.confirmOrder')} ${result.metadata?.refundAmount?.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}đ`);
      // Auto redirect to contracts
      setTimeout(() => {
        navigate('/rental-orders/contracts');
      }, 2000);
    }
    
    // Reload data
    await loadConfirmationSummary();
  };

  const loadConfirmationSummary = async () => {
    try {
      setLoading(true);
      const response = await rentalOrderService.getConfirmationSummary(masterOrderId);
      
      console.log('🔍 Confirmation Summary Response:', response);
      
      // Backend trả về: { data: { metadata: { masterOrderNumber, status, ... } } }
      const actualData = response.data?.metadata || response.metadata || response.data || response;
      
      console.log('🔍 Actual data extracted:', actualData);
      
      setData(actualData);
    } catch (error) {
      console.error('Error loading confirmation summary:', error);
      toast.error(error.message);
      navigate('/rental-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubOrder = async (subOrderId) => {
    try {
      setLoading(true);
      // Call API to reject SubOrder and refund
      await rentalOrderService.renterRejectSubOrder(subOrderId, {
        reason: t('renterConfirmationSummary.rejectReason')
      });
      
      toast.success(t('renterConfirmationSummary.rejectSuccess'));
      await loadConfirmationSummary(); // Reload data
      setShowRejectModal(false);
      setRejectingSubOrder(null);
    } catch (error) {
      console.error('Error rejecting SubOrder:', error);
      toast.error(error.response?.data?.message || t('renterConfirmationSummary.rejectError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPendingOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn');
      return;
    }

    try {
      setLoading(true);
      await rentalOrderService.renterCancelPendingOrder(cancelingSubOrder._id, cancelReason);
      toast.success('Đã hủy đơn hàng và hoàn tiền 100% thành công');
      setShowCancelPendingModal(false);
      setCancelingSubOrder(null);
      setCancelReason('');
      await loadConfirmationSummary();
    } catch (error) {
      console.error('Error cancelling pending order:', error);
      toast.error(error.message || 'Không thể hủy đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    console.log('⚠️ No data available, data state:', data);
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">{t('renterConfirmationSummary.noData')}</p>
          <button
            onClick={() => navigate('/rental-orders')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t('renterConfirmationSummary.backToList')}
          </button>
        </div>
      </div>
    );
  }

  console.log('✅ Rendering with data:', data);

  const { masterOrderNumber, status, confirmationSummary = {}, subOrders = [] } = data;
  
  console.log('📊 Parsed data:', {
    masterOrderNumber,
    status,
    confirmationSummary,
    subOrdersCount: subOrders.length
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/rental-orders')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('renterConfirmationSummary.backToList')}
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('renterConfirmationSummary.title')}
            </h1>
            <p className="text-gray-600">
              {t('renterConfirmationSummary.order')}: <span className="font-semibold">{masterOrderNumber}</span>
            </p>
          </div>

          {/* Status Badge */}
          <div className={`px-4 py-2 rounded-lg font-semibold ${
            status === 'CONFIRMED'
              ? 'bg-green-100 text-green-700'
              : status === 'PARTIALLY_CANCELLED'
              ? 'bg-yellow-100 text-yellow-700'
              : status === 'CANCELLED'
              ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {status === 'CONFIRMED' && t('renterConfirmationSummary.fullyConfirmed')}
            {status === 'PARTIALLY_CANCELLED' && t('renterConfirmationSummary.partiallyConfirmed')}
            {status === 'CANCELLED' && t('renterConfirmationSummary.cancelled')}
            {status === 'PENDING_CONFIRMATION' && t('renterConfirmationSummary.pendingConfirmation')}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
          <div className="text-sm text-gray-600 mb-1">{t('renterConfirmationSummary.totalProducts')}</div>
          <div className="text-3xl font-bold text-gray-900">
            {confirmationSummary.totalProducts}
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-green-700">{t('renterConfirmationSummary.confirmed')}</div>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600">
            {confirmationSummary.confirmedProducts}
          </div>
          <div className="text-xs text-green-700 mt-1">
            {confirmationSummary.totalConfirmedAmount.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} ₫
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-red-700">{t('renterConfirmationSummary.rejected')}</div>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-600">
            {confirmationSummary.rejectedProducts}
          </div>
          <div className="text-xs text-red-700 mt-1">
            {confirmationSummary.totalRejectedAmount.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} ₫
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-blue-700">{t('renterConfirmationSummary.pending')}</div>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {confirmationSummary.pendingProducts}
          </div>
        </div>
      </div>

      {/* Refund Info */}
      {confirmationSummary.totalRefundedAmount > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
          <div className="flex items-start gap-3">
            <DollarSign className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2 text-lg">
                {t('renterConfirmationSummary.refundInfo')}
              </h3>
              <p className="text-blue-800 mb-2">
                {t('renterConfirmationSummary.refundAmount')}
              </p>
              <div className="text-2xl font-bold text-blue-600">
                {confirmationSummary.totalRefundedAmount.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} ₫
              </div>
              <p className="text-sm text-blue-700 mt-2">
                {t('renterConfirmationSummary.refundUsage')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Message */}
      {status === 'PARTIALLY_CANCELLED' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">
                {t('renterConfirmationSummary.partiallyConfirmedMessage')}
              </h3>
              <p className="text-yellow-800">
                {t('renterConfirmationSummary.partiallyConfirmedDetails', {
                  confirmed: confirmationSummary.confirmedProducts,
                  total: confirmationSummary.totalProducts
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {status === 'CANCELLED' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">
                {t('renterConfirmationSummary.cancelledMessage')}
              </h3>
              <p className="text-red-800">
                {t('renterConfirmationSummary.cancelledDetails')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SubOrders Details */}
      <div className="space-y-6">
        {subOrders?.map((subOrder) => {
          const confirmedProducts = subOrder.products.filter(p => p.productStatus === 'CONFIRMED');
          const rejectedProducts = subOrder.products.filter(p => p.productStatus === 'REJECTED');
          const pendingProducts = subOrder.products.filter(p => p.productStatus === 'PENDING');

          return (
            <div key={subOrder._id} className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
              {/* SubOrder Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {subOrder.subOrderNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t('renterConfirmationSummary.ownerLabel')} {subOrder.owner?.profile?.firstName || 'N/A'} {subOrder.owner?.profile?.lastName || ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('renterConfirmationSummary.productsConfirmed', {
                        confirmed: confirmedProducts.length,
                        total: subOrder.products.length
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      subOrder.status === 'READY_FOR_CONTRACT'
                        ? 'bg-green-100 text-green-700'
                        : subOrder.status === 'PARTIALLY_CONFIRMED'
                        ? 'bg-yellow-100 text-yellow-700'
                        : subOrder.status === 'OWNER_CONFIRMED'
                        ? 'bg-blue-100 text-blue-700'
                        : subOrder.status === 'OWNER_REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : subOrder.status === 'CONTRACT_SIGNED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
              
                    }`}>
                      {subOrder.status === 'READY_FOR_CONTRACT' && t('renterConfirmationSummary.readyForContract')}
                      {subOrder.status === 'PARTIALLY_CONFIRMED' && t('renterConfirmationSummary.partiallyConfirmedStatus')}
                      {subOrder.status === 'OWNER_CONFIRMED' && t('renterConfirmationSummary.ownerConfirmed')}
                      {subOrder.status === 'OWNER_REJECTED' && t('renterConfirmationSummary.ownerRejected')}
                      {subOrder.status === 'CONTRACT_SIGNED' && t('renterConfirmationSummary.contractSigned')}
                      {!['READY_FOR_CONTRACT', 'PARTIALLY_CONFIRMED', 'OWNER_CONFIRMED', 'OWNER_REJECTED','CONTRACT_SIGNED'].includes(subOrder.status) && subOrder.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Products List */}
              <div className="p-6">
                {/* Confirmed Products */}
                {confirmedProducts.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      {t('renterConfirmationSummary.confirmedProductsTitle')} ({confirmedProducts.length})
                    </h4>
                    <div className="space-y-3">
                      {confirmedProducts.map((product) => (
                        <div key={product._id} className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <img
                            src={product.product?.images?.[0].url || '/placeholder.jpg'}
                            alt={product.product?.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {product.product?.title || product.product?.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {t('renterConfirmationSummary.quantityLabel')} {product.quantity} | {t('renterConfirmationSummary.rentalPriceLabel')} {(product.totalRental || 0).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} ₫
                            </div>
                          </div>
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejected Products */}
                {rejectedProducts.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      {t('renterConfirmationSummary.rejectedProductsTitle')} ({rejectedProducts.length})
                    </h4>
                    <div className="space-y-3">
                      {rejectedProducts.map((product) => (
                        <div key={product._id} className="flex items-center gap-4 p-3 bg-red-50 rounded-lg border border-red-200">
                          <img
                            src={product.product?.images?.[0].url || '/placeholder.jpg'}
                            alt={product.product?.title}
                            className="w-16 h-16 object-cover rounded opacity-50"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {product.product?.title || product.product?.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {t('renterConfirmationSummary.reasonLabel')} {product.rejectionReason}
                            </div>
                            <div className="text-xs text-red-600 mt-1">
                              {t('renterConfirmationSummary.refundedLabel')} {((product.totalRental || 0) + (product.totalDeposit || 0)).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} ₫
                            </div>
                          </div>
                          <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Products */}
                {pendingProducts.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      {t('renterConfirmationSummary.pendingProductsTitle')} ({pendingProducts.length})
                    </h4>
                    <div className="space-y-3">
                      {pendingProducts.map((product) => (
                        <div key={product._id} className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <img
                            src={product.product?.images?.[0].url || '/placeholder.jpg'}
                            alt={product.product?.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {product.product?.title || product.product?.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {t('renterConfirmationSummary.quantityLabel')} {product.quantity}
                            </div>
                          </div>
                          <Clock className="w-6 h-6 text-blue-600 animate-pulse" />
                        </div>
                      ))}
                    </div>
                    
                    {/* Cancel Pending Button - Only show when status is PENDING_CONFIRMATION */}
                    {subOrder.status === 'PENDING_CONFIRMATION' && (
                      <div className="mt-4 p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
                        <div className="mb-3">
                          <p className="text-sm text-orange-800 font-semibold mb-1">
                            ⚠️ Bạn có thể hủy đơn hàng này
                          </p>
                          <p className="text-xs text-orange-700">
                            Chủ chưa xác nhận. Nếu hủy, bạn sẽ được hoàn 100% tiền (cọc + thuê + ship)
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setCancelingSubOrder(subOrder);
                            setShowCancelPendingModal(true);
                          }}
                          className="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <XCircle size={20} />
                          Hủy đơn hàng (hoàn 100%)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Contract Link and Actions */}
                {confirmedProducts.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    {console.log('🔍 SubOrder contract info:', {
                      subOrderId: subOrder._id,
                      subOrderNumber: subOrder.subOrderNumber,
                      contract: subOrder.contract,
                      contractStatus: subOrder.contractStatus,
                      status: subOrder.status
                    })}
                    
                    {/* Warning for partially confirmed orders */}
                    {subOrder.status === 'PARTIALLY_CONFIRMED' && rejectedProducts.length > 0 && (
                      <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-yellow-800">
                            <p className="font-semibold mb-1">{t('renterConfirmationSummary.partialConfirmWarning')}</p>
                            <p className="mb-2">
                              {t('renterConfirmationSummary.partialConfirmWarningDetails', {
                                confirmed: confirmedProducts.length,
                                total: subOrder.products.length
                              })}
                            </p>
                            <p className="font-medium text-yellow-900">
                              {t('renterConfirmationSummary.partialConfirmOptions')}
                            </p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-yellow-800">
                              <li>{t('renterConfirmationSummary.optionContinue', { count: confirmedProducts.length })}</li>
                              <li><strong>{t('renterConfirmationSummary.optionReject')}</strong></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      {subOrder.contract ? (
                        <button
                          onClick={() => {
                            console.log('📄 Navigating to contract:', subOrder.contract);
                            navigate(`/rental-orders/contracts?contractId=${subOrder.contract}`);
                          }}
                          className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                          <FileText className="w-5 h-5" />
                          {t('renterConfirmationSummary.viewSignContract')}
                        </button>
                      ) : (
                        <div className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 font-semibold rounded-lg border-2 border-dashed border-gray-300 text-center">
                          {t('renterConfirmationSummary.contractCreating')}
                        </div>
                      )}
                      
                      {/* Reject button - Always show for PARTIALLY_CONFIRMED */}
                      {subOrder.status === 'PARTIALLY_CONFIRMED' && (
                        <button
                          onClick={() => {
                            setRejectingSubOrder(subOrder);
                            setShowRejectModal(true);
                          }}
                          className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 flex items-center justify-center gap-2 whitespace-nowrap"
                          title={t('renterConfirmationSummary.rejectRefund100')}
                        >
                          <XCircle className="w-5 h-5" />
                          {t('renterConfirmationSummary.rejectRefund100')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reject Confirmation Modal */}
      {showRejectModal && rejectingSubOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <XCircle className="w-6 h-6 text-red-600" />
              {t('renterConfirmationSummary.rejectModalTitle')}
            </h3>
            
            <div className="mb-6 space-y-3">
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  {t('renterConfirmationSummary.rejectModalWarning')}
                </p>
                <p className="text-gray-900 font-semibold">
                  {rejectingSubOrder.subOrderNumber}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {t('renterConfirmationSummary.ownerLabel')} {rejectingSubOrder.owner?.profile?.firstName} {rejectingSubOrder.owner?.profile?.lastName}
                </p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium mb-2">
                  {t('renterConfirmationSummary.rejectModalRefundTitle')}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {((rejectingSubOrder.pricing?.subtotalRental || 0) + 
                    (rejectingSubOrder.pricing?.subtotalDeposit || 0) + 
                    (rejectingSubOrder.pricing?.shippingFee || 0)).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} ₫
                </p>
                <p className="text-xs text-green-700 mt-2">
                  {t('renterConfirmationSummary.rejectModalRefundIncludes')}
                </p>
              </div>

              <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                <p className="text-sm text-red-800 font-semibold mb-2">
                  {t('renterConfirmationSummary.rejectModalImportantNote')}
                </p>
                <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                  <li>{t('renterConfirmationSummary.rejectModalNote1')}</li>
                  <li><strong>{t('renterConfirmationSummary.rejectModalNote2')}</strong></li>
                  <li>{t('renterConfirmationSummary.rejectModalNote3')}</li>
                  <li>{t('renterConfirmationSummary.rejectModalNote4')}</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingSubOrder(null);
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
              >
                {t('renterConfirmationSummary.cancelButton')}
              </button>
              <button
                onClick={() => handleRejectSubOrder(rejectingSubOrder._id)}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('renterConfirmationSummary.processing')}
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    {t('renterConfirmationSummary.confirmReject')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renter Partial Decision Modal */}
      {showPartialDecisionModal && partialDecisionSubOrder && (
        <RenterPartialDecisionModal
          isOpen={showPartialDecisionModal}
          onClose={() => {
            setShowPartialDecisionModal(false);
            setPartialDecisionSubOrder(null);
          }}
          subOrder={partialDecisionSubOrder}
          onDecisionMade={handleRenterDecision}
        />
      )}

      {/* Cancel Pending Order Modal */}
      {showCancelPendingModal && cancelingSubOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 shadow-2xl">
            <div className="bg-red-600 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <XCircle size={24} />
                Hủy đơn hàng
              </h3>
            </div>
            
            <div className="p-6">
              <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 mb-4">
                <p className="text-sm text-orange-800 font-semibold mb-2">
                  ⚠️ Cảnh báo: Hành động này không thể hoàn tác!
                </p>
                <p className="text-xs text-orange-700 mb-2">
                  Đơn hàng: <strong>{cancelingSubOrder.subOrderNumber}</strong>
                </p>
                <p className="text-xs text-orange-700">
                  Bạn sẽ được hoàn 100% tiền (bao gồm cọc, phí thuê và phí vận chuyển).
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800 font-semibold mb-2">
                  💰 Số tiền hoàn trả:
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {((cancelingSubOrder.pricing?.subtotalRental || 0) + 
                    (cancelingSubOrder.pricing?.subtotalDeposit || 0) + 
                    (cancelingSubOrder.pricing?.shippingFee || 0)).toLocaleString('vi-VN')} ₫
                </p>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do hủy đơn: <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Vui lòng nhập lý do hủy đơn hàng..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={loading}
              />
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCancelPendingModal(false);
                    setCancelingSubOrder(null);
                    setCancelReason('');
                  }}
                  disabled={loading}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                >
                  Đóng
                </button>
                <button
                  onClick={handleCancelPendingOrder}
                  disabled={loading || !cancelReason.trim()}
                  className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang hủy...
                    </>
                  ) : (
                    <>
                      <XCircle size={18} />
                      Xác nhận hủy đơn
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="mt-8">
        <button
          onClick={() => navigate('/rental-orders')}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
        >
          {t('renterConfirmationSummary.backToList')}
        </button>
      </div>
    </div>
  );
};

export default RenterConfirmationSummary;