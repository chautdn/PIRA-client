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
          ,
          home: {
            badge: 'Trusted by 10,000+ travelers',
            title_line1: 'Adventure Awaits.',
            title_line2: 'Rent Travel Gear Now!',
            description:
              'Explore. Capture. Share. Access premium travel gear from trusted locals.',
            title: 'Home',
            categories: {
              camera: 'Camera',
              backpack: 'Backpack',
              tent: 'Tent',
              luggage: 'Luggage',
              flycam: 'Flycam',
              gps: 'GPS'
            },
            categories_title: 'Explore by Category',
            categories_description: 'Find the right gear for your adventure',
            categories: {
              camera: 'Camera',
              backpack: 'Backpack',
              tent: 'Tent',
              luggage: 'Luggage',
              flycam: 'Flycam',
              gps: 'GPS'
            },
            cta_search: 'Find Gear Now',
            cta_rent: 'Become a Renter'
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
          ,
          home: {
            badge: 'Được tin tưởng bởi 10,000+ du khách',
            title_line1: 'Cuộc Phiêu Lưu Đang Chờ.',
            title_line2: 'Thuê Thiết Bị Du Lịch Ngay!',
            description:
              '🏔️ Khám phá. 📸 Ghi lại. 🌍 Chia sẻ. Truy cập thiết bị du lịch cao cấp từ những người địa phương đáng tin cậy.',
            title: 'Trang Chủ',
            categories_title: 'Khám Phá Theo Danh Mục',
            categories_description: 'Tìm thiết bị phù hợp cho chuyến phiêu lưu của bạn',
            categories: {
              camera: 'Camera',
              backpack: 'Balo',
              tent: 'Lều Trại',
              luggage: 'Vali',
              flycam: 'Flycam',
              gps: 'GPS'
            },
            cta_search: 'Tìm Thiết Bị Ngay',
            cta_rent: 'Cho Thuê Đồ'
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