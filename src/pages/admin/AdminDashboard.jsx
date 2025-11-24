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

      {/* Charts Section - Full Width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Users by Role Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Users theo vai trò</h3>
          <div className="space-y-4">
            {stats.charts.usersByRole.length > 0 ? (
              stats.charts.usersByRole.map((item, index) => {
                const maxCount = Math.max(...stats.charts.usersByRole.map(i => i.count));
                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                const bgColors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100'];
                
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {item._id === 'RENTER' ? '🙋 Người thuê' : 
                         item._id === 'OWNER' ? '👨‍💼 Chủ sở hữu' : 
                         item._id === 'ADMIN' ? '👑 Admin' : 
                         item._id === 'SHIPPER' ? '🚚 Shipper' : 
                         item._id || 'Không xác định'}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{item.count}</span>
                    </div>
                    <div className={`w-full ${bgColors[index % bgColors.length]} rounded-full h-8 overflow-hidden`}>
                      <div 
                        className={`${colors[index % colors.length]} h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500 ease-out`}
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-xs text-white font-semibold">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        </div>

        {/* Products by Status Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Sản phẩm theo trạng thái</h3>
          <div className="space-y-4">
            {stats.charts.productsByStatus.length > 0 ? (
              stats.charts.productsByStatus.map((item, index) => {
                const maxCount = Math.max(...stats.charts.productsByStatus.map(i => i.count));
                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                const statusConfig = {
                  'ACTIVE': { color: 'bg-green-500', bgColor: 'bg-green-100', icon: '🟢', label: 'Đang hoạt động' },
                  'PENDING': { color: 'bg-yellow-500', bgColor: 'bg-yellow-100', icon: '⏳', label: 'Chờ duyệt' },
                  'INACTIVE': { color: 'bg-gray-500', bgColor: 'bg-gray-100', icon: '⚫', label: 'Không hoạt động' },
                  'SUSPENDED': { color: 'bg-red-500', bgColor: 'bg-red-100', icon: '🔴', label: 'Đã đình chỉ' },
                  'RENTED': { color: 'bg-blue-500', bgColor: 'bg-blue-100', icon: '🔵', label: 'Đang cho thuê' },
                  'DRAFT': { color: 'bg-purple-500', bgColor: 'bg-purple-100', icon: '📝', label: 'Bản nháp' }
                };
                const config = statusConfig[item._id] || { color: 'bg-gray-500', bgColor: 'bg-gray-100', icon: '📦', label: item._id };
                
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span>{config.icon}</span>
                        {config.label}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{item.count}</span>
                    </div>
                    <div className={`w-full ${config.bgColor} rounded-full h-8 overflow-hidden`}>
                      <div 
                        className={`${config.color} h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500 ease-out`}
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-xs text-white font-semibold">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Charts - Full Width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Users Chart */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">👥</span>
                Người dùng mới theo tháng
              </h3>
              <p className="text-sm text-gray-600 mt-1">Tổng: {stats.charts.monthlyUsers.reduce((sum, item) => sum + item.count, 0)} users</p>
            </div>
          </div>
          {stats.charts.monthlyUsers.length > 0 ? (
            <div className="bg-white rounded-lg p-4 shadow-inner">
              <div className="flex items-end justify-between gap-3 h-64">
                {stats.charts.monthlyUsers.map((item, index) => {
                  const maxCount = Math.max(...stats.charts.monthlyUsers.map(i => i.count));
                  const height = maxCount > 0 ? (item.count / maxCount) * 100 : 5;
                  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group">
                      <div className="w-full flex items-end justify-center h-52 mb-3 relative">
                        {/* Value label on top of bar */}
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                            {item.count} users
                          </div>
                        </div>
                        
                        {/* Bar */}
                        <div 
                          className="w-full max-w-[40px] bg-gradient-to-t from-blue-500 via-blue-400 to-blue-300 rounded-t-xl hover:from-blue-600 hover:via-blue-500 hover:to-blue-400 transition-all duration-300 cursor-pointer shadow-lg group-hover:shadow-2xl group-hover:scale-105 relative overflow-hidden"
                          style={{ 
                            height: `${height}%`,
                            minHeight: '20px'
                          }}
                        >
                          {/* Shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 group-hover:opacity-40 transition-opacity"></div>
                          
                          {/* Count on bar for larger values */}
                          {height > 30 && (
                            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-white font-bold text-xs">
                              {item.count}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Month label */}
                      <div className="text-xs text-gray-700 font-semibold group-hover:text-blue-600 transition-colors text-center">
                        T{item._id.month}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {item._id.year}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500 bg-white rounded-lg">
              <div className="text-4xl mb-3">📊</div>
              <p className="font-medium">Chưa có dữ liệu</p>
            </div>
          )}
        </div>

        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Doanh thu theo tháng</h3>
          {stats.charts.monthlyRevenue.length > 0 ? (
            <div className="flex items-end justify-between gap-2 h-64">
              {stats.charts.monthlyRevenue.map((item, index) => {
                const maxRevenue = Math.max(...stats.charts.monthlyRevenue.map(i => i.revenue));
                const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex items-end justify-center h-48 mb-2">
                      <div 
                        className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg hover:from-green-600 hover:to-green-500 transition-all duration-300 cursor-pointer relative group"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {item.revenue?.toLocaleString()} đ
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      {monthNames[item._id.month - 1]}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              <p>Chưa có dữ liệu</p>
            </div>
          )}
        </div>
      </div>

      {/* Activities and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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