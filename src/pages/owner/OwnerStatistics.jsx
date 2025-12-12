import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Filter, 
  RefreshCw, 
  Download,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import ownerStatisticsApi from '../../services/ownerStatistics.Api';
import StatisticsCards from '../../components/owner/statistics/StatisticsCards';
import RevenueChart from '../../components/owner/statistics/RevenueChart';
import TopProductsTable from '../../components/owner/statistics/TopProductsTable';
import CurrentlyRentedTable from '../../components/owner/statistics/CurrentlyRentedTable';

const OwnerStatistics = () => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [rentedProducts, setRentedProducts] = useState([]);
  
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
        fetchRentedProducts(),
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

  const fetchRentedProducts = async () => {
    try {
      const response = await ownerStatisticsApi.getCurrentlyRentedProducts();
      if (response.success) {
        setRentedProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching rented products:', error);
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
    { id: 'rented', label: t("ownerStatistics.tabs.rented"), icon: Calendar },
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

            {/* Revenue Chart */}
            <RevenueChart
              revenueData={revenueData}
              loading={loading}
              groupBy={filters.groupBy}
            />
          </div>
        )}

        {/* Currently Rented Tab */}
        {activeTab === 'rented' && (
          <div className="space-y-6">
            <CurrentlyRentedTable
              rentedProducts={rentedProducts}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerStatistics;
