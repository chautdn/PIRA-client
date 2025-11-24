import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { ownerProductApi } from '../../services/ownerProduct.Api';
import rentalOrderService from '../../services/rentalOrder';
import extensionService from '../../services/extension';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/constants';
import ContractSigningModal from '../../components/common/ContractSigningModal';
import ExtensionRequestsModal from '../../components/rental/ExtensionRequestsModal';

const OwnerRentalRequests = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, DRAFT, CONFIRMED, REJECTED
  const [showContractSigning, setShowContractSigning] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [selectedSubOrder, setSelectedSubOrder] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnModalAction, setReturnModalAction] = useState('APPROVE'); // APPROVE | REJECT
  const [returnModalNotes, setReturnModalNotes] = useState('');
  const [returnModalSubOrderId, setReturnModalSubOrderId] = useState(null);
  const [extensionRequests, setExtensionRequests] = useState([]);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [selectedSubOrderForExtension, setSelectedSubOrderForExtension] = useState(null);

  useEffect(() => {
    if (user) {
      fetchSubOrders();
    }
  }, [user, filter]);

  const fetchSubOrders = async () => {
    try {
      setLoading(true);
      // API để lấy các SubOrder của owner
      const response = await ownerProductApi.getRentalRequests({
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
      return subOrdersList; // Return để có thể sử dụng trong refreshSubOrderData
    } catch (error) {
      console.error('Lỗi tải danh sách yêu cầu thuê:', error);
      toast.error(t('owner.rentalRequests.loadError'));
      setSubOrders([]); // Đảm bảo luôn là array
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Hàm để refresh dữ liệu và cập nhật selectedSubOrder
  const refreshSubOrderData = async (subOrderId) => {
    try {
      const updatedSubOrders = await fetchSubOrders();
      
      // Cập nhật selectedSubOrder nếu đang mở
      if (selectedSubOrder && selectedSubOrder._id === subOrderId) {
        const updatedSubOrder = updatedSubOrders.find(s => s._id === subOrderId);
        if (updatedSubOrder) {
          setSelectedSubOrder(updatedSubOrder);
        }
      }
    } catch (error) {
      console.error('Lỗi refresh dữ liệu:', error);
    }
  };

  const handleConfirmProductItem = async (subOrderId, itemIndex) => {
    try {
      await ownerProductApi.confirmProductItem(subOrderId, itemIndex);
      toast.success('Đã xác nhận sản phẩm');
      
      // Refresh list và cập nhật selectedSubOrder
      await refreshSubOrderData(subOrderId);
      
      // Kiểm tra xem có cần tự động ký hợp đồng không
      await checkAndAutoSignContract(subOrderId);
    } catch (error) {
      console.error('Lỗi xác nhận sản phẩm:', error);
      toast.error(error.message || 'Không thể xác nhận sản phẩm');
    }
  };

  // Hide all products in a subOrder (owner action when subOrder is ACTIVE)
  const handleHideProducts = async (subOrder) => {
    try {
      const ok = window.confirm('Bạn có chắc muốn ẩn các sản phẩm trong đơn này? Khách khác sẽ không thể thuê được chúng trong khi đang cho thuê.');
      if (!ok) return;

      const products = subOrder.products || [];
      if (products.length === 0) {
        toast.error('Không tìm thấy sản phẩm để ẩn');
        return;
      }

      for (const item of products) {
        const productId = item.product?._id || item.product?.id || item.product;
        if (productId) {
          try {
            await ownerProductApi.hideProduct(productId);
          } catch (err) {
            console.error('Không thể ẩn sản phẩm', productId, err);
          }
        }
      }

      toast.success('Đã ẩn các sản phẩm trong đơn');
      // Refresh list and selected sub-order
      await fetchSubOrders();
      if (selectedSubOrder && selectedSubOrder._id === subOrder._id) {
        await refreshSubOrderData(subOrder._id);
      }
    } catch (error) {
      console.error('Lỗi khi ẩn sản phẩm:', error);
      toast.error('Có lỗi khi ẩn sản phẩm');
    }
  };

  const handleRejectProductItem = async (subOrderId, itemIndex, reason) => {
    try {
      await ownerProductApi.rejectProductItem(subOrderId, itemIndex, reason);
      toast.success('Đã từ chối sản phẩm');
      
      // Refresh list và cập nhật selectedSubOrder
      await refreshSubOrderData(subOrderId);
      
      // Kiểm tra xem có cần tự động ký hợp đồng không
      await checkAndAutoSignContract(subOrderId);
    } catch (error) {
      console.error('Lỗi từ chối sản phẩm:', error);
      toast.error(error.message || 'Không thể từ chối sản phẩm');
    }
  };

  // Xác nhận tất cả sản phẩm trong một subOrder
  const handleConfirmAllProducts = async (subOrderId) => {
    try {
      await ownerProductApi.confirmAllProductItems(subOrderId);
      toast.success('Đã xác nhận tất cả sản phẩm trong đơn');
      fetchSubOrders(); // Refresh list
    } catch (error) {
      console.error('Lỗi xác nhận tất cả sản phẩm:', error);
      toast.error(error.message || 'Không thể xác nhận tất cả sản phẩm');
    }
  };

  // Xác nhận subOrder và tự động ký hợp đồng nếu có
  const handleConfirmSubOrderAndSign = async (subOrder) => {
    try {
      // Bước 1: Xác nhận subOrder
      await ownerProductApi.confirmSubOrder(subOrder._id);
      toast.success('Đã xác nhận đơn thuê');
      
      // Bước 2: Kiểm tra xem có hợp đồng để ký không
      const masterOrderId = subOrder.masterOrder?._id || subOrder.masterOrder;
      if (masterOrderId) {
        // Tạo hợp đồng nếu chưa có
        const contractResponse = await rentalOrderService.generateContracts(masterOrderId);
        
        if (contractResponse?.contract) {
          // Tự động ký hợp đồng cho chủ
          const contractId = contractResponse.contract._id || contractResponse.contract;
          await rentalOrderService.signContractAsOwner(contractId, {
            ownerSignature: `Owner-${user._id}-${Date.now()}`,
            signedAt: new Date().toISOString()
          });
          
          toast.success('Đã xác nhận và ký hợp đồng thành công!');
        }
      }
      
      fetchSubOrders(); // Refresh list
    } catch (error) {
      console.error('Lỗi xác nhận và ký hợp đồng:', error);
      toast.error(error.message || 'Không thể hoàn tất xác nhận và ký hợp đồng');
    }
  };

  const handleGenerateContract = async (masterOrderId) => {
    try {
      const response = await rentalOrderService.generateContracts(masterOrderId);
      toast.success('Hợp đồng đã được tạo thành công');
      fetchSubOrders(); // Refresh list to show updated status
      console.log('Generated contracts:', response);
    } catch (error) {
      console.error('Lỗi tạo hợp đồng:', error);
      toast.error('Không thể tạo hợp đồng');
    }
  };

  // Owner: Approve or Reject early return request
  const handleApproveReturnRequest = async (subOrderId, notes = '') => {
    try {
      const resp = await rentalOrderService.approveEarlyReturn(subOrderId, { status: 'APPROVED', notes });
      toast.success('Đã chấp nhận yêu cầu trả hàng sớm');
      await refreshSubOrderData(subOrderId);
    } catch (error) {
      console.error('Lỗi khi chấp nhận yêu cầu trả hàng:', error);
      toast.error(error.message || 'Không thể chấp nhận yêu cầu trả hàng');
    }
  };

  const handleRejectReturnRequest = async (subOrderId, rejectionReason = '') => {
    try {
      const resp = await rentalOrderService.approveEarlyReturn(subOrderId, { status: 'REJECTED', notes: rejectionReason });
      toast.success('Đã từ chối yêu cầu trả hàng sớm');
      await refreshSubOrderData(subOrderId);
    } catch (error) {
      console.error('Lỗi khi từ chối yêu cầu trả hàng:', error);
      toast.error(error.message || 'Không thể từ chối yêu cầu trả hàng');
    }
  };

  // Owner confirms that the item has been returned (finalize and trigger refund)
  const handleOwnerConfirmReturned = async (subOrderId) => {
    try {
      const resp = await rentalOrderService.confirmEarlyReturn(subOrderId, { by: 'OWNER' });
      toast.success('Đã xác nhận trả hàng — Hoàn tiền sẽ được xử lý');
      await refreshSubOrderData(subOrderId);
    } catch (error) {
      console.error('Lỗi khi xác nhận trả hàng bởi chủ:', error);
      toast.error(error.message || 'Không thể xác nhận trả hàng');
    }
  };

  const openReturnModal = (subOrderId, action = 'APPROVE') => {
    setReturnModalSubOrderId(subOrderId);
    setReturnModalAction(action);
    setReturnModalNotes('');
    setShowReturnModal(true);
  };

  const closeReturnModal = () => {
    setShowReturnModal(false);
    setReturnModalSubOrderId(null);
    setReturnModalNotes('');
  };

  const handleOpenExtensionModal = async (subOrder) => {
    console.log('📋 Opening extension modal for subOrder:', subOrder._id);
    setSelectedSubOrderForExtension(subOrder);
    // Load data BEFORE opening modal
    await fetchExtensionRequests(subOrder._id);
    setShowExtensionModal(true);
  };

  const fetchExtensionRequests = async (subOrderId) => {
    try {
      console.log('🔄 Fetching extension requests for subOrder:', subOrderId);
      const res = await extensionService.getOwnerExtensionRequests({ page: 1, limit: 50 });
      console.log('📦 API Response:', res);
      
      // API now returns with requests at top level
      const all = res?.requests || [];
      
      console.log('📋 All requests:', all);
      
      // Filter requests for this subOrder
      const filtered = all.filter(r => {
        const subOrderId_ = r.subOrder?._id || r.subOrder;
        const match = subOrderId_ === subOrderId;
        console.log('🔍 Request', r._id, '- subOrderId_:', subOrderId_, '- match:', match);
        return match;
      });
      
      console.log('✅ Filtered requests:', filtered);
      setExtensionRequests(filtered);
      return filtered;
    } catch (err) {
      console.error('❌ Fetch owner extension requests error', err);
      toast.error('Không thể lấy yêu cầu gia hạn: ' + err.message);
      setExtensionRequests([]);
      return [];
    }
  };

  const submitReturnDecision = async () => {
    if (!returnModalSubOrderId) return;
    if (returnModalAction === 'REJECT' && !returnModalNotes.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      if (returnModalAction === 'APPROVE') {
        await handleApproveReturnRequest(returnModalSubOrderId, returnModalNotes.trim());
      } else {
        await handleRejectReturnRequest(returnModalSubOrderId, returnModalNotes.trim());
      }
      closeReturnModal();
    } catch (error) {
      console.error('Lỗi submit quyết định trả hàng:', error);
    }
  };

  // Kiểm tra và tự động ký hợp đồng nếu tất cả sản phẩm đã được xác nhận
  const checkAndAutoSignContract = async (subOrderId) => {
    try {
      // Đợi một chút để server cập nhật xong
      setTimeout(async () => {
        try {
          // Lấy dữ liệu mới từ server
          const response = await ownerProductApi.getOwnerSubOrders(filter === 'ALL' ? undefined : filter);
          const updatedSubOrders = response.data || response;
          
          // Tìm subOrder đã được cập nhật
          const currentSubOrder = updatedSubOrders.find(s => s._id === subOrderId);
          if (!currentSubOrder) return;
          
          // Kiểm tra xem tất cả sản phẩm đã được xác nhận hay từ chối hết chưa
          const pendingItems = currentSubOrder.products?.filter(item => item.confirmationStatus === 'PENDING') || [];
          
          if (pendingItems.length === 0) {
            // Tất cả sản phẩm đã được xử lý
            const confirmedItems = currentSubOrder.products?.filter(item => item.confirmationStatus === 'CONFIRMED') || [];
            
            if (confirmedItems.length > 0) {
              // Có ít nhất 1 sản phẩm được xác nhận -> tự động chuyển sang trạng thái OWNER_CONFIRMED
              toast.success('Tất cả sản phẩm đã được xử lý! Đơn hàng chuyển sang trạng thái chờ ký hợp đồng.');
            } else {
              // Tất cả sản phẩm đều bị từ chối
              toast.info('Tất cả sản phẩm đã bị từ chối. Đơn hàng sẽ được hủy và hoàn tiền tự động.');
            }
          }
        } catch (error) {
          console.error('Lỗi kiểm tra tự động:', error);
        }
      }, 500); // Đợi 500ms để server cập nhật
    } catch (error) {
      console.error('Lỗi kiểm tra tự động ký hợp đồng:', error);
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Quản lý yêu cầu thuê</h1>
            <p className="text-gray-600">Theo dõi và xác nhận các yêu cầu thuê sản phẩm từ khách hàng</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => fetchSubOrders()}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              🔄 Reload
            </button>
          </div>
        </div>

        {/* Filter Card */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <div className="px-6 py-4">
              <h2 className="text-xl font-semibold text-blue-600">
                Yêu cầu thuê sản phẩm ({(subOrders || []).length})
              </h2>
            </div>
          </div>
          
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</span>
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
                    {status === 'ALL' ? 'Tất cả' : 
                     status === 'PENDING_OWNER_CONFIRMATION' ? 'Chờ xác nhận' :
                     status === 'OWNER_CONFIRMED' ? 'Đã xác nhận' : 'Đã từ chối'}
                  </button>
                ))}
              </div>
              <div className="text-sm text-gray-600 ml-auto">
                {(subOrders || []).length} yêu cầu
              </div>
            </div>
          </div>
        </div>

        {!Array.isArray(subOrders) || subOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Không có yêu cầu thuê nào
            </h3>
            <p className="text-gray-500">
              {filter === 'ALL' 
                ? 'Chưa có ai yêu cầu thuê sản phẩm của bạn'
                : `Không có yêu cầu thuê nào ở trạng thái "${filter}"`
              }
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn chính</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người thuê</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subOrders.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.subOrderNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{s.masterOrder?.masterOrderNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{s.masterOrder?.renter?.profile?.firstName || ''} {s.masterOrder?.renter?.profile?.lastName || ''} </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{(s.products || []).length}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {s.rentalPeriod?.startDate && s.rentalPeriod?.endDate ? (
                        <span>{new Date(s.rentalPeriod.startDate).toLocaleDateString('vi-VN')} → {new Date(s.rentalPeriod.endDate).toLocaleDateString('vi-VN')}</span>
                      ) : (
                        <span className="text-sm text-blue-600">Nhiều thời gian</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">{formatCurrency(((s.pricing?.subtotalRental || 0) + (s.pricing?.subtotalDeposit || 0) + (s.pricing?.shippingFee || 0)))}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(s.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                          <button onClick={() => setSelectedSubOrder(s)} className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Chi tiết</button>
                          {s.status === 'ACTIVE' && (
                            <>
                              <button 
                                onClick={() => handleOpenExtensionModal(s)} 
                                className="text-sm bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600"
                                title="Xem yêu cầu gia hạn"
                              >
                                📋 Xem yêu cầu gia hạn
                              </button>
                              <button
                                onClick={() => handleHideProducts(s)}
                                className="text-sm bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800"
                                title="Ẩn sản phẩm để tránh người khác thuê"
                              >
                                🙈 Ẩn sản phẩm
                              </button>
                            </>
                          )}
                        {s.status === 'OWNER_CONFIRMED' && (
                          <button onClick={() => { setSelectedContractId(s.contract?._id || s.contract || `contract-${s.masterOrder?._id || ''}`); setShowContractSigning(true); }} className="text-sm bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600">Ký HĐ</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Selected sub-order detail */}
            {selectedSubOrder && (
              <div className="mt-6">
                <SubOrderCard 
                  subOrder={selectedSubOrder}
                  onConfirmItem={handleConfirmProductItem}
                  onRejectItem={handleRejectProductItem}
                  onGenerateContract={handleGenerateContract}
                  getStatusBadge={getStatusBadge}
                  setSelectedContractId={setSelectedContractId}
                  setShowContractSigning={setShowContractSigning}
                  refreshSubOrderData={refreshSubOrderData}
                />
                <div className="flex justify-end mt-3">
                  <button onClick={() => setSelectedSubOrder(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Đóng</button>
                </div>
              </div>
            )}
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
        {/* Extension Requests Modal (page-level) */}
        <ExtensionRequestsModal
          isOpen={showExtensionModal}
          onClose={() => setShowExtensionModal(false)}
          subOrder={selectedSubOrderForExtension}
          onSuccess={async (result) => {
            // Refresh extension data and the sub-order list when modal reports success
            if (selectedSubOrderForExtension) {
              await fetchExtensionRequests(selectedSubOrderForExtension._id);
              await refreshSubOrderData(selectedSubOrderForExtension._id);
            }
          }}
        />
        {/* Return Decision Modal (page-level) */}
        {showReturnModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">{returnModalAction === 'APPROVE' ? 'Chấp nhận yêu cầu trả hàng' : 'Từ chối yêu cầu trả hàng'}</h3>
              <p className="text-sm text-gray-600 mb-3">Vui lòng nhập ghi chú (tùy chọn) cho quyết định này:</p>
              <textarea
                value={returnModalNotes}
                onChange={(e) => setReturnModalNotes(e.target.value)}
                placeholder={returnModalAction === 'APPROVE' ? 'Ghi chú khi chấp nhận (ví dụ: hẹn ngày lấy)...' : 'Nhập lý do từ chối (bắt buộc)'}
                className="w-full p-3 border rounded-lg resize-none h-28 focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={closeReturnModal}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={submitReturnDecision}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {returnModalAction === 'APPROVE' ? 'Chấp nhận' : 'Từ chối'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SubOrderCard = ({ 
  subOrder, 
  onConfirmItem, 
  onRejectItem, 
  onGenerateContract, 
  getStatusBadge,
  setSelectedContractId,
  setShowContractSigning,
  refreshSubOrderData
}) => {
  const { t } = useTranslation();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');

  const handleReject = () => {
    if (rejectReason.trim() && selectedItemIndex !== null) {
      onRejectItem(subOrder._id, selectedItemIndex, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedItemIndex(null);
    }
  };

  // Handle checkbox toggle
  const handleItemSelect = (itemIndex, isChecked) => {
    const newSelected = new Set(selectedItems);
    if (isChecked) {
      newSelected.add(itemIndex);
    } else {
      newSelected.delete(itemIndex);
    }
    setSelectedItems(newSelected);
  };

  // Handle select all checkbox
  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      const pendingItems = new Set();
      (subOrder.products || []).forEach((item, index) => {
        if (item.confirmationStatus === 'PENDING') {
          pendingItems.add(index);
        }
      });
      setSelectedItems(pendingItems);
    } else {
      setSelectedItems(new Set());
    }
  };

  // Handle bulk confirm
  const handleBulkConfirm = async () => {
    try {
      const itemCount = selectedItems.size;
      
      // Disable các hàm refresh tạm thời để tránh multiple calls
      for (const itemIndex of selectedItems) {
        // Gọi API trực tiếp
        await ownerProductApi.confirmProductItem(subOrder._id, itemIndex);
      }
      
      setSelectedItems(new Set());
      toast.success(`Đã xác nhận ${itemCount} sản phẩm`);
      
      // Refresh data một lần sau khi hoàn thành tất cả
      if (refreshSubOrderData) {
        await refreshSubOrderData(subOrder._id);
      }
    } catch (error) {
      console.error('Lỗi bulk confirm:', error);
      toast.error('Có lỗi khi xác nhận sản phẩm');
    }
  };

  // Handle bulk reject
  const handleBulkReject = async () => {
    if (bulkRejectReason.trim()) {
      try {
        const itemCount = selectedItems.size;
        
        // Disable các hàm refresh tạm thời để tránh multiple calls
        for (const itemIndex of selectedItems) {
          // Gọi API trực tiếp
          await ownerProductApi.rejectProductItem(subOrder._id, itemIndex, bulkRejectReason);
        }
        
        setSelectedItems(new Set());
        setShowBulkRejectModal(false);
        setBulkRejectReason('');
        toast.success(`Đã từ chối ${itemCount} sản phẩm`);
        
        // Refresh data một lần sau khi hoàn thành tất cả
        if (refreshSubOrderData) {
          await refreshSubOrderData(subOrder._id);
        }
      } catch (error) {
        console.error('Lỗi bulk reject:', error);
        toast.error('Có lỗi khi từ chối sản phẩm');
      }
    }
  };

  // Get pending items count
  const pendingItems = (subOrder.products || []).filter(item => item.confirmationStatus === 'PENDING');
  const allPendingSelected = pendingItems.length > 0 && pendingItems.every((_, index) => {
    const actualIndex = (subOrder.products || []).findIndex(p => p.confirmationStatus === 'PENDING' && p === pendingItems[index]);
    return selectedItems.has(actualIndex);
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(t('language') === 'en' ? 'en-US' : 'vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Yêu cầu thuê #{subOrder.subOrderNumber}</h3>
            <p className="text-sm text-gray-600">
              Đơn chính: {subOrder.masterOrder?.masterOrderNumber}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(subOrder.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 text-blue-600">👤</div>
            <div>
              <p className="text-sm text-gray-600">Người thuê</p>
              <p className="font-medium">{subOrder.masterOrder?.renter?.profile?.firstName} {subOrder.masterOrder?.renter?.profile?.lastName}</p>
              <p className="text-xs text-gray-500">{subOrder.masterOrder?.renter?.phone}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 text-green-600">📅</div>
            <div>
              <p className="text-sm text-gray-600">Thời gian thuê</p>
              {subOrder.rentalPeriod?.startDate && subOrder.rentalPeriod?.endDate ? (
                <>
                  <p className="font-medium">
                    {Math.ceil((new Date(subOrder.rentalPeriod.endDate) - new Date(subOrder.rentalPeriod.startDate)) / (1000 * 60 * 60 * 24))} ngày
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(subOrder.rentalPeriod.startDate)} - {formatDate(subOrder.rentalPeriod.endDate)}
                  </p>
                </>
              ) : (
                <p className="font-medium text-blue-600">Nhiều thời gian khác nhau</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 text-orange-600">📦</div>
            <div>
              <p className="text-sm text-gray-600">Số sản phẩm</p>
              <p className="font-medium">{(subOrder.products || []).length} sản phẩm</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 text-purple-600">💰</div>
            <div>
              <p className="text-sm text-gray-600">Tổng tiền</p>
              <p className="font-medium text-green-600">
                {formatCurrency(
                  (subOrder.pricing?.subtotalRental || 0) + 
                  (subOrder.pricing?.subtotalDeposit || 0) + 
                  (subOrder.pricing?.shippingFee || 0)
                )}
              </p>
            </div>
          </div>
        </div>

      {/* Thời gian thuê */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Thời gian thuê</h4>
        {subOrder.rentalPeriod?.startDate && subOrder.rentalPeriod?.endDate ? (
          <div className="flex items-center space-x-4 text-sm">
            <div>
              <span className="text-gray-600">Từ:</span>{' '}
              <span className="font-medium">{formatDate(subOrder.rentalPeriod.startDate)}</span>
            </div>
            <div>
              <span className="text-gray-600">Đến:</span>{' '}
              <span className="font-medium">{formatDate(subOrder.rentalPeriod.endDate)}</span>
            </div>
            <div>
              <span className="text-gray-600">Số ngày:</span>{' '}
              <span className="font-medium">
                {Math.ceil((new Date(subOrder.rentalPeriod.endDate) - new Date(subOrder.rentalPeriod.startDate)) / (1000 * 60 * 60 * 24))} ngày
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-blue-600 font-medium">Mỗi sản phẩm có thời gian thuê riêng (xem chi tiết bên dưới)</p>
        )}
      </div>

      {/* Danh sách sản phẩm */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">Sản phẩm thuê</h4>
          {pendingItems.length > 0 && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`selectAll-${subOrder._id}`}
                checked={allPendingSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`selectAll-${subOrder._id}`} className="text-sm text-gray-700">
                Chọn tất cả sản phẩm chờ xác nhận ({pendingItems.length})
              </label>
            </div>
          )}
        </div>
        <div className="space-y-3">
          {(subOrder.products || []).map((item, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded border">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3">
                  {/* Checkbox chỉ hiển thị cho sản phẩm PENDING */}
                  {item.confirmationStatus === 'PENDING' && (
                    <input
                      type="checkbox"
                      id={`product-${subOrder._id}-${index}`}
                      checked={selectedItems.has(index)}
                      onChange={(e) => handleItemSelect(index, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  )}
                  <img 
                    src={item.product?.images?.[0]?.url || '/placeholder.jpg'} 
                    alt={item.product?.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium">{item.product?.title}</p>
                    <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                    <p className="text-sm text-gray-600">
                      Giá: {formatCurrency(item.rentalRate)}/ngày
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-blue-600">
                    {formatCurrency(item.totalRental)}
                  </p>
                  <p className="text-xs text-gray-500">Tiền thuê</p>
                  {item.totalDeposit > 0 && (
                    <p className="text-sm text-orange-600">
                      +{formatCurrency(item.totalDeposit)} cọc
                    </p>
                  )}
                </div>
              </div>
              
              {/* Hiển thị rental period riêng */}
              {item.rentalPeriod && (
                <div className="mt-2 p-2 bg-blue-100 rounded text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-blue-700 font-medium">🗓️ Thời gian thuê:</span>
                      <div className="text-blue-600 mt-1">
                        {formatDate(item.rentalPeriod.startDate)} → {formatDate(item.rentalPeriod.endDate)}
                      </div>
                    </div>
                    <span className="text-blue-700 font-medium">
                      {item.rentalPeriod.duration?.value || Math.ceil((new Date(item.rentalPeriod.endDate) - new Date(item.rentalPeriod.startDate)) / (1000 * 60 * 60 * 24))} ngày
                    </span>
                  </div>
                </div>
              )}

              {/* Confirmation Status & Actions */}
              <div className="mt-3 flex items-center justify-between">
                <div>
                  {item.confirmationStatus === 'PENDING' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      ⏳ Chờ xác nhận
                    </span>
                  )}
                  {item.confirmationStatus === 'CONFIRMED' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✅ Đã xác nhận
                    </span>
                  )}
                  {item.confirmationStatus === 'REJECTED' && (
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ❌ Đã từ chối
                      </span>
                      {item.rejectionReason && (
                        <div className="text-xs text-red-600 mt-1">
                          Lý do: {item.rejectionReason}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons cho từng item */}
                {item.confirmationStatus === 'PENDING' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onConfirmItem(subOrder._id, index)}
                      className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                    >
                      ✓ Xác nhận
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItemIndex(index);
                        setShowRejectModal(true);
                      }}
                      className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      ✗ Từ chối
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Bar - chỉ hiện khi có sản phẩm được chọn */}
        {selectedItems.size > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-700">
                Đã chọn <span className="font-semibold">{selectedItems.size}</span> sản phẩm
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkConfirm}
                  className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                >
                  ✓ Xác nhận tất cả đã chọn
                </button>
                <button
                  onClick={() => setShowBulkRejectModal(true)}
                  className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                >
                  ✗ Từ chối tất cả đã chọn
                </button>
                <button
                  onClick={() => setSelectedItems(new Set())}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          </div>
        )}
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

      {/* Overall SubOrder Status */}
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <div className="text-sm font-medium text-gray-700">
          Trạng thái đơn hàng: {getStatusBadge(subOrder.status)}
        </div>
        {/* Show summary if there are mixed confirmation statuses */}
        {subOrder.products && subOrder.products.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            <div className="flex space-x-4">
              <span>Đã xác nhận: {subOrder.products.filter(p => p.confirmationStatus === 'CONFIRMED').length}</span>
              <span>Chờ xử lý: {subOrder.products.filter(p => p.confirmationStatus === 'PENDING').length}</span>
              <span>Đã từ chối: {subOrder.products.filter(p => p.confirmationStatus === 'REJECTED').length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Return Request Details (if any) */}
      {subOrder.returnRequest && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-medium text-gray-900 mb-2">Yêu cầu trả hàng sớm</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <div><strong>Trạng thái:</strong> {subOrder.returnRequest.status}</div>
            <div><strong>Yêu cầu lúc:</strong> {subOrder.returnRequest.requestedAt ? new Date(subOrder.returnRequest.requestedAt).toLocaleString('vi-VN') : '—'}</div>
            <div><strong>Lý do:</strong> {subOrder.returnRequest.reason || '—'}</div>
            <div><strong>Phương thức:</strong> {subOrder.returnRequest.returnMethod || '—'}</div>
            {subOrder.returnRequest.ownerApproval && (
              <div><strong>Quyết định Chủ:</strong> {subOrder.returnRequest.ownerApproval.notes || subOrder.returnRequest.ownerApproval.approvedBy || '—'}</div>
            )}
            {subOrder.returnRequest.refundCalculation && (
              <div><strong>Ước tính hoàn:</strong> {formatCurrency(subOrder.returnRequest.refundCalculation.refundAmount || 0)}</div>
            )}
          </div>
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
      {/* Extension Requests Modal - rendered at page level */}
      {/* Moved out of SubOrderCard so it mounts even when sub-order details are not open */}

      {/* Return Decision Modal moved to page-level (OwnerRentalRequests) to avoid referencing parent-only state here */}

      {/* Reject Modal */}
      {showRejectModal && selectedItemIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Từ chối sản phẩm</h3>
            {subOrder.products[selectedItemIndex] && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="font-medium">{subOrder.products[selectedItemIndex].product?.name}</div>
                <div className="text-sm text-gray-600">
                  Số lượng: {subOrder.products[selectedItemIndex].quantity}
                </div>
              </div>
            )}
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

      {/* Bulk Reject Modal */}
      {showBulkRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Từ chối các sản phẩm đã chọn</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Bạn đang từ chối <span className="font-semibold">{selectedItems.size}</span> sản phẩm:
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {Array.from(selectedItems).map(itemIndex => {
                  const item = subOrder.products[itemIndex];
                  return (
                    <div key={itemIndex} className="text-sm p-2 bg-gray-50 rounded">
                      {item?.product?.title} (x{item?.quantity})
                    </div>
                  );
                })}
              </div>
            </div>
            <textarea
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối chung cho tất cả sản phẩm đã chọn..."
              className="w-full p-3 border rounded-lg resize-none h-24 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowBulkRejectModal(false);
                  setBulkRejectReason('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleBulkReject}
                disabled={!bulkRejectReason.trim()}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Từ chối {selectedItems.size} sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default OwnerRentalRequests;