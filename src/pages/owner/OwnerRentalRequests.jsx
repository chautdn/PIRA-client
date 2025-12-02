import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ownerProductApi } from '../../services/ownerProduct.Api';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/constants';
import { Package, Calendar, User, CreditCard, ChevronRight, Filter } from 'lucide-react';

const OwnerRentalRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchSubOrders();
    }
  }, [user, statusFilter]);

  const fetchSubOrders = async () => {
    try {
      setLoading(true);
      const response = await ownerProductApi.getRentalRequests({
        status: statusFilter === 'all' ? undefined : statusFilter
      });

      // Extract subOrders from various response shapes
      const extractSubOrders = (resp) => {
        if (!resp) return [];
        const candidates = [
          resp,
          resp.data,
          resp.metadata,
          resp.data?.metadata,
          resp.data?.data,
          resp.metadata?.subOrders,
          resp.data?.subOrders,
          resp.data?.data?.subOrders,
          resp.data?.metadata?.subOrders
        ];

        for (const c of candidates) {
          if (Array.isArray(c)) return c;
          if (c && typeof c === 'object' && Array.isArray(c.data)) return c.data;
          if (c && typeof c === 'object' && Array.isArray(c.subOrders)) return c.subOrders;
          if (c && c.subOrders && Array.isArray(c.subOrders.data)) return c.subOrders.data;
          if (c && c.metadata && Array.isArray(c.metadata.data)) return c.metadata.data;
        }
        return [];
      };

      const subOrdersList = extractSubOrders(response);
      setSubOrders(subOrdersList);
    } catch (error) {
      console.error('Lỗi tải danh sách yêu cầu thuê:', error);
      toast.error('Không thể tải danh sách yêu cầu thuê');
      setSubOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Nháp' },
      PENDING_CONFIRMATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ xác nhận' },
      OWNER_CONFIRMED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã xác nhận' },
      OWNER_REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Đã từ chối' },
      PARTIALLY_CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Xác nhận 1 phần' },
      RENTER_REJECTED: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Người thuê từ chối' },
      READY_FOR_CONTRACT: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Sẵn sàng hợp đồng' },
      CONTRACT_SIGNED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã ký hợp đồng' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Hoàn thành' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Đã hủy' }
    };

    const style = config[status] || config.DRAFT;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text} whitespace-nowrap`}>
        {style.label}
      </span>
    );
  };

  const filterOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'PENDING_CONFIRMATION', label: 'Chờ xác nhận' },
    { value: 'OWNER_CONFIRMED', label: 'Đã xác nhận' },
    { value: 'PARTIALLY_CONFIRMED', label: 'Xác nhận 1 phần' },
    { value: 'CONTRACT_SIGNED', label: 'Đã ký hợp đồng' },
    { value: 'COMPLETED', label: 'Hoàn thành' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý yêu cầu thuê</h1>
          <p className="text-gray-600">Quản lý các yêu cầu thuê sản phẩm của bạn</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Filter size={20} className="text-gray-600" />
            <h3 className="font-semibold text-gray-900">Lọc theo trạng thái</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        {subOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có yêu cầu thuê nào</h3>
            <p className="text-gray-600">
              {statusFilter !== 'all' 
                ? 'Không có yêu cầu thuê nào với bộ lọc này'
                : 'Bạn chưa có yêu cầu thuê nào. Đăng sản phẩm để nhận yêu cầu thuê!'
              }
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã đơn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người thuê
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tổng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subOrders.map((subOrder) => (
                    <tr
                      key={subOrder._id}
                      onClick={() => navigate(`/owner/rental-requests/${subOrder._id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{subOrder.subOrderNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User size={16} className="text-gray-400 mr-2" />
                          <div className="text-sm font-medium text-gray-900">
                            {subOrder.masterOrder?.renter?.profile?.fullName || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {subOrder.products?.length || 0} sản phẩm
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-blue-600">
                          {formatCurrency(
                            (subOrder.pricing?.subtotalRental || 0) +
                            (subOrder.pricing?.subtotalDeposit || 0) +
                            (subOrder.pricing?.shippingFee || 0)
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(subOrder.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <ChevronRight size={20} className="text-gray-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {subOrders.map((subOrder) => (
                <div
                  key={subOrder._id}
                  onClick={() => navigate(`/owner/rental-requests/${subOrder._id}`)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-gray-900">{subOrder.subOrderNumber}</div>
                    {getStatusBadge(subOrder.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User size={16} />
                      <span>{subOrder.masterOrder?.renter?.profile?.fullName || 'N/A'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Package size={16} />
                      <span>{subOrder.products?.length || 0} sản phẩm</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} />
                      <span>{new Date(subOrder.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CreditCard size={16} className="text-gray-600" />
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(
                          (subOrder.pricing?.subtotalRental || 0) +
                          (subOrder.pricing?.subtotalDeposit || 0) +
                          (subOrder.pricing?.shippingFee || 0)
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end text-blue-600 text-sm font-medium">
                    Xem chi tiết
                    <ChevronRight size={16} className="ml-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {subOrders.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">
              Hiển thị <span className="font-semibold text-gray-900">{subOrders.length}</span> yêu cầu thuê
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerRentalRequests;
