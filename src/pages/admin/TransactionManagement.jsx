import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin';

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    type: '',
    status: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Show notification function
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllTransactions(filters);
      setTransactions(response.data.transactions || []);
      setPagination(response.data.pagination || {});
      setStats(response.data.stats || {});
    } catch (err) {
      setError(err.message);
      showNotification('Có lỗi xảy ra khi tải dữ liệu giao dịch', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when filter changes
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      type: '',
      status: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'processing': 'bg-blue-100 text-blue-800 border-blue-300',
      'success': 'bg-green-100 text-green-800 border-green-300',
      'failed': 'bg-red-100 text-red-800 border-red-300',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-300'
    };

    const statusText = {
      'pending': 'Chờ xử lý',
      'processing': 'Đang xử lý',
      'success': 'Thành công',
      'failed': 'Thất bại',
      'cancelled': 'Đã hủy'
    };

    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusClasses[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
        {statusText[status] || status}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeClasses = {
      'deposit': 'bg-green-100 text-green-800',
      'withdrawal': 'bg-red-100 text-red-800',
      'payment': 'bg-blue-100 text-blue-800',
      'refund': 'bg-purple-100 text-purple-800',
      'penalty': 'bg-orange-100 text-orange-800',
      'order_payment': 'bg-indigo-100 text-indigo-800',
      'wallet_topup': 'bg-emerald-100 text-emerald-800',
      'wallet_withdrawal': 'bg-rose-100 text-rose-800',
      'rental_payment': 'bg-cyan-100 text-cyan-800',
      'rental_deposit': 'bg-teal-100 text-teal-800'
    };

    const typeText = {
      'deposit': 'Nạp tiền vào ví',
      'withdrawal': 'Rút tiền khỏi ví',
      'payment': 'Thanh toán hệ thống',
      'refund': 'Hoàn tiền',
      'penalty': 'Phí phạt',
      'order_payment': 'Thanh toán đơn hàng',
      'wallet_topup': 'Nạp tiền ví',
      'wallet_withdrawal': 'Rút tiền ví',
      'rental_payment': 'Thanh toán thuê',
      'rental_deposit': 'Đặt cọc thuê'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${typeClasses[type] || 'bg-gray-100 text-gray-800'}`}>
        {typeText[type] || type}
      </span>
    );
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const exportTransactions = async () => {
    try {
      const { search, type, status, startDate, endDate } = filters;
      const exportFilters = { type, status, startDate, endDate };
      
      // Create download link
      const params = new URLSearchParams();
      Object.entries(exportFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const url = `/api/admin/transactions/export?${params.toString()}`;
      window.open(url, '_blank');
      
      showNotification('Đang xuất dữ liệu...', 'success');
    } catch (err) {
      showNotification('Có lỗi xảy ra khi xuất dữ liệu', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`p-4 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center gap-2">
              <span>{notification.type === 'success' ? '✅' : '❌'}</span>
              <span>{notification.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-3xl">💳</span>
              Quản lý Giao dịch
            </h1>
            <p className="text-gray-600 mt-1">Theo dõi và quản lý tất cả giao dịch trong hệ thống</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportTransactions}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <span>📊</span>
              Xuất Excel
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-blue-600 text-2xl font-bold">{stats.totalTransactions || 0}</div>
            <div className="text-blue-800 text-sm font-medium">Tổng giao dịch</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-600 text-2xl font-bold">{formatAmount(stats.totalAmount || 0)}</div>
            <div className="text-green-800 text-sm font-medium">Tổng giá trị</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="text-emerald-600 text-2xl font-bold">{stats.successfulTransactions || 0}</div>
            <div className="text-emerald-800 text-sm font-medium">Thành công</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-purple-600 text-2xl font-bold">{stats.walletTransactions || 0}</div>
            <div className="text-purple-800 text-sm font-medium">Giao dịch ví</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-600 text-2xl font-bold">{stats.failedTransactions || 0}</div>
            <div className="text-red-800 text-sm font-medium">Thất bại</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="ID, mô tả..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại giao dịch</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả loại giao dịch</option>
              <option value="deposit">Nạp tiền vào ví</option>
              <option value="withdrawal">Rút tiền khỏi ví</option>
              <option value="wallet_topup">Nạp tiền ví (Web)</option>
              <option value="wallet_withdrawal">Rút tiền ví (Web)</option>
              <option value="order_payment">Thanh toán đơn hàng</option>
              <option value="rental_payment">Thanh toán thuê</option>
              <option value="rental_deposit">Đặt cọc thuê</option>
              <option value="payment">Thanh toán khác</option>
              <option value="refund">Hoàn tiền</option>
              <option value="penalty">Phí phạt</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="processing">Đang xử lý</option>
              <option value="success">Thành công</option>
              <option value="failed">Thất bại</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền từ (VNĐ)</label>
            <input
              type="number"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền đến (VNĐ)</label>
            <input
              type="number"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              placeholder="1000000000"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Đang tải dữ liệu...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Giao dịch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người dùng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại giao dịch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mô tả
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {transaction.externalId || transaction._id.slice(-8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {transaction.user?.profile?.firstName || transaction.user?.firstName || 'N/A'} {transaction.user?.profile?.lastName || transaction.user?.lastName || ''}
                        </div>
                        <div className="text-sm text-gray-500">{transaction.user?.email || 'Không có email'}</div>
                        <div className="text-xs text-gray-400 font-mono">
                          ID: {transaction.user?._id?.slice(-8) || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(transaction.type)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {transaction.description || 
                           (transaction.type === 'deposit' ? 'Nạp tiền vào ví hệ thống' :
                            transaction.type === 'withdrawal' ? 'Rút tiền từ ví hệ thống' :
                            transaction.type === 'wallet_topup' ? 'Nạp tiền vào ví qua website' :
                            transaction.type === 'wallet_withdrawal' ? 'Rút tiền từ ví qua website' :
                            transaction.type === 'order_payment' ? 'Thanh toán đơn hàng thuê' :
                            transaction.type === 'rental_payment' ? 'Thanh toán tiền thuê sản phẩm' :
                            transaction.type === 'rental_deposit' ? 'Đặt cọc thuê sản phẩm' :
                            'Giao dịch hệ thống')}
                        </div>
                        {transaction.reference?.rentalOrderId && (
                          <div className="text-xs text-blue-600">
                            ĐH: {transaction.reference.rentalOrderId.slice(-8)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={transaction.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}>
                          {transaction.type === 'withdrawal' ? '-' : '+'}
                          {formatAmount(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/admin/transactions/${transaction._id}`}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          <span>👁️</span>
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Hiển thị{' '}
                      <span className="font-medium">{((pagination.currentPage - 1) * pagination.limit) + 1}</span>
                      {' '}-{' '}
                      <span className="font-medium">
                        {Math.min(pagination.currentPage * pagination.limit, pagination.total)}
                      </span>
                      {' '}trong{' '}
                      <span className="font-medium">{pagination.total}</span>
                      {' '}kết quả
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        ‹
                      </button>
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter(page => 
                          page === 1 || 
                          page === pagination.totalPages || 
                          Math.abs(page - pagination.currentPage) <= 1
                        )
                        .map((page, index, array) => (
                          <React.Fragment key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === pagination.currentPage
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        ))}
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        ›
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionManagement;