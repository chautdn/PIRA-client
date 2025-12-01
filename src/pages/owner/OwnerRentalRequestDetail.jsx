import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ownerProductApi } from '../../services/ownerProduct.Api';
import rentalOrderService from '../../services/rentalOrder';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/constants';
import ContractSigningInline from '../../components/owner/ContractSigningInline';
import CreateDisputeModal from '../../components/dispute/CreateDisputeModal';
import { useDispute } from '../../context/DisputeContext';
import { ArrowLeft, Package, Calendar, MapPin, User, CreditCard, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const OwnerRentalRequestDetail = () => {
  const { subOrderId } = useParams();
  const navigate = useNavigate();
  
  const [subOrder, setSubOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSigningInModal, setShowSigningInModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [contractData, setContractData] = useState(null);
  const [loadingContract, setLoadingContract] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const { createDispute } = useDispute();

  useEffect(() => {
    fetchSubOrderDetail();
  }, [subOrderId]);

  const fetchSubOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await ownerProductApi.getSubOrderDetail(subOrderId);
      setSubOrder(response.data || response);
    } catch (error) {
      console.error('Lỗi tải chi tiết yêu cầu thuê:', error);
      toast.error('Không thể tải chi tiết yêu cầu thuê');
      navigate('/owner/rental-requests');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmProductItem = async (itemIndex) => {
    try {
      await ownerProductApi.confirmProductItem(subOrderId, itemIndex);
      toast.success('Đã xác nhận sản phẩm');
      await fetchSubOrderDetail();
    } catch (error) {
      console.error('Lỗi xác nhận sản phẩm:', error);
      toast.error(error.message || 'Không thể xác nhận sản phẩm');
    }
  };

  const handleRejectProductItem = async () => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      await ownerProductApi.rejectProductItem(subOrderId, selectedItemIndex, rejectReason);
      toast.success('Đã từ chối sản phẩm');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedItemIndex(null);
      await fetchSubOrderDetail();
    } catch (error) {
      console.error('Lỗi từ chối sản phẩm:', error);
      toast.error(error.message || 'Không thể từ chối sản phẩm');
    }
  };

  const handleItemSelect = (itemIndex, isChecked) => {
    const newSelected = new Set(selectedItems);
    if (isChecked) {
      newSelected.add(itemIndex);
    } else {
      newSelected.delete(itemIndex);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      const pendingItems = new Set();
      (subOrder.products || []).forEach((item, index) => {
        if (item.productStatus === 'PENDING') {
          pendingItems.add(index);
        }
      });
      setSelectedItems(pendingItems);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleBulkConfirm = async () => {
    try {
      const confirmedProductIds = Array.from(selectedItems).map(itemIndex => {
        const product = subOrder.products[itemIndex];
        return product._id;
      });
      
      await rentalOrderService.partialConfirmSubOrder(subOrder._id, confirmedProductIds);
      setSelectedItems(new Set());
      toast.success(`✅ Đã xác nhận ${confirmedProductIds.length} sản phẩm và tạo hợp đồng!`);
      await fetchSubOrderDetail();
    } catch (error) {
      console.error('Lỗi xác nhận hàng loạt:', error);
      toast.error(error.message || 'Không thể xác nhận sản phẩm');
    }
  };

  const handleConfirmAll = async () => {
    try {
      await ownerProductApi.confirmAllProductItems(subOrderId);
      toast.success('Đã xác nhận tất cả sản phẩm');
      await fetchSubOrderDetail();
    } catch (error) {
      console.error('Lỗi xác nhận tất cả:', error);
      toast.error(error.message || 'Không thể xác nhận tất cả sản phẩm');
    }
  };

  const loadContractForSigning = async (contractId) => {
    setLoadingContract(true);
    try {
      const response = await rentalOrderService.getContractDetail(contractId);
      
      const contract = response.data?.metadata?.contract || 
                      response.metadata?.contract || 
                      response.data?.contract ||
                      response.contract;
      
      setContractData(contract);
      
      if (!contract) {
        throw new Error('Không tìm thấy dữ liệu hợp đồng trong response');
      }
    } catch (error) {
      console.error('Lỗi tải hợp đồng:', error);
      toast.error(error.message || 'Không thể tải hợp đồng');
      setShowSigningInModal(false);
    } finally {
      setLoadingContract(false);
    }
  };

  const handleSignContract = async () => {
    const contractId = subOrder.contract?._id || subOrder.contract;
    if (contractId) {
      setShowSigningInModal(true);
      await loadContractForSigning(contractId);
    } else {
      toast.error('Không tìm thấy hợp đồng');
    }
  };

  const handleCreateDispute = (product, productIndex) => {
    setSelectedProduct({ product, subOrder, productIndex });
    setShowDisputeModal(true);
  };

  const handleDisputeSubmit = async (disputeData) => {
    try {
      await createDispute({
        ...disputeData,
        subOrderId: subOrder._id,
        productId: selectedProduct.product.product._id,
        productIndex: selectedProduct.productIndex
      });
      setShowDisputeModal(false);
      setSelectedProduct(null);
      toast.success('Tạo tranh chấp thành công!');
      await fetchSubOrderDetail();
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast.error(error.response?.data?.message || 'Tạo tranh chấp thất bại');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Nháp' },
      PENDING_CONFIRMATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ xác nhận' },
      OWNER_CONFIRMED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã xác nhận' },
      OWNER_REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Đã từ chối' },
      PARTIALLY_CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Xác nhận 1 phần' },
      READY_FOR_CONTRACT: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Sẵn sàng hợp đồng' },
      CONTRACT_SIGNED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã ký hợp đồng' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Hoàn thành' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Đã hủy' }
    };

    const style = config[status] || config.DRAFT;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getProductStatusBadge = (status) => {
    const config = {
      // Confirmation Phase
      PENDING: { icon: <Clock size={14} />, bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ xác nhận' },
      CONFIRMED: { icon: <CheckCircle size={14} />, bg: 'bg-green-100', text: 'text-green-800', label: 'Đã xác nhận' },
      REJECTED: { icon: <XCircle size={14} />, bg: 'bg-red-100', text: 'text-red-800', label: 'Đã từ chối' },
      
      // Delivery Phase
      SHIPPER_CONFIRMED: { icon: <CheckCircle size={14} />, bg: 'bg-blue-100', text: 'text-blue-800', label: 'Shipper đã nhận' },
      IN_TRANSIT: { icon: <Package size={14} />, bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Đang vận chuyển' },
      DELIVERED: { icon: <CheckCircle size={14} />, bg: 'bg-green-100', text: 'text-green-800', label: 'Đã giao hàng' },
      DELIVERY_FAILED: { icon: <XCircle size={14} />, bg: 'bg-red-100', text: 'text-red-800', label: 'Giao hàng thất bại' },
      
      // Active Rental Phase
      ACTIVE: { icon: <CheckCircle size={14} />, bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Đang thuê' },
      DISPUTED: { icon: <XCircle size={14} />, bg: 'bg-orange-100', text: 'text-orange-800', label: 'Tranh chấp' },
      
      // Return Phase
      RETURN_REQUESTED: { icon: <Clock size={14} />, bg: 'bg-purple-100', text: 'text-purple-800', label: 'Yêu cầu trả hàng' },
      EARLY_RETURN_REQUESTED: { icon: <Clock size={14} />, bg: 'bg-purple-100', text: 'text-purple-800', label: 'Yêu cầu trả sớm' },
      RETURN_SHIPPER_CONFIRMED: { icon: <CheckCircle size={14} />, bg: 'bg-blue-100', text: 'text-blue-800', label: 'Shipper nhận trả' },
      RETURNING: { icon: <Package size={14} />, bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Đang trả hàng' },
      RETURNED: { icon: <CheckCircle size={14} />, bg: 'bg-green-100', text: 'text-green-800', label: 'Đã trả hàng' },
      RETURN_FAILED: { icon: <XCircle size={14} />, bg: 'bg-red-100', text: 'text-red-800', label: 'Trả hàng thất bại' },
      
      // Final States
      COMPLETED: { icon: <CheckCircle size={14} />, bg: 'bg-green-100', text: 'text-green-800', label: 'Hoàn thành' },
      CANCELLED: { icon: <XCircle size={14} />, bg: 'bg-gray-100', text: 'text-gray-800', label: 'Đã hủy' }
    };

    const style = config[status] || config.PENDING;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
        {style.icon}
        {style.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!subOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Không tìm thấy yêu cầu thuê</p>
          <button
            onClick={() => navigate('/owner/rental-requests')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const pendingItems = subOrder.products?.filter(p => p.productStatus === 'PENDING') || [];
  const hasPendingItems = pendingItems.length > 0;
  const allPendingSelected = pendingItems.length > 0 && pendingItems.every((_, index) => {
    const actualIndex = (subOrder.products || []).findIndex(p => p.productStatus === 'PENDING' && p === pendingItems[index]);
    return selectedItems.has(actualIndex);
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!showSigningInModal ? (
          <>
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => navigate('/owner/rental-requests')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
              >
                <ArrowLeft size={20} />
                Quay lại danh sách
              </button>
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Chi tiết yêu cầu thuê</h1>
                  <p className="text-gray-600 mt-1">Mã đơn: {subOrder.subOrderNumber}</p>
                </div>
                <div>
                  {getStatusBadge(subOrder.status)}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Products */}
              <div className="lg:col-span-2 space-y-6">
            {/* Products Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="text-white" size={24} />
                    <h2 className="text-xl font-bold text-white">Sản phẩm ({subOrder.products?.length || 0})</h2>
                  </div>
                  {hasPendingItems && (
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allPendingSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 text-white focus:ring-white border-white rounded bg-white/20"
                      />
                      <span className="text-sm text-white font-medium">
                        Chọn tất cả ({pendingItems.length} chờ xác nhận)
                      </span>
                    </label>
                  )}
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {subOrder.products?.map((item, index) => (
                  <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex gap-4">
                      {/* Checkbox for pending items */}
                      {item.productStatus === 'PENDING' && (
                        <div className="flex-shrink-0 pt-2">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(index)}
                            onChange={(e) => handleItemSelect(index, e.target.checked)}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      )}

                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.product?.images?.[0] || '/placeholder-product.png'}
                          alt={item.product?.title}
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-grow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg mb-1">
                              {item.product?.title}
                            </h3>
                            <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                          </div>
                          {getProductStatusBadge(item.productStatus)}
                        </div>

                        {/* Pricing */}
                        <div className="flex items-center gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-600">Giá thuê: </span>
                            <span className="font-semibold text-blue-600">{formatCurrency(item.pricingSnapshot?.pricePerDay)}/ngày</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Cọc: </span>
                            <span className="font-semibold text-amber-600">{formatCurrency(item.pricingSnapshot?.depositPrice)}</span>
                          </div>
                        </div>

                        {/* Rental Period */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Calendar size={16} />
                          <span>
                            {new Date(item.startDate).toLocaleDateString('vi-VN')} - {new Date(item.endDate).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="text-gray-400">({item.rentalDays} ngày)</span>
                        </div>

                        {/* Rejection Reason */}
                        {item.productStatus === 'REJECTED' && item.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">
                              <span className="font-semibold">Lý do từ chối: </span>
                              {item.rejectionReason}
                            </p>
                          </div>
                        )}

                        {/* Dispute Button for RETURNED products */}
                        {item.productStatus === 'RETURNED' && (
                          <div className="mt-3">
                            <button
                              onClick={() => handleCreateDispute(item, index)}
                              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                            >
                              <AlertCircle size={16} />
                              Tạo tranh chấp (Hàng có vấn đề)
                            </button>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                              Hàng đã được trả về. Nếu có vấn đề, hãy tạo tranh chấp.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bulk Action Bar */}
              {selectedItems.size > 0 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-green-800 mb-1">
                        ✓ Đã chọn <span className="text-xl">{selectedItems.size}</span> sản phẩm
                      </div>
                      <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded inline-block">
                        ⚠️ Sản phẩm KHÔNG chọn sẽ TỰ ĐỘNG bị từ chối và hoàn tiền
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleBulkConfirm}
                        className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        <span className="text-lg">✓</span>
                        Xác nhận & Ký HĐ
                      </button>
                      <button
                        onClick={() => setSelectedItems(new Set())}
                        className="px-4 py-3 bg-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Contract Section */}
            {(subOrder.status === 'OWNER_CONFIRMED' || subOrder.status === 'PARTIALLY_CONFIRMED' || subOrder.contract) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="text-purple-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">Hợp đồng</h2>
                </div>

                {subOrder.contract ? (
                  <div className="space-y-4">
                    {subOrder.contract.ownerSignature ? (
                      <>
                        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                          <p className="text-sm text-green-700 font-semibold">
                            ✅ Bạn đã ký hợp đồng. 
                            {subOrder.contract.renterSignature 
                              ? ' Người thuê cũng đã ký. Hợp đồng đã có hiệu lực.'
                              : ' Đang chờ người thuê ký hợp đồng.'}
                          </p>
                        </div>
                        <button
                          onClick={handleSignContract}
                          className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
                        >
                          📄 Xem hợp đồng
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                          <p className="text-sm text-purple-700">
                            Hợp đồng đã được tạo. Bạn cần ký hợp đồng trước khi người thuê có thể ký. Hợp đồng chỉ có hiệu lực khi cả hai bên đã ký.
                          </p>
                        </div>
                        <button
                          onClick={handleSignContract}
                          className="w-full px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl"
                        >
                          ✍️ Ký hợp đồng ngay
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-600 mb-4">Hợp đồng sẽ được tạo tự động sau khi xác nhận sản phẩm</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Order Info */}
          <div className="space-y-6">
            {/* Renter Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Người thuê</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Tên</p>
                  <p className="font-semibold text-gray-900">
                    {subOrder.masterOrder?.renter?.profile?.fullName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{subOrder.masterOrder?.renter?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số điện thoại</p>
                  <p className="font-semibold text-gray-900">{subOrder.masterOrder?.renter?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="text-green-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Địa chỉ giao hàng</h2>
              </div>

              <p className="text-gray-900">{subOrder.masterOrder?.deliveryInfo?.address || 'N/A'}</p>
            </div>

            {/* Pricing Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="text-amber-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Tổng quan thanh toán</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tổng tiền thuê</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(subOrder.pricing?.subtotalRental)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tổng tiền cọc</span>
                  <span className="font-semibold text-amber-600">{formatCurrency(subOrder.pricing?.subtotalDeposit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí vận chuyển</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(subOrder.pricing?.shippingFee)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Tổng cộng</span>
                    <span className="font-bold text-blue-600 text-lg">
                      {formatCurrency(
                        (subOrder.pricing?.subtotalRental || 0) + 
                        (subOrder.pricing?.subtotalDeposit || 0) + 
                        (subOrder.pricing?.shippingFee || 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            {subOrder.masterOrder?.payment?.method === 'COD' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💳</span>
                  <span className="font-semibold text-amber-800">Thanh toán COD</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Đã thanh toán:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(subOrder.pricing?.subtotalDeposit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Còn lại:</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency((subOrder.pricing?.subtotalRental || 0) + (subOrder.pricing?.shippingFee || 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </>
        ) : (
          <ContractSigningInline
            subOrder={subOrder}
            contractData={contractData}
            loadingContract={loadingContract}
            onBack={() => {
              setShowSigningInModal(false);
              setContractData(null);
            }}
            onSignSuccess={() => {
              setShowSigningInModal(false);
              setContractData(null);
              toast.success('✅ Ký hợp đồng thành công!');
              fetchSubOrderDetail();
            }}
            loadContractForSigning={loadContractForSigning}
          />
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedItemIndex !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4 shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-gray-900">❌ Từ chối sản phẩm</h3>
              {subOrder.products[selectedItemIndex] && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold">{subOrder.products[selectedItemIndex].product?.title}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Số lượng: {subOrder.products[selectedItemIndex].quantity}
                  </div>
                </div>
              )}
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                    setSelectedItemIndex(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleRejectProductItem}
                  disabled={!rejectReason.trim()}
                  className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dispute Modal */}
        {showDisputeModal && selectedProduct && (
          <CreateDisputeModal
            isOpen={showDisputeModal}
            onClose={() => {
              setShowDisputeModal(false);
              setSelectedProduct(null);
            }}
            onSubmit={handleDisputeSubmit}
            rentalOrder={{ _id: subOrder.masterOrder?._id, ...subOrder }}
          />
        )}
      </div>
    </div>
  );
};

export default OwnerRentalRequestDetail;
