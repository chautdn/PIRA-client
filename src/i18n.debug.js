// Debug: Log language changes
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
  console.log('Current language from i18n:', i18n.language);
  console.log('Language from localStorage:', localStorage.getItem('i18nextLng'));
});