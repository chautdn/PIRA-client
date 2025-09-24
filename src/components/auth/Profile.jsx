import React, { useState, useEffect } from 'react';
import userService from '../../services/user.Api';
import kycService from '../../services/kyc.Api'; // Thêm import này
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import KycModal from '../common/KycModal';

const Profile = () => {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  
  // KYC Modal states
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  
  const [formData, setFormData] = useState({
    profile: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: ''
    },
    phone: '',
    address: {
      streetAddress: '',
      district: '',
      city: '',
      province: ''
    }
  });

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" }
  };

  // Fetch user profile
  useEffect(() => {
    fetchProfile();
    loadKycStatus(); // Gọi sau khi component mount
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userService.getProfile();
      const userData = response.data.data;
      
      setUser(userData);
      
      setFormData({
        profile: {
          firstName: userData.profile?.firstName || '',
          lastName: userData.profile?.lastName || '',
          dateOfBirth: userData.profile?.dateOfBirth ? 
            new Date(userData.profile.dateOfBirth).toISOString().split('T')[0] : '',
          gender: userData.profile?.gender || ''
        },
        phone: userData.phone || '',
        address: {
          streetAddress: userData.address?.streetAddress || '',
          district: userData.address?.district || '',
          city: userData.address?.city || '',
          province: userData.address?.province || ''
        }
      });
      
      // **SAU KHI LOAD PROFILE, LOAD KYC STATUS**
      await loadKycStatus();
      
    } catch (error) {
      toast.error('Không thể tải thông tin profile');
    } finally {
      setLoading(false);
    }
  };

  // **SỬA HÀM loadKycStatus ĐỂ GỌI API ĐÚNG CÁCH**
  const loadKycStatus = async () => {
    try {
      console.log('🔍 Loading KYC status...');
      
      // Gọi API để lấy trạng thái KYC
      const statusResponse = await kycService.getKYCStatus();
      console.log('🔍 KYC Status Response:', statusResponse);
      
      if (statusResponse.data?.status === 'verified') {
        const kycData = statusResponse.data;
        setKycStatus(kycData);
        console.log('✅ KYC Status loaded:', kycData);
      } else {
        // Nếu không có KYC data, set default
        setKycStatus({
          isVerified: false,
          hasImages: false,
          status: 'not_started'
        });
        console.log('⚠️ No KYC data found');
      }
    } catch (error) {
      console.error('❌ Load KYC status error:', error);
      
      // Fallback: sử dụng thông tin từ user profile
      if (user?.cccd) {
        setKycStatus({
          isVerified: user.cccd.isVerified || false,
          hasImages: !!user.cccd.frontImageHash,
          status: user.cccd.isVerified ? 'verified' : 'pending'
        });
        console.log('🔄 Using fallback KYC status from user profile');
      } else {
        setKycStatus({
          isVerified: false,
          hasImages: false,
          status: 'not_started'
        });
      }
    }
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleDirectChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await userService.updateProfile(formData);
      setUser(response.data);
      setEditing(false);
      toast.success('Cập nhật thành công!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    fetchProfile();
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) { // 1MB limit
      toast.error('File quá lớn (tối đa 1MB)');
      return;
    }

    if (!file.type.match(/\.(jpeg|jpg|png)$/)) {
      toast.error('Chỉ hỗ trợ định dạng JPEG, PNG');
      return;
    }

    try {
      setSaving(true);
      const response = await userService.uploadAvatar(file);
      setUser(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          avatar: response.data.avatarUrl
        }
      }));
      toast.success('Cập nhật avatar thành công!');
    } catch (error) {
      toast.error('Không thể upload avatar');
    } finally {
      setSaving(false);
    }
  };

  // Handle KYC Modal
  const handleKycSuccess = async (result) => {
    if (result.skipped) {
      toast.success('Xác thực KYC thành công!');
    } else {
      toast.success('Xác thực danh tính và cập nhật profile thành công!');
    }
    
    // Reload cả KYC status và profile
    await loadKycStatus();
    await fetchProfile();
    
    // Đóng modal
    setShowKycModal(false);
  };

  // **SỬA HÀM getKycStatusDisplay ĐỂ SỬ DỤNG kycStatus**
  const getKycStatusDisplay = () => {
    console.log('🔍 Current KYC Status for display:', kycStatus);
    
    if (!kycStatus) {
      return { 
        text: 'Đang tải...', 
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        icon: '⏳'
      };
    }
    
    if (kycStatus.isVerified) {
      return { 
        text: 'Đã xác thực', 
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: '✅'
      };
    }
    
    if (kycStatus.hasImages) {
      return { 
        text: 'Chờ xác thực', 
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: '⏳'
      };
    }
    
    return { 
      text: 'Chưa xác thực', 
      color: 'text-red-500',
      bgColor: 'bg-red-100',
      icon: '❌'
    };
  };

  // Sidebar menu items
  const menuItems = [
    { id: 'notifications', icon: '🔔', label: 'Thông Báo' },
    { id: 'profile', icon: '👤', label: 'Tài Khoản Của Tôi', submenu: [
      { id: 'profile', label: 'Hồ Sơ' },
      { id: 'address', label: 'Địa Chỉ' },
      { id: 'password', label: 'Đổi Mật Khẩu' },
      { id: 'verification', label: 'Xác Minh Tài Khoản' },
    ]},
    { id: 'orders', icon: '📋', label: 'Đơn Thuê' },
    { id: 'vouchers', icon: '🎫', label: 'Kho Voucher' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div 
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Đang tải thông tin...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <motion.div 
            className="w-64 bg-white rounded-lg shadow-sm border border-gray-200 h-fit sticky top-6"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            {/* User Info Header */}
            <div className="flex items-center p-4 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg">
                {user?.profile?.firstName?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">
                  {user?.profile?.firstName && user?.profile?.lastName 
                    ? `${user.profile.firstName} ${user.profile.lastName}`
                    : user?.email?.split('@')[0] || 'User'
                  }
                </p>
                <p className="text-sm text-gray-500 flex items-center">
                  <span className="w-3 h-3 mr-1">✏️</span>
                  Sửa Hồ Sơ
                </p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item) => (
                <div key={item.id}>
                  <button className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                    <span className="w-5 h-5 mr-3">{item.icon}</span>
                    <span className="text-gray-700">{item.label}</span>
                  </button>
                  
                  {item.submenu && (
                    <div className="ml-8">
                      {item.submenu.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => setActiveSection(subItem.id)}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            activeSection === subItem.id
                              ? 'text-orange-500 bg-orange-50'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            className="flex-1"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      {activeSection === 'profile' && 'Hồ Sơ Của Tôi'}
                      {activeSection === 'address' && 'Địa Chỉ'}
                      {activeSection === 'verification' && 'Xác Minh Tài Khoản'}
                      {activeSection === 'password' && 'Đổi Mật Khẩu'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                      {activeSection === 'verification' 
                        ? 'Xác minh danh tính để nâng cao độ tin cậy tài khoản'
                        : 'Quản lý thông tin hồ sơ để bảo mật tài khoản'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {activeSection === 'verification' && (
                  <div className="max-w-2xl">
                    <div className="space-y-6">
                      {/* Email Verification */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <span className="text-blue-600">📧</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">Xác thực Email</h3>
                            <p className="text-sm text-gray-500">Xác nhận địa chỉ email của bạn</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user?.verification?.emailVerified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user?.verification?.emailVerified ? '✅ Đã xác thực' : '❌ Chưa xác thực'}
                          </span>
                          {!user?.verification?.emailVerified && (
                            <button className="ml-3 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                              Xác thực
                            </button>
                          )}
                        </div>
                      </div>

                      

                      {/* KYC Verification */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                            <span className="text-purple-600">🆔</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">Xác thực Danh tính (KYC)</h3>
                            <p className="text-sm text-gray-500">Upload CCCD/CMND để xác minh danh tính</p>
                            {/* Debug info */}
                            <p className="text-xs text-gray-400 mt-1">
                              Status: {kycStatus ? `isVerified: ${kycStatus.isVerified}, hasImages: ${kycStatus.hasImages}` : 'Loading...'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getKycStatusDisplay().bgColor} ${getKycStatusDisplay().color}`}>
                            {getKycStatusDisplay().icon} {getKycStatusDisplay().text}
                          </span>
                          <button 
                            onClick={() => {
                              console.log('🔍 Opening KYC Modal with status:', kycStatus);
                              setShowKycModal(true);
                            }}
                            className="ml-3 px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            {kycStatus?.isVerified ? 'Xem thông tin' : 'Xác thực ngay'}
                          </button>
                        </div>
                      </div>

                      {/* Security Level */}
                      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                          <span className="mr-2">🛡️</span>
                          Mức độ bảo mật tài khoản
                        </h3>
                        
                        <div className="flex items-center mb-4">
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${
                                  (user?.verification?.emailVerified ? 50 : 0) + +
                                  (user?.cccd?.isVerified ? 50 : 0)
                                }%` 
                              }}
                            ></div>
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-600">
                            {
                              (user?.verification?.emailVerified ? 1 : 0) +
                              (user?.cccd?.isVerified ? 1 : 0)
                            }/2 Hoàn thành
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          Hoàn thành tất cả các bước xác minh để đảm bảo tài khoản của bạn được bảo mật tốt nhất.
                        </p>

                        {((user?.verification?.emailVerified ? 1 : 0) +
                          (user?.cccd?.isVerified ? 1 : 0)) === 2 && (
                          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                            <p className="text-sm text-green-800 flex items-center">
                              <span className="mr-2">🎉</span>
                              Chúc mừng! Tài khoản của bạn đã được xác minh hoàn toàn.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'profile' && (
                  <div className="flex gap-8">
                    {/* Form Fields */}
                    <div className="flex-1 max-w-lg space-y-6">
                      {/* Name */}
                      <div className="flex items-center">
                        <label className="w-24 text-sm text-gray-600 text-right mr-4">
                          Tên
                        </label>
                        <div className="flex-1">
                          {editing ? (
                            <input
                              type="text"
                              value={formData.profile.firstName}
                              onChange={(e) => handleInputChange('profile', 'firstName', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="Nhập tên"
                            />
                          ) : (
                            <div className="flex items-center">
                              <span className="text-gray-900">{user?.profile?.firstName || 'Chưa cập nhật'}</span>
                              <button 
                                onClick={() => setEditing(true)}
                                className="ml-2 text-blue-600 hover:text-blue-700 text-sm"
                              >
                                Thay Đổi
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-center">
                        <label className="w-24 text-sm text-gray-600 text-right mr-4">
                          Email
                        </label>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="text-gray-900 mr-2">
                              {user?.email ? `${user.email.slice(0,3)}*********@gmail.com` : 'N/A'}
                            </span>
                            <button className="text-blue-600 hover:text-blue-700 text-sm">
                              Thay Đổi
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center">
                        <label className="w-24 text-sm text-gray-600 text-right mr-4">
                          Số điện thoại
                        </label>
                        <div className="flex-1">
                          {editing ? (
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handleDirectChange('phone', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="Nhập số điện thoại"
                            />
                          ) : (
                            <div className="flex items-center">
                              <span className="text-gray-900 mr-2">
                                {user?.phone ? `*******${user.phone.slice(-2)}` : 'Chưa cập nhật'}
                              </span>
                              <button 
                                onClick={() => setEditing(true)}
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                Thay Đổi
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Gender */}
                      <div className="flex items-center">
                        <label className="w-24 text-sm text-gray-600 text-right mr-4">
                          Giới tính
                        </label>
                        <div className="flex-1">
                          {editing ? (
                            <div className="flex space-x-6">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="gender"
                                  value="MALE"
                                  checked={formData.profile.gender === 'MALE'}
                                  onChange={(e) => handleInputChange('profile', 'gender', e.target.value)}
                                  className="mr-2"
                                />
                                Nam
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="gender"
                                  value="FEMALE"
                                  checked={formData.profile.gender === 'FEMALE'}
                                  onChange={(e) => handleInputChange('profile', 'gender', e.target.value)}
                                  className="mr-2"
                                />
                                Nữ
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="gender"
                                  value="OTHER"
                                  checked={formData.profile.gender === 'OTHER'}
                                  onChange={(e) => handleInputChange('profile', 'gender', e.target.value)}
                                  className="mr-2"
                                />
                                Khác
                              </label>
                            </div>
                          ) : (
                            <span className="text-gray-900">
                              {user?.profile?.gender === 'MALE' ? 'Nam' : 
                               user?.profile?.gender === 'FEMALE' ? 'Nữ' : 
                               user?.profile?.gender === 'OTHER' ? 'Khác' : 'Chưa cập nhật'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Date of Birth */}
                      <div className="flex items-center">
                        <label className="w-24 text-sm text-gray-600 text-right mr-4">
                          Ngày sinh
                        </label>
                        <div className="flex-1">
                          {editing ? (
                            <input
                              type="date"
                              value={formData.profile.dateOfBirth}
                              onChange={(e) => handleInputChange('profile', 'dateOfBirth', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                            />
                          ) : (
                            <span className="text-gray-900">
                              {user?.profile?.dateOfBirth 
                                ? new Date(user.profile.dateOfBirth).toLocaleDateString('vi-VN')
                                : '*/*/1998'
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Save Button */}
                      {editing && (
                        <div className="flex items-center">
                          <div className="w-24 mr-4"></div>
                          <div className="flex space-x-3">
                            <button
                              onClick={handleSave}
                              disabled={saving}
                              className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
                            >
                              {saving ? 'Đang lưu...' : 'Lưu'}
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Avatar Section */}
                    <div className="w-px bg-gray-200"></div>
                    <div className="w-64 flex flex-col items-center py-8">
                      <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden">
                        <img
                          src={user?.profile?.avatar || user?.avatar || '/api/placeholder/120/120'}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <label className="px-4 py-2 border border-gray-300 text-gray-700 rounded cursor-pointer hover:bg-gray-50 text-sm">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                        Chọn Ảnh
                      </label>
                      
                      <div className="text-xs text-gray-500 mt-2 text-center">
                        <p>Dung lượng file tối đa 1 MB</p>
                        <p>Định dạng: .JPEG, .PNG</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'address' && (
                  <div className="max-w-2xl">
                    <h2 className="text-lg font-medium mb-6">Địa chỉ của tôi</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Địa chỉ cụ thể
                        </label>
                        <input
                          type="text"
                          value={formData.address.streetAddress}
                          onChange={(e) => handleInputChange('address', 'streetAddress', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Số nhà, tên đường"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quận/Huyện
                          </label>
                          <input
                            type="text"
                            value={formData.address.district}
                            onChange={(e) => handleInputChange('address', 'district', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Quận/Huyện"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thành phố
                          </label>
                          <input
                            type="text"
                            value={formData.address.city}
                            onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Thành phố"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tỉnh/Thành phố
                        </label>
                        <input
                          type="text"
                          value={formData.address.province}
                          onChange={(e) => handleInputChange('address', 'province', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Tỉnh/Thành phố"
                        />
                      </div>

                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
                      >
                        {saving ? 'Đang lưu...' : 'Lưu địa chỉ'}
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === 'password' && (
                  <div className="max-w-lg">
                    <h2 className="text-lg font-medium mb-6">Đổi mật khẩu</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mật khẩu hiện tại
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Nhập mật khẩu hiện tại"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mật khẩu mới
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Nhập mật khẩu mới"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Xác nhận mật khẩu mới
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Nhập lại mật khẩu mới"
                        />
                      </div>

                      <button className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
                        Cập nhật mật khẩu
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* KYC Modal */}
      <KycModal
        visible={showKycModal}
        onClose={() => setShowKycModal(false)}
        onSuccess={handleKycSuccess}
        title="Xác thực danh tính (KYC)"
      />
    </div>
  );
};

export default Profile;