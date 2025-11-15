import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRentalOrder } from '../../context/RentalOrderContext';
import { FileText, Signature, Check, AlertCircle, Download, User } from 'lucide-react';

const ContractSigning = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [agreementConfirmed, setAgreementConfirmed] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [error, setError] = useState('');

  // Load contract details
  useEffect(() => {
    const loadContract = async () => {
      try {
        // This would be a new API endpoint to get contract details
        // For now, we'll simulate the data
        setContract({
          _id: contractId,
          contractNumber: 'CT20241120001',
          owner: {
            profile: { fullName: 'Nguyễn Văn A' },
            email: 'owner@example.com'
          },
          renter: {
            profile: { fullName: 'Trần Thị B' },
            email: 'renter@example.com'
          },
          product: {
            name: 'Máy ảnh Canon EOS R5',
            images: ['image1.jpg']
          },
          terms: {
            startDate: '2024-12-01T00:00:00Z',
            endDate: '2024-12-05T00:00:00Z',
            rentalRate: 2000000,
            deposit: 5000000
          },
          signatures: {
            owner: { signed: false },
            renter: { signed: false }
          },
          status: 'PENDING_SIGNATURE',
          content: `HỢP ĐỒNG CHO THUÊ SẢN PHẨM\n\nSố hợp đồng: CT20241120001\nNgày ký: ${new Date().toLocaleDateString('vi-VN')}\n\n...`
        });
        setIsLoading(false);
      } catch (error) {
        setError('Không thể tải thông tin hợp đồng');
        setIsLoading(false);
      }
    };

    if (contractId) {
      loadContract();
    }
  }, [contractId]);

  // Setup canvas for signature
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
    }
  }, []);

  // Mouse/Touch events for signature
  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    
    // Convert canvas to base64
    const canvas = canvasRef.current;
    const signatureBase64 = canvas.toDataURL();
    setSignatureData(signatureBase64);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  const handleSignContract = async () => {
    if (!signatureData) {
      setError('Vui lòng ký tên trước khi xác nhận');
      return;
    }

    if (!agreementConfirmed) {
      setError('Vui lòng xác nhận đồng ý với điều khoản hợp đồng');
      return;
    }

    setIsSigning(true);
    setError('');

    try {
      const signData = {
        signature: signatureData,
        agreementConfirmed: true,
        signatureMethod: 'ELECTRONIC'
      };

      // This would call the actual API
      // await rentalOrderService.signContract(contractId, signData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      navigate('/rental-orders/contracts?signed=true');
    } catch (error) {
      setError(error.message || 'Có lỗi xảy ra khi ký hợp đồng');
    } finally {
      setIsSigning(false);
    }
  };

  const downloadContract = () => {
    // This would generate and download PDF
    alert('Tính năng tải hợp đồng PDF sẽ được triển khai');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3">Đang tải hợp đồng...</span>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy hợp đồng</h2>
          <button
            onClick={() => navigate('/rental-orders/contracts')}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Quay về danh sách hợp đồng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <FileText className="w-6 h-6 mr-2" />
                Hợp đồng #{contract.contractNumber}
              </h1>
              <p className="text-gray-600">Ký hợp đồng điện tử</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={downloadContract}
                className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                <Download className="w-4 h-4" />
                <span>Tải PDF</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contract Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Nội dung hợp đồng</h2>
              <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50">
                <pre className="whitespace-pre-wrap text-sm font-mono">{contract.content}</pre>
              </div>
            </div>

            {/* Signature Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Signature className="w-5 h-5 mr-2" />
                Chữ ký điện tử
              </h2>

              {/* Signature Pad */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vui lòng ký tên trong khung bên dưới:
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={200}
                    className="border border-gray-300 rounded cursor-crosshair w-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-600">Sử dụng chuột hoặc touch để ký tên</p>
                  <button
                    onClick={clearSignature}
                    className="text-red-500 text-sm hover:text-red-700"
                  >
                    Xóa chữ ký
                  </button>
                </div>
              </div>

              {/* Agreement Confirmation */}
              <div className="mb-6">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreementConfirmed}
                    onChange={(e) => setAgreementConfirmed(e.target.checked)}
                    className="w-5 h-5 text-blue-500 mt-1"
                  />
                  <div className="text-sm">
                    <p className="font-medium">Tôi xác nhận đã đọc, hiểu và đồng ý với tất cả điều khoản trong hợp đồng này.</p>
                    <p className="text-gray-600 mt-1">
                      Tôi hiểu rằng việc ký hợp đồng điện tử này có giá trị pháp lý tương đương với hợp đồng giấy 
                      và tôi cam kết thực hiện đúng các nghĩa vụ đã thỏa thuận.
                    </p>
                  </div>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Sign Button */}
              <button
                onClick={handleSignContract}
                disabled={isSigning || !signatureData || !agreementConfirmed}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSigning ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Đang ký hợp đồng...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Ký hợp đồng</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Contract Info Sidebar */}
          <div className="lg:col-span-1">
            {/* Contract Details */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Thông tin hợp đồng</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block font-medium text-gray-700">Số hợp đồng</label>
                  <p>{contract.contractNumber}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Sản phẩm</label>
                  <p>{contract.product.name}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Thời gian thuê</label>
                  <p>{new Date(contract.terms.startDate).toLocaleDateString('vi-VN')} - {new Date(contract.terms.endDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Giá thuê</label>
                  <p className="font-medium text-blue-600">{contract.terms.rentalRate.toLocaleString('vi-VN')}đ</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Tiền cọc</label>
                  <p className="font-medium text-orange-600">{contract.terms.deposit.toLocaleString('vi-VN')}đ</p>
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Các bên tham gia</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Chủ cho thuê</p>
                    <p className="text-sm text-gray-600">{contract.owner.profile.fullName}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      {contract.signatures.owner.signed ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600">Đã ký</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                          <span className="text-xs text-gray-500">Chưa ký</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Người thuê</p>
                    <p className="text-sm text-gray-600">{contract.renter.profile.fullName}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      {contract.signatures.renter.signed ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600">Đã ký</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full border border-orange-300"></div>
                          <span className="text-xs text-orange-500">Đang ký</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Nền tảng PIRA</p>
                    <p className="text-sm text-gray-600">Bên trung gian</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-600">Tự động ký</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">🔒 Bảo mật & Pháp lý</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Hợp đồng được mã hóa và bảo mật</li>
                <li>• Chữ ký có giá trị pháp lý</li>
                <li>• Lưu trữ vĩnh viễn trên hệ thống</li>
                <li>• Tuân thủ luật Việt Nam</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractSigning;