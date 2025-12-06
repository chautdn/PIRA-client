import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/admin';
import icons from "../../utils/icons";
import RevenueChart from '../../components/admin/charts/RevenueChart';
import RevenuePieChart from '../../components/admin/charts/RevenuePieChart';
import ProfitChart from '../../components/admin/charts/ProfitChart';
import ComparisonChart from '../../components/admin/charts/ComparisonChart';
import ExportButtons from '../../components/admin/charts/ExportButtons';
import UserRoleChart from '../../components/admin/charts/UserRoleChart';
import ProductStatusChart from '../../components/admin/charts/ProductStatusChart';
import MonthlyUserChart from '../../components/admin/charts/MonthlyUserChart';
import MonthlyRevenueChart from '../../components/admin/charts/MonthlyRevenueChart';
import { format, subDays, subMonths, subWeeks, startOfQuarter, subQuarters } from 'date-fns';

const { FiUser, FiPackage, BsCart4, BiCategory, BiLoaderAlt, BiCheckCircle, FiDollarSign, FiAlertTriangle, FiSettings, FiTruck, BiErrorCircle, FiEdit3, IoBarChart, LuBoxes, FiCalendar, FiFilter } = icons;

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
  const [revenueStats, setRevenueStats] = useState(null);
  const [profitStats, setProfitStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
    loadStatistics();
  }, []);

  useEffect(() => {
    if (selectedPeriod || dateRange.startDate || dateRange.endDate) {
      loadStatistics();
    }
  }, [selectedPeriod, dateRange]);

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

  const loadStatistics = async () => {
    try {
      setStatsLoading(true);
      
      const params = {
        period: selectedPeriod,
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate })
      };

      const [revenue, profit] = await Promise.all([
        adminService.getRevenueStatistics(params),
        adminService.getProfitStatistics(params)
      ]);

      setRevenueStats(revenue);
      setProfitStats(profit);
    } catch (err) {
      console.error('Statistics error:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    setDateRange({ startDate: '', endDate: '' });
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
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
    const getIconComponent = (type) => {
      switch (type) {
        case 'user': return <FiUser />;
        case 'product': return <FiPackage />;
        case 'order': return <BsCart4 />;
        case 'report': return <FiAlertTriangle />;
        default: return <FiEdit3 />;
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
          <span className="text-sm">{getIconComponent(activity.type)}</span>
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
          <span className="text-red-500 mr-2"><FiAlertTriangle /></span>
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng Users"
          value={stats.overview.totalUsers}
          change={12}
          icon={<FiUser />}
          color="blue"
        />
        <StatCard
          title="Tổng Sản phẩm"
          value={stats.overview.totalProducts}
          change={8}
          icon={<FiPackage />}
          color="green"
        />
        <StatCard
          title="Tổng Đơn hàng"
          value={stats.overview.totalOrders}
          change={-3}
          icon={<BsCart4 />}
          color="purple"
        />
        <StatCard
          title="Danh mục"
          value={stats.overview.totalCategories}
          change={5}
          icon={<BiCategory />}
          color="yellow"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Sản phẩm chờ duyệt"
          value={stats.overview.pendingProducts}
          icon={<BiLoaderAlt />}
          color="yellow"
        />
        <StatCard
          title="Users hoạt động"
          value={stats.overview.activeUsers}
          icon={<BiCheckCircle />}
          color="green"
        />
        <StatCard
          title="Tổng doanh thu"
          value={stats.charts.monthlyRevenue?.reduce((total, item) => total + (item.revenue || 0), 0) || 0}
          icon={<FiDollarSign />}
          color="indigo"
        />
      </div>

      {/* Statistics Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <IoBarChart className="text-blue-600" />
            Thống kê chi tiết
          </h2>
          {revenueStats && <ExportButtons data={revenueStats} filename="revenue-statistics" title="Thống kê doanh thu" />}
        </div>

        {/* Period Filter */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Lọc theo:</span>
          </div>
          
          <div className="flex gap-2">
            {[
              { value: 'day', label: 'Ngày' },
              { value: 'week', label: 'Tuần' },
              { value: 'month', label: 'Tháng' },
              { value: 'quarter', label: 'Quý' },
              { value: 'year', label: 'Năm' }
            ].map(period => (
              <button
                key={period.value}
                onClick={() => handlePeriodChange(period.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <FiCalendar className="text-gray-600" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Loading State */}
        {statsLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Statistics Charts */}
        {!statsLoading && revenueStats && profitStats && (
          <div className="space-y-6">
            {/* Revenue Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-800 font-medium mb-1">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-blue-900">
                  {revenueStats.summary.total.toLocaleString('vi-VN')} ₫
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-800 font-medium mb-1">Từ đơn hàng</p>
                <p className="text-2xl font-bold text-green-900">
                  {revenueStats.summary.orderRevenue.toLocaleString('vi-VN')} ₫
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <p className="text-sm text-purple-800 font-medium mb-1">Phí vận chuyển</p>
                <p className="text-2xl font-bold text-purple-900">
                  {revenueStats.summary.shippingRevenue.toLocaleString('vi-VN')} ₫
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <p className="text-sm text-orange-800 font-medium mb-1">Phí quảng cáo</p>
                <p className="text-2xl font-bold text-orange-900">
                  {revenueStats.summary.promotionRevenue.toLocaleString('vi-VN')} ₫
                </p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart data={revenueStats.timeSeries} period={selectedPeriod} />
              <RevenuePieChart data={revenueStats.breakdown.bySource} />
            </div>

            {/* Profit Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Phân tích lợi nhuận</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Tổng doanh thu</p>
                  <p className="text-xl font-bold text-gray-900">
                    {profitStats.summary.totalRevenue.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Chi phí</p>
                  <p className="text-xl font-bold text-red-600">
                    {profitStats.summary.totalCosts.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lợi nhuận</p>
                  <p className="text-xl font-bold text-green-600">
                    {profitStats.summary.profit.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Biên lợi nhuận</p>
                  <p className="text-xl font-bold text-blue-600">
                    {profitStats.summary.profitMargin}%
                  </p>
                </div>
              </div>
              <ProfitChart data={profitStats.timeSeries} />
            </div>

            {/* Comparison Chart */}
            <ComparisonChart 
              data={revenueStats.timeSeries} 
              title="Biểu đồ so sánh doanh thu & đơn hàng"
            />
          </div>
        )}
      </div>

      {/* User & Product Analytics Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <IoBarChart className="text-indigo-600" />
            Phân tích người dùng & sản phẩm
          </h2>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stats.charts.usersByRole.length > 0 && (
            <UserRoleChart data={stats.charts.usersByRole} />
          )}
          {stats.charts.productsByStatus.length > 0 && (
            <ProductStatusChart data={stats.charts.productsByStatus} />
          )}
        </div>

        {/* Monthly Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stats.charts.monthlyUsers.length > 0 && (
            <MonthlyUserChart data={stats.charts.monthlyUsers} />
          )}
          {stats.charts.monthlyRevenue.length > 0 && (
            <MonthlyRevenueChart data={stats.charts.monthlyRevenue} />
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
              <span className="text-blue-600"><FiUser /></span>
              <div>
                <p className="font-medium">Quản lý Users</p>
                <p className="text-sm text-gray-500">{stats.overview.totalUsers} users trong hệ thống</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-green-600"><FiPackage /></span>
              <div>
                <p className="font-medium">Duyệt sản phẩm</p>
                <p className="text-sm text-gray-500">{stats.overview.pendingProducts} sản phẩm đang chờ</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-purple-600"><BsCart4 /></span>
              <div>
                <p className="font-medium">Quản lý đơn hàng</p>
                <p className="text-sm text-gray-500">{stats.overview.totalOrders} đơn hàng</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-red-600"><IoBarChart /></span>
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
              <p className="text-sm text-gray-500">Nếu nhìn thấy chữ là hoạt động bình thường</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="font-medium">API Server</p>
              <p className="text-sm text-gray-500">Nếu nhìn thấy chữ là hoạt động bình thường</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div>
              <p className="font-medium">Storage</p>
              <p className="text-sm text-gray-500">Sử dụng 99% dung lượng</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;