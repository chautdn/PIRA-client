import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin';
import { motion } from 'framer-motion';
import icons from "../../utils/icons";

const { BsBuildings, FiUser, FiMail, FiPhone, FiCreditCard, FiCalendar, IoBarChart, FiClock, FiPlus, BiCheckCircle, FiX, BiLoaderAlt, FiAlertTriangle, FiZap } = icons;

const AdminBankDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    loadBankAccountDetail();
  }, [userId]);

  const loadBankAccountDetail = async () => {
    try {
      setLoading(true);
      const response = await adminService.getBankAccountById(userId);
      setUser(response);
    } catch (error) {
      console.error('Error loading bank account detail:', error);
      showNotification('Lỗi khi tải thông tin tài khoản ngân hàng!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleVerify = async () => {
    try {
      setActionLoading(true);
      await adminService.verifyBankAccount(userId, adminNote);
      showNotification('Xác minh tài khoản ngân hàng thành công!', 'success');
      setShowVerifyModal(false);
      setAdminNote('');
      await loadBankAccountDetail();
    } catch (error) {
      console.error('Error verifying bank account:', error);
      showNotification('Lỗi khi xác minh tài khoản ngân hàng!', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showNotification('Vui lòng nhập lý do từ chối!', 'error');
      return;
    }

    try {
      setActionLoading(true);
      await adminService.rejectBankAccount(userId, rejectionReason);
      showNotification('Từ chối xác minh tài khoản ngân hàng thành công!', 'success');
      setShowRejectModal(false);
      setRejectionReason('');
      await loadBankAccountDetail();
    } catch (error) {
      console.error('Error rejecting bank account:', error);
      showNotification('Lỗi khi từ chối tài khoản ngân hàng!', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: ' Chờ xác minh', border: 'border-yellow-300' },
      VERIFIED: { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Đã xác minh', border: 'border-green-300' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: '❌ Đã từ chối', border: 'border-red-300' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span className={`px-4 py-2 rounded-lg text-sm font-bold border-2 ${config.bg} ${config.text} ${config.border}`}>
        {config.label}
      </span>
    );
  };

  const getBankName = (bankCode) => {
    const banks = {
      VCB: 'Vietcombank',
      TCB: 'Techcombank',
      BIDV: 'BIDV',
      VTB: 'Vietinbank',
      ACB: 'ACB',
      MB: 'MBBank',
      TPB: 'TPBank',
      STB: 'Sacombank',
      VPB: 'VPBank',
      AGR: 'Agribank',
      EIB: 'Eximbank',
      MSB: 'MSB',
      SCB: 'SCB',
      SHB: 'SHB',
      OCB: 'OCB'
    };
    return banks[bankCode] || bankCode;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">
          <FiX className="text-6xl" />
        </div>
        <p className="text-gray-500 text-lg">Không tìm thấy thông tin tài khoản ngân hàng</p>
        <button
          onClick={() => navigate('/admin/bank-accounts')}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const bankAccount = user.bankAccount;

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification.show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}
        >
          {notification.message}
        </motion.div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/admin/bank-accounts')}
              className="text-white hover:text-blue-100 mb-4 flex items-center gap-2"
            >
              ← Quay lại danh sách
            </button>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <BsBuildings className="text-5xl" />
              Chi tiết Tài khoản Ngân hàng
            </h1>
            <p className="text-blue-100 text-lg">Thông tin chi tiết và xác minh tài khoản</p>
          </div>
          {getStatusBadge(bankAccount?.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiUser className="text-2xl" />
              Thông tin người dùng
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  {user.profile?.firstName?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">
                    {user.profile?.firstName} {user.profile?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vai trò:</span>
                  <span className="font-semibold text-gray-800">
                    {user.role === 'OWNER' ? '🏠 Owner' : user.role === 'RENTER' ? '👤 Renter' : user.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className={`font-semibold ${
                    user.status === 'ACTIVE' ? 'text-green-600' : 
                    user.status === 'INACTIVE' ? 'text-gray-600' : 
                    'text-red-600'
                  }`}>
                    {user.status === 'ACTIVE' ? '✅ Hoạt động' : 
                     user.status === 'INACTIVE' ? '⏸️ Không hoạt động' : 
                     '🚫 Bị khóa'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Status Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BiCheckCircle className="text-2xl" />
              Trạng thái xác thực
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">
                  <FiMail className="inline mr-1" /> Email
                </span>
                <span className={user.verification?.emailVerified ? 'text-green-600 font-semibold' : 'text-red-600'}>
                  {user.verification?.emailVerified ? '✅ Đã xác thực' : '❌ Chưa xác thực'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">
                  <FiPhone className="inline mr-1" /> Số điện thoại
                </span>
                <span className={user.verification?.phoneVerified ? 'text-green-600 font-semibold' : 'text-red-600'}>
                  {user.verification?.phoneVerified ? '✅ Đã xác thực' : '❌ Chưa xác thực'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">
                  <FiCreditCard className="inline mr-1" /> CCCD/CMND
                </span>
                <span className={user.cccd?.isVerified ? 'text-green-600 font-semibold' : 'text-red-600'}>
                  {user.cccd?.isVerified ? '✅ Đã xác thực' : '❌ Chưa xác thực'}
                </span>
              </div>
            </div>
          </div>

          {/* CCCD Information (if available) */}
          {user.cccd && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiCreditCard className="text-2xl" />
                Thông tin CCCD
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <FiUser className="text-lg" />
                  <div className="flex-1">
                    <span className="text-xs text-gray-500">Họ tên</span>
                    <p className="text-sm font-semibold text-gray-800">{user.cccd.fullName || 'Chưa có thông tin'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <FiCalendar className="text-lg" />
                  <div className="flex-1">
                    <span className="text-xs text-gray-500">Ngày sinh</span>
                    <p className="text-sm font-semibold text-gray-800">
                      {user.cccd.dateOfBirth 
                        ? new Date(user.cccd.dateOfBirth).toLocaleDateString('vi-VN')
                        : 'Chưa có thông tin'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <div className="flex-1">
                    <span className="text-xs text-gray-500">Giới tính</span>
                    <p className="text-sm font-semibold text-gray-800">
                      {user.cccd.gender === 'MALE' ? 'Nam' : 
                       user.cccd.gender === 'FEMALE' ? 'Nữ' : 
                       user.cccd.gender || 'Chưa có thông tin'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1">
                    <span className="text-xs text-gray-500">Địa chỉ</span>
                    <p className="text-sm font-semibold text-gray-800">{user.cccd.address || 'Chưa có thông tin'}</p>
                  </div>
                </div>

                {user.phone && (
                  <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <FiPhone className="text-lg" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-500">Số điện thoại</span>
                      <p className="text-sm font-mono font-semibold text-gray-800">{user.phone}</p>
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <IoBarChart className="text-lg" />
                      <span className="text-xs text-gray-600">Trạng thái xác minh</span>
                    </div>
                    <span className={`text-sm font-bold ${user.cccd.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {user.cccd.isVerified ? '✅ Đã xác minh' : '⏳ Chưa xác minh'}
                    </span>
                  </div>
                </div>

                {user.cccd.verifiedAt && (
                  <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                    <FiClock className="text-lg" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-500">Ngày xác minh</span>
                      <p className="text-sm font-semibold text-gray-800">
                        {new Date(user.cccd.verifiedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bank Account Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bank Account Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <BsBuildings className="text-3xl" />
              Thông tin tài khoản ngân hàng
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bank Name */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                <label className="text-sm font-semibold text-gray-600 mb-1 block">
                  <BsBuildings className="inline mr-1" /> Ngân hàng
                </label>
                <p className="text-xl font-bold text-gray-800">
                  {getBankName(bankAccount?.bankCode)} ({bankAccount?.bankCode})
                </p>
              </div>

              {/* Account Number */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200">
                <label className="text-sm font-semibold text-gray-600 mb-1 block">
                  <FiCreditCard className="inline mr-1" /> Số tài khoản
                </label>
                <p className="text-xl font-mono font-bold text-gray-800">{bankAccount?.accountNumber}</p>
              </div>

              {/* Account Holder Name */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200 md:col-span-2">
                <label className="text-sm font-semibold text-gray-600 mb-1 block">
                  <FiUser className="inline mr-1" /> Tên chủ tài khoản
                </label>
                <p className="text-xl font-bold text-gray-800">{bankAccount?.accountHolderName}</p>
              </div>

              {/* Added Date */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border-2 border-orange-200">
                <label className="text-sm font-semibold text-gray-600 mb-1 block">
                  <FiCalendar className="inline mr-1" /> Ngày thêm
                </label>
                <p className="text-lg font-semibold text-gray-800">
                  {bankAccount?.addedAt
                    ? new Date(bankAccount.addedAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </p>
              </div>

              {/* Status */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border-2 border-gray-200">
                <label className="text-sm font-semibold text-gray-600 mb-1 block">
                  <IoBarChart className="inline mr-1" /> Trạng thái
                </label>
                <div className="mt-1">
                  {getStatusBadge(bankAccount?.status)}
                </div>
              </div>
            </div>
          </div>

          {/* Verification Timeline */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Lịch sử xác minh
            </h2>
            <div className="space-y-3">
              {/* Added Event */}
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <FiPlus className="text-2xl" />
                <div className="flex-1">
                  <p className="font-bold text-blue-800">Tài khoản được thêm</p>
                  <p className="text-sm text-blue-600 mt-1">
                    {new Date(bankAccount?.addedAt).toLocaleString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <div className="mt-2 text-xs text-blue-700">
                    Tài khoản ngân hàng được người dùng đăng ký và chờ xác minh
                  </div>
                </div>
              </div>

              {/* Verified Event */}
              {bankAccount?.verifiedAt && (
                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <BiCheckCircle className="text-2xl" />
                  <div className="flex-1">
                    <p className="font-bold text-green-800">Đã xác minh</p>
                    <p className="text-sm text-green-600 mt-1">
                      {new Date(bankAccount.verifiedAt).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {bankAccount?.adminNote && (
                      <div className="mt-2 p-3 bg-white rounded border border-green-200">
                        <p className="text-xs font-semibold text-gray-600 mb-1">
                          💬 Ghi chú của Admin:
                        </p>
                        <p className="text-sm text-gray-700">{bankAccount.adminNote}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rejected Event */}
              {bankAccount?.rejectedAt && (
                <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <FiX className="text-2xl" />
                  <div className="flex-1">
                    <p className="font-bold text-red-800">Đã từ chối</p>
                    <p className="text-sm text-red-600 mt-1">
                      {new Date(bankAccount.rejectedAt).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {bankAccount?.rejectionReason && (
                      <div className="mt-2 p-3 bg-white rounded border border-red-200">
                        <p className="text-xs font-semibold text-gray-600 mb-1">
                          ⚠️ Lý do từ chối:
                        </p>
                        <p className="text-sm text-gray-700">{bankAccount.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pending Status */}
              {bankAccount?.status === 'PENDING' && !bankAccount?.verifiedAt && !bankAccount?.rejectedAt && (
                <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <BiLoaderAlt className="text-2xl" />
                  <div className="flex-1">
                    <p className="font-bold text-yellow-800">Đang chờ xác minh</p>
                    <p className="text-sm text-yellow-600 mt-1">
                      Tài khoản đang được chờ Admin xác minh
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Verification Note */}
          {bankAccount?.status === 'PENDING' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
              <div className="flex items-start gap-3">
                <FiAlertTriangle className="text-2xl" />
                <div>
                  <h3 className="font-bold text-yellow-800 mb-2">Lưu ý khi xác minh</h3>
                  <ul className="space-y-1 text-sm text-yellow-700">
                    <li>✅ Kiểm tra tên chủ tài khoản khớp với tên trên CCCD</li>
                    <li>✅ Xác minh số tài khoản hợp lệ</li>
                    <li>✅ Đảm bảo mã ngân hàng chính xác</li>
                    <li>✅ Kiểm tra thông tin người dùng đã được xác thực</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {bankAccount?.status === 'PENDING' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiZap className="text-2xl" />
                Thao tác xác minh
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowVerifyModal(true)}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 shadow-lg transform hover:-translate-y-1 transition-all duration-200"
                >
                  <BiCheckCircle className="inline mr-2" /> Xác minh tài khoản
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-rose-500 text-white text-lg font-bold rounded-xl hover:from-red-600 hover:to-rose-600 shadow-lg transform hover:-translate-y-1 transition-all duration-200"
                >
                  <FiX className="inline mr-2" /> Từ chối xác minh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BiCheckCircle className="text-3xl" />
              Xác minh tài khoản ngân hàng
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xác minh tài khoản ngân hàng này?
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Nhập ghi chú của bạn..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows="3"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowVerifyModal(false)}
                disabled={actionLoading}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleVerify}
                disabled={actionLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 shadow-lg"
              >
                {actionLoading ? '⏳ Đang xử lý...' : <><BiCheckCircle className="inline mr-2" /> Xác minh</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiX className="text-3xl" />
              Từ chối xác minh
            </h3>
            <p className="text-gray-600 mb-6">
              Vui lòng nhập lý do từ chối xác minh tài khoản ngân hàng này:
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ví dụ: Thông tin không khớp với CCCD, Số tài khoản không hợp lệ..."
                className="w-full px-4 py-3 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows="4"
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={actionLoading}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold rounded-lg hover:from-red-600 hover:to-rose-600 disabled:opacity-50 shadow-lg"
              >
                {actionLoading ? '⏳ Đang xử lý...' : <><FiX className="inline mr-2" /> Từ chối</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminBankDetail;
