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
import useOrderSocket from '../../hooks/useOrderSocket';

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
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [cancelOrderReason, setCancelOrderReason] = useState('');
  const [loadingCancelOrder, setLoadingCancelOrder] = useState(false);
  const [showRejectAllModal, setShowRejectAllModal] = useState(false);
  const [rejectAllReason, setRejectAllReason] = useState('');
  const [loadingRejectAll, setLoadingRejectAll] = useState(false);
  
  const { createDispute } = useDispute();

  // Initialize WebSocket - context handles updates, only reload if needed for full data
  const { isConnected } = useOrderSocket({
    onContractSigned: (data) => {
      fetchSubOrderDetail();
    },
    onContractCompleted: (data) => {
      fetchSubOrderDetail();
    },
  });

  useEffect(() => {
    fetchSubOrderDetail();
  }, [subOrderId]);

  const fetchSubOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await ownerProductApi.getSubOrderDetail(subOrderId);
      const subOrderData = response.data || response;
      console.log('🔍 SubOrder Data:', subOrderData);
      console.log('🔍 SubOrder Status:', subOrderData?.status);
      console.log('🔍 MasterOrder:', subOrderData?.masterOrder);
      console.log('🔍 Delivery Address:', subOrderData?.masterOrder?.deliveryAddress);
      console.log('🔍 Contract:', subOrderData?.contract);
      if (subOrderData?.contract) {
        console.log('🔍 Contract ID:', subOrderData.contract._id || subOrderData.contract);
        console.log('🔍 Contract Signatures:', subOrderData.contract.signatures);
        console.log('🔍 Owner Signed:', subOrderData.contract.signatures?.owner?.signed);
        console.log('🔍 Renter Signed:', subOrderData.contract.signatures?.renter?.signed);
      }
      setSubOrder(subOrderData);
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

  const handleBulkAction = async (action) => {
    try {
      if (selectedItems.size === 0) {
        toast.error('⚠️ Vui lòng chọn ít nhất 1 sản phẩm!');
        return;
      }

      let confirmedProductIds = [];
      
      if (action === 'confirm') {
        // Xác nhận những sản phẩm đã chọn
        confirmedProductIds = Array.from(selectedItems).map(itemIndex => {
          const product = subOrder.products[itemIndex];
          return product._id;
        });
      } else {
        // Từ chối những sản phẩm đã chọn → xác nhận những sản phẩm KHÔNG chọn
        (subOrder.products || []).forEach((product, index) => {
          if (product.productStatus === 'PENDING' && !selectedItems.has(index)) {
            confirmedProductIds.push(product._id);
          }
        });
        
        if (confirmedProductIds.length === 0) {
          toast.error('⚠️ Bạn đã chọn TỪ CHỐI tất cả sản phẩm. Không có sản phẩm nào được xác nhận!');
          return;
        }
      }
      
      const confirmedCount = confirmedProductIds.length;
      const rejectedCount = pendingItems.length - confirmedCount;
      
      await rentalOrderService.partialConfirmSubOrder(subOrder._id, confirmedProductIds);
      setSelectedItems(new Set());
      
      if (action === 'confirm') {
        toast.success(`✅ Đã xác nhận ${confirmedCount} sản phẩm${rejectedCount > 0 ? ` và từ chối ${rejectedCount} sản phẩm` : ''}!`);
      } else {
        toast.success(`✅ Đã từ chối ${rejectedCount} sản phẩm và xác nhận ${confirmedCount} sản phẩm còn lại!`);
      }
      
      await fetchSubOrderDetail();
    } catch (error) {
      console.error('Lỗi xử lý hàng loạt:', error);
      toast.error(error.message || 'Không thể xử lý sản phẩm');
    }
  };

  const handleConfirmAll = async () => {
    try {
      // Lấy tất cả product IDs của sản phẩm PENDING
      const allPendingProductIds = pendingItems.map(item => item._id);
      
      if (allPendingProductIds.length === 0) {
        toast.error('Không có sản phẩm nào để xác nhận');
        return;
      }
      
      await rentalOrderService.partialConfirmSubOrder(subOrder._id, allPendingProductIds);
      toast.success(`Đã xác nhận tất cả ${allPendingProductIds.length} sản phẩm`);
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

  const handleCancelEntireOrder = async () => {
    if (!cancelOrderReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn HỦY TOÀN BỘ đơn hàng này? Người thuê sẽ được hoàn 100% tiền. Hành động này không thể hoàn tác.')) {
      return;
    }

    setLoadingCancelOrder(true);
    try {
      await rentalOrderService.ownerCancelPartialOrder(subOrder._id, cancelOrderReason);
      toast.success('Đã hủy đơn hàng và hoàn tiền 100% cho người thuê');
      setShowCancelOrderModal(false);
      setCancelOrderReason('');
      await fetchSubOrderDetail();
      // Redirect sau 2 giây
      setTimeout(() => {
        navigate('/owner/rental-requests');
      }, 2000);
    } catch (error) {
      console.error('Lỗi hủy đơn hàng:', error);
      toast.error(error.message || 'Không thể hủy đơn hàng');
    } finally {
      setLoadingCancelOrder(false);
    }
  };

  const handleRejectAll = async () => {
    if (!rejectAllReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn TỪ CHỐI TOÀN BỘ đơn hàng này? Người thuê sẽ được hoàn 100% tiền. Hành động này không thể hoàn tác.')) {
      return;
    }

    setLoadingRejectAll(true);
    try {
      await rentalOrderService.ownerRejectAllProducts(subOrder._id, rejectAllReason);
      toast.success('Đã từ chối đơn hàng và hoàn tiền 100% cho người thuê');
      setShowRejectAllModal(false);
      setRejectAllReason('');
      await fetchSubOrderDetail();
      // Redirect sau 2 giây
      setTimeout(() => {
        navigate('/owner/rental-requests');
      }, 2000);
    } catch (error) {
      console.error('Lỗi từ chối đơn hàng:', error);
      toast.error(error.message || 'Không thể từ chối đơn hàng');
    } finally {
      setLoadingRejectAll(false);
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
                        Chọn tất cả ({pendingItems.length})
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
                          src={item.product?.images?.[0]?.url || '/placeholder-product.png'}
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
                            <span className="font-semibold text-blue-600">{formatCurrency(item.rentalRate)}/ngày</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Cọc: </span>
                            <span className="font-semibold text-amber-600">{formatCurrency(item.depositRate)}</span>
                          </div>
                        </div>

                        {/* Rental Period */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Calendar size={16} />
                          <span>
                            {new Date(item.rentalPeriod?.startDate).toLocaleDateString('vi-VN')} - {new Date(item.rentalPeriod?.endDate).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="text-gray-400">
                            ({item.rentalPeriod?.duration?.value} {item.rentalPeriod?.duration?.unit === 'DAY' ? 'ngày' : item.rentalPeriod?.duration?.unit === 'WEEK' ? 'tuần' : 'tháng'})
                          </span>
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

              {/* Bulk Action Bar - Only show Confirm when items selected */}
              {selectedItems.size > 0 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-blue-900 mb-2">
                        📦 Đã chọn <span className="text-xl">{selectedItems.size}</span> sản phẩm
                      </div>
                      <div className="text-xs text-gray-600">
                        Nhấn "Xác nhận đã chọn" để xác nhận các sản phẩm này
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleBulkAction('confirm')}
                        className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        <CheckCircle size={18} />
                        <div className="text-left">
                          <div className="text-sm">Xác nhận đã chọn</div>
                          <div className="text-xs opacity-90">({selectedItems.size} sản phẩm)</div>
                        </div>
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

              {/* Confirm All & Reject All Buttons - Only show when NO items selected and status is PENDING_CONFIRMATION */}
              {hasPendingItems && subOrder.status === 'PENDING_CONFIRMATION' && selectedItems.size === 0 && (
                <div className="mt-4 space-y-3">
                  {/* Confirm All Button */}
                  <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={18} />
                          </div>
                          <div className="text-base font-bold text-green-900">
                            Xác nhận toàn bộ yêu cầu thuê
                          </div>
                        </div>
                        <div className="text-xs text-green-700 ml-10">
                          Xác nhận tất cả {pendingItems.length} sản phẩm và tiến hành ký hợp đồng
                        </div>
                      </div>
                      <button
                        onClick={handleConfirmAll}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                      >
                        <CheckCircle size={20} />
                        Xác nhận tất cả
                      </button>
                    </div>
                  </div>

                  {/* Reject All Button */}
                  <div className="p-5 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <XCircle className="text-red-600" size={18} />
                          </div>
                          <div className="text-base font-bold text-red-900">
                            Từ chối toàn bộ yêu cầu thuê
                          </div>
                        </div>
                        <div className="text-xs text-red-700 ml-10">
                          Không xác nhận bất kỳ sản phẩm nào và hoàn 100% tiền cho người thuê
                        </div>
                      </div>
                      <button
                        onClick={() => setShowRejectAllModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                      >
                        <XCircle size={20} />
                        Từ chối tất cả
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
                    {subOrder.contract.signatures?.owner?.signed ? (
                      <>
                        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                          <p className="text-sm text-green-700 font-semibold">
                            ✅ Bạn đã ký hợp đồng. 
                            {subOrder.contract.signatures?.renter?.signed 
                              ? ' Người thuê cũng đã ký. Hợp đồng đã có hiệu lực.'
                              : ' Đang chờ người thuê ký hợp đồng.'}
                          </p>
                        </div>
                        <button
                          onClick={handleSignContract}
                          className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
                        >
                          📄 Xem lại hợp đồng
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
                    
                    {/* Nút hủy toàn bộ đơn hàng - Chỉ hiển thị khi đơn hàng chưa được xác nhận */}
                    {subOrder.status === 'PENDING_CONFIRMATION' && (
                      <div className="pt-4 border-t">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                          <p className="text-xs text-red-700">
                            ⚠️ Nếu bạn không thể chuẩn bị đủ hàng, bạn có thể hủy toàn bộ đơn hàng. Người thuê sẽ được hoàn 100% tiền.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowCancelOrderModal(true)}
                          className="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <XCircle size={20} />
                          Hủy toàn bộ đơn hàng (hoàn 100%)
                        </button>
                      </div>
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
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="text-green-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Địa chỉ giao hàng</h2>
              </div>

              {subOrder.masterOrder?.deliveryAddress ? (
                <div className="space-y-2">
                  <p className="text-gray-900 font-medium">
                    {subOrder.masterOrder.deliveryAddress.streetAddress}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {[
                      subOrder.masterOrder.deliveryAddress.ward,
                      subOrder.masterOrder.deliveryAddress.district,
                      subOrder.masterOrder.deliveryAddress.city,
                      subOrder.masterOrder.deliveryAddress.province
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">Chưa có địa chỉ giao hàng</p>
              )}
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
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Tổng cộng</span>
                    <span className="font-bold text-blue-600 text-lg">
                      {formatCurrency(
                        (subOrder.pricing?.subtotalRental || 0) + 
                        (subOrder.pricing?.subtotalDeposit || 0) 
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
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {/* Product Image and Title */}
                  <div className="flex gap-3 mb-3">
                    <img
                      src={subOrder.products[selectedItemIndex].product?.images?.[0]?.url || '/placeholder-product.png'}
                      alt={subOrder.products[selectedItemIndex].product?.title}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">
                        {subOrder.products[selectedItemIndex].product?.title}
                      </div>
                      <div className="text-sm text-gray-600">
                        Số lượng: {subOrder.products[selectedItemIndex].quantity}
                      </div>
                    </div>
                  </div>
                  
                  {/* Pricing */}
                  <div className="flex items-center gap-4 text-sm mb-2">
                    <div>
                      <span className="text-gray-600">Giá thuê: </span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(subOrder.products[selectedItemIndex].rentalRate)}/ngày
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Cọc: </span>
                      <span className="font-semibold text-amber-600">
                        {formatCurrency(subOrder.products[selectedItemIndex].depositRate)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Rental Period */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} />
                    <span>
                      {new Date(subOrder.products[selectedItemIndex].rentalPeriod?.startDate).toLocaleDateString('vi-VN')} - {new Date(subOrder.products[selectedItemIndex].rentalPeriod?.endDate).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="text-gray-400">
                      ({subOrder.products[selectedItemIndex].rentalPeriod?.duration?.value} {subOrder.products[selectedItemIndex].rentalPeriod?.duration?.unit === 'DAY' ? 'ngày' : subOrder.products[selectedItemIndex].rentalPeriod?.duration?.unit === 'WEEK' ? 'tuần' : 'tháng'})
                    </span>
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

        {/* Cancel Entire Order Modal */}
        {showCancelOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full mx-4 shadow-2xl">
              <div className="bg-red-600 px-6 py-4 rounded-t-xl">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <XCircle size={24} />
                  Hủy toàn bộ đơn hàng
                </h3>
              </div>
              
              <div className="p-6">
                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 mb-4">
                  <p className="text-sm text-orange-800 font-semibold mb-2">
                    ⚠️ Cảnh báo: Hành động này không thể hoàn tác!
                  </p>
                  <p className="text-xs text-orange-700">
                    Người thuê sẽ được hoàn 100% tiền (bao gồm cọc, phí thuê và phí vận chuyển). Bạn chắc chắn muốn hủy?
                  </p>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do hủy đơn: <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelOrderReason}
                  onChange={(e) => setCancelOrderReason(e.target.value)}
                  placeholder="Vui lòng nhập lý do hủy đơn hàng..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={loadingCancelOrder}
                />
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCancelOrderModal(false);
                      setCancelOrderReason('');
                    }}
                    disabled={loadingCancelOrder}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={handleCancelEntireOrder}
                    disabled={loadingCancelOrder || !cancelOrderReason.trim()}
                    className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    {loadingCancelOrder ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

        {/* Reject All Modal */}
        {showRejectAllModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full mx-4 shadow-2xl">
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-xl">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <XCircle size={24} />
                  Từ chối toàn bộ yêu cầu thuê
                </h3>
              </div>
              
              <div className="p-6">
                <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-4 mb-5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-orange-800 font-semibold mb-1">
                        Cảnh báo: Hành động này không thể hoàn tác!
                      </p>
                      <p className="text-xs text-orange-700">
                        Tất cả <strong>{subOrder.products?.length || 0} sản phẩm</strong> sẽ bị từ chối. Người thuê sẽ được hoàn 100% tiền (bao gồm cọc, phí thuê và phí vận chuyển).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-5">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 text-xs">Số sản phẩm</p>
                      <p className="font-bold text-blue-900">{subOrder.products?.length || 0} sản phẩm</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Tổng giá trị</p>
                      <p className="font-bold text-blue-900">{formatCurrency(subOrder.pricing?.subtotalRental + subOrder.pricing?.subtotalDeposit )}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Lý do từ chối <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={rejectAllReason}
                    onChange={(e) => setRejectAllReason(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                    disabled={loadingRejectAll}
                  >
                    <option value="">-- Chọn lý do từ chối --</option>
                    <option value="Sản phẩm đang được thuê">Sản phẩm đang được thuê</option>
                    <option value="Sản phẩm đã hết hàng">Sản phẩm đã hết hàng</option>
                    <option value="Sản phẩm cần bảo trì/sửa chữa">Sản phẩm cần bảo trì/sửa chữa</option>
                    <option value="Thời gian thuê không phù hợp">Thời gian thuê không phù hợp</option>
                    <option value="Không thể giao hàng đến địa chỉ yêu cầu">Không thể giao hàng đến địa chỉ yêu cầu</option>
                    <option value="Giá thuê không chính xác">Giá thuê không chính xác</option>
                    <option value="Ngừng cho thuê sản phẩm này">Ngừng cho thuê sản phẩm này</option>
                    <option value="other">Lý do khác...</option>
                  </select>
                </div>

                {rejectAllReason === 'other' && (
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nhập lý do cụ thể <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectAllReason === 'other' ? '' : rejectAllReason}
                      onChange={(e) => setRejectAllReason(e.target.value)}
                      placeholder="Vui lòng nhập lý do từ chối đơn hàng..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      disabled={loadingRejectAll}
                    />
                  </div>
                )}
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowRejectAllModal(false);
                      setRejectAllReason('');
                    }}
                    disabled={loadingRejectAll}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-all font-semibold disabled:opacity-50 border border-gray-300"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={handleRejectAll}
                    disabled={loadingRejectAll || !rejectAllReason.trim() || rejectAllReason === 'other'}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 shadow-lg"
                  >
                    {loadingRejectAll ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Đang từ chối...
                      </>
                    ) : (
                      <>
                        <XCircle size={18} />
                        Xác nhận từ chối tất cả
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerRentalRequestDetail;
