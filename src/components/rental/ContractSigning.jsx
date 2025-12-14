import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useRentalOrder } from '../../context/RentalOrderContext';  
import { FileText, Signature, Check, AlertCircle, Download, User, Clock, Shield, Mail } from 'lucide-react';
import rentalOrderService from '../../services/rentalOrder';
import otpService from '../../services/otp';
import { toast } from '../common/Toast';
import useOrderSocket from '../../hooks/useOrderSocket';
import { useI18n } from '../../hooks/useI18n';

const ContractSigning = () => {
  const { contractId: paramContractId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  
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
      setError(t('contractSigning.notFound'));
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
        setOtpError(t('contractSigning.otpExpired') || 'Mã OTP đã hết hạn. Vui lòng gửi lại.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [otpExpiry]);

  // Send OTP
  const handleSendOTP = async () => {
    if (!contractId) {
      toast.error(t('contractSigning.notFound'));
      return;
    }

    if (sentCount >= 3) {
      toast.error(t('contractSigning.otpLimitExceeded') || 'Bạn đã vượt quá số lần gửi OTP (tối đa 3 lần)');
      return;
    }

    setIsSendingOTP(true);
    setOtpError('');

    try {
      const response = await otpService.sendContractSigningOTP(contractId);
      
      setOtpSent(true);
      setOtpExpiry(response.data.expiresAt);
      setSentCount(response.data.sentCount);
      
      toast.success(response.message || t('contractSigning.otpSentSuccess'));
      console.log('✅ OTP sent successfully:', response);
    } catch (error) {
      console.error('❌ Error sending OTP:', error);
      setOtpError(error.message);
      toast.error(error.message || t('contractSigning.otpSentError'));
    } finally {
      setIsSendingOTP(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError(t('contractSigning.otpInvalid') || 'Vui lòng nhập mã OTP 6 số');
      return;
    }

    setIsVerifyingOTP(true);
    setOtpError('');

    try {
      const response = await otpService.verifyContractSigningOTP(contractId, otpCode);
      
      setOtpVerified(true);
      toast.success(t('contractSigning.otpVerifiedSuccess'));
      console.log('✅ OTP verified successfully');
    } catch (error) {
      console.error('❌ Error verifying OTP:', error);
      setOtpError(error.message);
      toast.error(error.message || t('contractSigning.otpVerifyError'));
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
    
    // Calculate scale factor for accurate positioning
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    // Calculate scale factor for accurate positioning
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
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
      toast.warning(t('contractSigning.alreadySignedWarning'));
      return;
    }

    if (!otpVerified) {
      setError(t('contractSigning.otpRequired'));
      toast.error(t('contractSigning.otpRequiredShort'));
      return;
    }

    if (!signatureData) {
      setError(t('contractSigning.signatureRequired'));
      return;
    }

    if (!agreementConfirmed) {
      setError(t('contractSigning.agreementRequired'));
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
      toast.success(t('contractSigning.signSuccess'));
      // Don't navigate away - let user download PDF
    } catch (error) {
      console.error('❌ Error signing contract:', error);
      setError(error.message || t('contractSigning.signError'));
      toast.error(error.message || t('contractSigning.signError'));
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
            <title>${t('contractSigning.title')} ${contract?.contractNumber || ''}</title>
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
              <h3>${t('contractSigning.electronicSignatureTitle')}</h3>
              <div style="display: flex; justify-content: space-between;">
                <div>
                  <p><strong>${t('contractSigning.owner')}:</strong></p>
                  ${contract.signatures?.owner?.signed ? 
                    `<img src="${contract.signatures.owner.signature}" style="max-width: 200px; border: 1px solid #ccc;" />` : 
                    `<p>${t('contractSigning.notSigned')}</p>`
                  }
                  <p><small>${t('contractSigning.signedAt')} ${contract.signatures?.owner?.signedAt ? new Date(contract.signatures.owner.signedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : 'N/A'}</small></p>
                </div>
                <div>
                  <p><strong>${t('contractSigning.renter')}:</strong></p>
                  ${contract.signatures?.renter?.signed ? 
                    `<img src="${contract.signatures.renter.signature}" style="max-width: 200px; border: 1px solid #ccc;" />` : 
                    `<p>${t('contractSigning.notSigned')}</p>`
                  }
                  <p><small>${t('contractSigning.signedAt')} ${contract.signatures?.renter?.signedAt ? new Date(contract.signatures.renter.signedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : 'N/A'}</small></p>
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
      toast.error(t('contractSigning.downloadError'));
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3">{t('contractSigning.loading')}</span>
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
            {error || t('contractSigning.notFound')}
          </h2>
          <p className="text-gray-600 mb-4">
            Contract ID: {contractId || t('contractSigning.notFound')}
          </p>
          <button
            onClick={() => navigate('/rental-orders')}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            {t('contractSigning.backToOrders')}
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
                {t('contractSigning.title')} #{contract.contractNumber}
              </h1>
              <p className="text-gray-600">{t('contractSigning.electronicSignature')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={downloadContract}
                className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                <Download className="w-4 h-4" />
                <span>{t('contractSigning.downloadPDF')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contract Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">{t('contractSigning.contractContent')}</h2>
              <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50">
                {contract.content?.htmlContent ? (
                  <div 
                    className="text-sm"
                    dangerouslySetInnerHTML={{ __html: contract.content.htmlContent }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {contract.content || t('contractSigning.loadingContract')}
                  </pre>
                )}
              </div>
            </div>

            {/* Show existing signatures */}
            {(contract.signatures?.owner?.signed || contract.signatures?.renter?.signed) && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Signature className="w-5 h-5 mr-2" />
                  {t('contractSigning.existingSignatures')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Owner Signature */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="font-medium text-gray-700 mb-2">{t('contractSigning.owner')}</p>
                    {contract.signatures?.owner?.signed ? (
                      <>
                        <img 
                          src={contract.signatures?.owner?.signature} 
                          alt={t('contractSigning.owner')}
                          className="w-full h-32 object-contain border border-gray-300 rounded bg-white mb-2"
                        />
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {t('contractSigning.signedAt')} {contract.signatures?.owner?.signedAt ? new Date(contract.signatures.owner.signedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : 'N/A'}
                        </p>
                      </>
                    ) : (
                      <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400">
                        {t('contractSigning.notSigned')}
                      </div>
                    )}
                  </div>

                  {/* Renter Signature */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="font-medium text-gray-700 mb-2">{t('contractSigning.renter')}</p>
                    {contract.signatures?.renter?.signed ? (
                      <>
                        <img 
                          src={contract.signatures?.renter?.signature} 
                          alt={t('contractSigning.renter')}
                          className="w-full h-32 object-contain border border-gray-300 rounded bg-white mb-2"
                        />
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {t('contractSigning.signedAt')} {contract.signatures?.renter?.signedAt ? new Date(contract.signatures.renter.signedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : 'N/A'}
                        </p>
                      </>
                    ) : (
                      <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400">
                        {t('contractSigning.notSigned')}
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
                {t('contractSigning.signatureSection')}
              </h2>

              {/* OTP Verification Section */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center text-blue-800">
                  <Shield className="w-5 h-5 mr-2" />
                  {t('contractSigning.otpVerification')}
                </h3>
                
                {!otpVerified ? (
                  <>
                    <p className="text-sm text-gray-700 mb-4">
                      {t('contractSigning.otpDescription')}
                    </p>

                    {!otpSent ? (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={handleSendOTP}
                          disabled={isSendingOTP || sentCount >= 3}
                          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          <Mail className="w-4 h-4" />
                          <span>{isSendingOTP ? t('contractSigning.sending') : t('contractSigning.sendOTP')}</span>
                        </button>
                        {sentCount > 0 && (
                          <span className="text-sm text-gray-600">
                            {t('contractSigning.sentCount', { count: sentCount })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-green-600 text-sm">
                          <Check className="w-4 h-4" />
                          <span>{t('contractSigning.otpSent')}</span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder={t('contractSigning.enterOTP')}
                            maxLength={6}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleVerifyOTP}
                            disabled={isVerifyingOTP || otpCode.length !== 6}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {isVerifyingOTP ? t('contractSigning.verifying') : t('contractSigning.verify')}
                          </button>
                        </div>

                        {remainingTime > 0 && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{t('contractSigning.otpValidFor')} {formatTime(remainingTime)}</span>
                          </div>
                        )}

                        {remainingTime === 0 && (
                          <button
                            onClick={handleSendOTP}
                            disabled={isSendingOTP || sentCount >= 3}
                            className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                          >
                            {t('contractSigning.resendOTP')}
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
                    <span className="font-medium">{t('contractSigning.otpVerifiedSuccess')}</span>
                  </div>
                )}
              </div>

              {/* Signature Pad */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contractSigning.signHereLabel')}
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
                    <p className="text-sm text-gray-600">{t('contractSigning.useMouse')}</p>
                  ) : (
                    <p className="text-sm text-orange-600 font-medium">
                      {t('contractSigning.verifyOTPFirst')}
                    </p>
                  )}
                  <button
                    onClick={clearSignature}
                    disabled={!otpVerified}
                    className="text-red-500 text-sm hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {t('contractSigning.clearSignature')}
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
                    <p className="font-medium">{t('contractSigning.agreementLabel')}</p>
                    <p className="text-gray-600 mt-1">
                      {t('contractSigning.agreementDetails')}
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
                  <p className="text-green-800 font-medium">{t('contractSigning.alreadySigned')}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {t('contractSigning.signedAt')} {userRole && contract.signatures[userRole.toLowerCase()]?.signedAt ? 
                      new Date(contract.signatures[userRole.toLowerCase()].signedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : 'N/A'
                    }
                  </p>
                  <button
                    onClick={downloadContract}
                    className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('contractSigning.downloadContract')}</span>
                  </button>
                </div>
              ) : signMessage ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-yellow-800 font-medium">{signMessage}</p>
                  {signMessage.includes('Chờ chủ đồ') && (
                    <p className="text-sm text-yellow-600 mt-2">
                      {t('contractSigning.waitingForOwner')}
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
                      <span>{t('contractSigning.signing')}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>{t('contractSigning.signContract')}</span>
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
              <h3 className="text-lg font-semibold mb-4">{t('contractSigning.contractInfo')}</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block font-medium text-gray-700">{t('contractSigning.contractNumber')}</label>
                  <p>{contract.contractNumber}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">{t('contractSigning.product')}</label>
                  <p>{contract.product?.name || contract.product?.title || 'N/A'}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">{t('contractSigning.rentalPeriod')}</label>
                  <p>{contract.terms?.startDate ? new Date(contract.terms.startDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') : 'N/A'} - {contract.terms?.endDate ? new Date(contract.terms.endDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') : 'N/A'}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">{t('contractSigning.rentalPrice')}</label>
                  <p className="font-medium text-blue-600">{contract.terms?.rentalRate ? contract.terms.rentalRate.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') + 'đ' : 'N/A'}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">{t('contractSigning.deposit')}</label>
                  <p className="font-medium text-orange-600">{contract.terms?.deposit ? contract.terms.deposit.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') + 'đ' : 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">{t('contractSigning.parties')}</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{t('contractSigning.owner')}</p>
                    <p className="text-sm text-gray-600">{contract.owner?.profile?.fullName || 'N/A'}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      {contract.signatures.owner.signed ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600">{t('contractSigning.signedStatus')}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                          <span className="text-xs text-gray-500">{t('contractSigning.notSigned')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">{t('contractSigning.renter')}</p>
                    <p className="text-sm text-gray-600">{contract.renter?.profile?.fullName || 'N/A'}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      {contract.signatures.renter.signed ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600">{t('contractSigning.signedStatus')}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full border border-orange-300"></div>
                          <span className="text-xs text-orange-500">{t('contractSigning.pendingStatus')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">{t('contractSigning.platform')}</p>
                    <p className="text-sm text-gray-600">{t('contractSigning.intermediary')}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-600">{t('contractSigning.autoSigned')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">{t('contractSigning.securityTitle')}</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>{t('contractSigning.securityNote1')}</li>
                <li>{t('contractSigning.securityNote2')}</li>
                <li>{t('contractSigning.securityNote3')}</li>
                <li>{t('contractSigning.securityNote4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractSigning;