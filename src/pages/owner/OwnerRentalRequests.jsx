import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ownerProductApi } from '../../services/ownerProduct.Api';
import rentalOrderService from '../../services/rentalOrder';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/constants';
import ContractSigningModal from '../../components/common/ContractSigningModal';

const OwnerRentalRequests = () => {
  const { user } = useAuth();
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, DRAFT, CONFIRMED, REJECTED
  const [showContractSigning, setShowContractSigning] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [selectedSubOrder, setSelectedSubOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSigningInModal, setShowSigningInModal] = useState(false);

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
      toast.error('Không thể tải danh sách yêu cầu thuê');
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
      toast.success('Hợp đồng đã được ký thành công');
      fetchSubOrders(); // Refresh list
    } catch (error) {
      console.error('Lỗi ký hợp đồng:', error);
      toast.error('Không thể ký hợp đồng');
      throw error; // Re-throw để ContractSigningModal xử lý loading state
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-800', // Old status - rare
      PENDING_CONFIRMATION: 'bg-yellow-100 text-yellow-800', // New main status
      OWNER_CONFIRMED: 'bg-green-100 text-green-800',
      OWNER_REJECTED: 'bg-red-100 text-red-800',
      READY_FOR_CONTRACT: 'bg-blue-100 text-blue-800',
      PENDING_CONTRACT: 'bg-blue-100 text-blue-800',
      CONTRACT_SIGNED: 'bg-purple-100 text-purple-800'
    };

    const labels = {
      DRAFT: 'Bản nháp (cũ)',
      PENDING_CONFIRMATION: 'Chờ xác nhận',
      OWNER_CONFIRMED: 'Đã xác nhận',
      OWNER_REJECTED: 'Đã từ chối',
      READY_FOR_CONTRACT: 'Sẵn sàng hợp đồng',
      PENDING_CONTRACT: 'Chờ ký hợp đồng',
      CONTRACT_SIGNED: 'Người thuê đã ký hợp đồng'
    };
    
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
                {['ALL', 'PENDING_CONFIRMATION', 'OWNER_CONFIRMED', 'OWNER_REJECTED'].map((status) => (
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
                     status === 'PENDING_CONFIRMATION' ? 'Chờ xác nhận' :
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
                        <button 
                          onClick={() => {
                            setSelectedSubOrder(s);
                            setShowDetailModal(true);
                          }} 
                          className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                        >
                          📋 Chi tiết
                        </button>
                        {s.status === 'OWNER_CONFIRMED' && (
                          <button 
                            onClick={() => {
                              setSelectedContractId(s.contract?._id || s.contract || `contract-${s.masterOrder?._id || ''}`);
                              setShowContractSigning(true);
                            }} 
                            className="text-sm bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 transition-colors"
                          >
                            ✍️ Ký HĐ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Detail Modal */}
            {showDetailModal && selectedSubOrder && (
              <SubOrderDetailModal
                subOrder={selectedSubOrder}
                onClose={() => {
                  setShowDetailModal(false);
                  setShowSigningInModal(false);
                  setSelectedSubOrder(null);
                }}
                onConfirmItem={handleConfirmProductItem}
                onRejectItem={handleRejectProductItem}
                onGenerateContract={handleGenerateContract}
                getStatusBadge={getStatusBadge}
                refreshSubOrderData={refreshSubOrderData}
                showSigningInModal={showSigningInModal}
                setShowSigningInModal={setShowSigningInModal}
                handleSignContract={handleSignContract}
              />
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
      </div>
    </div>
  );
};

// Inline Contract Signing Component
const ContractSigningInline = ({ subOrder, contractData, loadingContract, onBack, onSignSuccess, loadContractForSigning }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (!contractData && subOrder.contract) {
      const contractId = subOrder.contract?._id || subOrder.contract;
      loadContractForSigning(contractId);
    }
  }, [contractData, subOrder, loadContractForSigning]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    setSignatureData(canvas.toDataURL());
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  const handleSign = async () => {
    if (!signatureData) {
      toast.error('Vui lòng ký trước khi xác nhận');
      return;
    }

    try {
      setSigning(true);
      const contractId = contractData._id;
      
      await rentalOrderService.signContract(contractId, {
        signature: signatureData,
        agreementConfirmed: true,
        signatureMethod: 'canvas'
      });
      
      toast.success('✅ Ký hợp đồng thành công!');
      onSignSuccess();
    } catch (error) {
      toast.error(error.message || 'Không thể ký hợp đồng');
    } finally {
      setSigning(false);
    }
  };

  if (loadingContract) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Đang tải hợp đồng...</span>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Không tìm thấy hợp đồng</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:text-blue-800">
          ← Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[500px]">
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 flex items-center space-x-2 font-medium"
        >
          <span>←</span>
          <span>Quay lại</span>
        </button>
      </div>

      {/* Contract Info */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
        <h3 className="text-xl font-bold text-gray-900 mb-2">📄 Hợp đồng thuê sản phẩm</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Mã hợp đồng:</span>
            <span className="font-semibold ml-2">{contractData.contractNumber}</span>
          </div>
          <div>
            <span className="text-gray-600">Trạng thái:</span>
            <span className="font-semibold ml-2 text-yellow-600">{contractData.status === 'PENDING_OWNER' ? 'Chờ chủ ký' : contractData.status}</span>
          </div>
          <div>
            <span className="text-gray-600">Người thuê:</span>
            <span className="font-semibold ml-2">{contractData.renter?.profile?.firstName} {contractData.renter?.profile?.lastName}</span>
          </div>
          <div>
            <span className="text-gray-600">Tổng tiền:</span>
            <span className="font-bold ml-2 text-green-600">{formatCurrency(contractData.terms?.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Contract Content Preview */}
      <div className="bg-white rounded-lg border border-gray-300 p-6 mb-6 max-h-96 overflow-y-auto">
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: contractData.content?.htmlContent || '<p>Đang tải nội dung hợp đồng...</p>' }}
        />
      </div>

      {/* Signature Section */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4">✍️ Chữ ký của chủ cho thuê</h4>
        
        {/* Existing Signatures Display */}
        {(contractData.signatures?.owner?.signed || contractData.signatures?.renter?.signed) && (
          <div className="mb-6 bg-white rounded-lg p-4 border border-gray-200">
            <h5 className="font-semibold mb-3 text-gray-700">Chữ ký đã có:</h5>
            <div className="grid grid-cols-2 gap-4">
              {/* Owner Signature */}
              <div className="border rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-2">👤 Chủ cho thuê</p>
                {contractData.signatures.owner?.signed ? (
                  <>
                    <img 
                      src={contractData.signatures.owner.signature} 
                      alt="Chữ ký chủ" 
                      className="w-full h-24 object-contain bg-gray-50 rounded border"
                    />
                    <p className="text-xs text-green-600 mt-2">
                      ✓ Đã ký lúc {new Date(contractData.signatures.owner.signedAt).toLocaleString('vi-VN')}
                    </p>
                  </>
                ) : (
                  <div className="h-24 bg-gray-100 rounded border border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Chưa ký</span>
                  </div>
                )}
              </div>

              {/* Renter Signature */}
              <div className="border rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-2">👤 Người thuê</p>
                {contractData.signatures.renter?.signed ? (
                  <>
                    <img 
                      src={contractData.signatures.renter.signature} 
                      alt="Chữ ký người thuê" 
                      className="w-full h-24 object-contain bg-gray-50 rounded border"
                    />
                    <p className="text-xs text-green-600 mt-2">
                      ✓ Đã ký lúc {new Date(contractData.signatures.renter.signedAt).toLocaleString('vi-VN')}
                    </p>
                  </>
                ) : (
                  <div className="h-24 bg-gray-100 rounded border border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Chờ chủ ký trước</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Signature Canvas */}
        {!contractData.signatures?.owner?.signed && (
          <>
            <p className="text-sm text-gray-600 mb-3">Vui lòng ký tên vào khung bên dưới:</p>
            <div className="bg-white rounded-lg p-4 border-2 border-dashed border-purple-300">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="border border-gray-300 rounded cursor-crosshair w-full"
                style={{ touchAction: 'none' }}
              />
            </div>

            <div className="flex space-x-3 mt-4">
              <button
                onClick={clearSignature}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                🗑️ Xóa chữ ký
              </button>
              <button
                onClick={handleSign}
                disabled={!signatureData || signing}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
              >
                {signing ? '⏳ Đang ký...' : '✍️ Xác nhận ký hợp đồng'}
              </button>
            </div>
          </>
        )}

        {contractData.signatures?.owner?.signed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-700 font-semibold text-lg mb-2">✅ Bạn đã ký hợp đồng này</p>
            <p className="text-sm text-gray-600">Đang chờ người thuê ký hợp đồng</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SubOrderDetailModal = ({ 
  subOrder, 
  onClose,
  onConfirmItem, 
  onRejectItem, 
  getStatusBadge,
  refreshSubOrderData,
  showSigningInModal,
  setShowSigningInModal,
  handleSignContract
}) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [contractData, setContractData] = useState(null);
  const [loadingContract, setLoadingContract] = useState(false);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleReject = () => {
    if (rejectReason.trim() && selectedItemIndex !== null) {
      onRejectItem(subOrder._id, selectedItemIndex, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedItemIndex(null);
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
        if (item.confirmationStatus === 'PENDING') {
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
      const itemCount = selectedItems.size;
      const confirmedProductIds = Array.from(selectedItems).map(itemIndex => {
        const product = subOrder.products[itemIndex];
        return product._id;
      });
      
      const response = await rentalOrderService.partialConfirmSubOrder(subOrder._id, confirmedProductIds);
      setSelectedItems(new Set());
      
      // Extract contract ID from various possible response structures
      let newContractId = response.metadata?.contract?._id || 
                          response.data?.metadata?.contract?._id ||
                          response.data?.contract?._id ||
                          response.contract?._id ||
                          response.data?.metadata?.contract ||
                          response.metadata?.contract;
      
      toast.success(
        `✅ Đã xác nhận ${itemCount} sản phẩm thành công!\n` +
        `📄 Hợp đồng đã được tạo. Đang chuyển sang phần ký...`,
        { duration: 5000 }
      );
      
      // Refresh SubOrder data first to get updated contract
      if (refreshSubOrderData) {
        await refreshSubOrderData(subOrder._id);
      }

      // If no contractId from response, try to get from refreshed subOrder
      if (!newContractId) {
        // Wait a bit for state to update
        await new Promise(resolve => setTimeout(resolve, 500));
        newContractId = subOrder.contract?._id || subOrder.contract;
      }

      // Auto-load contract for signing
      if (newContractId) {
        setTimeout(() => {
          setShowSigningInModal(true);
          loadContractForSigning(newContractId);
        }, 1500);
      } else {
        toast.error('Không tìm thấy hợp đồng. Vui lòng reload trang và thử lại.');
      }
    } catch (error) {
      console.error('Lỗi bulk confirm:', error);
      toast.error(error.response?.data?.message || 'Có lỗi khi xác nhận sản phẩm');
    }
  };

  const loadContractForSigning = async (contractId) => {
    try {
      setLoadingContract(true);
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
      toast.error(error.message || 'Không thể tải hợp đồng');
      setShowSigningInModal(false); // Return to product list on error
    } finally {
      setLoadingContract(false);
    }
  };

  const handleSignContractInModal = async (signatureData) => {
    try {
      const contractId = subOrder.contract?._id || subOrder.contract;
      await handleSignContract(contractId, signatureData);
      setShowSigningInModal(false);
      onClose();
      toast.success('✅ Ký hợp đồng thành công! Đã gửi đến người thuê.');
    } catch (error) {
      console.error('Lỗi ký hợp đồng:', error);
      toast.error('Không thể ký hợp đồng');
    }
  };

  const pendingItems = (subOrder.products || []).filter(item => item.confirmationStatus === 'PENDING');
  const allPendingSelected = pendingItems.length > 0 && pendingItems.every((_, index) => {
    const actualIndex = (subOrder.products || []).findIndex(p => p.confirmationStatus === 'PENDING' && p === pendingItems[index]);
    return selectedItems.has(actualIndex);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">📋 Yêu cầu thuê #{subOrder.subOrderNumber}</h2>
              <p className="text-blue-100 mt-1">Đơn chính: {subOrder.masterOrder?.masterOrderNumber}</p>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(subOrder.status)}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showSigningInModal ? (
            <>
              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">👤</span>
                    <p className="text-sm text-gray-600 font-medium">Người thuê</p>
                  </div>
                  <p className="font-semibold">{subOrder.masterOrder?.renter?.profile?.firstName} {subOrder.masterOrder?.renter?.profile?.lastName}</p>
                  <p className="text-xs text-gray-500">{subOrder.masterOrder?.renter?.phone}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">📅</span>
                    <p className="text-sm text-gray-600 font-medium">Thời gian thuê</p>
                  </div>
                  {subOrder.rentalPeriod?.startDate && subOrder.rentalPeriod?.endDate ? (
                    <>
                      <p className="font-semibold">
                        {Math.ceil((new Date(subOrder.rentalPeriod.endDate) - new Date(subOrder.rentalPeriod.startDate)) / (1000 * 60 * 60 * 24))} ngày
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(subOrder.rentalPeriod.startDate)} - {formatDate(subOrder.rentalPeriod.endDate)}
                      </p>
                    </>
                  ) : (
                    <p className="font-semibold text-blue-600 text-sm">Nhiều thời gian khác nhau</p>
                  )}
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">📦</span>
                    <p className="text-sm text-gray-600 font-medium">Số sản phẩm</p>
                  </div>
                  <p className="font-semibold text-lg">{(subOrder.products || []).length} sản phẩm</p>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="text-green-600">✓ {subOrder.products?.filter(p => p.confirmationStatus === 'CONFIRMED').length}</span> |
                    <span className="text-yellow-600"> ⏳ {subOrder.products?.filter(p => p.confirmationStatus === 'PENDING').length}</span> |
                    <span className="text-red-600"> ✗ {subOrder.products?.filter(p => p.confirmationStatus === 'REJECTED').length}</span>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">💰</span>
                    <p className="text-sm text-gray-600 font-medium">Tổng tiền</p>
                  </div>
                  <p className="font-bold text-green-600 text-lg">
                    {formatCurrency(
                      (subOrder.pricing?.subtotalRental || 0) + 
                      (subOrder.pricing?.subtotalDeposit || 0) + 
                      (subOrder.pricing?.shippingFee || 0)
                    )}
                  </p>
                </div>
              </div>

              {/* Products List */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">📦 Danh sách sản phẩm</h3>
                  {pendingItems.length > 0 && (
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allPendingSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 font-medium">
                        Chọn tất cả ({pendingItems.length} chờ xác nhận)
                      </span>
                    </label>
                  )}
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {(subOrder.products || []).map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3 flex-1">
                          {item.confirmationStatus === 'PENDING' && (
                            <input
                              type="checkbox"
                              checked={selectedItems.has(index)}
                              onChange={(e) => handleItemSelect(index, e.target.checked)}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          )}
                          <img 
                            src={item.product?.images?.[0]?.url || '/placeholder.jpg'} 
                            alt={item.product?.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{item.product?.title}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span>SL: {item.quantity}</span>
                              <span>Giá: {formatCurrency(item.rentalRate)}/ngày</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600 text-lg">
                            {formatCurrency(item.totalRental)}
                          </p>
                          <p className="text-xs text-gray-500">Tiền thuê</p>
                          {item.totalDeposit > 0 && (
                            <p className="text-sm text-orange-600 mt-1">
                              +{formatCurrency(item.totalDeposit)} cọc
                            </p>
                          )}
                        </div>
                      </div>

                      {item.rentalPeriod && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <span className="text-blue-700 font-medium">🗓️ </span>
                          <span className="text-blue-600">
                            {formatDate(item.rentalPeriod.startDate)} → {formatDate(item.rentalPeriod.endDate)}
                            ({item.rentalPeriod.duration?.value || Math.ceil((new Date(item.rentalPeriod.endDate) - new Date(item.rentalPeriod.startDate)) / (1000 * 60 * 60 * 24))} ngày)
                          </span>
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          {item.confirmationStatus === 'PENDING' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              ⏳ Chờ xác nhận
                            </span>
                          )}
                          {item.confirmationStatus === 'CONFIRMED' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✅ Đã xác nhận
                            </span>
                          )}
                          {item.confirmationStatus === 'REJECTED' && (
                            <div>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                ❌ Đã từ chối
                              </span>
                              {item.rejectionReason && (
                                <div className="text-xs text-red-600 mt-1">Lý do: {item.rejectionReason}</div>
                              )}
                            </div>
                          )}
                        </div>

                        {item.confirmationStatus === 'PENDING' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => onConfirmItem(subOrder._id, index)}
                              className="px-4 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                            >
                              ✓ Xác nhận
                            </button>
                            <button
                              onClick={() => {
                                setSelectedItemIndex(index);
                                setShowRejectModal(true);
                              }}
                              className="px-4 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                            >
                              ✗ Từ chối
                            </button>
                          </div>
                        )}
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

              {/* Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
                <h4 className="font-bold text-gray-900 mb-3">💰 Tổng kết thanh toán</h4>
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiền thuê:</span>
                    <span className="font-semibold">{formatCurrency(subOrder.pricing?.subtotalRental)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiền cọc:</span>
                    <span className="font-semibold">{formatCurrency(subOrder.pricing?.subtotalDeposit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vận chuyển:</span>
                    <span className="font-semibold">
                      {subOrder.masterOrder?.deliveryMethod === 'DELIVERY' ? 
                        formatCurrency(subOrder.pricing?.shippingFee || 0) : 
                        'Tự nhận hàng'}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Tổng cộng:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(
                        (subOrder.pricing?.subtotalRental || 0) + 
                        (subOrder.pricing?.subtotalDeposit || 0) + 
                        (subOrder.pricing?.shippingFee || 0)
                      )}
                    </span>
                  </div>
                </div>

                {subOrder.masterOrder?.paymentMethod === 'COD' && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span>💳</span>
                      <span className="font-semibold text-amber-800">Thanh toán COD</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Đã thanh toán: </span>
                        <span className="font-semibold text-green-600">{formatCurrency(subOrder.pricing?.subtotalDeposit)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Còn lại: </span>
                        <span className="font-bold text-red-600">
                          {formatCurrency((subOrder.pricing?.subtotalRental || 0) + (subOrder.pricing?.shippingFee || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sign Contract Button - Show for multiple statuses */}
              {(subOrder.status === 'OWNER_CONFIRMED' || 
                subOrder.status === 'PARTIALLY_CONFIRMED' ||
                (subOrder.contract && !showSigningInModal)) && (
                <div className="mt-6">
                  {/* Info box if contract exists */}
                  {subOrder.contract && (
                    <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">📄</span>
                        <span className="font-bold text-purple-900">Hợp đồng đã được tạo</span>
                      </div>
                      <p className="text-sm text-purple-700 mb-3">
                        Bạn cần ký hợp đồng trước khi người thuê có thể ký. Hợp đồng chỉ có hiệu lực khi cả hai bên đã ký.
                      </p>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <button
                      onClick={() => {
                        const contractId = subOrder.contract?._id || subOrder.contract;
                        if (contractId) {
                          setShowSigningInModal(true);
                          loadContractForSigning(contractId);
                        } else {
                          toast.error('Không tìm thấy hợp đồng. Vui lòng reload trang.');
                        }
                      }}
                      className="px-8 py-4 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl text-lg"
                    >
                      ✍️ Ký hợp đồng ngay
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Contract Signing View */
            <ContractSigningInline
              subOrder={subOrder}
              contractData={contractData}
              loadingContract={loadingContract}
              onBack={() => setShowSigningInModal(false)}
              onSignSuccess={() => {
                setShowSigningInModal(false);
                onClose();
                toast.success('✅ Ký hợp đồng thành công! Đã gửi đến người thuê.');
              }}
              loadContractForSigning={loadContractForSigning}
            />
          )}
        </div>

        {/* Reject Product Modal */}
        {showRejectModal && selectedItemIndex !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
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
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Từ chối
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