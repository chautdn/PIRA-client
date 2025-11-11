import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/admin';

const AdminReportDetail = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [deletingProduct, setDeletingProduct] = useState(false);

  useEffect(() => {
    if (reportId) {
      loadReportDetail();
    }
  }, [reportId]);

  const loadReportDetail = async () => {
    try {
      setLoading(true);
      const response = await adminService.getReportById(reportId);
      
      if (response && response.success) {
        const reportData = response.data || response;
        setReport(reportData);
        setSelectedStatus(reportData.status || 'PENDING');
        setAdminNotes(reportData.adminNotes || '');
      } else {
        throw new Error('Không thể tải thông tin báo cáo');
      }
    } catch (err) {
      console.error('Error loading report detail:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      await adminService.updateReportStatus(reportId, selectedStatus, adminNotes);
      
      // Reload report data
      await loadReportDetail();
      alert('Cập nhật trạng thái thành công!');
    } catch (err) {
      console.error('Error updating report status:', err);
      alert('Có lỗi xảy ra khi cập nhật trạng thái!');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa báo cáo này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      await adminService.deleteReport(reportId);
      alert('Xóa báo cáo thành công!');
      navigate('/admin/reports');
    } catch (err) {
      console.error('Error deleting report:', err);
      alert('Có lỗi xảy ra khi xóa báo cáo!');
    }
  };

  const handleDeleteProduct = async () => {
    if (!report.reportedItem?._id) {
      alert('Không tìm thấy sản phẩm để xóa!');
      return;
    }

    if (!confirm(
      `Bạn có chắc chắn muốn xóa sản phẩm "${report.reportedItem.title}"?\n\n` +
      'Hành động này sẽ:\n' +
      '- Xóa vĩnh viễn sản phẩm khỏi hệ thống\n' +
      '- Không thể hoàn tác\n' +
      '- Ảnh hưởng đến tất cả dữ liệu liên quan\n\n' +
      'Bạn có muốn tiếp tục?'
    )) {
      return;
    }

    try {
      setDeletingProduct(true);
      await adminService.deleteProduct(report.reportedItem._id);
      
      // Reload report to show updated state
      await loadReportDetail();
      alert('Xóa sản phẩm thành công! Sản phẩm đã bị gỡ khỏi hệ thống.');
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Có lỗi xảy ra khi xóa sản phẩm: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingProduct(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        text: 'Chờ xử lý',
        icon: '⏳'
      },
      REVIEWED: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        text: 'Đã xem xét',
        icon: '👁️'
      },
      RESOLVED: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        text: 'Đã giải quyết',
        icon: '✅'
      },
      DISMISSED: { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        text: 'Đã bác bỏ',
        icon: '❌'
      }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full border ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </span>
    );
  };

  const getReportTypeBadge = (reportType) => {
    const typeConfig = {
      SPAM: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        text: 'Spam',
        icon: '🚫'
      },
      INAPPROPRIATE: { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        text: 'Không phù hợp',
        icon: '⚠️'
      },
      HARASSMENT: { 
        color: 'bg-purple-100 text-purple-800 border-purple-200', 
        text: 'Quấy rối',
        icon: '😡'
      },
      OTHER: { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        text: 'Khác',
        icon: '📝'
      }
    };

    const config = typeConfig[reportType] || typeConfig.OTHER;
    
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <span className="text-red-500 mr-3 text-xl">⚠️</span>
          <div>
            <h3 className="text-lg font-medium text-red-800">Lỗi tải báo cáo</h3>
            <p className="text-red-600">{error || 'Không tìm thấy báo cáo'}</p>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate('/admin/reports')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/reports')}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-red-600">🚨</span>
              Chi tiết Báo cáo #{report._id?.slice(-8)}
            </h1>
            <p className="text-gray-600 mt-1">
              Báo cáo được tạo lúc {formatDate(report.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDeleteReport}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <span>🗑️</span>
            Xóa báo cáo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span>📋</span>
                Thông tin báo cáo
              </h2>
              <div className="flex items-center gap-3">
                {getReportTypeBadge(report.reportType)}
                {getStatusBadge(report.status)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <span>💬</span>
                    Lý do báo cáo
                  </span>
                </label>
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-red-900 font-medium">
                    {report.reason || 'Không có lý do cụ thể'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <span>🏷️</span>
                    Loại báo cáo
                  </span>
                </label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  {getReportTypeBadge(report.reportType)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <span>📅</span>
                    Ngày báo cáo
                  </span>
                </label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-900 font-medium">
                    {formatDate(report.createdAt)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <span>🔄</span>
                    Trạng thái hiện tại
                  </span>
                </label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  {getStatusBadge(report.status)}
                </div>
              </div>
            </div>

            {/* Description Section */}
            {report.description && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <span>📝</span>
                    Mô tả chi tiết
                  </span>
                </label>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-yellow-900 whitespace-pre-wrap">
                    {report.description}
                  </p>
                </div>
              </div>
            )}

            {report.description && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả chi tiết
                </label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {report.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Reporter Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>👤</span>
              Thông tin người báo cáo
            </h2>

            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {(report.reporter?.fullName || report.reporter?.username || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Họ tên</label>
                    <p className="mt-1 text-gray-900 font-medium">
                      {report.reporter?.fullName || report.reporter?.username || 'Người dùng ẩn danh'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-gray-900">
                      {report.reporter?.email || 'Không có email'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                    <p className="mt-1 text-gray-900">
                      {report.reporter?.phone || 'Không có số điện thoại'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Trạng thái tài khoản</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      report.reporter?.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {report.reporter?.status === 'ACTIVE' ? '✅ Hoạt động' : '❌ Không hoạt động'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày tham gia</label>
                    <p className="mt-1 text-gray-900">
                      {report.reporter?.createdAt ? formatDate(report.reporter.createdAt) : 'Không xác định'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Xác minh KYC</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      report.reporter?.isKycVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {report.reporter?.isKycVerified ? '✅ Đã xác minh' : '⏳ Chưa xác minh'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reported Item Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📦</span>
              Đối tượng bị báo cáo
            </h2>

            {report.reportedItem ? (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start gap-4">
                  {report.reportedItem.images && report.reportedItem.images.length > 0 && (
                    <img
                      src={typeof report.reportedItem.images[0] === 'string' 
                        ? report.reportedItem.images[0] 
                        : report.reportedItem.images[0]?.url || report.reportedItem.images[0]}
                      alt="Product"
                      className="w-20 h-20 object-cover rounded-lg border"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/80x80?text=No+Image';
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {report.reportedItem.title || 'Sản phẩm không có tiêu đề'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ID sản phẩm</label>
                        <p className="text-gray-600 font-mono text-sm">{report.reportedItem._id}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Giá</label>
                        <p className="text-gray-900 font-semibold">
                          {report.reportedItem.price ? 
                            new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(report.reportedItem.price) 
                            : 'Không xác định'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Trạng thái sản phẩm</label>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          report.reportedItem.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : report.reportedItem.status === 'INACTIVE'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {report.reportedItem.status === 'ACTIVE' ? '✅ Hoạt động' : 
                           report.reportedItem.status === 'INACTIVE' ? '❌ Không hoạt động' : 
                           report.reportedItem.status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                        <p className="text-gray-900">
                          {report.reportedItem.category?.name || 'Không có danh mục'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
                        <p className="text-gray-600">
                          {report.reportedItem.createdAt ? formatDate(report.reportedItem.createdAt) : 'Không xác định'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Số lượng xem</label>
                        <p className="text-gray-900">
                          {report.reportedItem.viewCount || 0} lượt xem
                        </p>
                      </div>
                    </div>

                    {/* Product Description */}
                    {report.reportedItem.description && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả sản phẩm</label>
                        <div className="bg-gray-50 border p-3 rounded-lg">
                          <p className="text-gray-900 text-sm whitespace-pre-wrap">
                            {report.reportedItem.description}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Owner Information */}
                    {report.reportedItem.owner && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <span>👤</span>
                          Thông tin chủ sở hữu
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Tên chủ sở hữu</label>
                            <p className="text-gray-900 font-medium">
                              {report.reportedItem.owner.fullName || report.reportedItem.owner.username || 'Không xác định'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <p className="text-gray-600">{report.reportedItem.owner.email || 'Không có email'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                            <p className="text-gray-600">{report.reportedItem.owner.phone || 'Không có số điện thoại'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Trạng thái tài khoản</label>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              report.reportedItem.owner.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {report.reportedItem.owner.status === 'ACTIVE' ? '✅ Hoạt động' : '❌ Không hoạt động'}
                            </span>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Xác minh KYC</label>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              report.reportedItem.owner.isKycVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {report.reportedItem.owner.isKycVerified ? '✅ Đã xác minh' : '⏳ Chưa xác minh'}
                            </span>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Ngày tham gia</label>
                            <p className="text-gray-600">
                              {report.reportedItem.owner.createdAt ? formatDate(report.reportedItem.owner.createdAt) : 'Không xác định'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Product Actions */}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex gap-3">
                        <button
                          onClick={handleDeleteProduct}
                          disabled={deletingProduct || report.reportedItem.status === 'DELETED'}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {deletingProduct ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              Đang xóa...
                            </>
                          ) : (
                            <>
                              <span>🗑️</span>
                              Xóa sản phẩm
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => window.open(`/product/${report.reportedItem._id}`, '_blank')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                          <span>👁️</span>
                          Xem sản phẩm
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-2 block">❌</span>
                <p>Đối tượng đã bị xóa hoặc không còn tồn tại</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>⚙️</span>
              Cập nhật trạng thái
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PENDING">⏳ Chờ xử lý</option>
                  <option value="REVIEWED">👁️ Đã xem xét</option>
                  <option value="RESOLVED">✅ Đã giải quyết</option>
                  <option value="DISMISSED">❌ Đã bác bỏ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú của admin
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập ghi chú về việc xử lý báo cáo này..."
                />
              </div>

              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    Cập nhật trạng thái
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Report Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📅</span>
              Lịch sử báo cáo
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  📝
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Báo cáo được tạo</p>
                  <p className="text-xs text-gray-500">{formatDate(report.createdAt)}</p>
                </div>
              </div>

              {report.updatedAt && report.updatedAt !== report.createdAt && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    ✏️
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Báo cáo được cập nhật</p>
                    <p className="text-xs text-gray-500">{formatDate(report.updatedAt)}</p>
                  </div>
                </div>
              )}

              {report.adminNotes && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    👨‍💼
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Ghi chú từ admin</p>
                    <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-1">
                      {report.adminNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>⚡</span>
              Thao tác nhanh
            </h3>

            <div className="space-y-3">
              {report.reportedItem && (
                <Link
                  to={`/admin/products/${report.reportedItem._id}`}
                  className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                >
                  <span>👁️</span>
                  Xem chi tiết sản phẩm
                </Link>
              )}
              
              {report.reporter && (
                <Link
                  to={`/admin/users/${report.reporter._id}`}
                  className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2"
                >
                  <span>👤</span>
                  Xem thông tin người báo cáo
                </Link>
              )}

              <button
                onClick={() => window.print()}
                className="w-full px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <span>🖨️</span>
                In báo cáo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportDetail;