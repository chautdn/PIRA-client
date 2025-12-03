import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, X, CheckCircle, XCircle, Phone, MapPin, CreditCard, Shield, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getRequirementLabel, getRequirementDescription, getRequirementIcon } from '../../utils/kycVerification';

/**
 * KYC Warning Modal - Shows missing requirements and redirects to profile
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close modal callback
 * @param {string[]} missingRequirements - Array of missing requirements (cccd, phone, address)
 */
const KycWarningModal = ({ isOpen, onClose, missingRequirements = [] }) => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  // Refresh user data when modal opens to get latest info
  React.useEffect(() => {
    if (isOpen && refreshUser) {
      refreshUser().catch(err => {
        console.error('Failed to refresh user data:', err);
      });
    }
  }, [isOpen, refreshUser]);

  // Filter out requirements that are actually complete
  const actuallyMissing = React.useMemo(() => {
    if (!user) return missingRequirements;
    
    return missingRequirements.filter(req => {
      switch (req) {
        case 'cccd':
          return !user?.cccd?.isVerified;
        case 'phone':
          return !user?.phone || user.phone.trim() === '';
        case 'address':
          const hasStreet = user?.address?.streetAddress && user.address.streetAddress.trim() !== '';
          const hasWard = user?.address?.ward && user.address.ward.trim() !== '';
          const hasDistrict = user?.address?.district && user.address.district.trim() !== '';
          let cityValue = user?.address?.city || '';
          if (cityValue) {
            cityValue = cityValue.replace(/^(Thành phố|Thành Phố|Tỉnh)\s+/i, '').trim();
          }
          const hasCity = cityValue && cityValue.trim() !== '';
          return !(hasStreet || hasWard || hasDistrict || hasCity);
        default:
          return true;
      }
    });
  }, [user, missingRequirements]);

  // If nothing is actually missing, don't show modal
  React.useEffect(() => {
    if (isOpen && actuallyMissing.length === 0) {
      onClose();
    }
  }, [isOpen, actuallyMissing, onClose]);

  const getRequirementStatus = (requirement) => {
    switch (requirement) {
      case 'cccd':
        return {
          current: user?.cccd?.isVerified ? 'Đã xác thực' : 'Chưa xác thực',
          hasValue: user?.cccd?.isVerified,
          icon: user?.cccd?.isVerified ? CheckCircle : XCircle,
          iconColor: user?.cccd?.isVerified ? 'text-green-600' : 'text-red-600'
        };
      case 'phone':
        return {
          current: user?.phone || 'Chưa có số điện thoại',
          hasValue: !!user?.phone,
          icon: user?.phone ? Phone : XCircle,
          iconColor: user?.phone ? 'text-blue-600' : 'text-red-600'
        };
      case 'address':
        // Check if ANY address field has value
        const hasStreetAddress = user?.address?.streetAddress && user.address.streetAddress.trim() !== '';
        const hasWard = user?.address?.ward && user.address.ward.trim() !== '';
        const hasDistrict = user?.address?.district && user.address.district.trim() !== '';
        
        // Clean city name - remove "Thành phố", "Thành Phố", "Tỉnh" prefixes
        let cityValue = user?.address?.city || '';
        if (cityValue) {
          cityValue = cityValue.replace(/^(Thành phố|Thành Phố|Tỉnh)\s+/i, '').trim();
        }
        const hasCity = cityValue && cityValue.trim() !== '';
        
        const hasAnyAddress = hasStreetAddress || hasWard || hasDistrict || hasCity;
        
        const addressParts = [];
        
        if (hasStreetAddress) {
          addressParts.push(user.address.streetAddress);
        }
        if (hasWard) {
          addressParts.push(user.address.ward);
        }
        if (hasDistrict) {
          addressParts.push(user.address.district);
        }
        if (hasCity) {
          addressParts.push(cityValue);
        }
        
        return {
          current: addressParts.length > 0 
            ? addressParts.join(', ') 
            : 'Chưa có địa chỉ',
          hasValue: hasAnyAddress,
          icon: hasAnyAddress ? MapPin : XCircle,
          iconColor: hasAnyAddress ? 'text-purple-600' : 'text-red-600',
          details: !hasAnyAddress ? 'Vui lòng thêm địa chỉ của bạn' : null
        };
      default:
        return { 
          current: 'Chưa có', 
          hasValue: false,
          icon: XCircle,
          iconColor: 'text-red-600'
        };
    }
  };

  const handleGoToProfile = () => {
    navigate('/profile');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full overflow-hidden max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">Yêu Cầu Xác Thực</h3>
                    <p className="text-xs text-white/90 hidden sm:block">Vui lòng hoàn thành thông tin</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <span className="text-white font-bold text-lg sm:text-xl">×</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-3 sm:py-4">
              {/* Why section */}
              <div className="mb-3 sm:mb-4 bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-blue-900 mb-1 text-xs sm:text-sm">Tại sao cần xác thực?</h4>
                    <ul className="text-[11px] sm:text-xs text-blue-800 space-y-0.5 sm:space-y-1">
                      <li className="flex items-start">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0 text-blue-600" />
                        <span><strong>An toàn:</strong> Bảo vệ giao dịch của bạn khỏi gian lận</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0 text-blue-600" />
                        <span><strong>Xác thực:</strong> Đảm bảo thông tin người thuê chính xác</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0 text-blue-600" />
                        <span><strong>Tin cậy:</strong> Tạo môi trường cho thuê đáng tin cậy</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0 text-blue-600" />
                        <span><strong>Pháp lý:</strong> Tuân thủ quy định về thuê cho thuê</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Missing requirements */}
              <div className="mb-3 sm:mb-4">
                <h4 className="font-bold text-gray-900 mb-1.5 sm:mb-2 text-xs sm:text-sm">Bạn cần hoàn thành:</h4>
                <div className="space-y-2">
                  {actuallyMissing.map((requirement, index) => {
                    const status = getRequirementStatus(requirement);
                    const IconComponent = requirement === 'cccd' ? CreditCard : requirement === 'phone' ? Phone : MapPin;
                    return (
                      <motion.div
                        key={requirement}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex flex-col space-y-1.5 p-2.5 sm:p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 mb-0.5 text-xs sm:text-sm">
                              {getRequirementLabel(requirement)}
                            </div>
                            <div className="text-[11px] sm:text-xs text-gray-700 mb-1 sm:mb-1.5 leading-snug">
                              {getRequirementDescription(requirement)}
                            </div>
                            
                            {/* Current status */}
                            <div className="bg-white/60 rounded-lg p-1.5 sm:p-2 border border-orange-200">
                              <div className="text-[10px] sm:text-xs font-medium text-gray-600 mb-0.5">Trạng thái:</div>
                              <div className="flex items-center space-x-1.5 sm:space-x-2">
                                <status.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${status.iconColor}`} />
                                <div className={`text-xs sm:text-sm font-medium truncate ${status.hasValue ? 'text-orange-700' : 'text-red-700'}`}>
                                  {status.current}
                                </div>
                              </div>
                              {status.details && (
                                <div className="flex items-center space-x-1 text-[11px] sm:text-xs text-red-600 mt-0.5 sm:mt-1">
                                  <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                  <span>{status.details}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-orange-200 text-orange-800">
                              Bắt buộc
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors text-xs sm:text-sm active:scale-95">
                  Để sau
                </button>
                <button
                  onClick={handleGoToProfile}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm"
                >
                  <span>Đi đến Trang Cá Nhân</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>

              {/* Info note */}
              <div className="mt-2.5 sm:mt-3 text-center">
                <p className="text-[10px] sm:text-xs text-gray-500 flex items-center justify-center space-x-1 leading-tight">
                  <Shield className="w-3 h-3 flex-shrink-0" />
                  <span>Quá trình xác thực chỉ mất vài phút và chỉ cần thực hiện 1 lần</span>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default KycWarningModal;
