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

  useEffect(() => {
    loadShipperData();
  }, [shipperId]);

  const loadShipperData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get mock shipper details
      const mockShippers = getMockShippers();
      const shipperData = mockShippers.find(s => s._id === shipperId);
      
      if (shipperData) {
        setShipper(shipperData);
        setShipments(getMockShipments(shipperId));
        setStats({
          today: 5,
          thisWeek: 28,
          thisMonth: 65,
          totalCompleted: 62,
          totalFailed: 3
        });
      } else {
        setError('Không tìm thấy shipper');
      }
    } catch (err) {
      setError(err.message || 'Lỗi tải dữ liệu');
      console.error('Error loading shipper data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMockShippers = () => {
    return [
      {
        _id: '1',
        profile: { firstName: 'Nguyễn Văn A', fullName: 'Nguyễn Văn A' },
        email: 'shipper1@example.com',
        phone: '0901234567',
        address: { district: 'Quận 1', city: 'TP HCM' },
        status: 'ACTIVE',
        totalShipments: 65,
        completedShipments: 62,
        revenue: 3250000,
        joinDate: '2024-01-15',
        rating: 4.8
      },
      {
        _id: '2',
        profile: { firstName: 'Trần Thị B', fullName: 'Trần Thị B' },
        email: 'shipper2@example.com',
        phone: '0902345678',
        address: { district: 'Quận 3', city: 'TP HCM' },
        status: 'ACTIVE',
        totalShipments: 58,
        completedShipments: 56,
        revenue: 2900000,
        joinDate: '2024-02-20',
        rating: 4.6
      }
    ];
  };

  const getMockShipments = (shipperId) => {
    const shipmentTypes = [
      {
        id: '#SHP001',
        time: '09:06\n08/12/2025',
        customer: 'N/A',
        email: 'customer1@gmail.com',
        product: 'N/A',
        price: '0 VND',
        status: 'CHỜ XỬ LÝ',
        statusColor: 'yellow',
        paymentStatus: 'ĐÃ THANH TOÁN',
        timeRange: 'N/A'
      },
      {
        id: '#SHP002',
        time: '00:11\n08/12/2025',
        customer: 'N/A',
        email: 'customer2@gmail.com',
        product: 'N/A',
        price: '0 VND',
        status: 'CHỜ XỬ LÝ',
        statusColor: 'yellow',
        paymentStatus: 'ĐÃ THANH TOÁN',
        timeRange: 'N/A'
      },
      {
        id: '#SHP003',
        time: '23:58\n07/12/2025',
        customer: 'N/A',
        email: 'customer3@gmail.com',
        product: 'N/A',
        price: '0 VND',
        status: 'HOÀN THÀNH',
        statusColor: 'green',
        paymentStatus: 'ĐÃ THANH TOÁN',
        timeRange: 'N/A'
      },
      {
        id: '#SHP004',
        time: '13:04\n06/12/2025',
        customer: 'N/A',
        email: 'customer4@gmail.com',
        product: 'N/A',
        price: '0 VND',
        status: 'HOÀN THÀNH',
        statusColor: 'green',
        paymentStatus: 'ĐÃ THANH TOÁN',
        timeRange: 'N/A'
      },
      {
        id: '#SHP005',
        time: '13:03\n06/12/2025',
        customer: 'N/A',
        email: 'customer5@gmail.com',
        product: 'N/A',
        price: '0 VND',
        status: 'ĐÃ HỦY',
        statusColor: 'red',
        paymentStatus: 'ĐÃ THANH TOÁN',
        timeRange: 'N/A'
      },
      {
        id: '#SHP006',
        time: '13:01\n06/12/2025',
        customer: 'N/A',
        email: 'customer6@gmail.com',
        product: 'N/A',
        price: '0 VND',
        status: 'CHỜ XỬ LÝ',
        statusColor: 'yellow',
        paymentStatus: 'ĐÃ THANH TOÁN',
        timeRange: 'N/A'
      }
    ];
    return shipmentTypes;
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
              📦 Danh sách đơn vận chuyển ({shipments.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Mã Đơn</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Khách Hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Sản Phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Giá</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Trạng Thái</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Thanh Toán</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Thời Gian</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {shipments.map((shipment, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-blue-600">{shipment.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{shipment.customer}</p>
                        <p className="text-xs text-gray-500">{shipment.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{shipment.product}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{shipment.price}</td>
                    <td className="px-6 py-4">
                      {getStatusBadge(shipment.status)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        ✓ {shipment.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="whitespace-pre-line">{shipment.time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminShipperDetail;
