import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

const RevenuePieChart = ({ data }) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Custom label
  const renderCustomLabel = (entry) => {
    const percent = ((entry.value / entry.payload.total) * 100).toFixed(1);
    return `${percent}%`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-700">{data.name}</p>
          <p className="text-sm text-gray-600">{formatCurrency(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = data.map(item => ({ ...item, total }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Cơ cấu doanh thu
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={dataWithTotal}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {dataWithTotal.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) => (
              <span className="text-sm">
                {entry.payload.name}: {formatCurrency(entry.payload.value)}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {data.map((item, index) => (
          <div
            key={index}
            className="p-3 rounded-lg border"
            style={{ borderColor: COLORS[index % COLORS.length] }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <p className="text-xs text-gray-600">{item.name}</p>
            </div>
            <p className="text-lg font-semibold text-gray-800 mt-1">
              {formatCurrency(item.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenuePieChart;
