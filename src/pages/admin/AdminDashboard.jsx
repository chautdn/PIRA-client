import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/admin';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    overview: {
      totalUsers: 0,
      totalProducts: 0,
      totalOrders: 0,
      totalCategories: 0,
      activeUsers: 0,
      pendingProducts: 0
    },
    charts: {
      usersByRole: [],
      productsByStatus: [],
      monthlyUsers: [],
      monthlyRevenue: []
    }
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dashboardData = await adminService.getDashboardStats();
      console.log('Dashboard data from API:', dashboardData);
      
      if (dashboardData) {
        // Check if data has the expected structure
        if (dashboardData.overview) {
          console.log('Dashboard data has overview structure');
          setStats({
            overview: {
              totalUsers: dashboardData.overview.totalUsers || 0,
              totalProducts: dashboardData.overview.totalProducts || 0,
              totalOrders: dashboardData.overview.totalOrders || 0,
              totalCategories: dashboardData.overview.totalCategories || 0,
              activeUsers: dashboardData.overview.activeUsers || 0,
              pendingProducts: dashboardData.overview.pendingProducts || 0
            },
            charts: {
              usersByRole: dashboardData.charts?.usersByRole || [],
              productsByStatus: dashboardData.charts?.productsByStatus || [],
              monthlyUsers: dashboardData.charts?.monthlyUsers || [],
              monthlyRevenue: dashboardData.charts?.monthlyRevenue || []
            }
          });
        } else {
          console.log('Dashboard data does not have overview structure:', Object.keys(dashboardData));
          // Handle flat structure or different format
          setStats({
            overview: {
              totalUsers: dashboardData.totalUsers || 0,
              totalProducts: dashboardData.totalProducts || 0,
              totalOrders: dashboardData.totalOrders || 0,
              totalCategories: dashboardData.totalCategories || 0,
              activeUsers: dashboardData.activeUsers || 0,
              pendingProducts: dashboardData.pendingProducts || 0
            },
            charts: {
              usersByRole: [],
              productsByStatus: [],
              monthlyUsers: [],
              monthlyRevenue: []
            }
          });
        }
      } else {
        console.warn('Dashboard API returned null/undefined data');
        setError('Không thể tải dữ liệu dashboard');
      }
      
      // Load recent activities (this could be enhanced with real API)
      setRecentActivities([
        { id: 1, type: 'user', action: 'Người dùng mới đăng ký', user: 'Nguyễn Văn A', time: '2 phút trước' },
        { id: 2, type: 'product', action: 'Sản phẩm mới đăng', product: 'Camera Canon EOS', time: '5 phút trước' },
        { id: 3, type: 'order', action: 'Đơn hàng mới', orderId: '#12345', time: '10 phút trước' },
        { id: 4, type: 'report', action: 'Báo cáo vi phạm', reportId: '#R001', time: '15 phút trước' }
      ]);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Không thể tải dữ liệu dashboard: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      indigo: 'bg-indigo-500'
    };

    // Safe value handling
    const safeValue = typeof value === 'number' ? value : 0;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{safeValue.toLocaleString()}</p>
            {change && (
              <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}{change}% từ tháng trước
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]} text-white`}>
            <span className="text-xl">{icon}</span>
          </div>
        </div>
      </div>
    );
  };

  const ActivityItem = ({ activity }) => {
    const getIcon = (type) => {
      switch (type) {
        case 'user': return '👤';
        case 'product': return '📦';
        case 'order': return '🛒';
        case 'report': return '⚠️';
        default: return '📝';
      }
    };

    const getColor = (type) => {
      switch (type) {
        case 'user': return 'text-blue-600';
        case 'product': return 'text-green-600';
        case 'order': return 'text-purple-600';
        case 'report': return 'text-red-600';
        default: return 'text-gray-600';
      }
    };

    return (
      <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
        <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center`}>
          <span className="text-sm">{getIcon(activity.type)}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
          <p className="text-xs text-gray-500">{activity.time}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-500 mr-2">⚠️</span>
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Tổng quan hệ thống PIRA</p>
        </div>
        <button 
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>🔄</span>
          Làm mới
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng Users"
          value={stats.overview.totalUsers}
          change={12}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Tổng Sản phẩm"
          value={stats.overview.totalProducts}
          change={8}
          icon="📦"
          color="green"
        />
        <StatCard
          title="Tổng Đơn hàng"
          value={stats.overview.totalOrders}
          change={-3}
          icon="🛒"
          color="purple"
        />
        <StatCard
          title="Danh mục"
          value={stats.overview.totalCategories}
          change={5}
          icon="�"
          color="yellow"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Sản phẩm chờ duyệt"
          value={stats.overview.pendingProducts}
          icon="⏳"
          color="yellow"
        />
        <StatCard
          title="Users hoạt động"
          value={stats.overview.activeUsers}
          icon="🟢"
          color="green"
        />
        <StatCard
          title="Tổng doanh thu"
          value={stats.charts.monthlyRevenue?.reduce((total, item) => total + (item.revenue || 0), 0) || 0}
          icon="�"
          color="indigo"
        />
      </div>

      {/* Charts and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê chi tiết</h3>
          <div className="space-y-4">
            {/* Users by Role */}
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Users theo vai trò</h4>
              <div className="space-y-2">
                {stats.charts.usersByRole.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">{item._id || 'Không xác định'}</span>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Products by Status */}
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Sản phẩm theo trạng thái</h4>
              <div className="space-y-2">
                {stats.charts.productsByStatus.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{item._id || 'Không xác định'}</span>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-blue-600">👥</span>
              <div>
                <p className="font-medium">Quản lý Users</p>
                <p className="text-sm text-gray-500">{stats.overview.totalUsers} users trong hệ thống</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-green-600">📦</span>
              <div>
                <p className="font-medium">Duyệt sản phẩm</p>
                <p className="text-sm text-gray-500">{stats.overview.pendingProducts} sản phẩm đang chờ</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-purple-600">🛒</span>
              <div>
                <p className="font-medium">Quản lý đơn hàng</p>
                <p className="text-sm text-gray-500">{stats.overview.totalOrders} đơn hàng</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-red-600">📊</span>
              <div>
                <p className="font-medium">Xem báo cáo</p>
                <p className="text-sm text-gray-500">Thống kê và phân tích</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Xem tất cả
            </button>
          </div>
          <div className="space-y-1">
            {recentActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái hệ thống</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="font-medium">Database</p>
              <p className="text-sm text-gray-500">Hoạt động bình thường</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="font-medium">API Server</p>
              <p className="text-sm text-gray-500">Hoạt động bình thường</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div>
              <p className="font-medium">Storage</p>
              <p className="text-sm text-gray-500">Sử dụng 78% dung lượng</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;