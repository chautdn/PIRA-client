import { useTranslation } from 'react-i18next';

/**
 * Custom hook to help with i18n translations throughout the app
 * Usage: const { t, formatDate, formatPrice, getRoleText } = useTranslationHelper();
 */
export const useTranslationHelper = () => {
  const { t, i18n } = useTranslation();
  const isVietnamese = i18n.language === 'vi';

  // Format date based on current language
  const formatDate = (dateString, options = {}) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const locale = isVietnamese ? 'vi-VN' : 'en-US';
      const defaultOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        ...(options.includeTime && {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      return date.toLocaleDateString(locale, { ...defaultOptions, ...options });
    } catch (error) {
      console.error('Date format error:', error);
      return dateString;
    }
  };

  // Format price with VND currency
  const formatPrice = (amount) => {
    if (amount === null || amount === undefined) return `0${t('common.currency_vnd')}`;
    try {
      const locale = isVietnamese ? 'vi-VN' : 'en-US';
      const formatted = new Intl.NumberFormat(locale).format(amount);
      return `${formatted}${t('common.currency_vnd')}`;
    } catch (error) {
      console.error('Price format error:', error);
      return amount;
    }
  };

  // Get translated role text
  const getRoleText = (role) => {
    const roleMap = {
      ADMIN: { en: 'Admin', vi: 'Quản trị viên' },
      RENTER: { en: 'Renter', vi: 'Người thuê' },
      OWNER: { en: 'Owner', vi: 'Chủ sở hữu' },
      SHIPPER: { en: 'Shipper', vi: 'Người giao hàng' }
    };
    const lang = isVietnamese ? 'vi' : 'en';
    return roleMap[role]?.[lang] || role;
  };

  // Get translated status text
  const getStatusText = (status) => {
    const statusMap = {
      PENDING: { en: 'Pending', vi: 'Chờ xử lý' },
      CONFIRMED: { en: 'Confirmed', vi: 'Đã xác nhận' },
      COMPLETED: { en: 'Completed', vi: 'Hoàn thành' },
      CANCELLED: { en: 'Cancelled', vi: 'Đã hủy' },
      FAILED: { en: 'Failed', vi: 'Thất bại' },
      ACTIVE: { en: 'Active', vi: 'Hoạt động' },
      INACTIVE: { en: 'Inactive', vi: 'Không hoạt động' }
    };
    const lang = isVietnamese ? 'vi' : 'en';
    return statusMap[status]?.[lang] || status;
  };

  // Get translated gender text
  const getGenderText = (gender) => {
    const genderMap = {
      MALE: { en: 'Male', vi: 'Nam' },
      NAM: { en: 'Male', vi: 'Nam' },
      FEMALE: { en: 'Female', vi: 'Nữ' },
      NỮ: { en: 'Female', vi: 'Nữ' },
      OTHER: { en: 'Other', vi: 'Khác' }
    };
    const lang = isVietnamese ? 'vi' : 'en';
    return genderMap[gender?.toUpperCase()]?.[lang] || gender || 'N/A';
  };

  return {
    t,
    i18n,
    isVietnamese,
    formatDate,
    formatPrice,
    getRoleText,
    getStatusText,
    getGenderText
  };
};

export default useTranslationHelper;
