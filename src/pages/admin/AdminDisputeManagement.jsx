import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import disputeApi from '../../services/dispute.Api';
import {
  getDisputeStatusColor,
  getDisputeStatusText,
  getDisputeTypeText,
  getPriorityColor,
  getPriorityText,
  formatDate
} from '../../utils/disputeHelpers';

const AdminDisputeManagement = () => {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadDisputes();
    loadStatistics();
  }, [filters]);

  const loadDisputes = async () => {
    try {
      setIsLoading(true);
      const response = await disputeApi.adminGetAllDisputes(filters);
      setDisputes(response.data?.disputes || []);
    } catch (error) {
      console.error('Load disputes error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await disputeApi.adminGetStatistics();
      setStatistics(response.data?.statistics || null);
    } catch (error) {
      console.error('Load statistics error:', error);
    }
  };

  const handleRowClick = (disputeId) => {
    navigate(`/admin/disputes/${disputeId}`);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading && disputes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Tranh chấp</h1>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Tổng số</div>
            <div className="text-2xl font-bold text-gray-900">{statistics.total || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Chờ xử lý</div>
            <div className="text-2xl font-bold text-orange-600">{statistics.pending || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Đang xử lý</div>
            <div className="text-2xl font-bold text-blue-600">{statistics.inProgress || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Đã giải quyết</div>
            <div className="text-2xl font-bold text-green-600">{statistics.resolved || 0}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <option value="RESPONDENT_REJECTED">Chờ admin</option>
              <option value="ADMIN_DECISION_MADE">Admin đã quyết định</option>
              <option value="IN_NEGOTIATION">Đang đàm phán</option>
              <option value="THIRD_PARTY_ESCALATED">Bên thứ 3</option>
              <option value="RESOLVED">Đã giải quyết</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ưu tiên
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tất cả</option>
              <option value="LOW">Thấp</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HIGH">Cao</option>
              <option value="URGENT">Khẩn cấp</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Mã dispute, tên người dùng..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', priority: '', search: '' })}
              className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Disputes Table */}
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
                Người khiếu nại
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Người bị khiếu nại
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ưu tiên
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {disputes.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  Không có tranh chấp nào
                </td>
              </tr>
            ) : (
              disputes.map((dispute) => (
                <tr
                  key={dispute._id}
                  onClick={() => handleRowClick(dispute._id)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {dispute.disputeId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getDisputeTypeText(dispute.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dispute.complainant?.profile?.fullName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dispute.respondent?.profile?.fullName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDisputeStatusColor(dispute.status)}`}>
                      {getDisputeStatusText(dispute.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(dispute.priority)}`}>
                      {getPriorityText(dispute.priority)}
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

export default AdminDisputeManagement;
