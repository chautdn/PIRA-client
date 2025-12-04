import React, { useState, useEffect } from 'react';
import { X, Check, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import extensionApi from '../../services/extension.Api';
import { formatCurrency } from '../../utils/constants';

const ManageExtensionRequestsModal = ({ isOpen, onClose, onSuccess }) => {
  const [extensionRequests, setExtensionRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchExtensionRequests();
    }
  }, [isOpen]);

  const fetchExtensionRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/extensions/owner-requests?status=PENDING');
      
      console.log('📦 API Response:', {
        fullResponse: response.data,
        hasData: !!response.data?.data,
        hasMetadata: !!response.data?.metadata,
        dataType: typeof response.data?.data,
        metadataType: typeof response.data?.metadata
      });

      const requests = response.data?.data || response.data?.metadata?.requests || [];
      
      // Ensure it's always an array
      const requestsArray = Array.isArray(requests) ? requests : (requests ? [requests] : []);
      
      console.log('📋 Extracted requests:', {
        count: requestsArray.length,
        firstRequest: requestsArray[0]
      });

      setExtensionRequests(requestsArray);
    } catch (error) {
      console.error('Error fetching extension requests:', error);
      toast.error('Không thể tải danh sách yêu cầu gia hạn');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveExtension = async (extensionId, productId) => {
    try {
      setSubmitting(true);
      console.log('📤 Approving extension:', { extensionId, productId });
      
      const response = await api.put(`/extensions/${extensionId}/approve`, { productId });
      
      console.log('✅ Response from approve:', response);
      toast.success('✅ Đã xác nhận gia hạn sản phẩm này');
      
      // Re-fetch the list to remove the approved product
      await fetchExtensionRequests();
      setSelectedRequest(null);
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Error approving extension:', error);
      toast.error(error.response?.data?.message || 'Không thể xác nhận yêu cầu gia hạn');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectExtension = async () => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    if (!selectedRequest) {
      toast.error('Không có yêu cầu được chọn');
      return;
    }

    try {
      setSubmitting(true);
      console.log('📤 Rejecting extension:', { 
        extensionId: selectedRequest.extensionId, 
        productId: selectedRequest.productId,
        rejectionReason: rejectReason
      });
      
      const response = await api.put(`/extensions/${selectedRequest.extensionId}/reject`, {
        productId: selectedRequest.productId,
        rejectionReason: rejectReason
      });

      console.log('✅ Response from reject:', response);
      toast.success('✅ Đã từ chối gia hạn sản phẩm này');
      
      setShowRejectModal(false);
      setRejectReason('');
      
      // Re-fetch the list to remove the rejected product
      await fetchExtensionRequests();
      setSelectedRequest(null);
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Error rejecting extension:', error);
      toast.error(error.response?.data?.message || 'Không thể từ chối yêu cầu gia hạn');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateExtendDays = (currentEndDate, newEndDate) => {
    const current = new Date(currentEndDate);
    const target = new Date(newEndDate);
    const diffTime = Math.abs(target - current);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">📅 Quản lí Yêu cầu Gia hạn</h2>
              <p className="text-orange-100 mt-1">Danh sách yêu cầu gia hạn từ người thuê</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : extensionRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Không có yêu cầu gia hạn</h3>
              <p className="text-gray-600">Hiện chưa có yêu cầu gia hạn nào từ người thuê</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {extensionRequests.map((request) => {
                const productData = request.product;
                const productDetail = request.productDetail;
                const currentEndDate = new Date(productData.currentEndDate);
                const newEndDate = new Date(productData.newEndDate);
                const extensionDays = productData.extensionDays;

                console.log('🎯 Rendering request card:', {
                  extensionId: request.extensionId,
                  productId: productData.productId,
                  productName: productData.productName,
                  hasDetail: !!productDetail
                });

                return (
                  <div
                    key={`${request.extensionId}-${productData.productId}`}
                    className="border-2 border-gray-200 rounded-lg p-4 bg-white hover:shadow-xl transition-all"
                  >
                    {/* Product Header */}
                    <div className="mb-3">
                      {productDetail?.thumbnail && (
                        <img 
                          src={productDetail.thumbnail}
                          alt={productDetail.name || productData.productName}
                          className="w-full h-40 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h4 className="text-base font-bold text-gray-900 line-clamp-2">
                        {productDetail?.name || productDetail?.title || productData.productName}
                      </h4>
                      
                      {productDetail?.sku && (
                        <p className="text-xs text-gray-500 mt-1">SKU: {productDetail.sku}</p>
                      )}
                    </div>

                    {/* Extension Info */}
                    <div className="space-y-2 mb-4 text-sm border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hiện tại:</span>
                        <span className="font-semibold">{currentEndDate.toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mới:</span>
                        <span className="font-semibold text-green-600">{newEndDate.toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gia hạn:</span>
                        <span className="font-bold text-orange-600">{extensionDays} ngày</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phí:</span>
                        <span className="font-bold text-blue-600">{formatCurrency(productData.extensionFee)}</span>
                      </div>
                    </div>

                    {/* Renter Info */}
                    <div className="text-xs text-gray-600 mb-4 p-2 bg-gray-50 rounded">
                      <p><strong>Người thuê:</strong> {request.renter?.profile?.firstName} {request.renter?.profile?.lastName}</p>
                      <p><strong>Đơn:</strong> {request.masterOrder?.masterOrderNumber}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveExtension(request.extensionId, productData.productId)}
                        disabled={submitting}
                        className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors font-semibold flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        Xác nhận
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest({ 
                            extensionId: request.extensionId, 
                            productId: productData.productId,
                            productName: productDetail?.name || productData.productName,
                            productData: productData,
                            masterOrder: request.masterOrder,
                            renter: request.renter
                          });
                          setShowRejectModal(true);
                        }}
                        disabled={submitting}
                        className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-colors font-semibold flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Từ chối
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="bg-red-600 text-white p-4 rounded-t-xl">
              <h3 className="text-lg font-bold">❌ Từ chối Yêu cầu Gia hạn</h3>
              <p className="text-sm text-red-100 mt-1">Sản phẩm: {selectedRequest.productName}</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700 font-semibold">
                Nhập lý do từ chối (sẽ gửi cho người thuê):
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                className="w-full p-3 border-2 border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                    setSelectedRequest(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleRejectExtension()}
                  disabled={!rejectReason.trim() || submitting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                >
                  {submitting ? '⏳...' : 'Từ chối'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageExtensionRequestsModal;
