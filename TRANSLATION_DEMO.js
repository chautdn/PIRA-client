/**
 * DEMO: Cách Dịch Toàn Bộ Hệ Thống PIRA
 * 
 * Đây là ví dụ thực tế để bạn hiểu cách thay đổi code
 */

// ============================================================
// TRƯỚC (Hardcoded - SAI)
// ============================================================
const BEFORE_HOME_PAGE = `
export default function Home() {
  return (
    <div>
      <h1>Cuộc Phiêu Lưu Du Lịch Đang Chờ Đợi</h1>
      <p>Thuê Thiết Bị Du Lịch Cao Cấp</p>
      <button>Bắt Đầu Ngay Hôm Nay</button>
      
      <div>
        <h2>Được Tin Tưởng Bởi Du Khách Toàn Cầu</h2>
      </div>
    </div>
  );
}
`;

// ============================================================
// SAU (Sử dụng i18n - ĐÚNG)
// ============================================================
const AFTER_HOME_PAGE = `
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('pages.home.hero.title')}</h1>
      <p>{t('pages.home.hero.description')}</p>
      <button>{t('pages.home.hero.cta')}</button>
      
      <div>
        <h2>{t('pages.home.testimonials.title')}</h2>
      </div>
    </div>
  );
}
`;

// ============================================================
// TRƯỚC (Hardcoded formatting - SAI)
// ============================================================
const BEFORE_PRODUCT_LIST = `
export default function ProductList() {
  const products = [
    { id: 1, name: 'Camera', price: 100000 },
    { id: 2, name: 'Backpack', price: 50000 }
  ];
  
  return (
    <div>
      {products.map(p => (
        <div key={p.id}>
          <h3>{p.name}</h3>
          <p>{p.price.toLocaleString('vi-VN')}đ</p>
        </div>
      ))}
    </div>
  );
}
`;

// ============================================================
// SAU (Sử dụng translation helper - ĐÚNG)
// ============================================================
const AFTER_PRODUCT_LIST = `
import { useTranslationHelper } from '../hooks/useTranslationHelper';

export default function ProductList() {
  const { t, formatPrice } = useTranslationHelper();
  
  const products = [
    { id: 1, name: 'Camera', price: 100000 },
    { id: 2, name: 'Backpack', price: 50000 }
  ];
  
  return (
    <div>
      <h1>{t('pages.productList.title')}</h1>
      {products.map(p => (
        <div key={p.id}>
          <h3>{p.name}</h3>
          <p>{formatPrice(p.price)}</p>
        </div>
      ))}
    </div>
  );
}
`;

// ============================================================
// TRƯỚC (Hardcoded dates - SAI)
// ============================================================
const BEFORE_PRODUCT_DETAIL = `
export default function ProductDetail() {
  const product = {
    title: 'Camera 4K',
    createdAt: '2025-12-08T10:30:00Z'
  };
  
  return (
    <div>
      <h1>{product.title}</h1>
      <p>Đăng ngày: {new Date(product.createdAt).toLocaleDateString('vi-VN')}</p>
    </div>
  );
}
`;

// ============================================================
// SAU (Sử dụng translation helper - ĐÚNG)
// ============================================================
const AFTER_PRODUCT_DETAIL = `
import { useTranslationHelper } from '../hooks/useTranslationHelper';

export default function ProductDetail() {
  const { t, formatDate } = useTranslationHelper();
  
  const product = {
    title: 'Camera 4K',
    createdAt: '2025-12-08T10:30:00Z'
  };
  
  return (
    <div>
      <h1>{product.title}</h1>
      <p>{t('common.date')}: {formatDate(product.createdAt)}</p>
    </div>
  );
}
`;

// ============================================================
// TRƯỚC (Hardcoded roles - SAI)
// ============================================================
const BEFORE_USER_PROFILE = `
export default function UserProfile({ user }) {
  const roleText = {
    OWNER: 'Chủ sở hữu',
    RENTER: 'Người thuê',
    SHIPPER: 'Người giao hàng'
  };
  
  return (
    <div>
      <h1>{user.profile.fullName}</h1>
      <p>Vai trò: {roleText[user.role] || user.role}</p>
    </div>
  );
}
`;

// ============================================================
// SAU (Sử dụng translation helper - ĐÚNG)
// ============================================================
const AFTER_USER_PROFILE = `
import { useTranslationHelper } from '../hooks/useTranslationHelper';

export default function UserProfile({ user }) {
  const { t, getRoleText } = useTranslationHelper();
  
  return (
    <div>
      <h1>{user.profile.fullName}</h1>
      <p>{t('common.status')}: {getRoleText(user.role)}</p>
    </div>
  );
}
`;

// ============================================================
// STEP-BY-STEP GUIDE
// ============================================================
const STEP_BY_STEP = `
🎯 BƯỚC 1: Thêm Key vào Locale Files
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thêm vào src/locales/en.json:
{
  "pages": {
    "myPage": {
      "title": "Page Title",
      "description": "Page Description",
      "button": "Click Me"
    }
  }
}

Thêm vào src/locales/vi.json:
{
  "pages": {
    "myPage": {
      "title": "Tiêu Đề Trang",
      "description": "Mô Tả Trang",
      "button": "Nhấp Vào"
    }
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 BƯỚC 2: Import useTranslation trong Component
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useTranslation } from 'react-i18next';

// Hoặc nếu cần formatting:
import { useTranslationHelper } from '../hooks/useTranslationHelper';

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 BƯỚC 3: Sử dụng trong Component
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { t } = useTranslation();

return (
  <div>
    <h1>{t('pages.myPage.title')}</h1>
    <p>{t('pages.myPage.description')}</p>
    <button>{t('pages.myPage.button')}</button>
  </div>
);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 BƯỚC 4: Test Language Switcher
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Mở ứng dụng
2. Click nút globe icon (🌐) trên navbar
3. Chọn English hoặc Tiếng Việt
4. Text sẽ thay đổi ngay lập tức
`;

console.log(STEP_BY_STEP);

// ============================================================
// FORMAT FUNCTIONS EXAMPLES
// ============================================================
const FORMAT_EXAMPLES = `
📅 Format Date Example
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { formatDate } = useTranslationHelper();

formatDate('2025-12-08')
// Kết quả:
// - English: 12/08/2025
// - Vietnamese: 08/12/2025

formatDate('2025-12-08T10:30:00Z', { includeTime: true })
// Kết quả:
// - English: 12/08/2025, 10:30 AM
// - Vietnamese: 08/12/2025, 10:30

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Format Price Example
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { formatPrice } = useTranslationHelper();

formatPrice(150000)
// Kết quả:
// - English: 150,000 VND
// - Vietnamese: 150.000 VND

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Get Role Text Example
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { getRoleText } = useTranslationHelper();

getRoleText('OWNER')
// Kết quả:
// - English: Owner
// - Vietnamese: Chủ sở hữu

getRoleText('RENTER')
// Kết quả:
// - English: Renter
// - Vietnamese: Người thuê

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Get Status Text Example
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { getStatusText } = useTranslationHelper();

getStatusText('PENDING')
// Kết quả:
// - English: Pending
// - Vietnamese: Chờ xử lý

getStatusText('COMPLETED')
// Kết quả:
// - English: Completed
// - Vietnamese: Hoàn thành
`;

console.log(FORMAT_EXAMPLES);
