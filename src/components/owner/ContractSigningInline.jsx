import React, { useRef, useState, useEffect } from 'react';
import rentalOrderService from '../../services/rentalOrder';
import otpService from '../../services/otp';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/constants';
import ContractEditModal from '../rental/ContractEditModal';
import { useI18n } from '../../hooks/useI18n';

const ContractSigningInline = ({ 
  subOrder, 
  contractData, 
  loadingContract, 
  onBack, 
  onSignSuccess, 
  loadContractForSigning 
}) => {
  const { t, language } = useI18n();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [signing, setSigning] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
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

  useEffect(() => {
    if (!contractData && subOrder.contract) {
      const contractId = subOrder.contract?._id || subOrder.contract;
      loadContractForSigning(contractId);
    }
  }, [contractData, subOrder, loadContractForSigning]);

  // Countdown timer for OTP
  useEffect(() => {
    if (otpExpiry && otpSent && !otpVerified) {
      const interval = setInterval(() => {
        const now = Date.now();
        const timeLeft = Math.max(0, otpExpiry - now);
        setRemainingTime(timeLeft);
        
        if (timeLeft === 0) {
          setOtpSent(false);
          setOtpExpiry(null);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [otpExpiry, otpSent, otpVerified]);

  const getCanvasPos = (e) => {
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();

  // Tính scale vì canvas width/height có thể khác CSS width/height
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  return { x, y };
};

const startDrawing = (e) => {
  if (!otpVerified) {
    toast.error(t('contractSigning.verifyOTPFirst'));
    return;
  }

  setIsDrawing(true);
  const ctx = canvasRef.current.getContext("2d");
  const { x, y } = getCanvasPos(e);

  ctx.beginPath();
  ctx.moveTo(x, y);
};

const draw = (e) => {
  if (!isDrawing || !otpVerified) return;

  const ctx = canvasRef.current.getContext("2d");
  const { x, y } = getCanvasPos(e);

  ctx.lineTo(x, y);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.stroke();
};

const stopDrawing = () => {
  if (!isDrawing) return;
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

  const handleSendOTP = async () => {
    if (sentCount >= 3) {
      toast.error(t('contractSigning.maxOTPAttempts'));
      return;
    }

    try {
      setIsSendingOTP(true);
      setOtpError('');
      
      const response = await otpService.sendContractSigningOTP(contractData._id);
      
      setOtpSent(true);
      setOtpExpiry(response.data?.expiresAt || Date.now() + 5 * 60 * 1000);
      setSentCount(prev => prev + 1);
      setRemainingTime(5 * 60 * 1000);
      
      toast.success('✅ ' + t('contractSigning.otpSentSuccess'));
    } catch (error) {
      console.error('Error sending OTP:', error);
      setOtpError(error.message || t('contractSigning.cannotSendOTP'));
      toast.error(error.message || t('contractSigning.cannotSendOTP'));
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast.error(t('contractSigning.enterAll6Digits'));
      return;
    }

    try {
      setIsVerifyingOTP(true);
      setOtpError('');
      
      await otpService.verifyContractSigningOTP(contractData._id, otpCode);
      
      setOtpVerified(true);
      toast.success('✅ ' + t('contractSigning.verifySuccess'));
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setOtpError(error.message || t('contractSigning.invalidOTP'));
      toast.error(error.message || t('contractSigning.invalidOTP'));
      setOtpCode('');
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(value);
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSign = async () => {
    if (!otpVerified) {
      toast.error(t('contractSigning.verifyOTPFirst'));
      return;
    }

    if (!signatureData) {
      toast.error(t('contractSigning.signBeforeConfirm'));
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
      
      toast.success('✅ ' + t('contractSigning.signSuccess'));
      onSignSuccess();
    } catch (error) {
      toast.error(error.message || t('contractSigning.cannotSign'));
    } finally {
      setSigning(false);
    }
  };

  if (loadingContract) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">{t('contractSigning.loadingContract')}</span>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>{t('contractSigning.contractNotFound')}</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:text-blue-800">
          ← {t('contractSigning.backButton')}
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
          <span>{t('contractSigning.backButton')}</span>
        </button>
      </div>

      {/* Contract Info */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">📄 {t('contractSigning.rentalContract')}</h3>
          {!contractData.signatures?.owner?.signed && (
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm flex items-center gap-2"
            >
              ✏️ {t('contractSigning.editTerms')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">{t('contractSigning.contractCode')}</span>
            <span className="font-semibold ml-2">{contractData.contractNumber}</span>
          </div>
          <div>
            <span className="text-gray-600">{t('contractSigning.status')}</span>
            <span className="font-semibold ml-2 text-yellow-600">
              {contractData.status === 'PENDING_OWNER' ? t('contractSigning.waitingOwnerSign') : contractData.status}
            </span>
          </div>
          <div>
            <span className="text-gray-600">{t('contractSigning.renter')}</span>
            <span className="font-semibold ml-2">
              {contractData.renter?.profile?.firstName} {contractData.renter?.profile?.lastName}
            </span>
          </div>
          <div>
            <span className="text-gray-600">{t('contractSigning.totalAmount')}</span>
            <span className="font-bold ml-2 text-green-600">
              {formatCurrency(contractData.terms?.totalAmount)}
            </span>
          </div>
        </div>
        {contractData.editableTerms?.isEdited && (
          <div className="mt-3 bg-orange-100 border border-orange-300 rounded-lg p-2 text-sm">
            <span className="text-orange-800 font-semibold">{t('contractSigning.contractEdited')}</span>
            <span className="text-orange-700 ml-2">
              ({new Date(contractData.editableTerms.lastEditedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')})
            </span>
          </div>
        )}
      </div>

      {/* Contract Content Preview */}
      <div className="bg-white rounded-lg border border-gray-300 p-6 mb-6 max-h-96 overflow-y-auto">
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ 
            __html: contractData.content?.htmlContent || '<p>' + t('contractSigning.loadingContent') + '</p>' 
          }}
        />
      </div>

      {/* Signature Section */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4">✍️ {t('contractSigning.ownerSignature')}</h4>
        
        {/* Existing Signatures Display */}
        {(contractData.signatures?.owner?.signed || contractData.signatures?.renter?.signed) && (
          <div className="mb-6 bg-white rounded-lg p-4 border border-gray-200">
            <h5 className="font-semibold mb-3 text-gray-700">{t('contractSigning.signaturesPresent')}</h5>
            <div className="grid grid-cols-2 gap-4">
              {/* Owner Signature */}
              <div className="border rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-2">👤 {t('contractSigning.owner')}</p>
                {contractData.signatures.owner?.signed ? (
                  <>
                    <img 
                      src={contractData.signatures.owner.signature} 
                      alt="Chữ ký chủ" 
                      className="w-full h-24 object-contain bg-gray-50 rounded border"
                    />
                    <p className="text-xs text-green-600 mt-2">
                      ✓ {t('contractSigning.signedAt')} {new Date(contractData.signatures.owner.signedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                    </p>
                  </>
                ) : (
                  <div className="h-24 bg-gray-100 rounded border border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">{t('contractSigning.notSignedYet')}</span>
                  </div>
                )}
              </div>

              {/* Renter Signature */}
              <div className="border rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-2">👤 {t('contractSigning.renter')}</p>
                {contractData.signatures.renter?.signed ? (
                  <>
                    <img 
                      src={contractData.signatures.renter.signature} 
                      alt="Renter signature" 
                      className="w-full h-24 object-contain bg-gray-50 rounded border"
                    />
                    <p className="text-xs text-green-600 mt-2">
                      ✓ {t('contractSigning.signedAt')} {new Date(contractData.signatures.renter.signedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                    </p>
                  </>
                ) : (
                  <div className="h-24 bg-gray-100 rounded border border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">{t('contractSigning.waitOwnerFirst')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Signature Canvas */}
        {!contractData.signatures?.owner?.signed && (
          <>
            {/* OTP Verification Section */}
            <div className="mb-6 bg-white rounded-lg p-5 border-2 border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-2xl">🔐</span>
                <h5 className="font-bold text-gray-900">{t('contractSigning.identityVerification')}</h5>
              </div>
              
              {!otpVerified ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('contractSigning.verifyDescription')}
                  </p>
                  
                  {!otpSent ? (
                    <button
                      onClick={handleSendOTP}
                      disabled={isSendingOTP || sentCount >= 3}
                      className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {isSendingOTP ? '⏳ ' + t('contractSigning.sending') : '📧 ' + t('contractSigning.sendOTPEmail')}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={otpCode}
                          onChange={handleOTPChange}
                          placeholder={t('contractSigning.enterOTP')}
                          maxLength={6}
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl font-bold tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={handleVerifyOTP}
                          disabled={otpCode.length !== 6 || isVerifyingOTP}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          {isVerifyingOTP ? '⏳ ' + t('contractSigning.verifying') : '✓ ' + t('contractSigning.verify')}
                        </button>
                      </div>
                      
                      {remainingTime > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            ⏰ {t('contractSigning.otpExpires')} <span className="font-bold text-red-600">{formatTime(remainingTime)}</span>
                          </span>
                          {sentCount < 3 && remainingTime < 30000 && (
                            <button
                              onClick={handleSendOTP}
                              disabled={isSendingOTP}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              🔄 {t('contractSigning.resendOTP')} ({sentCount}/3)
                            </button>
                          )}
                        </div>
                      )}
                      
                      {otpError && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                          ❌ {otpError}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center space-x-3 text-green-700 bg-green-50 p-4 rounded-lg">
                  <span className="text-2xl">✅</span>
                  <span className="font-semibold">{t('contractSigning.verifiedSuccess')}</span>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-3">{t('contractSigning.signHere')}</p>
            <div className="bg-white rounded-lg p-4 border-2 border-dashed border-purple-300">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className={`border border-gray-300 rounded w-full ${otpVerified ? 'cursor-crosshair' : 'cursor-not-allowed opacity-50'}`}
                style={{ touchAction: 'none' }}
              />
            </div>

            <div className="flex space-x-3 mt-4">
              <button
                onClick={clearSignature}
                disabled={!otpVerified}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🗑️ {t('contractSigning.clearSignature')}
              </button>
              <button
                onClick={handleSign}
                disabled={!signatureData || signing || !otpVerified}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
              >
                {signing ? '⏳ ' + t('contractSigning.signing') : (!otpVerified ? '🔒 ' + t('contractSigning.verifyOTPToSign') : '✍️ ' + t('contractSigning.confirmSign'))}
              </button>
            </div>
          </>
        )}

        {contractData.signatures?.owner?.signed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-700 font-semibold text-lg mb-2">✅ {t('contractSigning.alreadySigned')}</p>
            <p className="text-sm text-gray-600">{t('contractSigning.waitingRenterSign')}</p>
          </div>
        )}
      </div>

      {/* Contract Edit Modal */}
      {showEditModal && (
        <ContractEditModal
          contractId={contractData._id}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false);
            // Reload contract to show updated terms
            loadContractForSigning(contractData._id);
            toast.success('✅ ' + t('contractSigning.savedChanges'));
          }}
        />
      )}
    </div>
  );
};

export default ContractSigningInline;
