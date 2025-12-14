import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/admin';
import { useI18n } from '../../hooks/useI18n';
import { translateCategory } from '../../utils/categoryTranslation';

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { i18n } = useI18n();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [loadingTab, setLoadingTab] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    type: '', // 'status' or 'role'
    newValue: '',
    currentValue: '',
    message: ''
  });

  // Show notification function
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000); // Auto hide after 3 seconds
  };

  // Fetch orders for user
  const fetchOrders = async () => {
    setLoadingTab(true);
    try {
      const ordersData = await adminService.getUserOrders(userId);
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoadingTab(false);
    }
  };

  // Fetch products for owner
  const fetchProducts = async () => {
    setLoadingTab(true);
    try {
      const productsData = await adminService.getUserProducts(userId);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoadingTab(false);
    }
  };

  // Fetch bank account
  const [bankAccount, setBankAccount] = useState(null);
  const fetchBankAccount = async () => {
    setLoadingTab(true);
    try {
      const bankData = await adminService.getUserBankAccount(userId);
      setBankAccount(bankData);
    } catch (error) {
      console.error('Error fetching bank account:', error);
      setBankAccount(null);
    } finally {
      setLoadingTab(false);
    }
  };

  // Handle tab change
  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (tab === 'orders' && orders.length === 0) {
      await fetchOrders();
    } else if (tab === 'products' && products.length === 0) {
      await fetchProducts();
    } else if (tab === 'bank' && !bankAccount) {
      await fetchBankAccount();
    }
  };



  useEffect(() => {
    if (userId) {
      loadUserDetail();
    }
  }, [userId]);

  const loadUserDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = await adminService.getUserById(userId);
      
      if (!userData) {
        setError('User không tồn tại hoặc đã bị xóa');
        setUser(null);
        return;
      }
      
      setUser(userData);

      // Load initial stats data
      if (userData.role === 'OWNER' || userData.role === 'RENTER') {
        // Fetch orders and products in background to show stats
        fetchOrders();
        if (userData.role === 'OWNER') {
          fetchProducts();
        }
      }
    } catch (err) {
      console.error('Load user detail error:', err);
      setError('Không thể tải thông tin user. Vui lòng thử lại');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };



  const handleStatusChange = async (newStatus) => {
    if (newStatus === user.status) return; // No change
    
    const statusLabels = {
      ACTIVE: 'Hoạt động',
      INACTIVE: 'Không hoạt động', 
      SUSPENDED: 'Tạm khóa',
      PENDING: 'Chờ xử lý'
    };

    setConfirmDialog({
      show: true,
      type: 'status',
      newValue: newStatus,
      currentValue: user.status,
      message: `Bạn có chắc chắn muốn thay đổi trạng thái từ "${statusLabels[user.status]}" thành "${statusLabels[newStatus]}"?`
    });
  };

  const handleRoleChange = async (newRole) => {
    if (newRole === user.role) return; // No change

    const roleLabels = {
      ADMIN: 'Quản trị viên',
      OWNER: 'Chủ sở hữu',
      RENTER: 'Người thuê',
      SHIPPER: 'Shipper'
    };

    setConfirmDialog({
      show: true,
      type: 'role',
      newValue: newRole,
      currentValue: user.role,
      message: `Bạn có chắc chắn muốn thay đổi vai trò từ "${roleLabels[user.role]}" thành "${roleLabels[newRole]}"?`
    });
  };

  const confirmChange = async () => {
    const { type, newValue } = confirmDialog;
    setConfirmDialog({ show: false, type: '', newValue: '', currentValue: '', message: '' });

    try {
      if (type === 'status') {
        await adminService.updateUserStatus(userId, newValue);
        setUser(prev => ({ ...prev, status: newValue }));
        showNotification('Cập nhật trạng thái thành công!', 'success');
      } else if (type === 'role') {
        await adminService.updateUserRole(userId, newValue);
        setUser(prev => ({ ...prev, role: newValue }));
        showNotification('Cập nhật vai trò thành công!', 'success');
      }
    } catch (err) {
      console.error(`Update ${type} error:`, err);
      showNotification(`Có lỗi xảy ra khi cập nhật ${type === 'status' ? 'trạng thái' : 'vai trò'}!`, 'error');
    }
  };

  const cancelChange = () => {
    setConfirmDialog({ show: false, type: '', newValue: '', currentValue: '', message: '' });
  };

  const getUserStatusBadge = (status) => {
    const statusClasses = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-red-100 text-red-800',
      SUSPENDED: 'bg-yellow-100 text-yellow-800',
      PENDING: 'bg-blue-100 text-blue-800'
    };
    
    const statusText = {
      ACTIVE: 'Hoạt động',
      INACTIVE: 'Không hoạt động',
      SUSPENDED: 'Tạm khóa',
      PENDING: 'Chờ xác thực'
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusText[status] || status}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleClasses = {
      ADMIN: 'bg-purple-100 text-purple-800',
      RENTER: 'bg-blue-100 text-blue-800',
      OWNER: 'bg-green-100 text-green-800',
      SHIPPER: 'bg-orange-100 text-orange-800'
    };

    const roleText = {
      ADMIN: 'Admin',
      RENTER: 'Người thuê',
      OWNER: 'Chủ sở hữu',
      SHIPPER: 'Shipper'
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${roleClasses[role] || 'bg-gray-100 text-gray-800'}`}>
        {roleText[role] || role}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCountryName = (countryCode) => {
    const countryMap = {
      'VN': 'Việt Nam',
      'US': 'United States', 
      'JP': 'Japan',
      'KR': 'Korea',
      'CN': 'China'
    };
    return countryMap[countryCode] || countryCode;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        
        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Link 
            to="/admin/users" 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết User</h1>
        </div>

        {/* Error message with retry option */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Không thể tải thông tin user
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error || 'Không tìm thấy user với ID này'}</p>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={loadUserDetail}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  Thử lại
                </button>
                <Link
                  to="/admin/users"
                  className="px-4 py-2 border border-red-300 text-red-700 text-sm rounded-lg hover:bg-red-50 transition-colors"
                >
                  Quay lại danh sách
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Component */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 ${
          notification.type === 'success' 
            ? 'border-green-500' 
            : notification.type === 'error' 
            ? 'border-red-500' 
            : 'border-blue-500'
        } p-4 transform transition-all duration-300 ease-in-out`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {notification.type === 'success' && (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'error' && (
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className={`text-sm font-medium ${
                notification.type === 'success' 
                  ? 'text-green-800' 
                  : notification.type === 'error' 
                  ? 'text-red-800' 
                  : 'text-blue-800'
              }`}>
                {notification.message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => setNotification({ show: false, message: '', type: '' })}
                className={`inline-flex text-sm ${
                  notification.type === 'success' 
                    ? 'text-green-500 hover:text-green-600' 
                    : notification.type === 'error' 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-blue-500 hover:text-blue-600'
                } focus:outline-none`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <Link 
            to="/admin/users" 
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">
              {user.profile?.firstName || ''} {user.profile?.lastName || ''}
            </h1>
            <p className="text-blue-100 text-sm mt-1">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {getRoleBadge(user.role)}
            {getUserStatusBadge(user.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                  {user.profile?.avatar ? (
                    <img src={user.profile.avatar} alt="" className="w-24 h-24 rounded-2xl object-cover" />
                  ) : (
                    <span className="text-white text-3xl font-bold">
                      {user.profile?.firstName?.charAt(0) || ''}{user.profile?.lastName?.charAt(0) || ''}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {user.profile?.firstName || ''} {user.profile?.lastName || ''}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Tham gia từ {formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Thông tin cá nhân</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <label className="text-xs font-medium text-gray-600 uppercase">Họ và tên</label>
                </div>
                <p className="text-gray-900 font-medium">{user.profile?.firstName || ''} {user.profile?.lastName || 'Chưa có'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <label className="text-xs font-medium text-gray-600 uppercase">Email</label>
                </div>
                <p className="text-gray-900 font-medium truncate">{user.email || 'Chưa có email'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <label className="text-xs font-medium text-gray-600 uppercase">Số điện thoại</label>
                </div>
                <p className="text-gray-900 font-medium">{user.phone || 'Chưa có'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <label className="text-xs font-medium text-gray-600 uppercase">Ngày sinh</label>
                </div>
                <p className="text-gray-900 font-medium">
                  {user.profile?.dateOfBirth 
                    ? new Date(user.profile.dateOfBirth).toLocaleDateString('vi-VN')
                    : 'Chưa có'
                  }
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <label className="text-xs font-medium text-gray-600 uppercase">Giới tính</label>
                </div>
                <p className="text-gray-900 font-medium">
                  {(() => {
                    const genderMap = { 'MALE': 'Nam', 'FEMALE': 'Nữ', 'OTHER': 'Khác' };
                    return genderMap[user.profile?.gender] || 'Chưa có';
                  })()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <label className="text-xs font-medium text-purple-700 uppercase">Điểm tín dụng</label>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-2xl text-purple-900 font-bold">{user.creditScore || 100}</p>
                  <span className="text-sm text-purple-600">/1000</span>
                  <div className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    user.creditScore >= 800 ? 'bg-green-100 text-green-800' :
                    user.creditScore >= 600 ? 'bg-yellow-100 text-yellow-800' :
                    user.creditScore >= 400 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {user.creditScore >= 800 ? '⭐ Xuất sắc' :
                     user.creditScore >= 600 ? '👍 Tốt' :
                     user.creditScore >= 400 ? '📊 Trung bình' : '⚠️ Kém'}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  <label className="text-xs font-medium text-gray-600 uppercase">ID User</label>
                </div>
                <p className="text-gray-900 font-mono text-xs truncate">{user._id}</p>
              </div>
            </div>
          </div>

          {/* Address Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Địa chỉ</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Đường/Số nhà</label>
                <p className="text-gray-900 font-medium">{user.address?.streetAddress || 'Chưa có'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Tỉnh/Thành phố</label>
                <p className="text-gray-900 font-medium">{user.address?.province || 'Chưa có'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Quận/Huyện</label>
                <p className="text-gray-900 font-medium">{user.address?.district || 'Chưa có'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Thành phố</label>
                <p className="text-gray-900 font-medium">{user.address?.city || 'Chưa có'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Quốc gia</label>
                <p className="text-gray-900 font-medium">
                  {getCountryName(user.address?.country || 'VN')}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Actions & Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Thao tác nhanh</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thay đổi trạng thái</label>
                <select
                  value={user.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Không hoạt động</option>
                  <option value="SUSPENDED">Tạm khóa</option>
                  <option value="PENDING">Chờ xác thực</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thay đổi vai trò</label>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="RENTER">Người thuê</option>
                  <option value="OWNER">Chủ sở hữu</option>
                  <option value="SHIPPER">Shipper</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Stats */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Thống kê</h3>
            </div>
            <div className="space-y-3">
              {user.role === 'OWNER' && (
                <>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <span className="text-gray-700 font-medium">Sản phẩm</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">{products.length}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <span className="text-gray-700 font-medium">Đơn hàng</span>
                      </div>
                      <span className="text-2xl font-bold text-green-600">{orders.length}</span>
                    </div>
                  </div>
                </>
              )}
              {user.role === 'RENTER' && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <span className="text-gray-700 font-medium">Đã thuê</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">{orders.length}</span>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">Điểm</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">{user.creditScore || 100}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Hoạt động</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Đăng nhập lần cuối</p>
                  <p className="text-xs text-gray-500 mt-0.5">{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Chưa có'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Cập nhật thông tin</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDate(user.updatedAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Tạo tài khoản</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation for OWNER role */}
      {user.role === 'OWNER' && (
        <div className="mt-8">
          {/* Tab Headers */}
          <div className="bg-white rounded-t-xl shadow-sm border border-gray-100">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px overflow-x-auto">
                <button
                  onClick={() => handleTabChange('orders')}
                  className={`relative px-6 py-4 text-sm font-semibold border-b-3 transition-all whitespace-nowrap ${
                    activeTab === 'orders'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Đơn hàng</span>
                    {orders.length > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-blue-500 text-white rounded-full">
                        {orders.length}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => handleTabChange('products')}
                  className={`relative px-6 py-4 text-sm font-semibold border-b-3 transition-all whitespace-nowrap ${
                    activeTab === 'products'
                      ? 'border-green-500 text-green-600 bg-green-50'
                      : 'border-transparent text-gray-600 hover:text-green-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span>Sản phẩm</span>
                    {products.length > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-green-500 text-white rounded-full">
                        {products.length}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => handleTabChange('bank')}
                  className={`relative px-6 py-4 text-sm font-semibold border-b-3 transition-all whitespace-nowrap ${
                    activeTab === 'bank'
                      ? 'border-purple-500 text-purple-600 bg-purple-50'
                      : 'border-transparent text-gray-600 hover:text-purple-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>Ngân hàng</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-100 p-6">
            {loadingTab ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Đơn hàng ({orders.length})
                    </h3>
                    {orders.length === 0 ? (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">Chưa có đơn hàng nào</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người thuê</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian thuê</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {user.role === 'OWNER' ? (
                              // Display SubOrders for OWNER
                              orders.map((subOrder) => (
                                <tr key={subOrder._id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center">
                                      {subOrder.product?.images && subOrder.product.images.length > 0 ? (
                                        <img
                                          src={subOrder.product.images[0].url || subOrder.product.images[0]}
                                          alt={subOrder.product.title}
                                          className="w-12 h-12 rounded object-cover mr-3"
                                        />
                                      ) : (
                                        <div className="w-12 h-12 rounded bg-gray-200 mr-3"></div>
                                      )}
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {subOrder.product?.title || 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-500">#{subOrder._id?.slice(-8)}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {subOrder.masterOrder?.renter?.profile?.firstName} {subOrder.masterOrder?.renter?.profile?.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500">{subOrder.masterOrder?.renter?.email}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {subOrder.rentalPeriod?.startDate 
                                        ? new Date(subOrder.rentalPeriod.startDate).toLocaleDateString('vi-VN')
                                        : 'N/A'
                                      }
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {subOrder.rentalPeriod?.endDate
                                        ? `đến ${new Date(subOrder.rentalPeriod.endDate).toLocaleDateString('vi-VN')}`
                                        : ''
                                      }
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {subOrder.totalAmount?.toLocaleString('vi-VN') || '0'}đ
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      subOrder.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                      subOrder.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                                      subOrder.status === 'PENDING_CONFIRMATION' ? 'bg-yellow-100 text-yellow-800' :
                                      subOrder.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {subOrder.status}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              // Display MasterOrders for RENTER
                              orders.map((order) => (
                                <tr key={order._id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {order.subOrders?.length || 0} sản phẩm
                                    </div>
                                    <div className="text-xs text-gray-500">#{order._id?.slice(-8)}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {order.masterOrderNumber || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {order.createdAt 
                                        ? new Date(order.createdAt).toLocaleDateString('vi-VN')
                                        : 'N/A'
                                      }
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {order.totalAmount?.toLocaleString('vi-VN') || '0'}đ
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                      order.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                                      order.status === 'PENDING_PAYMENT' ? 'bg-yellow-100 text-yellow-800' :
                                      order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {order.status}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Products Tab */}
                {activeTab === 'products' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Sản phẩm ({products.length})
                    </h3>
                    {products.length === 0 ? (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">Chưa có sản phẩm nào</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product) => (
                          <div key={product._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                              {product.images && product.images.length > 0 ? (
                                <img
                                  src={product.images[0].url || product.images[0]}
                                  alt={product.title}
                                  className="w-full h-48 object-cover"
                                />
                              ) : (
                                <div className="w-full h-48 flex items-center justify-center bg-gray-100">
                                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h4 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                                {product.title}
                              </h4>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-blue-600">
                                  {product.pricing?.dailyRate?.toLocaleString('vi-VN') || '0'}đ/ngày
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  product.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                  product.status === 'RENTED' ? 'bg-yellow-100 text-yellow-800' :
                                  product.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                                  product.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {product.status}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                {product.category && (
                                  <span className="flex items-center gap-1">
                                    {product.category.icon && <span>{product.category.icon}</span>}
                                    <span>{translateCategory(product.category.name, i18n.language)}</span>
                                  </span>
                                )}
                                {product.condition && (
                                  <span className="px-2 py-0.5 bg-gray-100 rounded">
                                    {product.condition}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Bank Account Tab */}
                {activeTab === 'bank' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin ngân hàng</h3>
                    {!bankAccount || !bankAccount.bankAccount ? (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">Chưa có thông tin ngân hàng</p>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">
                                {bankAccount.bankAccount.bankName || 'Ngân hàng'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {bankAccount.bankAccount.accountHolderName || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                              bankAccount.verified || bankAccount.bankAccount.isVerified
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {bankAccount.verified || bankAccount.bankAccount.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                            </span>
                            {bankAccount.status || bankAccount.bankAccount.status ? (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                (bankAccount.status || bankAccount.bankAccount.status) === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                                (bankAccount.status || bankAccount.bankAccount.status) === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {bankAccount.status || bankAccount.bankAccount.status}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white/50 rounded-lg p-4">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Số tài khoản</label>
                            <p className="text-base font-mono font-semibold text-gray-900">
                              {bankAccount.bankAccount.accountNumber || 'N/A'}
                            </p>
                          </div>
                          <div className="bg-white/50 rounded-lg p-4">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Mã ngân hàng</label>
                            <p className="text-base font-semibold text-gray-900">
                              {bankAccount.bankAccount.bankCode || 'N/A'}
                            </p>
                          </div>
                          <div className="bg-white/50 rounded-lg p-4">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Tên ngân hàng</label>
                            <p className="text-sm text-gray-900">
                              {bankAccount.bankAccount.bankName || 'Không có thông tin'}
                            </p>
                          </div>
                          <div className="bg-white/50 rounded-lg p-4">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Ngày thêm</label>
                            <p className="text-sm text-gray-900">
                              {bankAccount.bankAccount.addedAt 
                                ? new Date(bankAccount.bankAccount.addedAt).toLocaleDateString('vi-VN')
                                : 'N/A'
                              }
                            </p>
                          </div>
                          {bankAccount.bankAccount.verifiedAt && (
                            <div className="bg-white/50 rounded-lg p-4">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Ngày xác minh</label>
                              <p className="text-sm text-gray-900">
                                {new Date(bankAccount.bankAccount.verifiedAt).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          )}
                          {bankAccount.bankAccount.adminNote && (
                            <div className="bg-white/50 rounded-lg p-4 md:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú của Admin</label>
                              <p className="text-sm text-gray-900">
                                {bankAccount.bankAccount.adminNote}
                              </p>
                            </div>
                          )}
                          {bankAccount.bankAccount.rejectionReason && (
                            <div className="bg-red-50 rounded-lg p-4 md:col-span-2 border border-red-200">
                              <label className="block text-xs font-medium text-red-600 mb-1">Lý do từ chối</label>
                              <p className="text-sm text-red-900">
                                {bankAccount.bankAccount.rejectionReason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">
                  {confirmDialog.type === 'status' ? '🔄' : '👥'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Xác nhận thay đổi {confirmDialog.type === 'status' ? 'trạng thái' : 'vai trò'}
              </h3>
              <div className="text-gray-600 space-y-2">
                <p className="font-medium">
                  User: {user?.profile?.firstName} {user?.profile?.lastName || user?.email}
                </p>
                <p>{confirmDialog.message}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={cancelChange}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                ❌ Hủy
              </button>
              <button
                onClick={confirmChange}
                className={`flex-1 px-6 py-3 text-white font-semibold rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg ${
                  confirmDialog.type === 'status'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                    : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                }`}
              >
                ✅ Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetail;