import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin';
import { formatCurrency } from '../../utils/constants';
import { includesIgnoreDiacritics } from '../../utils/textUtils';

const AdminShipmentManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
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
    totalRevenue: 0,
    dailyData: [],
    successFailureRatio: { success: 0, failed: 0 },
    topShippers: []
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
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

      // Fetch shipment stats
      const response = await adminService.getShipmentStats?.();
      console.log('📊 Shipment stats response:', response);
      if (response?.data) {
        setStats(response.data);
      } else if (response) {
        setStats(response);
      } else {
        // Use mock data for testing
        setStats(getMockStats());
      }

      // Fetch shippers list
      const shippersRes = await adminService.getAllShippers?.();
      console.log('🚚 Shippers response:', shippersRes);
      
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
        setPagination({
          ...pagination,
          total: shipperList.length,
          totalPages: Math.ceil(shipperList.length / pagination.limit)
        });
      } else {
        console.warn('⚠️ No shippers from API, using mock data');
        // Use mock shippers for testing
        const mockShippers = getMockShippers();
        setShippers(mockShippers);
        setPagination({
          ...pagination,
          total: mockShippers.length,
          totalPages: Math.ceil(mockShippers.length / pagination.limit)
        });
      }
    } catch (err) {
      setError(err.message || 'Lỗi tải dữ liệu vận chuyển');
      console.error('❌ Error loading shipment data:', err);
      
      // Use mock data on error
      setStats(getMockStats());
      const mockShippers = getMockShippers();
      setShippers(mockShippers);
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
      // Cũng normalize district để so sánh chính xác hơn
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

  const getMockStats = () => {
    return {
      totalShippers: 12,
      totalShipments: 245,
      successRate: 92.5,
      totalRevenue: 12500000,
      dailyData: [
        { date: '2025-12-02', count: 32 },
        { date: '2025-12-03', count: 28 },
        { date: '2025-12-04', count: 35 },
        { date: '2025-12-05', count: 42 },
        { date: '2025-12-06', count: 38 },
        { date: '2025-12-07', count: 45 },
        { date: '2025-12-08', count: 48 }
      ],
      successFailureRatio: {
        success: 227,
        failed: 18
      },
      topShippers: [
        {
          _id: '1',
          profile: { firstName: 'Nguyễn Văn A' },
          address: { district: 'Quận 1' },
          totalShipments: 65,
          completedShipments: 62,
          revenue: 3250000
        },
        {
          _id: '2',
          profile: { firstName: 'Trần Thị B' },
          address: { district: 'Quận 3' },
          totalShipments: 58,
          completedShipments: 56,
          revenue: 2900000
        },
        {
          _id: '3',
          profile: { firstName: 'Phạm Minh C' },
          address: { district: 'Quận 5' },
          totalShipments: 52,
          completedShipments: 48,
          revenue: 2600000
        },
        {
          _id: '4',
          profile: { firstName: 'Hoàng Quốc D' },
          address: { district: 'Quận 7' },
          totalShipments: 45,
          completedShipments: 43,
          revenue: 2250000
        },
        {
          _id: '5',
          profile: { firstName: 'Võ Thị E' },
          address: { district: 'Quận 10' },
          totalShipments: 38,
          completedShipments: 36,
          revenue: 1900000
        }
      ]
    };
  };

  const getMockShippers = () => {
    return [
      {
        _id: '1',
        profile: { firstName: 'Nguyễn Văn A', fullName: 'Nguyễn Văn A' },
        email: 'shipper1@example.com',
        phone: '0901234567',
        address: { district: 'Quận 1' },
        totalShipments: 65,
        completedShipments: 62,
        revenue: 3250000
      },
      {
        _id: '2',
        profile: { firstName: 'Trần Thị B', fullName: 'Trần Thị B' },
        email: 'shipper2@example.com',
        phone: '0902345678',
        address: { district: 'Quận 3' },
        totalShipments: 58,
        completedShipments: 56,
        revenue: 2900000
      },
      {
        _id: '3',
        profile: { firstName: 'Phạm Minh C', fullName: 'Phạm Minh C' },
        email: 'shipper3@example.com',
        phone: '0903456789',
        address: { district: 'Quận 5' },
        totalShipments: 52,
        completedShipments: 48,
        revenue: 2600000
      },
      {
        _id: '4',
        profile: { firstName: 'Hoàng Quốc D', fullName: 'Hoàng Quốc D' },
        email: 'shipper4@example.com',
        phone: '0904567890',
        address: { district: 'Quận 7' },
        totalShipments: 45,
        completedShipments: 43,
        revenue: 2250000
      },
      {
        _id: '5',
        profile: { firstName: 'Võ Thị E', fullName: 'Võ Thị E' },
        email: 'shipper5@example.com',
        phone: '0905678901',
        address: { district: 'Quận 10' },
        totalShipments: 38,
        completedShipments: 36,
        revenue: 1900000
      }
    ];
  };

  const renderLineChart = () => {
    if (!stats.dailyData || stats.dailyData.length === 0) {
      return <div className="text-center py-20 text-gray-500">Chưa có dữ liệu</div>;
    }

    const maxCount = Math.max(...stats.dailyData.map(d => d.count), 1);
    const chartHeight = 200;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">📈 Số đơn theo ngày (7 ngày gần đây)</h3>
        <div className="flex items-end justify-between h-64 gap-1 px-2">
          {stats.dailyData.map((item, idx) => {
            const height = (item.count / maxCount) * chartHeight;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <div className="relative mb-2">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.count} đơn
                  </div>
                </div>
                <div
                  className="w-full bg-gradient-to-t from-blue-400 to-blue-600 rounded-t transition-all duration-300 group-hover:shadow-lg"
                  style={{ height: `${height}px` }}
                ></div>
                <div className="text-xs text-gray-600 font-medium mt-2">{item.date}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPieChart = () => {
    const total =
      (stats.successFailureRatio?.success || 0) + (stats.successFailureRatio?.failed || 0);
    const successPercent = total > 0 ? ((stats.successFailureRatio?.success || 0) / total) * 100 : 0;
    const failPercent = 100 - successPercent;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">🎯 Tỉ lệ giao thành công / thất bại</h3>
        <div className="flex items-center justify-center gap-12">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="20" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#10b981"
                strokeWidth="20"
                strokeDasharray={`${(successPercent / 100) * 314.16} 314.16`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
              <text x="60" y="70" textAnchor="middle" className="text-lg font-bold fill-gray-900">
                {successPercent.toFixed(1)}%
              </text>
            </svg>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <div>
                <p className="text-sm font-medium text-gray-700">Thành công</p>
                <p className="text-lg font-bold text-gray-900">{stats.successFailureRatio?.success || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <div>
                <p className="text-sm font-medium text-gray-700">Thất bại</p>
                <p className="text-lg font-bold text-gray-900">{stats.successFailureRatio?.failed || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    if (!stats.topShippers || stats.topShippers.length === 0) {
      return <div className="text-center py-20 text-gray-500">Chưa có dữ liệu</div>;
    }

    const maxShipments = Math.max(...stats.topShippers.map(s => s.totalShipments || 0), 1);
    const chartHeight = 250;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">🌟 Hiệu suất 5 shipper hoạt động mạnh nhất</h3>
        <div className="flex items-end justify-between h-80 gap-4">
          {stats.topShippers.map((shipper, idx) => {
            const height = ((shipper.totalShipments || 0) / maxShipments) * chartHeight;
            const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-green-500'];
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <div className="relative mb-2">
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {shipper.totalShipments} đơn
                  </div>
                </div>
                <div
                  className={`w-full ${colors[idx]} rounded-t transition-all duration-300 group-hover:shadow-lg`}
                  style={{ height: `${height}px` }}
                ></div>
                <div className="mt-3 text-center">
                  <p className="text-xs font-bold text-gray-800 truncate w-full px-1">
                    {shipper.profile?.firstName || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{shipper.address?.district || 'N/A'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span>🚚</span> Quản lí Vận chuyển
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
              <span className="text-3xl">🚚</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Tổng Đơn Vận chuyển</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalShipments || 0}</p>
              </div>
              <span className="text-3xl">📦</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Tỉ lệ Thành công</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.successRate || 0}%</p>
              </div>
              <span className="text-3xl">✅</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Tổng Doanh thu</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalRevenue || 0)}</p>
              </div>
              <span className="text-3xl">💰</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6 border-b">
          <nav className="flex border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Thống kê
            </button>
            <button
              onClick={() => setActiveTab('shippers')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'shippers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🚚 Danh sách Shipper
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {renderLineChart()}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderPieChart()}
              {renderBarChart()}
            </div>
          </div>
        )}

        {activeTab === 'shippers' && (
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">👤 Shipper</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">📍 Khu vực</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">📦 Tổng đơn</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">✅ Hoàn thành</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">❌ Thất bại</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">📊 Tỉ lệ %</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">💰 Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredShippers.length > 0 ? (
                      filteredShippers.map((shipper, idx) => {
                        const successRate = getSuccessRate(shipper);
                        return (
                          <tr 
                            key={idx} 
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => navigate(`/admin/shipments/${shipper._id}`)}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-lg">🚚</span>
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
                                {shipper.address?.district || 'N/A'}
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
                            <td className="px-6 py-4 font-semibold text-gray-900">
                              {formatCurrency(shipper.revenue || 0)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                          Không tìm thấy shipper
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminShipmentManagement;
