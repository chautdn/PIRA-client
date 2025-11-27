import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userReportService } from '../../services/userReport';
import { useAuth } from '../../hooks/useAuth';

const UserReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: 'all'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [filters, user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userReportService.getUserReports(filters);
      
      if (response.success) {
        setReports(response.data.reports || []);
        setPagination(response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          total: 0,
          limit: 10
        });
      }
    } catch (err) {
      console.error('Fetch reports error:', err);
      setError('Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        text: '⏳ Đang xử lý',
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
        text: '❌ Bị từ chối',
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

  const getReportTypeLabel = (type) => {
    const types = {
      SPAM: '🚫 Spam',
      INAPPROPRIATE: '⚠️ Không phù hợp',
      HARASSMENT: '😡 Quấy rối',
      OTHER: '📝 Khác'
    };
    return types[type] || type;
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

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-600">Vui lòng đăng nhập để xem báo cáo của bạn</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📋 Báo cáo của tôi
        </h1>
        <p className="text-gray-600">
          Quản lý các báo cáo bạn đã gửi về sản phẩm
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Trạng thái:
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả</option>
            <option value="PENDING">Đang xử lý</option>
            <option value="REVIEWED">Đang xem xét</option>
            <option value="RESOLVED">Đã giải quyết</option>
            <option value="DISMISSED">Bị từ chối</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Reports List */}
      {!loading && !error && (
        <>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Chưa có báo cáo nào
              </h3>
              <p className="text-gray-600">
                Bạn chưa gửi báo cáo nào. Khi gặp sản phẩm vi phạm, hãy báo cáo để chúng tôi xử lý.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-semibold text-gray-900">
                          {getReportTypeLabel(report.reportType)}
                        </span>
                        {getStatusBadge(report.status)}
                      </div>
                      
                      {/* Product Info */}
                      {report.reportedItem && (
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                            {report.reportedItem.images?.[0] ? (
                              <img
                                src={report.reportedItem.images[0].url || report.reportedItem.images[0]}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                📦
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {report.reportedItem.title}
                            </div>
                            <div className="text-sm text-gray-600">
                              Sản phẩm bị báo cáo
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="mb-2">
                        <div className="text-sm text-gray-600 mb-1">Lý do:</div>
                        <div className="font-medium text-gray-900">
                          {report.reason}
                        </div>
                      </div>
                      
                      {report.description && (
                        <div className="mb-2">
                          <div className="text-sm text-gray-600 mb-1">Mô tả:</div>
                          <div className="text-gray-700">
                            {report.description}
                          </div>
                        </div>
                      )}
                      
                      {report.adminNotes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-blue-600 font-medium mb-1">
                            📝 Ghi chú từ admin:
                          </div>
                          <div className="text-blue-800">
                            {report.adminNotes}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-500 ml-4">
                      {formatDate(report.createdAt)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                
                <span className="px-4 py-2 text-sm text-gray-700">
                  Trang {pagination.currentPage} / {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserReports;