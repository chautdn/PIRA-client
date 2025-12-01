import React, { useRef, useState, useEffect } from 'react';
import rentalOrderService from '../../services/rentalOrder';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/constants';

const ContractSigningInline = ({ 
  subOrder, 
  contractData, 
  loadingContract, 
  onBack, 
  onSignSuccess, 
  loadContractForSigning 
}) => {
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
            <span className="font-semibold ml-2 text-yellow-600">
              {contractData.status === 'PENDING_OWNER' ? 'Chờ chủ ký' : contractData.status}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Người thuê:</span>
            <span className="font-semibold ml-2">
              {contractData.renter?.profile?.firstName} {contractData.renter?.profile?.lastName}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Tổng tiền:</span>
            <span className="font-bold ml-2 text-green-600">
              {formatCurrency(contractData.terms?.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Contract Content Preview */}
      <div className="bg-white rounded-lg border border-gray-300 p-6 mb-6 max-h-96 overflow-y-auto">
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ 
            __html: contractData.content?.htmlContent || '<p>Đang tải nội dung hợp đồng...</p>' 
          }}
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

export default ContractSigningInline;
