import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import icons from '../../../utils/icons';

const { FiUser, LuBoxes, FiSettings, FiTruck } = icons;

const UserRoleChart = ({ data }) => {
  const COLORS = {
    RENTER: '#3b82f6',
    OWNER: '#10b981',
    ADMIN: '#8b5cf6',
    SHIPPER: '#f59e0b'
  };

  const LABELS = {
    RENTER: 'Người thuê',
    OWNER: 'Chủ sở hữu',
    ADMIN: 'Admin',
    SHIPPER: 'Shipper'
  };

  const ICONS = {
    RENTER: <FiUser />,
    OWNER: <LuBoxes />,
    ADMIN: <FiSettings />,
    SHIPPER: <FiTruck />
  };

  // Format data for chart
  const chartData = data.map(item => ({
    name: LABELS[item._id] || item._id,
    value: item.count,
    role: item._id
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-700">{payload[0].payload.name}</p>
          <p className="text-lg font-bold" style={{ color: payload[0].fill }}>
            {payload[0].value} người dùng
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Người dùng theo vai trò
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Bar
            dataKey="value"
            name="Số lượng"
            radius={[8, 8, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.role] || '#6b7280'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {chartData.map((item, index) => (
          <div
            key={index}
            className="p-3 rounded-lg border"
            style={{ borderColor: COLORS[item.role] }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: COLORS[item.role] }}
              >
                {ICONS[item.role]}
              </div>
              <p className="text-xs text-gray-600">{item.name}</p>
            </div>
            <p className="text-xl font-semibold text-gray-800 mt-2">
              {item.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserRoleChart;
