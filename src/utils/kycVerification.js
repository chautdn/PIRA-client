/**
 * Utility functions for KYC verification checks
 */

/**
 * Check if user has completed all required KYC steps
 * @param {Object} user - User object from AuthContext
 * @returns {Object} - { isComplete: boolean, missing: string[] }
 */
export const checkKYCRequirements = (user) => {
  const missing = [];

  // Check CCCD verification - must be verified
  if (!user?.cccd?.isVerified) {
    missing.push('cccd');
  }

  // Check phone number - must exist and not be empty
  if (!user?.phone || user.phone.trim() === '') {
    missing.push('phone');
  }

  // Check address exists - just check if any address field has value
  const hasAnyAddress = 
    (user?.address?.streetAddress && user.address.streetAddress.trim() !== '') ||
    (user?.address?.district && user.address.district.trim() !== '') ||
    (user?.address?.city && user.address.city.trim() !== '') ||
    (user?.address?.ward && user.address.ward.trim() !== '');
  
  if (!hasAnyAddress) {
    missing.push('address');
  }

  return {
    isComplete: missing.length === 0,
    missing
  };
};

/**
 * Get human-readable requirement labels
 * @param {string} requirement - Requirement key (cccd, phone, address)
 * @returns {string} - Human-readable label
 */
export const getRequirementLabel = (requirement) => {
  const labels = {
    cccd: 'Xác thực CCCD/CMND',
    phone: 'Số điện thoại',
    address: 'Địa chỉ'
  };
  return labels[requirement] || requirement;
};

/**
 * Get requirement description
 * @param {string} requirement - Requirement key
 * @returns {string} - Description
 */
export const getRequirementDescription = (requirement) => {
  const descriptions = {
    cccd: 'Xác thực danh tính bằng CCCD/CMND để đảm bảo tính xác thực',
    phone: 'Cung cấp số điện thoại để chúng tôi có thể liên hệ khi cần thiết',
    address: 'Cung cấp địa chỉ để giao nhận sản phẩm'
  };
  return descriptions[requirement] || '';
};

/**
 * Get requirement icon
 * @param {string} requirement - Requirement key
 * @returns {string} - Emoji icon
 */
export const getRequirementIcon = (requirement) => {
  const icons = {
    cccd: '🆔',
    phone: '📱',
    address: '📍'
  };
  return icons[requirement] || '📋';
};
