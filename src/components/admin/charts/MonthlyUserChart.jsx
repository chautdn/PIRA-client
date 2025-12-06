import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const MonthlyUserChart = ({ data }) => {
  // Format data for chart
  const chartData = data.map(item => ({
    month: `T${item._id.month}/${item._id.year}`,
    users: item.count
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-1">{label}</p>
          <p className="text-lg font-bold text-blue-600">
            {payload[0].value} người dùng mới
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Người dùng mới theo tháng
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Tổng: {data.reduce((sum, item) => sum + item.count, 0)} người dùng
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Area
            type="monotone"
            dataKey="users"
            stroke="#3b82f6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorUsers)"
            name="Người dùng"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyUserChart;
