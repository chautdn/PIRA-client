import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin';
import { useAuth } from '../../hooks/useAuth';

const ReportManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReports, setSelectedReports] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    reportType: '',
    status: '',
    page: 1
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Bạn cần đăng nhập để xem danh sách báo cáo');
        setReports([]);
        return;
      }
      
      const response = await adminService.getReports(filters);
      
      if (response && response.success && response.data) {
        const { reports: reportsData, pagination: paginationData } = response.data;
        setReports(reportsData || []);
        setPagination(paginationData || {
          currentPage: 1,
          totalPages: 1,
          total: 0,
          limit: 10
        });
      } else {
        setReports([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          total: 0,
          limit: 10
        });
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Lỗi khi tải danh sách báo cáo: ' + (err.message || 'Unknown error'));
      setReports([]);
    } finally {
      setLoading(false);
    }
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

  const handleStatusChange = async (reportId, newStatus, adminNotes = '') => {
    try {
      await adminService.updateReportStatus(reportId, newStatus, adminNotes);
      fetchReports(); // Refresh list
    } catch (error) {
      console.error('Error updating report status:', error);
      setError('Lỗi khi cập nhật trạng thái báo cáo');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) {
      return;
    }

    try {
      await adminService.deleteReport(reportId);
      fetchReports(); // Refresh list
    } catch (error) {
      console.error('Error deleting report:', error);
      setError('Lỗi khi xóa báo cáo');
    }
  };

  const handleSelectReport = (reportId) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map(report => report._id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedReports.length === 0) {
      alert('Vui lòng chọn ít nhất một báo cáo');
      return;
    }

    try {
      if (action === 'delete') {
        if (!window.confirm('Bạn có chắc chắn muốn xóa các báo cáo đã chọn?')) return;
        for (const reportId of selectedReports) {
          await adminService.deleteReport(reportId);
        }
        alert('Xóa thành công!');
      } else if (action === 'resolve') {
        if (!window.confirm('Bạn có chắc chắn muốn đánh dấu các báo cáo đã chọn là đã giải quyết?')) return;
        for (const reportId of selectedReports) {
          await adminService.updateReportStatus(reportId, 'RESOLVED', 'Giải quyết hàng loạt');
        }
        alert('Cập nhật trạng thái thành công!');
      } else if (action === 'dismiss') {
        if (!window.confirm('Bạn có chắc chắn muốn bác bỏ các báo cáo đã chọn?')) return;
        for (const reportId of selectedReports) {
          await adminService.updateReportStatus(reportId, 'DISMISSED', 'Bác bỏ hàng loạt');
        }
        alert('Cập nhật trạng thái thành công!');
      }
      setSelectedReports([]);
      fetchReports();
    } catch (err) {
      console.error('Bulk action error:', err);
      alert('Có lỗi xảy ra khi thực hiện thao tác!');
    }
  };

  const getReportTypeBadge = (type) => {
    const typeConfig = {
      'SPAM': { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        text: 'Spam',
        icon: '🚫'
      },
      'INAPPROPRIATE': { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        text: 'Không phù hợp',
        icon: '⚠️'
      },
      'HARASSMENT': { 
        color: 'bg-purple-100 text-purple-800 border-purple-200', 
        text: 'Quấy rối',
        icon: '🚨'
      },
      'OTHER': { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        text: 'Khác',
        icon: '❓'
      }
    };

    const config = typeConfig[type] || typeConfig.OTHER;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        text: 'Chờ xử lý',
        icon: '⏳'
      },
      'REVIEWED': { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        text: 'Đã xem',
        icon: '👀'
      },
      'RESOLVED': { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        text: 'Đã giải quyết',
        icon: '✅'
      },
      'DISMISSED': { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        text: 'Đã hủy',
        icon: '❌'
      }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-red-600">🚨</span>
            Quản lý Báo cáo
          </h1>
          <div className="flex items-center gap-6 mt-2">
            <p className="text-gray-600 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-md">
                📊 Tổng cộng: {pagination.total.toLocaleString('vi-VN')} báo cáo
              </span>
            </p>
            <p className="text-gray-600 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-md">
                📄 Trang {pagination.currentPage}/{pagination.totalPages}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span>🔍</span>
            Bộ lọc & Tìm kiếm
          </h2>
          <button
            onClick={() => setFilters({ search: '', reportType: '', status: '', page: 1 })}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            <span>🗑️</span>
            Xóa bộ lọc
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <span>🔍</span>
                Tìm kiếm
              </span>
            </label>
            <input
              type="text"
              placeholder="Lý do, mô tả báo cáo..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <span>🚨</span>
                Loại báo cáo
              </span>
            </label>
            <select
              value={filters.reportType}
              onChange={(e) => handleFilterChange('reportType', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Tất cả loại</option>
              <option value="SPAM">🚫 Spam</option>
              <option value="INAPPROPRIATE">⚠️ Không phù hợp</option>
              <option value="HARASSMENT">🚨 Quấy rối</option>
              <option value="OTHER">❓ Khác</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <span>📋</span>
                Trạng thái
              </span>
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">⏳ Chờ xử lý</option>
              <option value="REVIEWED">👀 Đã xem</option>
              <option value="RESOLVED">✅ Đã giải quyết</option>
              <option value="DISMISSED">❌ Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedReports.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-orange-800">
              Đã chọn {selectedReports.length} báo cáo
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('resolve')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1"
              >
                ✅ Giải quyết tất cả
              </button>
              <button
                onClick={() => handleBulkAction('dismiss')}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center gap-1"
              >
                ❌ Bác bỏ tất cả
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center gap-1"
              >
                🗑️ Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-red-800">{error}</p>
            {(error.includes('không có quyền') || error.includes('đăng nhập')) && (
              <button
                onClick={() => navigate('/auth/login')}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span>🚨</span>
            Danh sách báo cáo ({reports.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedReports.length === reports.length && reports.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Báo cáo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người báo cáo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm bị báo cáo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại báo cáo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Không có báo cáo</h3>
                      <p className="mt-1 text-sm text-gray-500">Chưa có báo cáo nào trong hệ thống.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report._id)}
                        onChange={() => handleSelectReport(report._id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{report._id?.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(report.createdAt)}
                        </div>
                        {report.reason && (
                          <div className="mt-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            💬 {report.reason}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                          {(report.reporter?.fullName || report.reporter?.username || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {report.reporter?.fullName || report.reporter?.username || 'Người dùng ẩn danh'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {report.reporter?.email || 'Không có email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {report.reportedItem?.title || 'Sản phẩm đã bị xóa'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.reason && (
                            <div className="mt-1">
                              <span className="text-xs font-medium">Lý do: </span>
                              <span className="text-xs">{report.reason}</span>
                            </div>
                          )}
                          {report.description && (
                            <div className="mt-1">
                              <span className="text-xs font-medium">Mô tả: </span>
                              <span className="text-xs">{report.description.substring(0, 100)}...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getReportTypeBadge(report.reportType)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {getStatusBadge(report.status)}
                        {report.adminNotes && (
                          <div className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
                            📝 {report.adminNotes}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/admin/reports/${report._id}`)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors duration-200 flex items-center gap-1"
                        >
                          👁️ Xem
                        </button>
                        {report.status === 'PENDING' && (
                          <select
                            onChange={(e) => handleStatusChange(report._id, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                            defaultValue=""
                          >
                            <option value="" disabled>Cập nhật</option>
                            <option value="REVIEWED">👀 Đã xem</option>
                            <option value="RESOLVED">✅ Giải quyết</option>
                            <option value="DISMISSED">❌ Hủy bỏ</option>
                          </select>
                        )}
                        <button
                          onClick={() => handleDeleteReport(report._id)}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors duration-200 flex items-center gap-1"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.currentPage === 1
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              Trước
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.currentPage === pagination.totalPages
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              Sau
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">{(pagination.currentPage - 1) * pagination.limit + 1}</span> đến{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * pagination.limit, pagination.total)}
                </span>{' '}
                trong <span className="font-medium">{pagination.total}</span> kết quả
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                    pagination.currentPage === 1
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-gray-500 bg-white hover:bg-gray-50'
                  }`}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                  let page;
                  if (pagination.totalPages <= 5) {
                    page = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    page = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    page = pagination.totalPages - 4 + i;
                  } else {
                    page = pagination.currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                    pagination.currentPage === pagination.totalPages
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-gray-500 bg-white hover:bg-gray-50'
                  }`}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagement;