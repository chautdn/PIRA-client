/**
 * i18n Integration Examples
 * 
 * Tệp này chứa các ví dụ cách sử dụng i18n trong các component khác nhau.
 * Bạn có thể tham khảo những ví dụ này để tích hợp i18n vào component của mình.
 */

// ============================================================
// EXAMPLE 1: Sử dụng useTranslation Hook (Cách Đơn Giản)
// ============================================================

/*
import { useTranslation } from 'react-i18next';

const ProductCard = ({ product }) => {
  const { t } = useTranslation();

  return (
    <div className="card">
      <h3>{product.name}</h3>
      <p>{t('products.rentalPrice')}: ${product.price}</p>
      <button>{t('common.addToCart')}</button>
    </div>
  );
};

export default ProductCard;
*/

// ============================================================
// EXAMPLE 2: Sử dụng useI18n Hook Tùy Chỉnh
// ============================================================

/*
import useI18n from '../../hooks/useI18n';

const LanguageInfo = () => {
  const { t, language, changeLanguage } = useI18n();

  return (
    <div>
      <p>{t('common.language')}: {language}</p>
      <button onClick={() => changeLanguage('vi')}>
        {t('common.selectLanguage')}
      </button>
    </div>
  );
};

export default LanguageInfo;
*/

// ============================================================
// EXAMPLE 3: Dịch Trong Modal/Dialog
// ============================================================

/*
import { useTranslation } from 'react-i18next';
import { Modal, Button } from 'antd';

const ConfirmModal = ({ visible, onConfirm, onCancel }) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t('common.warning')}
      open={visible}
      onOk={onConfirm}
      onCancel={onCancel}
    >
      <p>{t('validation.required')}</p>
      <div className="flex gap-2">
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="primary" onClick={onConfirm}>
          {t('common.save')}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
*/

// ============================================================
// EXAMPLE 4: Sử Dụng Interpolation (Biến Động)
// ============================================================

/*
// Trong locales/en.json:
{
  "welcome": "Welcome {{name}} to {{app}}!"
}

// Trong locales/vi.json:
{
  "welcome": "Chào mừng {{name}} đến {{app}}!"
}

// Trong Component:
import { useTranslation } from 'react-i18next';

const Welcome = ({ userName }) => {
  const { t } = useTranslation();

  return (
    <h1>{t('welcome', { name: userName, app: 'PIRA' })}</h1>
  );
};
*/

// ============================================================
// EXAMPLE 5: Dịch Danh Sách Lỗi Validation
// ============================================================

/*
import { useTranslation } from 'react-i18next';

const LoginForm = () => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState({});

  const validateForm = (data) => {
    const newErrors = {};
    
    if (!data.email) {
      newErrors.email = t('validation.required');
    } else if (!isValidEmail(data.email)) {
      newErrors.email = t('auth.invalidEmail');
    }

    if (!data.password) {
      newErrors.password = t('validation.required');
    } else if (data.password.length < 6) {
      newErrors.password = t('auth.passwordTooShort');
    }

    return newErrors;
  };

  return (
    <form>
      <input placeholder={t('auth.email')} />
      {errors.email && <span className="error">{errors.email}</span>}
      
      <input placeholder={t('auth.password')} type="password" />
      {errors.password && <span className="error">{errors.password}</span>}
      
      <button>{t('auth.login')}</button>
    </form>
  );
};
*/

// ============================================================
// EXAMPLE 6: Dịch Thông Báo Lỗi từ Server
// ============================================================

/*
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const UserForm = () => {
  const { t } = useTranslation();

  const handleSubmit = async (data) => {
    try {
      await api.post('/users', data);
      toast.success(t('common.success'));
    } catch (error) {
      // Map server error codes to i18n keys
      const errorKey = errorCodeMap[error.response.status];
      toast.error(t(errorKey || 'errors.serverError'));
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
};
*/

// ============================================================
// EXAMPLE 7: Dịch Title và Meta Tags
// ============================================================

/*
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

const ProductPage = ({ productId }) => {
  const { t } = useTranslation();

  useEffect(() => {
    // Cập nhật title trang
    document.title = t('products.title') + ' - PIRA';
  }, [t]);

  return (
    <div>
      <h1>{t('products.title')}</h1>
      <p>{t('products.description')}</p>
    </div>
  );
};
*/

// ============================================================
// EXAMPLE 8: Dịch Conditional Text
// ============================================================

/*
import { useTranslation } from 'react-i18next';

const OrderStatus = ({ status }) => {
  const { t } = useTranslation();

  const getStatusText = (status) => {
    switch(status) {
      case 'PENDING':
        return t('orders.pending');
      case 'CONFIRMED':
        return t('orders.confirmed');
      case 'COMPLETED':
        return t('orders.completed');
      default:
        return t('common.unknown');
    }
  };

  return <span className={`status ${status}`}>{getStatusText(status)}</span>;
};
*/

// ============================================================
// EXAMPLE 9: Dịch Dalam Context Provider
// ============================================================

/*
import { useTranslation } from 'react-i18next';
import { createContext, useContext } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { t } = useTranslation();

  const showNotification = (type, messageKey, options = {}) => {
    const message = t(messageKey, options);
    // ... hiển thị thông báo
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
*/

// ============================================================
// EXAMPLE 10: Dịch Trong useEffect
// ============================================================

/*
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

const ChatWindow = ({ conversationId }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const loadMessages = async () => {
      try {
        // Load messages...
      } catch (error) {
        // Hiển thị lỗi bằng i18n
        console.error(t('chat.messageFailed'));
      }
    };

    loadMessages();
  }, [t, conversationId]);

  return (
    <div>
      <h2>{t('chat.title')}</h2>
      {/* Chat content */}
    </div>
  );
};
*/

// ============================================================
// HOW TO IMPLEMENT IN YOUR COMPONENTS
// ============================================================

/*
1. Thêm key dịch vào locales/en.json và locales/vi.json
2. Import useTranslation hoặc useI18n
3. Sử dụng t() function để lấy text dịch
4. Component sẽ tự động cập nhật khi ngôn ngữ thay đổi

KHÔNG CẦN:
- Manual re-render
- Manual event listeners
- Manual state management cho ngôn ngữ

i18next sẽ tự động:
- Detect thay đổi ngôn ngữ
- Cập nhật tất cả component
- Lưu tùy chỉnh vào localStorage
- Phát hiện ngôn ngữ mặc định từ browser
*/

export default {};
