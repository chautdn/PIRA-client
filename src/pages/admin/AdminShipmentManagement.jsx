import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin';
import { formatCurrency } from '../../utils/constants';
import { includesIgnoreDiacritics } from '../../utils/textUtils';
import { CiDeliveryTruck } from 'react-icons/ci';

const AdminShipmentManagement = () => {
  const navigate = useNavigate();
  const [shippers, setShippers] = useState([]);
  const [filteredShippers, setFilteredShippers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [stats, setStats] = useState({
    totalShippers: 0,
    totalShipments: 0,
    successRate: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    loadShipmentData();
  }, []);

  useEffect(() => {
    filterShippers();
  }, [searchQuery, filterRegion, shippers]);

  const loadShipmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch shippers list with stats
      const shippersRes = await adminService.getAllShippers?.();
      console.log('📦 Shippers response:', shippersRes);
      
      // Handle different response structures
      let shipperList = [];
      if (shippersRes?.data && Array.isArray(shippersRes.data)) {
        shipperList = shippersRes.data;
      } else if (shippersRes?.data?.data && Array.isArray(shippersRes.data.data)) {
        shipperList = shippersRes.data.data;
      } else if (Array.isArray(shippersRes)) {
        shipperList = shippersRes;
      }
      
      if (shipperList.length > 0) {
        console.log(`✅ Loaded ${shipperList.length} shippers from API`);
        setShippers(shipperList);
        
        // Calculate summary stats from shipper data
        const totalShipments = shipperList.reduce((sum, s) => sum + (s.totalShipments || 0), 0);
        const totalCompleted = shipperList.reduce((sum, s) => sum + (s.completedShipments || 0), 0);
        const totalRevenue = shipperList.reduce((sum, s) => sum + (s.revenue || 0), 0);
        
        setStats({
          totalShippers: shipperList.length,
          totalShipments,
          successRate: totalShipments > 0 ? ((totalCompleted / totalShipments) * 100).toFixed(1) : 0,
          totalRevenue
        });
      } else {
        console.warn('⚠️ No shippers found');
        setShippers([]);
      }
    } catch (err) {
      setError(err.message || 'Lỗi tải dữ liệu vận chuyển');
      console.error('❌ Error loading shipment data:', err);
      setShippers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterShippers = () => {
    let result = shippers;

    if (searchQuery) {
      result = result.filter(
        s =>
          includesIgnoreDiacritics(s.profile?.fullName, searchQuery) ||
          includesIgnoreDiacritics(s.profile?.firstName, searchQuery) ||
          includesIgnoreDiacritics(s.email, searchQuery) ||
          includesIgnoreDiacritics(s.phone, searchQuery)
      );
    }

    if (filterRegion) {
      result = result.filter(s => 
        includesIgnoreDiacritics(s.address?.district, filterRegion)
      );
    }

    setFilteredShippers(result);
  };

  const getSuccessRate = (shipper) => {
    const total = shipper.totalShipments || 0;
    const completed = shipper.completedShipments || 0;
    return total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CiDeliveryTruck className="w-8 h-8" /> Quản lí Vận chuyển
          </h1>
          <p className="text-gray-600 mt-2">Quản lý shipper và thống kê vận chuyển toàn hệ thống</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Tổng Shipper</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalShippers || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Tổng Đơn Vận chuyển</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalShipments || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Tỉ lệ Thành công</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.successRate || 0}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Tổng Doanh thu</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalRevenue || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shipper List */}
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Tìm kiếm & Lọc</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm theo tên/email/SĐT</label>
                <input
                  type="text"
                  placeholder="Nhập tên, email hoặc số điện thoại..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo khu vực</label>
                <input
                  type="text"
                  placeholder="Nhập quận/huyện..."
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Shippers Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                📦 Danh sách Shipper ({filteredShippers.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Shipper</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Khu vực</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tổng đơn</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Hoàn thành</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Thất bại</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tỉ lệ %</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Đánh giá</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Doanh thu</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredShippers.length > 0 ? (
                    filteredShippers.map((shipper, idx) => {
                      const successRate = getSuccessRate(shipper);
                      return (
                        <tr 
                          key={idx} 
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                {(shipper.profile?.firstName || 'N')[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {shipper.profile?.fullName || shipper.profile?.firstName || 'N/A'}
                                </p>
                                <p className="text-sm text-gray-600">{shipper.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                              📍 {shipper.address?.district || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-900">{shipper.totalShipments || 0}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                              ✅ {shipper.completedShipments || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                              ❌ {(shipper.totalShipments || 0) - (shipper.completedShipments || 0)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${successRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 mt-1 block">{successRate}%</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500 text-lg">★</span>
                              <span className="font-semibold text-gray-900">
                                {shipper.averageRating || 0}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({shipper.totalReviews || 0})
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {formatCurrency(shipper.revenue || 0)}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => navigate(`/admin/shippers/${shipper._id}`)}
                              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Xem chi tiết
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                        Không tìm thấy shipper
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminShipmentManagement;
