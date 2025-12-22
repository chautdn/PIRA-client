import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin';
import { formatCurrency } from '../../utils/constants';

const AdminShipperDetail = () => {
  const { shipperId } = useParams();
  const navigate = useNavigate();
  const [shipper, setShipper] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    totalCompleted: 0,
    totalFailed: 0
  });
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDateRange, setFilterDateRange] = useState('ALL');
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [selectedImages, setSelectedImages] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    loadShipperData();
  }, [shipperId]);

  useEffect(() => {
    applyFilters();
  }, [shipments, filterStatus, filterDateRange]);

  const loadShipperData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get shipper details from API
      const shipperData = await adminService.getShipperById(shipperId);
      
      if (shipperData) {
        setShipper(shipperData);
        setShipments(shipperData.recentShipments || []);
        
        
        // Calculate stats from recent shipments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const recentShipments = shipperData.recentShipments || [];
        
        const calculatedStats = {
          today: recentShipments.filter(s => new Date(s.createdAt) >= today).length,
          thisWeek: recentShipments.filter(s => new Date(s.createdAt) >= weekAgo).length,
          thisMonth: recentShipments.filter(s => new Date(s.createdAt) >= monthAgo).length,
          totalCompleted: shipperData.completedShipments || 0,
          totalFailed: shipperData.failedShipments || 0
        };
        
        setStats(calculatedStats);
      } else {
        setError('Không tìm thấy shipper');
      }
    } catch (err) {
      setError(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = shipments;

    // Filter by status
    if (filterStatus !== 'ALL') {
      result = result.filter(s => {
        if (filterStatus === 'COMPLETED') return s.status === 'DELIVERED';
        if (filterStatus === 'PENDING') return ['PENDING', 'SHIPPER_CONFIRMED', 'IN_TRANSIT'].includes(s.status);
        if (filterStatus === 'FAILED') return ['CANCELLED', 'DELIVERY_FAILED'].includes(s.status);
        return true;
      });
    }

    // Filter by date range
    if (filterDateRange !== 'ALL') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      result = result.filter(s => {
        const shipmentDate = new Date(s.createdAt);
        
        if (filterDateRange === 'TODAY') {
          return shipmentDate >= today;
        }
        if (filterDateRange === 'WEEK') {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return shipmentDate >= weekAgo;
        }
        if (filterDateRange === 'MONTH') {
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          return shipmentDate >= monthAgo;
        }
        return true;
      });
    }

    setFilteredShipments(result);
  };

  const openImageModal = (proofImages) => {
    setSelectedImages(proofImages);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImages(null);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'CHỜ XỬ LÝ': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' },
      'HOÀN THÀNH': { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
      'ĐÃ HỦY': { bg: 'bg-red-100', text: 'text-red-800', icon: '❌' },
      'ĐANG GIAO': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🚚' }
    };
    const style = statusMap[status] || statusMap['CHỜ XỬ LÝ'];
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
        <span>{style.icon}</span>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !shipper) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/admin/shipments')}
            className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            ← Quay lại
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium">{error || 'Không tìm thấy shipper'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header & Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/shipments')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ←
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Chi tiết Shipper</h1>
          </div>
          <span className={`px-4 py-2 rounded-full font-semibold ${
            shipper.status === 'ACTIVE' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {shipper.status === 'ACTIVE' ? '🟢 Đang hoạt động' : '🔴 Tạm dừng'}
          </span>
        </div>

        {/* Shipper Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm mb-2">Tên Shipper</p>
            <p className="text-2xl font-bold text-gray-900">{shipper.profile?.firstName}</p>
            <p className="text-xs text-gray-500 mt-2">{shipper.email}</p>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm mb-2">Liên hệ</p>
            <p className="text-2xl font-bold text-gray-900">{shipper.phone}</p>
            <p className="text-xs text-gray-500 mt-2">{shipper.address?.district}, {shipper.address?.city}</p>
          </div>

          {/* Success Rate */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm mb-2">Tỉ lệ Thành công</p>
            <p className="text-2xl font-bold text-gray-900">
              {shipper.totalShipments > 0 
                ? ((shipper.completedShipments / shipper.totalShipments) * 100).toFixed(1) 
                : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-2">{shipper.completedShipments}/{shipper.totalShipments} đơn</p>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm mb-2">Doanh thu</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(shipper.revenue)}</p>
            <p className="text-xs text-gray-500 mt-2">Từ {shipper.totalShipments} đơn</p>
          </div>
        </div>

        {/* Rating Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-2">Đánh giá trung bình</p>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-bold text-orange-500">
                  {shipper.averageRating || 0}
                </span>
                <span className="text-2xl">⭐</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Từ {shipper.totalReviews || 0} đánh giá
              </p>
            </div>
            {shipper.recentReviews && shipper.recentReviews.length > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-2">Đánh giá gần nhất</p>
                {shipper.recentReviews.slice(0, 3).map((review, idx) => (
                  <div key={idx} className="text-xs text-gray-600 mb-1">
                    {review.rating}⭐ - {review.userId?.profile?.firstName || 'Người dùng'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-600 text-xs uppercase mb-2">Hôm nay</p>
            <p className="text-3xl font-bold text-blue-600">{stats.today}</p>
            <p className="text-xs text-gray-500 mt-1">đơn</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-600 text-xs uppercase mb-2">Tuần này</p>
            <p className="text-3xl font-bold text-green-600">{stats.thisWeek}</p>
            <p className="text-xs text-gray-500 mt-1">đơn</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-600 text-xs uppercase mb-2">Tháng này</p>
            <p className="text-3xl font-bold text-purple-600">{stats.thisMonth}</p>
            <p className="text-xs text-gray-500 mt-1">đơn</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-600 text-xs uppercase mb-2">Hoàn thành</p>
            <p className="text-3xl font-bold text-green-600">{stats.totalCompleted}</p>
            <p className="text-xs text-gray-500 mt-1">đơn</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-600 text-xs uppercase mb-2">Thất bại</p>
            <p className="text-3xl font-bold text-red-600">{stats.totalFailed}</p>
            <p className="text-xs text-gray-500 mt-1">đơn</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Lọc</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả</option>
                <option value="COMPLETED">✅ Hoàn thành</option>
                <option value="PENDING">⏳ Chờ xử lý</option>
                <option value="FAILED">❌ Thất bại</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Khoảng thời gian</label>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả</option>
                <option value="TODAY">Hôm nay</option>
                <option value="WEEK">Tuần này</option>
                <option value="MONTH">Tháng này</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shipments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-100 border-b px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              📦 Danh sách đơn vận chuyển ({filteredShipments.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Mã Đơn</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Khách Hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Sản Phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Giá</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Trạng Thái</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Thanh Toán</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Thời Gian</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">📸 Ảnh Chứng Minh</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      Không tìm thấy đơn vận chuyển nào
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((shipment, idx) => {
                    const statusDisplay = {
                      'PENDING': 'CHỜ XỬ LÝ',
                      'SHIPPER_CONFIRMED': 'ĐÃ XÁC NHẬN',
                      'IN_TRANSIT': 'ĐANG GIAO',
                      'DELIVERED': 'HOÀN THÀNH',
                      'CANCELLED': 'ĐÃ HỦY',
                      'DELIVERY_FAILED': 'GIAO THẤT BẠI',
                      'FAILED': 'THẤT BẠI'
                    }[shipment.status] || shipment.status;

                    return (
                      <tr key={shipment._id || idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-semibold text-blue-600">
                              {shipment.masterOrderNumber || 'N/A'}
                            </span>
                            <p className="text-xs text-gray-500">
                              {shipment.subOrderNumber || ''}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{shipment.customer?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{shipment.customer?.phone || '-'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {shipment.type === 'DELIVERY' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              Giao hàng
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                              Trả về
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {shipment.products && shipment.products.length > 0 ? (
                            <div className="flex items-center gap-2">
                              {shipment.products[0].image && (
                                <img src={shipment.products[0].image} alt="Product" className="w-10 h-10 object-cover rounded" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">{shipment.products[0].name}</p>
                                {shipment.products.length > 1 && (
                                  <p className="text-xs text-gray-500">+{shipment.products.length - 1} sản phẩm</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {formatCurrency(shipment.fee || 0)}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(statusDisplay)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            ✓ Đã thanh toán
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div>
                            {new Date(shipment.createdAt).toLocaleString('vi-VN')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {shipment.proofImages && 
                           ((shipment.proofImages.before && shipment.proofImages.before.length > 0) || 
                            (shipment.proofImages.after && shipment.proofImages.after.length > 0)) ? (
                            <button
                              onClick={() => openImageModal(shipment.proofImages)}
                              className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Xem
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Chưa có ảnh</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Image Modal */}
        {showImageModal && selectedImages && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4" onClick={closeImageModal}>
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-xl font-bold text-gray-900">📸 Ảnh Chứng Minh Giao Hàng</h3>
                <button 
                  onClick={closeImageModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Before Images */}
                {selectedImages.before && selectedImages.before.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-blue-700 mb-3 flex items-center gap-2">
                      <span className="bg-blue-100 px-3 py-1 rounded-full">📦 Trước Giao Hàng ({selectedImages.before.length})</span>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedImages.before.map((mediaUrl, idx) => {
                        const isVideo = mediaUrl.includes('/video/') || mediaUrl.match(/\.(mp4|webm|ogg)$/i);
                        return (
                          <div key={idx} className="relative group">
                            {isVideo ? (
                              <video 
                                src={mediaUrl} 
                                className="w-full h-64 object-cover rounded-lg border-4 border-blue-200 hover:border-blue-400 transition-colors cursor-pointer"
                                onClick={() => window.open(mediaUrl, '_blank')}
                                controls
                              />
                            ) : (
                              <img 
                                src={mediaUrl} 
                                alt={`Before ${idx + 1}`}
                                className="w-full h-64 object-cover rounded-lg border-4 border-blue-200 hover:border-blue-400 transition-colors cursor-pointer"
                                onClick={() => window.open(mediaUrl, '_blank')}
                              />
                            )}
                            <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-sm font-semibold">
                              #{idx + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* After Images */}
                {selectedImages.after && selectedImages.after.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                      <span className="bg-green-100 px-3 py-1 rounded-full">✅ Sau Giao Hàng ({selectedImages.after.length})</span>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedImages.after.map((mediaUrl, idx) => {
                        const isVideo = mediaUrl.includes('/video/') || mediaUrl.match(/\.(mp4|webm|ogg)$/i);
                        return (
                          <div key={idx} className="relative group">
                            {isVideo ? (
                              <video 
                                src={mediaUrl} 
                                className="w-full h-64 object-cover rounded-lg border-4 border-green-200 hover:border-green-400 transition-colors cursor-pointer"
                                onClick={() => window.open(mediaUrl, '_blank')}
                                controls
                              />
                            ) : (
                              <img 
                                src={mediaUrl} 
                                alt={`After ${idx + 1}`}
                                className="w-full h-64 object-cover rounded-lg border-4 border-green-200 hover:border-green-400 transition-colors cursor-pointer"
                                onClick={() => window.open(mediaUrl, '_blank')}
                              />
                            )}
                            <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-sm font-semibold">
                              #{idx + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
                <button 
                  onClick={closeImageModal}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminShipperDetail;
