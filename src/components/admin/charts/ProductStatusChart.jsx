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

const { BiCheckCircle, BiLoaderAlt, BiErrorCircle, BsCart4, FiEdit3, FiPackage } = icons;

const ProductStatusChart = ({ data }) => {
  const COLORS = {
    ACTIVE: '#10b981',
    PENDING: '#f59e0b',
    INACTIVE: '#6b7280',
    SUSPENDED: '#ef4444',
    RENTED: '#3b82f6',
    DRAFT: '#8b5cf6'
  };

  const LABELS = {
    ACTIVE: 'Hoạt động',
    PENDING: 'Chờ duyệt',
    INACTIVE: 'Không hoạt động',
    SUSPENDED: 'Đình chỉ',
    RENTED: 'Đang cho thuê',
    DRAFT: 'Bản nháp'
  };

  const ICONS = {
    ACTIVE: <BiCheckCircle />,
    PENDING: <BiLoaderAlt />,
    INACTIVE: <BiErrorCircle />,
    SUSPENDED: <BiErrorCircle />,
    RENTED: <BsCart4 />,
    DRAFT: <FiEdit3 />
  };

  // Format data for chart
  const chartData = data.map(item => ({
    name: LABELS[item._id] || item._id,
    value: item.count,
    status: item._id
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-700">{payload[0].payload.name}</p>
          <p className="text-lg font-bold" style={{ color: payload[0].fill }}>
            {payload[0].value} sản phẩm
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Sản phẩm theo trạng thái
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Bar
            dataKey="value"
            name="Số lượng"
            radius={[0, 8, 8, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.status] || '#6b7280'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {chartData.map((item, index) => (
          <div
            key={index}
            className="p-3 rounded-lg border"
            style={{ borderColor: COLORS[item.status] }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm"
                style={{ backgroundColor: COLORS[item.status] }}
              >
                {ICONS[item.status]}
              </div>
              <p className="text-xs text-gray-600">{item.name}</p>
            </div>
            <p className="text-lg font-semibold text-gray-800 mt-1">
              {item.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductStatusChart;
