import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from 'antd';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  useEffect(() => {
    // Initialize with the stored language or default to 'vi'
    const storedLang = localStorage.getItem('i18nextLng') || 'vi';
    if (storedLang !== i18n.language) {
      i18n.changeLanguage(storedLang);
    }
    setCurrentLang(storedLang);
  }, [i18n]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setCurrentLang(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-base">🌐</span>
      <Select
        value={currentLang}
        onChange={changeLanguage}
        style={{ width: 110 }}
        options={[
          { value: 'en', label: 'English' },
          { value: 'vi', label: 'Tiếng Việt' },
        ]}
        className="language-selector"
      />
    </div>
  );
};

export default LanguageSwitcher;