import React from 'react';
import { useTranslation } from 'react-i18next';

const Loading = ({ message = 'common.loading' }) => {
  const { t } = useTranslation();
  
  // Support both i18n keys and plain strings
  const getLabel = (label) => {
    if (typeof label === 'string' && label.startsWith('common.')) {
      return t(label);
    }
    return label;
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600">{getLabel(message)}</p>
    </div>
  );
};

export default Loading;