import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    setIsMenuVisible(false);
  };

  return (
    <div className="relative">
      <Button
        type="text"
        icon={<GlobalOutlined />}
        onClick={() => setIsMenuVisible(!isMenuVisible)}
        className="flex items-center gap-2"
      >
        {i18n.language === 'en' ? 'EN' : 'VI'}
      </Button>
      {isMenuVisible && (
        <div className="absolute top-full mt-1 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px] z-50">
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={() => handleLanguageChange('en')}
          >
            English
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={() => handleLanguageChange('vi')}
          >
            Tiếng Việt
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;