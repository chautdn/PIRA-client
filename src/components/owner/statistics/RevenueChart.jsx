import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const RevenueChart = ({ revenueData, loading, groupBy = 'month' }) => {
  const chartData = useMemo(() => {
    console.log('🔍 RevenueChart - revenueData:', revenueData);
    
    if (!revenueData || !revenueData.revenueByPeriod) {
      console.log('⚠️ RevenueChart - No data or revenueByPeriod');
      return null;
    }

    console.log('📊 RevenueChart - revenueByPeriod length:', revenueData.revenueByPeriod.length);
    
    const periods = revenueData.revenueByPeriod.map((item) => item.period);
    const revenues = revenueData.revenueByPeriod.map((item) => item.totalRevenue);
    const netRevenues = revenueData.revenueByPeriod.map((item) => item.netRevenue);
    const orderCounts = revenueData.revenueByPeriod.map((item) => item.orderCount);

    console.log('📈 Chart data prepared:', { periods, revenues, netRevenues });

    return {
      labels: periods,
      datasets: [
        {
          label: 'Tổng doanh thu',
          data: revenues,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
        },
        {
          label: 'Doanh thu ròng',
          data: netRevenues,
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2,
        },
      ],
    };
  }, [revenueData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Biểu đồ doanh thu theo thời gian',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              notation: 'compact',
              maximumFractionDigits: 1,
            }).format(value);
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!chartData) {
    console.log('❌ RevenueChart - chartData is null, showing no data message');
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-96 flex items-center justify-center">
        <p className="text-gray-500">Không có dữ liệu để hiển thị</p>
      </div>
    );
  }

  console.log('✅ RevenueChart - Rendering chart with data');

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="h-96">
        <Bar data={chartData} options={options} />
      </div>

      {/* Summary Stats */}
      {revenueData?.summary && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Tổng doanh thu</p>
            <p className="text-lg font-bold text-blue-600">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(revenueData.summary.totalRevenue)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Doanh thu ròng</p>
            <p className="text-lg font-bold text-green-600">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(revenueData.summary.netRevenue)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Tổng đơn hàng</p>
            <p className="text-lg font-bold text-purple-600">
              {revenueData.summary.totalOrders.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Giá trị TB/Đơn</p>
            <p className="text-lg font-bold text-yellow-600">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(revenueData.summary.averageOrderValue)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueChart;
