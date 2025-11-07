import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          nav: {
            home: 'Home',
            products: 'Products',
            cart: 'Cart',
            wishlist: 'Wishlist',
            orders: 'Orders',
            chat: 'Chat',
            wallet: 'Wallet'
          },
          auth: {
            login: 'Login',
            register: 'Register',
            logout: 'Logout'
          }
        }
      },
      vi: {
        translation: {
          nav: {
            home: 'Trang Chủ',
            products: 'Sản Phẩm',
            cart: 'Giỏ Hàng',
            wishlist: 'Yêu Thích',
            orders: 'Đơn Hàng',
            chat: 'Tin Nhắn',
            wallet: 'Ví'
          },
          auth: {
            login: 'Đăng Nhập',
            register: 'Đăng Ký',
            logout: 'Đăng Xuất'
          }
        }
      }
    },
    lng: 'vi', // Default language
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false
    }
  });

// Handle language changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
  console.log('Language changed to:', lng);
});

// Initialize language from localStorage
const savedLang = localStorage.getItem('i18nextLng');
if (savedLang) {
  i18n.changeLanguage(savedLang);
}

export default i18n;