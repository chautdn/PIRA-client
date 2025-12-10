import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobalOutlined } from '@ant-design/icons';
import { Button } from 'antd';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', label: '🇬🇧 English' },
    { code: 'vi', label: '🇻🇳 Tiếng Việt' },
  ];

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentLanguage = i18n.language;
  const currentLabel = languages.find(l => l.code === currentLanguage)?.label || '🇬🇧 English';

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="text"
        icon={<GlobalOutlined />}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1"
        title="Language / Ngôn ngữ"
      >
        {currentLabel}
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors ${
                currentLanguage === lang.code ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
