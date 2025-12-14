import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Filter, 
  RefreshCw, 
  Download,
  TrendingUp,
  BarChart3,
  Package,
  DollarSign,
  ShoppingCart,
  PieChart,
  TrendingDown
} from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import ownerStatisticsApi from '../../services/ownerStatistics.Api';
import StatisticsCards from '../../components/owner/statistics/StatisticsCards';
import RevenueChart from '../../components/owner/statistics/RevenueChart';
import TopProductsTable from '../../components/owner/statistics/TopProductsTable';
import ExportButtons from '../../components/admin/charts/ExportButtons';
import RevenuePieChart from '../../components/admin/charts/RevenuePieChart';
import ComparisonChart from '../../components/admin/charts/ComparisonChart';
import ProfitChart from '../../components/admin/charts/ProfitChart';

const OwnerStatistics = () => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    groupBy: 'month',
  });

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAllStatistics();
  }, []);

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      fetchRevenueStatistics();
    }
  }, [filters]);

  const fetchAllStatistics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOverviewStatistics(),
        fetchRevenueStatistics(),
        fetchTopProducts(),
      ]);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverviewStatistics = async () => {
    try {
      const response = await ownerStatisticsApi.getOverviewStatistics();
      if (response.success) {
        setOverview(response.data);
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
    }
  };

  const fetchRevenueStatistics = async () => {
    try {
      const response = await ownerStatisticsApi.getRevenueStatistics(filters);
      if (response.success) {
        setRevenueData(response.data);
      }
    } catch (error) {
      console.error('Error fetching revenue:', error);
    }
  };

  const fetchTopProducts = async () => {
    try {
      const response = await ownerStatisticsApi.getTopRevenueProducts(10);
      if (response.success) {
        setTopProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching top products:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRefresh = () => {
    fetchAllStatistics();
  };

  const tabs = [
    { id: 'overview', label: t("ownerStatistics.tabs.overview"), icon: BarChart3 },
    { id: 'revenue', label: t("ownerStatistics.tabs.revenue"), icon: TrendingUp },
    { id: 'profit', label: t("ownerStatistics.tabs.profit") || "Lợi nhuận", icon: DollarSign },
    { id: 'products', label: t("ownerStatistics.tabs.products") || "Sản phẩm", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t("ownerStatistics.title")}
              </h1>
              <p className="text-gray-600">
                {t("ownerStatistics.subtitle")}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              {t("ownerStatistics.refresh")}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                      ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <StatisticsCards statistics={overview} loading={loading} />

            {/* Top Products */}
            <TopProductsTable products={topProducts} loading={loading} />
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            {/* Export Buttons */}
            {revenueData && (
              <div className="flex justify-end">
                <ExportButtons 
                  data={revenueData} 
                  filename="owner-revenue-statistics" 
                  title="Thống kê doanh thu chủ cho thuê" 
                />
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter size={18} className="text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-800">{t("ownerStatistics.filters.label")}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("ownerStatistics.filters.startDate")}
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("ownerStatistics.filters.endDate")}
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("ownerStatistics.filters.groupBy")}
                  </label>
                  <select
                    value={filters.groupBy}
                    onChange={(e) => handleFilterChange('groupBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="day">{t("ownerStatistics.filters.day")}</option>
                    <option value="week">{t("ownerStatistics.filters.week")}</option>
                    <option value="month">{t("ownerStatistics.filters.month")}</option>
                    <option value="year">{t("ownerStatistics.filters.year")}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Revenue Summary Cards */}
            {revenueData && revenueData.summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={20} className="text-blue-600" />
                    <p className="text-sm text-blue-800 font-medium">Doanh thu (100%)</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {(revenueData.summary.totalRevenue || 0).toLocaleString('vi-VN')} ₫
                  </p>
                  {revenueData.summary.growthRate !== undefined && (
                    <p className={`text-sm mt-1 ${revenueData.summary.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {revenueData.summary.growthRate >= 0 ? '+' : ''}{revenueData.summary.growthRate}% so với kỳ trước
                    </p>
                  )}
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart size={20} className="text-green-600" />
                    <p className="text-sm text-green-800 font-medium">Tiền nhận về (90%)</p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {(revenueData.summary.receivedAmount || 0).toLocaleString('vi-VN')} ₫
                  </p>
                  <p className="text-xs text-green-600 mt-1">Sau khi trừ phí nền tảng</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={20} className="text-purple-600" />
                    <p className="text-sm text-purple-800 font-medium">Phí nền tảng (10%)</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {(revenueData.summary.platformFee || 0).toLocaleString('vi-VN')} ₫
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Chi phí sử dụng nền tảng</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <PieChart size={20} className="text-orange-600" />
                    <p className="text-sm text-orange-800 font-medium">Phí quảng cáo</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">
                    {(revenueData.summary.promotionFees || 0).toLocaleString('vi-VN')} ₫
                  </p>
                  <p className="text-xs text-orange-600 mt-1">Chi phí đăng sản phẩm</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 size={20} className="text-indigo-600" />
                    <p className="text-sm text-indigo-800 font-medium">Số đơn hàng</p>
                  </div>
                  <p className="text-2xl font-bold text-indigo-900">
                    {revenueData.summary.orderCount || 0}
                  </p>
                  <p className="text-xs text-indigo-600 mt-1">Đơn thuê thành công</p>
                </div>
              </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart
                revenueData={revenueData}
                loading={loading}
                groupBy={filters.groupBy}
              />
              {revenueData && revenueData.breakdown && revenueData.breakdown.bySource && (
                <RevenuePieChart data={revenueData.breakdown.bySource} />
              )}
            </div>

            {/* Comparison Chart */}
            {revenueData && revenueData.timeSeries && (
              <ComparisonChart 
                data={revenueData.timeSeries} 
                title="Biểu đồ so sánh doanh thu & đơn hàng"
              />
            )}
          </div>
        )}

        {/* Profit Tab */}
        {activeTab === 'profit' && (
          <div className="space-y-6">
            {/* Export Buttons */}
            {revenueData && (
              <div className="flex justify-end">
                <ExportButtons 
                  data={{
                    summary: revenueData.profit || {},
                    timeSeries: revenueData.timeSeries || [],
                    breakdown: revenueData.breakdown || {}
                  }} 
                  filename="owner-profit-statistics" 
                  title="Thống kê lợi nhuận chủ cho thuê" 
                />
              </div>
            )}

            {/* Profit Analysis Section */}
            {revenueData && revenueData.profit && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Phân tích lợi nhuận</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Lợi nhuận = Tiền nhận về (90%) - Phí quảng cáo
                </p>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Doanh thu (100%)</p>
                    <p className="text-xl font-bold text-gray-900">
                      {(revenueData.profit.revenue || 0).toLocaleString('vi-VN')} ₫
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Tổng giá trị đơn thuê</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tiền nhận về</p>
                    <p className="text-xl font-bold text-green-600">
                      {(revenueData.profit.receivedAmount || 0).toLocaleString('vi-VN')} ₫
                    </p>
                    <p className="text-xs text-gray-500 mt-1">90% sau trừ phí nền tảng</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phí nền tảng</p>
                    <p className="text-xl font-bold text-purple-600">
                      {(revenueData.profit.platformFee || 0).toLocaleString('vi-VN')} ₫
                    </p>
                    <p className="text-xs text-gray-500 mt-1">10% phí sử dụng</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phí quảng cáo</p>
                    <p className="text-xl font-bold text-orange-600">
                      {(revenueData.profit.promotionFees || 0).toLocaleString('vi-VN')} ₫
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Chi phí đăng sản phẩm</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Lợi nhuận thuần</p>
                    <p className={`text-xl font-bold ${(revenueData.profit.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(revenueData.profit.profit || 0).toLocaleString('vi-VN')} ₫
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Biên: {revenueData.profit.profitMargin || 0}%
                    </p>
                  </div>
                </div>

                {/* Profit Chart */}
                {revenueData.timeSeries && (
                  <ProfitChart data={revenueData.timeSeries} />
                )}
              </div>
            )}

            {/* Revenue Breakdown Pie Chart */}
            {revenueData && revenueData.breakdown && revenueData.breakdown.bySource && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Cơ cấu doanh thu</h3>
                <RevenuePieChart data={revenueData.breakdown.bySource} />
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <TopProductsTable products={topProducts} loading={loading} />
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerStatistics;
