import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispute } from '../../context/DisputeContext';
import {
  getDisputeStatusColor,
  getDisputeStatusText,
  getDisputeTypeColor,
  getDisputeTypeText,
  formatDate
} from '../../utils/disputeHelpers';

const DisputeList = () => {
  const navigate = useNavigate();
  const { disputes, isLoading, loadMyDisputes } = useDispute();
  const [filters, setFilters] = useState({
    status: '',
    type: ''
  });

  useEffect(() => {
    loadMyDisputes(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRowClick = (disputeId) => {
    navigate(`/disputes/${disputeId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tất cả</option>
              <option value="OPEN">Chờ phản hồi</option>
              <option value="IN_NEGOTIATION">Đang đàm phán</option>
              <option value="ADMIN_REVIEWING">Admin xem xét</option>
              <option value="THIRD_PARTY_ESCALATED">Bên thứ 3</option>
              <option value="RESOLVED">Đã giải quyết</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tất cả</option>
              <option value="PRODUCT_NOT_AS_DESCRIBED">Không đúng mô tả</option>
              <option value="MISSING_ITEMS">Thiếu hàng</option>
              <option value="DAMAGED_BY_SHIPPER">Shipper làm hỏng</option>
              <option value="PRODUCT_DEFECT">Sản phẩm lỗi</option>
              <option value="DAMAGED_ON_RETURN">Hư hỏng khi trả</option>
              <option value="LATE_RETURN">Trả hàng trễ</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', type: '' })}
              className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Dispute Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã tranh chấp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loại
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {disputes.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  Không có tranh chấp nào
                </td>
              </tr>
            ) : (
              disputes.map((dispute) => (
                <tr
                  key={dispute._id}
                  onClick={() => handleRowClick(dispute._id)}
                  className="hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {dispute.disputeId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDisputeTypeColor(dispute.type)}`}>
                      {getDisputeTypeText(dispute.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDisputeStatusColor(dispute.status)}`}>
                      {getDisputeStatusText(dispute.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(dispute.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DisputeList;
