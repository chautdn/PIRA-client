import { useTranslation } from 'react-i18next';

/**
 * Custom hook for i18n translations
 * Usage: const { t, i18n, language } = useI18n();
 */
export const useI18n = () => {
  const { t, i18n } = useTranslation();

  return {
    t, // Translation function
    i18n, // i18n instance
    language: i18n.language, // Current language
    changeLanguage: i18n.changeLanguage, // Function to change language
  };
};

export default useI18n;
