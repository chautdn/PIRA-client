import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin';
import { useAuth } from '../../hooks/useAuth';
import icons from "../../utils/icons";

const { FiAlertTriangle, FaHourglassHalf , FaQuestion, BiCheckCircle, BiClipboard , FiSearch, FiTrash2, FiUser, FiPackage, FiShield, FiBell, FiSettings, FiEye, FiX } = icons;

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
    page: 1,
    limit: 10
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  useEffect(() => {
    fetchReports();
  }, [filters]); // Use filters directly instead of fetchReports

  // Sync searchQuery with filters.search when filters change externally
  useEffect(() => {
    // Only sync if search query is different and not in typing mode
    if (!searchTimeout && filters.search !== searchQuery) {
      setSearchQuery(filters.search);
    }
  }, [filters.search, searchQuery, searchTimeout]);

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
    if (key === 'search') {
      // Update search query immediately (for UI)
      setSearchQuery(value);
      
      // Clear existing timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Set new timeout to update actual filter
      const newTimeout = setTimeout(() => {
        setFilters(prev => ({
          ...prev,
          search: value,
          page: 1
        }));
      }, 500);

      setSearchTimeout(newTimeout);
    } else {
      // For other filters, update immediately
      setFilters(prev => ({
        ...prev,
        [key]: value,
        page: key === 'page' ? value : 1
      }));
    }
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

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
      if (action === 'resolve') {
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
        icon: <FiAlertTriangle className="text-sm" />
      },
      'INAPPROPRIATE': { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        text: 'Không phù hợp',
        icon: <FiAlertTriangle className="text-sm" />
      },
      'HARASSMENT': { 
        color: 'bg-purple-100 text-purple-800 border-purple-200', 
        text: 'Quấy rối',
        icon: <FiAlertTriangle className="text-sm" />
      },
      'OTHER': { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        text: 'Khác',
        icon: <FaQuestion  className="text-sm" />
      }
    };

    const config = typeConfig[type] || typeConfig.OTHER;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
        {config.icon}
        <span>{config.text}</span>
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        text: 'Chờ xử lý',
        icon: <FaHourglassHalf  className="text-sm" />
      },
      'REVIEWED': { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        text: 'Đã xem',
        icon: <FiEye className="text-sm" />
      },
      'RESOLVED': { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        text: 'Đã giải quyết',
        icon: <BiCheckCircle className="text-sm" />
      },
      'DISMISSED': { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        text: 'Đã hủy',
        icon: <FiX className="text-sm" />
      }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
        {config.icon}
        <span>{config.text}</span>
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-red-600 via-orange-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
              <FiAlertTriangle className="text-5xl" />
              Quản lý Báo cáo
            </h1>
            <p className="text-orange-100 text-lg">Quản lý và xử lý các báo cáo vi phạm trong hệ thống</p>
          </div>
          <button className="px-6 py-3 bg-white text-red-600 rounded-xl hover:bg-red-50 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2">
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Tổng Báo cáo</p>
              <p className="text-3xl font-bold text-gray-900">{(pagination?.total || 0).toLocaleString('vi-VN')}</p>
            </div>
            <div className="bg-red-100 p-4 rounded-full">
              <FiAlertTriangle className="text-3xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Chờ xử lý</p>
              <p className="text-3xl font-bold text-gray-900">{reports.filter(r => r.status === 'PENDING').length}</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded-full">
              <FaHourglassHalf  className="text-3xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Đã giải quyết</p>
              <p className="text-3xl font-bold text-gray-900">{reports.filter(r => r.status === 'RESOLVED').length}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-full">
              <BiCheckCircle className="text-3xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Trang hiện tại</p>
              <p className="text-3xl font-bold text-gray-900">{pagination?.currentPage || 1}<span className="text-lg text-gray-500">/{pagination?.totalPages || 1}</span></p>
            </div>
            <div className="bg-purple-100 p-4 rounded-full">
              <FaQuestion  className="text-3xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FiSearch className="text-2xl" />
            Bộ lọc & Tìm kiếm
          </h2>
          <button
            onClick={() => {
              setFilters({ search: '', reportType: '', status: '', page: 1, limit: 10 });
              setSearchQuery('');
              if (searchTimeout) {
                clearTimeout(searchTimeout);
                setSearchTimeout(null);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-semibold rounded-lg hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <FiTrash2 />
            Xóa bộ lọc
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <FiSearch />
                Tìm kiếm
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Lý do, mô tả báo cáo..."
                value={searchQuery}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {searchTimeout && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <FiAlertTriangle />
                Loại báo cáo
              </span>
            </label>
            <select
              value={filters.reportType}
              onChange={(e) => handleFilterChange('reportType', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Tất cả loại</option>
              <option value="SPAM">Spam</option>
              <option value="INAPPROPRIATE">Không phù hợp</option>
              <option value="HARASSMENT">Quấy rối</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <BiClipboard />
                Trạng thái
              </span>
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="REVIEWED">Đã xem</option>
              <option value="RESOLVED">Đã giải quyết</option>
              <option value="DISMISSED">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedReports.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-5 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 text-white p-2 rounded-lg">
                <BiClipboard className="text-xl" />
              </div>
              <div>
                <span className="text-lg text-orange-900 font-bold">
                  Đã chọn {selectedReports.length} báo cáo
                </span>
                <p className="text-sm text-orange-700">Chọn hành động để áp dụng hàng loạt</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleBulkAction('resolve')}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm rounded-lg hover:from-green-600 hover:to-emerald-600 flex items-center gap-2 font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <BiCheckCircle className="text-lg" /> Giải quyết tất cả
              </button>
              <button
                onClick={() => handleBulkAction('dismiss')}
                className="px-4 py-2 bg-gradient-to-r from-gray-500 to-slate-500 text-white text-sm rounded-lg hover:from-gray-600 hover:to-slate-600 flex items-center gap-2 font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <FiX className="text-lg" /> Bác bỏ tất cả
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
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-red-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <FiAlertTriangle className="text-2xl" />
              Danh sách báo cáo
              <span className="ml-2 px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full">
                {reports.length}
              </span>
            </h3>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Hiển thị trên trang này</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedReports.length === reports.length && reports.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <FiAlertTriangle className="inline mr-1" /> Báo cáo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <FiUser className="inline mr-1" /> Người báo cáo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <FiPackage className="inline mr-1" /> Sản phẩm bị báo cáo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <FiShield className="inline mr-1" /> Loại báo cáo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <FiBell className="inline mr-1" /> Trạng thái
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <FiSettings className="inline mr-1" /> Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="mt-2 text-lg font-bold text-gray-900">Không có báo cáo</h3>
                      <p className="mt-1 text-sm text-gray-500">Chưa có báo cáo nào trong hệ thống.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 transition-all duration-200">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report._id)}
                        onChange={() => handleSelectReport(report._id)}
                        className="rounded border-gray-300 w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-500 cursor-pointer"
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
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <FiEye className="text-sm" /> Xem chi tiết
                        </button>
                        {report.status === 'PENDING' && (
                          <select
                            onChange={(e) => handleStatusChange(report._id, e.target.value)}
                            className="px-3 py-2 border-2 border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all cursor-pointer"
                            defaultValue=""
                          >
                            <option value="" disabled>Cập nhật</option>
                            <option value="REVIEWED">Đã xem</option>
                            <option value="RESOLVED">Giải quyết</option>
                            <option value="DISMISSED">Hủy bỏ</option>
                          </select>
                        )}
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