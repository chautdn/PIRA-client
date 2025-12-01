import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin';
import { motion } from 'framer-motion';

const BankManagement = () => {
  const navigate = useNavigate();
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0
  });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    bankCode: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBankAccounts: 0
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    loadBankAccounts();
  }, [filters]);

  const loadBankAccounts = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllBankAccounts(filters);
      console.log('Bank Accounts Response:', response);

      if (response) {
        setBankAccounts(response.bankAccounts || []);
        setPagination(response.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalBankAccounts: 0
        });
        setStats(response.stats || {
          total: 0,
          pending: 0,
          verified: 0,
          rejected: 0
        });
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      showNotification('Lỗi khi tải danh sách tài khoản ngân hàng!', 'error');
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1
    }));
  };

  const handlePageChange = (page) => {
    handleFilterChange('page', page);
  };

  const handleViewDetail = (userId) => {
    navigate(`/admin/bank-accounts/${userId}`);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⏳ Chờ xác minh' },
      VERIFIED: { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Đã xác minh' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: '❌ Đã từ chối' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getBankLogo = (bankCode) => {
    const bankLogos = {
      VCB: '🏦',
      TCB: '🏦',
      BIDV: '🏦',
      VTB: '🏦',
      ACB: '🏦',
      MB: '🏦',
      TPB: '🏦',
      STB: '🏦',
      VPB: '🏦',
      AGR: '🏦',
      EIB: '🏦',
      MSB: '🏦',
      SCB: '🏦',
      SHB: '🏦',
      OCB: '🏦'
    };
    return bankLogos[bankCode] || '🏦';
  };

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

      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-5xl">🏦</span>
              Xác minh Tài khoản Ngân hàng
            </h1>
            <p className="text-blue-100 text-lg">Quản lý và xác minh thông tin tài khoản ngân hàng</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Tổng số</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="text-4xl">🏦</div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Chờ xác minh</p>
                <p className="text-3xl font-bold mt-1">{stats.pending}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Đã xác minh</p>
                <p className="text-3xl font-bold mt-1">{stats.verified}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Đã từ chối</p>
                <p className="text-3xl font-bold mt-1">{stats.rejected}</p>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Tìm kiếm</label>
            <input
              type="text"
              placeholder="Số TK, tên, email..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📊 Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="PENDING">Chờ xác minh</option>
              <option value="VERIFIED">Đã xác minh</option>
              <option value="REJECTED">Đã từ chối</option>
            </select>
          </div>

          {/* Bank Code Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">🏦 Ngân hàng</label>
            <select
              value={filters.bankCode}
              onChange={(e) => handleFilterChange('bankCode', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="VCB">Vietcombank</option>
              <option value="TCB">Techcombank</option>
              <option value="BIDV">BIDV</option>
              <option value="VTB">Vietinbank</option>
              <option value="ACB">ACB</option>
              <option value="MB">MBBank</option>
              <option value="TPB">TPBank</option>
              <option value="STB">Sacombank</option>
              <option value="VPB">VPBank</option>
              <option value="AGR">Agribank</option>
            </select>
          </div>

          {/* Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📄 Hiển thị</label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="10">10 / trang</option>
              <option value="20">20 / trang</option>
              <option value="50">50 / trang</option>
              <option value="100">100 / trang</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : bankAccounts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏦</div>
            <p className="text-gray-500 text-lg">Không có tài khoản ngân hàng nào</p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Ngân hàng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Số tài khoản
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Tên chủ TK
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Ngày thêm
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bankAccounts.map((account) => (
                  <motion.tr
                    key={account._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ backgroundColor: '#f9fafb' }}
                    className="hover:shadow-md transition-all duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {account.profile?.firstName?.charAt(0) || 'U'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {account.profile?.firstName} {account.profile?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{account.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getBankLogo(account.bankAccount?.bankCode)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {account.bankAccount?.bankCode}
                          </div>
                          <div className="text-xs text-gray-500">{account.bankAccount?.bankName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-medium text-gray-900">
                        {account.bankAccount?.accountNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {account.bankAccount?.accountHolderName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(account.bankAccount?.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {account.bankAccount?.addedAt
                        ? new Date(account.bankAccount.addedAt).toLocaleDateString('vi-VN')
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleViewDetail(account._id)}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        👁️ Xem chi tiết
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{(pagination.currentPage - 1) * filters.limit + 1}</span> đến{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * filters.limit, pagination.totalBankAccounts)}
                  </span>{' '}
                  trong tổng số <span className="font-medium">{pagination.totalBankAccounts}</span> tài khoản
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Trước
                  </button>

                  <div className="flex gap-1">
                    {[...Array(pagination.totalPages)].map((_, index) => {
                      const page = index + 1;
                      if (
                        page === 1 ||
                        page === pagination.totalPages ||
                        (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-2 border rounded-lg text-sm font-medium ${
                              pagination.currentPage === page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === pagination.currentPage - 2 ||
                        page === pagination.currentPage + 2
                      ) {
                        return <span key={page} className="px-2 py-2 text-gray-500">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BankManagement;
