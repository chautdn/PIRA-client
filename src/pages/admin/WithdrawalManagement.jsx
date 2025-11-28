import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/admin';
import { motion } from 'framer-motion';
import { Search, Filter, CheckCircle, XCircle, Clock, AlertCircle, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const WithdrawalManagement = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [actionData, setActionData] = useState({
    status: '',
    adminNote: '',
    rejectionReason: ''
  });

  useEffect(() => {
    fetchWithdrawals();
  }, [filters]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const result = await adminService.getWithdrawals(filters);
      setWithdrawals(result.withdrawals || []);
      setPagination(result.pagination || {});
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Không thể tải danh sách rút tiền');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (withdrawalId, status) => {
    if (!actionData.adminNote && status !== 'processing') {
      toast.error('Vui lòng nhập ghi chú quản trị viên');
      return;
    }

    if (status === 'rejected' && !actionData.rejectionReason) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setProcessing(true);
      await adminService.updateWithdrawalStatus(withdrawalId, status, actionData);
      
      toast.success(
        status === 'processing'
          ? 'Đã chuyển sang đang xử lý'
          : status === 'completed'
          ? 'Đã duyệt yêu cầu rút tiền'
          : 'Đã từ chối yêu cầu rút tiền'
      );
      
      setShowModal(false);
      setSelectedWithdrawal(null);
      setActionData({ status: '', adminNote: '', rejectionReason: '' });
      fetchWithdrawals();
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setProcessing(false);
    }
  };

  const openActionModal = (withdrawal, status) => {
    setSelectedWithdrawal(withdrawal);
    setActionData({ ...actionData, status });
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Chờ xử lý' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: AlertCircle, label: 'Đang xử lý' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Đã hoàn thành' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Đã từ chối' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle, label: 'Đã hủy' }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-4 h-4 mr-1" />
        {badge.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản Lý Rút Tiền</h1>
        <p className="text-gray-600 mt-2">Quản lý các yêu cầu rút tiền từ người dùng</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="processing">Đang xử lý</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="rejected">Đã từ chối</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Withdrawals Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : withdrawals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Không có yêu cầu rút tiền nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngân hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {withdrawal.user?.profile?.firstName} {withdrawal.user?.profile?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{withdrawal.user?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(withdrawal.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{withdrawal.bankDetails?.bankName}</div>
                      <div className="text-sm text-gray-500">
                        {withdrawal.bankDetails?.accountNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {withdrawal.bankDetails?.accountHolderName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(withdrawal.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(withdrawal.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {withdrawal.status === 'pending' && (
                        <button
                          onClick={() => openActionModal(withdrawal, 'processing')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mr-2"
                        >
                          Xử lý
                        </button>
                      )}
                      {withdrawal.status === 'processing' && (
                        <>
                          <button
                            onClick={() => openActionModal(withdrawal, 'completed')}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg mr-2"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => openActionModal(withdrawal, 'rejected')}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {withdrawals.length} trên {pagination.totalItems} yêu cầu
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                <span className="px-4 py-2">
                  Trang {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Modal */}
      {showModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold mb-4">
              {actionData.status === 'processing' && 'Bắt đầu xử lý'}
              {actionData.status === 'completed' && 'Duyệt rút tiền'}
              {actionData.status === 'rejected' && 'Từ chối rút tiền'}
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Số tiền: <span className="font-semibold">{formatCurrency(selectedWithdrawal.amount)}</span></p>
              <p className="text-sm text-gray-600">Người dùng: <span className="font-semibold">{selectedWithdrawal.user?.email}</span></p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú quản trị viên {actionData.status !== 'processing' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={actionData.adminNote}
                onChange={(e) => setActionData({ ...actionData, adminNote: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập ghi chú..."
              />
            </div>

            {actionData.status === 'rejected' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={actionData.rejectionReason}
                  onChange={(e) => setActionData({ ...actionData, rejectionReason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập lý do từ chối..."
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedWithdrawal(null);
                  setActionData({ status: '', adminNote: '', rejectionReason: '' });
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleStatusChange(selectedWithdrawal._id, actionData.status)}
                disabled={processing}
                className={`flex-1 px-4 py-2 rounded-lg text-white disabled:opacity-50 ${
                  actionData.status === 'completed'
                    ? 'bg-green-600 hover:bg-green-700'
                    : actionData.status === 'rejected'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {processing ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalManagement;
