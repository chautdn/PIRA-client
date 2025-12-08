import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useRentalOrder } from '../../context/RentalOrderContext';  
import { FileText, Signature, Check, AlertCircle, Download, User, Clock, Shield, Mail } from 'lucide-react';
import rentalOrderService from '../../services/rentalOrder';
import otpService from '../../services/otp';
import { toast } from '../common/Toast';
import useOrderSocket from '../../hooks/useOrderSocket';

const ContractSigning = () => {
  const { contractId: paramContractId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get contractId from either URL param or query string
  const contractId = React.useMemo(() => {
    return paramContractId || searchParams.get('contractId');
  }, [paramContractId, searchParams]);
  
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [contract, setContract] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [canSign, setCanSign] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [agreementConfirmed, setAgreementConfirmed] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [error, setError] = useState('');
  const [hasAlreadySigned, setHasAlreadySigned] = useState(false);
  const [signMessage, setSignMessage] = useState('');

  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [sentCount, setSentCount] = useState(0);

  // Initialize WebSocket for real-time contract updates
  const { emitContractSigned, emitContractCompleted } = useOrderSocket({
    onContractSigned: (data) => {
      console.log('📝 Contract signed by other party, reloading...');
      if (contractId) {
        const loadContract = async () => {
          try {
            const response = await rentalOrderService.getContractDetail(contractId);
            const actualData = response.data?.metadata || response.metadata || response.data || response;
            if (actualData.contract) {
              setContract(actualData.contract);
              setCanSign(actualData.canSign);
              setSignMessage(actualData.signMessage || '');
              const role = actualData.userRole?.toLowerCase();
              const alreadySigned = role && actualData.contract.signatures[role]?.signed;
              setHasAlreadySigned(alreadySigned);
            }
          } catch (error) {
            console.error('Error reloading contract:', error);
          }
        };
        loadContract();
      }
    },
  });

  console.log('🔍 ContractSigning - contractId:', contractId);

  // Load contract details
  useEffect(() => {
    if (!contractId) {
      setError('Không tìm thấy ID hợp đồng');
      setIsLoading(false);
      return;
    }
    
    const loadContract = async () => {
      try {
        console.log('📄 Loading contract:', contractId);
        
        const response = await rentalOrderService.getContractDetail(contractId);
        console.log('✅ Contract loaded - Full response:', response);
        
        // Handle nested response structure
        const actualData = response.data?.metadata || response.metadata || response.data || response;
        console.log('📦 Extracted data:', actualData);
        
        if (!actualData.contract) {
          console.error('❌ No contract in response:', actualData);
          throw new Error('Không tìm thấy thông tin hợp đồng trong response');
        }
        
        setContract(actualData.contract);
        setUserRole(actualData.userRole);
        setCanSign(actualData.canSign);
        setSignMessage(actualData.signMessage || '');
        
        // Check if user already signed
        const role = actualData.userRole?.toLowerCase();
        const alreadySigned = role && actualData.contract.signatures[role]?.signed;
        setHasAlreadySigned(alreadySigned);
        
        setIsLoading(false);
        console.log('✅ Contract set successfully. Already signed:', alreadySigned, 'Message:', actualData.signMessage);
      } catch (error) {
        console.error('❌ Error loading contract:', error);
        setError(error.message || 'Không thể tải thông tin hợp đồng');
        setIsLoading(false);
      }
    };

    loadContract();
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

  // OTP countdown timer
  useEffect(() => {
    if (!otpExpiry) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((otpExpiry - now) / 1000));
      setRemainingTime(remaining);

      if (remaining === 0) {
        setOtpSent(false);
        setOtpCode('');
        setOtpError('Mã OTP đã hết hạn. Vui lòng gửi lại.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [otpExpiry]);

  // Send OTP
  const handleSendOTP = async () => {
    if (!contractId) {
      toast.error('Không tìm thấy ID hợp đồng');
      return;
    }

    if (sentCount >= 3) {
      toast.error('Bạn đã vượt quá số lần gửi OTP (tối đa 3 lần)');
      return;
    }

    setIsSendingOTP(true);
    setOtpError('');

    try {
      const response = await otpService.sendContractSigningOTP(contractId);
      
      setOtpSent(true);
      setOtpExpiry(response.data.expiresAt);
      setSentCount(response.data.sentCount);
      
      toast.success(response.message || 'Mã OTP đã được gửi đến email của bạn');
      console.log('✅ OTP sent successfully:', response);
    } catch (error) {
      console.error('❌ Error sending OTP:', error);
      setOtpError(error.message);
      toast.error(error.message || 'Không thể gửi mã OTP');
    } finally {
      setIsSendingOTP(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Vui lòng nhập mã OTP 6 số');
      return;
    }

    setIsVerifyingOTP(true);
    setOtpError('');

    try {
      const response = await otpService.verifyContractSigningOTP(contractId, otpCode);
      
      setOtpVerified(true);
      toast.success('Xác minh OTP thành công! Bạn có thể ký hợp đồng.');
      console.log('✅ OTP verified successfully');
    } catch (error) {
      console.error('❌ Error verifying OTP:', error);
      setOtpError(error.message);
      toast.error(error.message || 'Mã OTP không chính xác');
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  // Format countdown time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
    if (hasAlreadySigned) {
      toast.warning('Bạn đã ký hợp đồng này rồi!');
      return;
    }

    if (!otpVerified) {
      setError('Vui lòng xác minh OTP trước khi ký hợp đồng');
      toast.error('Bạn cần xác minh mã OTP trước');
      return;
    }

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

      // Call actual API
      const response = await rentalOrderService.signContract(contractId, signData);
      console.log('✅ Contract signed:', response);
      
      // Update state to reflect signing
      setHasAlreadySigned(true);
      
      // Reload contract to get updated signatures
      const updatedResponse = await rentalOrderService.getContractDetail(contractId);
      const updatedData = updatedResponse.data?.metadata || updatedResponse.metadata || updatedResponse;
      if (updatedData.contract) {
        setContract(updatedData.contract);
      }
      
      // Show success message
      toast.success('✅ Ký hợp đồng thành công! Bạn có thể tải PDF bên dưới.');
      // Don't navigate away - let user download PDF
    } catch (error) {
      console.error('❌ Error signing contract:', error);
      setError(error.message || 'Có lỗi xảy ra khi ký hợp đồng');
      toast.error(error.message || 'Có lỗi xảy ra khi ký hợp đồng');
    } finally {
      setIsSigning(false);
    }
  };

  const downloadContract = async () => {
    try {
      // Create HTML content for PDF
      const htmlContent = contract.content?.htmlContent || '';
      
      // Create a new window with the contract content
      const printWindow = window.open('', '_blank');
        if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Hợp đồng ${contract?.contractNumber || ''}</title>
            <style>
              body { font-family: 'Times New Roman', serif; padding: 20px; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${htmlContent}
            <div style="margin-top: 50px; page-break-before: always;">
              <h3>CHỮ KÝ ĐIỆN TỬ</h3>
              <div style="display: flex; justify-content: space-between;">
                <div>
                  <p><strong>Chủ cho thuê:</strong></p>
                  ${contract.signatures?.owner?.signed ? 
                    `<img src="${contract.signatures.owner.signature}" style="max-width: 200px; border: 1px solid #ccc;" />` : 
                    '<p>Chưa ký</p>'
                  }
                  <p><small>Ký lúc: ${contract.signatures?.owner?.signedAt ? new Date(contract.signatures.owner.signedAt).toLocaleString('vi-VN') : 'N/A'}</small></p>
                </div>
                <div>
                  <p><strong>Người thuê:</strong></p>
                  ${contract.signatures?.renter?.signed ? 
                    `<img src="${contract.signatures.renter.signature}" style="max-width: 200px; border: 1px solid #ccc;" />` : 
                    '<p>Chưa ký</p>'
                  }
                  <p><small>Ký lúc: ${contract.signatures?.renter?.signedAt ? new Date(contract.signatures.renter.signedAt).toLocaleString('vi-VN') : 'N/A'}</small></p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        
        // Auto print dialog
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    } catch (error) {
      console.error('Error downloading contract:', error);
      toast.error('Không thể tải hợp đồng');
    }
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

  if (error || !contract || !contractId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4 text-red-800">
            {error || 'Không tìm thấy hợp đồng'}
          </h2>
          <p className="text-gray-600 mb-4">
            Contract ID: {contractId || 'Không có'}
          </p>
          <button
            onClick={() => navigate('/rental-orders')}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Quay về danh sách đơn hàng
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
                {contract.content?.htmlContent ? (
                  <div 
                    className="text-sm"
                    dangerouslySetInnerHTML={{ __html: contract.content.htmlContent }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {contract.content || 'Đang tải nội dung hợp đồng...'}
                  </pre>
                )}
              </div>
            </div>

            {/* Show existing signatures */}
            {(contract.signatures?.owner?.signed || contract.signatures?.renter?.signed) && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Signature className="w-5 h-5 mr-2" />
                  Chữ ký đã có
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Owner Signature */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="font-medium text-gray-700 mb-2">Chủ cho thuê</p>
                    {contract.signatures?.owner?.signed ? (
                      <>
                        <img 
                          src={contract.signatures?.owner?.signature} 
                          alt="Chữ ký chủ đồ"
                          className="w-full h-32 object-contain border border-gray-300 rounded bg-white mb-2"
                        />
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Đã ký lúc: {contract.signatures?.owner?.signedAt ? new Date(contract.signatures.owner.signedAt).toLocaleString('vi-VN') : 'N/A'}
                        </p>
                      </>
                    ) : (
                      <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400">
                        Chưa ký
                      </div>
                    )}
                  </div>

                  {/* Renter Signature */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="font-medium text-gray-700 mb-2">Người thuê</p>
                    {contract.signatures?.renter?.signed ? (
                      <>
                        <img 
                          src={contract.signatures?.renter?.signature} 
                          alt="Chữ ký người thuê"
                          className="w-full h-32 object-contain border border-gray-300 rounded bg-white mb-2"
                        />
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Đã ký lúc: {contract.signatures?.renter?.signedAt ? new Date(contract.signatures.renter.signedAt).toLocaleString('vi-VN') : 'N/A'}
                        </p>
                      </>
                    ) : (
                      <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400">
                        Chưa ký
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Signature Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Signature className="w-5 h-5 mr-2" />
                Chữ ký điện tử
              </h2>

              {/* OTP Verification Section */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center text-blue-800">
                  <Shield className="w-5 h-5 mr-2" />
                  Xác minh danh tính (OTP)
                </h3>
                
                {!otpVerified ? (
                  <>
                    <p className="text-sm text-gray-700 mb-4">
                      Để đảm bảo tính bảo mật, vui lòng xác minh danh tính bằng mã OTP được gửi qua email.
                    </p>

                    {!otpSent ? (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={handleSendOTP}
                          disabled={isSendingOTP || sentCount >= 3}
                          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          <Mail className="w-4 h-4" />
                          <span>{isSendingOTP ? 'Đang gửi...' : 'Gửi mã xác nhận'}</span>
                        </button>
                        {sentCount > 0 && (
                          <span className="text-sm text-gray-600">
                            Đã gửi {sentCount}/3 lần
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-green-600 text-sm">
                          <Check className="w-4 h-4" />
                          <span>Mã OTP đã được gửi đến email của bạn</span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Nhập mã OTP (6 số)"
                            maxLength={6}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleVerifyOTP}
                            disabled={isVerifyingOTP || otpCode.length !== 6}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {isVerifyingOTP ? 'Đang xác minh...' : 'Xác minh'}
                          </button>
                        </div>

                        {remainingTime > 0 && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>Mã có hiệu lực trong: {formatTime(remainingTime)}</span>
                          </div>
                        )}

                        {remainingTime === 0 && (
                          <button
                            onClick={handleSendOTP}
                            disabled={isSendingOTP || sentCount >= 3}
                            className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                          >
                            Gửi lại mã OTP
                          </button>
                        )}

                        {otpError && (
                          <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-2 rounded">
                            <AlertCircle className="w-4 h-4" />
                            <span>{otpError}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Xác minh OTP thành công! Bạn có thể ký hợp đồng.</span>
                  </div>
                )}
              </div>

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
                    className={`border border-gray-300 rounded w-full ${
                      otpVerified ? 'cursor-crosshair' : 'cursor-not-allowed opacity-50'
                    }`}
                    onMouseDown={otpVerified ? startDrawing : null}
                    onMouseMove={otpVerified ? draw : null}
                    onMouseUp={otpVerified ? stopDrawing : null}
                    onMouseLeave={otpVerified ? stopDrawing : null}
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  {otpVerified ? (
                    <p className="text-sm text-gray-600">Sử dụng chuột hoặc touch để ký tên</p>
                  ) : (
                    <p className="text-sm text-orange-600 font-medium">
                      🔒 Vui lòng xác minh OTP trước khi ký
                    </p>
                  )}
                  <button
                    onClick={clearSignature}
                    disabled={!otpVerified}
                    className="text-red-500 text-sm hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
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

              {/* Sign Button or Already Signed Message */}
              {hasAlreadySigned ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-medium">✅ Bạn đã ký hợp đồng này rồi</p>
                  <p className="text-sm text-green-600 mt-1">
                    Ký lúc: {userRole && contract.signatures[userRole.toLowerCase()]?.signedAt ? 
                      new Date(contract.signatures[userRole.toLowerCase()].signedAt).toLocaleString('vi-VN') : 'N/A'
                    }
                  </p>
                  <button
                    onClick={downloadContract}
                    className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải hợp đồng PDF</span>
                  </button>
                </div>
              ) : signMessage ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-yellow-800 font-medium">{signMessage}</p>
                  {signMessage.includes('Chờ chủ đồ') && (
                    <p className="text-sm text-yellow-600 mt-2">
                      Chủ đồ cần ký hợp đồng trước khi bạn có thể ký
                    </p>
                  )}
                </div>
              ) : (
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
              )}
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
                  <p>{contract.product?.name || contract.product?.title || 'N/A'}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Thời gian thuê</label>
                  <p>{contract.terms?.startDate ? new Date(contract.terms.startDate).toLocaleDateString('vi-VN') : 'N/A'} - {contract.terms?.endDate ? new Date(contract.terms.endDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Giá thuê</label>
                  <p className="font-medium text-blue-600">{contract.terms?.rentalRate ? contract.terms.rentalRate.toLocaleString('vi-VN') + 'đ' : 'N/A'}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Tiền cọc</label>
                  <p className="font-medium text-orange-600">{contract.terms?.deposit ? contract.terms.deposit.toLocaleString('vi-VN') + 'đ' : 'N/A'}</p>
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
                    <p className="text-sm text-gray-600">{contract.owner?.profile?.fullName || 'N/A'}</p>
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
                    <p className="text-sm text-gray-600">{contract.renter?.profile?.fullName || 'N/A'}</p>
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