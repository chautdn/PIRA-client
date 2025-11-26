import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import rentalOrderService from '../services/rentalOrder';
import { toast } from '../components/common/Toast';
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

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [rejectingSubOrder, setRejectingSubOrder] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadConfirmationSummary();
  }, [masterOrderId]);

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
        reason: 'Không đủ số lượng sản phẩm mong muốn'
      });
      
      toast.success('Đã hủy SubOrder và hoàn tiền thành công!');
      await loadConfirmationSummary(); // Reload data
      setShowRejectModal(false);
      setRejectingSubOrder(null);
    } catch (error) {
      console.error('Error rejecting SubOrder:', error);
      toast.error(error.response?.data?.message || 'Có lỗi khi hủy SubOrder');
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
          <p className="text-yellow-800">Không có dữ liệu xác nhận. Vui lòng thử lại.</p>
          <button
            onClick={() => navigate('/rental-orders')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Quay lại danh sách
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
          Quay lại danh sách đơn hàng
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Tổng quan xác nhận
            </h1>
            <p className="text-gray-600">
              Đơn hàng: <span className="font-semibold">{masterOrderNumber}</span>
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
            {status === 'CONFIRMED' && '✓ Đã xác nhận toàn bộ'}
            {status === 'PARTIALLY_CANCELLED' && '⚠ Xác nhận một phần'}
            {status === 'CANCELLED' && '✗ Đã hủy'}
            {status === 'PENDING_CONFIRMATION' && '⏳ Chờ xác nhận'}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Tổng sản phẩm</div>
          <div className="text-3xl font-bold text-gray-900">
            {confirmationSummary.totalProducts}
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-green-700">Đã xác nhận</div>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600">
            {confirmationSummary.confirmedProducts}
          </div>
          <div className="text-xs text-green-700 mt-1">
            {confirmationSummary.totalConfirmedAmount.toLocaleString('vi-VN')} ₫
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-red-700">Đã hủy</div>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-600">
            {confirmationSummary.rejectedProducts}
          </div>
          <div className="text-xs text-red-700 mt-1">
            {confirmationSummary.totalRejectedAmount.toLocaleString('vi-VN')} ₫
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-blue-700">Chờ xác nhận</div>
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
                💰 Thông tin hoàn tiền
              </h3>
              <p className="text-blue-800 mb-2">
                Số tiền đã được hoàn lại vào ví của bạn:
              </p>
              <div className="text-2xl font-bold text-blue-600">
                {confirmationSummary.totalRefundedAmount.toLocaleString('vi-VN')} ₫
              </div>
              <p className="text-sm text-blue-700 mt-2">
                Bạn có thể sử dụng số tiền này để thanh toán cho đơn hàng tiếp theo.
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
                ⚠️ Đơn hàng được xác nhận một phần
              </h3>
              <p className="text-yellow-800">
                Chủ đồ đã xác nhận {confirmationSummary.confirmedProducts} trong tổng số{' '}
                {confirmationSummary.totalProducts} sản phẩm. Các sản phẩm còn lại đã được tự động hủy
                và hoàn tiền cho bạn.
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
                ✗ Đơn hàng đã bị hủy
              </h3>
              <p className="text-red-800">
                Tất cả sản phẩm trong đơn hàng này đã bị hủy. Toàn bộ số tiền đã được hoàn lại cho bạn.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SubOrders Details */}
      <div className="space-y-6">
        {subOrders?.map((subOrder) => {
          const confirmedProducts = subOrder.products.filter(p => p.confirmationStatus === 'CONFIRMED');
          const rejectedProducts = subOrder.products.filter(p => p.confirmationStatus === 'REJECTED');
          const pendingProducts = subOrder.products.filter(p => p.confirmationStatus === 'PENDING');

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
                      Chủ đồ: {subOrder.owner?.profile?.firstName || 'N/A'} {subOrder.owner?.profile?.lastName || ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {confirmedProducts.length}/{subOrder.products.length} sản phẩm đã xác nhận
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
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {subOrder.status === 'READY_FOR_CONTRACT' && '✓ Sẵn sàng ký HĐ'}
                      {subOrder.status === 'PARTIALLY_CONFIRMED' && '⚠ Xác nhận một phần'}
                      {subOrder.status === 'OWNER_CONFIRMED' && '✓ Đã xác nhận'}
                      {subOrder.status === 'OWNER_REJECTED' && '✗ Đã từ chối'}
                      {!['READY_FOR_CONTRACT', 'PARTIALLY_CONFIRMED', 'OWNER_CONFIRMED', 'OWNER_REJECTED'].includes(subOrder.status) && subOrder.status}
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
                      Sản phẩm đã xác nhận ({confirmedProducts.length})
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
                              Số lượng: {product.quantity} | Giá thuê: {(product.totalRental || 0).toLocaleString('vi-VN')} ₫
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
                      Sản phẩm đã hủy ({rejectedProducts.length})
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
                              Lý do: {product.rejectionReason}
                            </div>
                            <div className="text-xs text-red-600 mt-1">
                              Đã hoàn: {((product.totalRental || 0) + (product.totalDeposit || 0)).toLocaleString('vi-VN')} ₫
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
                      Đang chờ xác nhận ({pendingProducts.length})
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
                              Số lượng: {product.quantity}
                            </div>
                          </div>
                          <Clock className="w-6 h-6 text-blue-600 animate-pulse" />
                        </div>
                      ))}
                    </div>
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
                            <p className="font-semibold mb-1">⚠️ Chủ đồ chỉ xác nhận một phần sản phẩm</p>
                            <p className="mb-2">
                              Chỉ có <strong>{confirmedProducts.length}/{subOrder.products.length}</strong> sản phẩm được xác nhận. 
                              Các sản phẩm còn lại đã bị từ chối và đã được hoàn tiền.
                            </p>
                            <p className="font-medium text-yellow-900">
                              💡 Bạn có 2 lựa chọn:
                            </p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-yellow-800">
                              <li>Tiếp tục ký hợp đồng cho {confirmedProducts.length} sản phẩm đã xác nhận</li>
                              <li><strong>HOẶC từ chối toàn bộ</strong> và nhận hoàn tiền 100% (bao gồm cả sản phẩm đã xác nhận)</li>
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
                          Xem & Ký hợp đồng
                        </button>
                      ) : (
                        <div className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 font-semibold rounded-lg border-2 border-dashed border-gray-300 text-center">
                          ⏳ Hợp đồng đang được tạo...
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
                          title="Từ chối toàn bộ SubOrder và nhận hoàn tiền 100%"
                        >
                          <XCircle className="w-5 h-5" />
                          Từ chối & Hoàn tiền 100%
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
              Từ chối toàn bộ SubOrder
            </h3>
            
            <div className="mb-6 space-y-3">
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  ⚠️ Bạn đang từ chối SubOrder:
                </p>
                <p className="text-gray-900 font-semibold">
                  {rejectingSubOrder.subOrderNumber}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Chủ đồ: {rejectingSubOrder.owner?.profile?.firstName} {rejectingSubOrder.owner?.profile?.lastName}
                </p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium mb-2">
                  💰 Số tiền hoàn trả 100%:
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {((rejectingSubOrder.pricing?.subtotalRental || 0) + 
                    (rejectingSubOrder.pricing?.subtotalDeposit || 0) + 
                    (rejectingSubOrder.pricing?.shippingFee || 0)).toLocaleString('vi-VN')} ₫
                </p>
                <p className="text-xs text-green-700 mt-2">
                  Bao gồm: Tiền thuê + Tiền cọc + Phí vận chuyển (nếu có)
                </p>
              </div>

              <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                <p className="text-sm text-red-800 font-semibold mb-2">
                  📌 Lưu ý quan trọng:
                </p>
                <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                  <li>Toàn bộ SubOrder (kể cả sản phẩm đã xác nhận) sẽ bị hủy</li>
                  <li>Bạn sẽ <strong>KHÔNG CẦN KÝ HỢP ĐỒNG</strong></li>
                  <li>100% số tiền sẽ được hoàn vào ví ngay lập tức</li>
                  <li>Không thể hoàn tác sau khi xác nhận</li>
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
                Hủy
              </button>
              <button
                onClick={() => handleRejectSubOrder(rejectingSubOrder._id)}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    Xác nhận từ chối
                  </>
                )}
              </button>
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
          Quay lại danh sách đơn hàng
        </button>
      </div>
    </div>
  );
};

export default RenterConfirmationSummary;