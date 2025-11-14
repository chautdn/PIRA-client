import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { userReportService } from '../services/userReport';
import { useAuth } from '../hooks/useAuth';

const MyReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await userReportService.getUserReports(filters);
      
      if (response.success) {
        setReports(response.data.reports || []);
        setPagination(response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          total: 0
        });
      }
    } catch (error) {
      console.error('Load reports error:', error);
      setError('Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        text: '⏳ Chờ xử lý',
        icon: '⏳'
      },
      REVIEWED: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        text: '👀 Đang xem xét',
        icon: '👀'
      },
      RESOLVED: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        text: '✅ Đã giải quyết',
        icon: '✅'
      },
      DISMISSED: { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        text: '❌ Đã bác bỏ',
        icon: '❌'
      }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </span>
    );
  };

  const getReportTypeBadge = (type) => {
    const typeConfig = {
      SPAM: { color: 'bg-red-100 text-red-800', text: 'Spam' },
      INAPPROPRIATE: { color: 'bg-orange-100 text-orange-800', text: 'Không phù hợp' },
      HARASSMENT: { color: 'bg-purple-100 text-purple-800', text: 'Quấy rối' },
      OTHER: { color: 'bg-gray-100 text-gray-800', text: 'Khác' }
    };

    const config = typeConfig[type] || typeConfig.OTHER;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Vui lòng đăng nhập để xem báo cáo của bạn</p>
          <Link 
            to="/login" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-red-600">🚨</span>
            Báo cáo của tôi
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý và theo dõi trạng thái các báo cáo bạn đã gửi
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả</option>
                <option value="PENDING">⏳ Chờ xử lý</option>
                <option value="REVIEWED">👀 Đang xem xét</option>
                <option value="RESOLVED">✅ Đã giải quyết</option>
                <option value="DISMISSED">❌ Đã bác bỏ</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>📊 Tổng cộng:</span>
              <span className="font-semibold text-blue-600">{pagination.total} báo cáo</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center text-red-800">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Reports List */}
        <div className="space-y-4">
          <AnimatePresence>
            {reports.length > 0 ? (
              reports.map((report) => (
                <motion.div
                  key={report._id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {report.reportedItem?.title || 'Sản phẩm đã bị xóa'}
                          </h3>
                          {getReportTypeBadge(report.reportType)}
                          {getStatusBadge(report.status)}
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Lý do:</span> {report.reason || 'Không có'}</p>
                          {report.description && (
                            <p><span className="font-medium">Mô tả:</span> {report.description}</p>
                          )}
                          <p><span className="font-medium">Ngày gửi:</span> {formatDate(report.createdAt)}</p>
                        </div>

                        {report.adminNotes && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <span className="font-medium">📝 Ghi chú của admin:</span> {report.adminNotes}
                            </p>
                          </div>
                        )}
                      </div>

                      {report.reportedItem && (
                        <div className="ml-6 flex-shrink-0">
                          <div className="w-24 h-24 rounded-lg overflow-hidden border">
                            {report.reportedItem.images && report.reportedItem.images.length > 0 ? (
                              <img
                                src={report.reportedItem.images[0]?.url || report.reportedItem.images[0]}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="w-full h-full bg-gray-200 flex items-center justify-center"
                              style={{ display: report.reportedItem.images?.length ? 'none' : 'flex' }}
                            >
                              <span className="text-gray-500 text-2xl">📦</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chưa có báo cáo nào
                </h3>
                <p className="text-gray-600 mb-6">
                  Bạn chưa gửi báo cáo nào. Khi bạn gặp vấn đề với sản phẩm, hãy báo cáo để chúng tôi xử lý.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🔍 Khám phá sản phẩm
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => handleFilterChange('page', filters.page - 1)}
                disabled={filters.page <= 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              
              {[...Array(pagination.totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handleFilterChange('page', page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      page === filters.page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => handleFilterChange('page', filters.page + 1)}
                disabled={filters.page >= pagination.totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReports;