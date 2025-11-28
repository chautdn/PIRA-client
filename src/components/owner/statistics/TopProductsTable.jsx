import React from 'react';
import { Award, TrendingUp, Package } from 'lucide-react';

const TopProductsTable = ({ products, loading }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      AVAILABLE: { color: 'bg-green-100 text-green-800', text: 'Có sẵn' },
      RENTED: { color: 'bg-blue-100 text-blue-800', text: 'Đang cho thuê' },
      UNAVAILABLE: { color: 'bg-gray-100 text-gray-800', text: 'Không khả dụng' },
    };
    const config = statusConfig[status] || statusConfig.AVAILABLE;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="text-yellow-500" size={20} />
          Top sản phẩm có doanh thu cao nhất
        </h3>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="text-yellow-500" size={20} />
          Top sản phẩm có doanh thu cao nhất
        </h3>
        <div className="text-center py-8 text-gray-500">
          <Package size={48} className="mx-auto mb-2 opacity-50" />
          <p>Chưa có dữ liệu sản phẩm</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Award className="text-yellow-500" size={20} />
        Top sản phẩm có doanh thu cao nhất
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                #
              </th>
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                Sản phẩm
              </th>
              <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">
                Trạng thái
              </th>
              <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                Số lần thuê
              </th>
              <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                Doanh thu
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr
                key={product.productId}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-sm">
                    {index + 1}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-3">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].url}
                        alt={product.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <Package size={24} className="text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800 line-clamp-2">
                        {product.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Tổng SL thuê: {product.totalQuantityRented}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2 text-center">
                  {getStatusBadge(product.status)}
                </td>
                <td className="py-3 px-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <TrendingUp size={16} className="text-blue-500" />
                    <span className="font-semibold text-gray-800">
                      {product.rentalCount}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2 text-right">
                  <span className="font-bold text-green-600">
                    {formatCurrency(product.totalRevenue)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopProductsTable;
