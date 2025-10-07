import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/admin';

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Show notification function
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000); // Auto hide after 3 seconds
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
    } catch (err) {
      console.error('Load user detail error:', err);
      setError('Không thể tải thông tin user. Vui lòng thử lại');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };



  const handleStatusChange = async (newStatus) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      setUser(prev => ({ ...prev, status: newStatus }));
      showNotification('Cập nhật trạng thái thành công!', 'success');
    } catch (err) {
      console.error('Update status error:', err);
      showNotification('Có lỗi xảy ra khi cập nhật trạng thái!', 'error');
    }
  };

  const handleRoleChange = async (newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      setUser(prev => ({ ...prev, role: newRole }));
      showNotification('Cập nhật vai trò thành công!', 'success');
    } catch (err) {
      console.error('Update role error:', err);
      showNotification('Có lỗi xảy ra khi cập nhật vai trò!', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa user này? Hành động này không thể hoàn tác!')) return;
    
    try {
      await adminService.deleteUser(userId);
      showNotification('Xóa user thành công!', 'success');
      setTimeout(() => navigate('/admin/users'), 1500); // Wait for notification before redirect
    } catch (err) {
      console.error('Delete user error:', err);
      showNotification('Có lỗi xảy ra khi xóa user!', 'error');
    }
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/admin/users" 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.profile?.firstName || ''} {user.profile?.lastName || ''}
            </h1>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
                {user.profile?.avatar ? (
                  <img src={user.profile.avatar} alt="" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <span className="text-gray-600 text-2xl font-medium">
                    {user.profile?.firstName?.charAt(0) || ''}{user.profile?.lastName?.charAt(0) || ''}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getRoleBadge(user.role)}
                  {getUserStatusBadge(user.status)}
                </div>
                <p className="text-gray-600">Tham gia từ {formatDate(user.createdAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                <p className="text-gray-900">{user.profile?.firstName || 'Chưa có'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ</label>
                <p className="text-gray-900">{user.profile?.lastName || 'Chưa có'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{user.email || 'Chưa có email'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <p className="text-gray-900">{user.phone || 'Chưa có'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                <p className="text-gray-900">
                  {user.profile?.dateOfBirth 
                    ? new Date(user.profile.dateOfBirth).toLocaleDateString('vi-VN')
                    : 'Chưa có'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                <p className="text-gray-900">
                  {(() => {
                    const genderMap = { 'MALE': 'Nam', 'FEMALE': 'Nữ', 'OTHER': 'Khác' };
                    return genderMap[user.profile?.gender] || 'Chưa có';
                  })()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Điểm tín dụng</label>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900 font-semibold">{user.creditScore || 100}</p>
                  <span className="text-sm text-gray-500">/1000</span>
                  <div className={`px-2 py-1 text-xs rounded-full ${
                    user.creditScore >= 800 ? 'bg-green-100 text-green-800' :
                    user.creditScore >= 600 ? 'bg-yellow-100 text-yellow-800' :
                    user.creditScore >= 400 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {user.creditScore >= 800 ? 'Xuất sắc' :
                     user.creditScore >= 600 ? 'Tốt' :
                     user.creditScore >= 400 ? 'Trung bình' : 'Kém'}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID User</label>
                <p className="text-gray-900 font-mono text-sm">{user._id}</p>
              </div>
            </div>
          </div>

          {/* Address Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Địa chỉ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đường/Số nhà</label>
                <p className="text-gray-900">{user.address?.streetAddress || 'Chưa có'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố</label>
                <p className="text-gray-900">{user.address?.province || 'Chưa có'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                <p className="text-gray-900">{user.address?.district || 'Chưa có'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố</label>
                <p className="text-gray-900">{user.address?.city || 'Chưa có'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quốc gia</label>
                <p className="text-gray-900">
                  {getCountryName(user.address?.country || 'VN')}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Actions & Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
            <div className="space-y-3">
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

              <hr className="my-4" />

              <button
                onClick={handleDeleteUser}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa User
              </button>
            </div>
          </div>

          {/* User Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Sản phẩm đã đăng</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đơn hàng</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đánh giá</span>
                <span className="font-medium">0</span>
              </div>
              
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Đăng nhập lần cuối</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Cập nhật thông tin</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Đăng sản phẩm mới</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;