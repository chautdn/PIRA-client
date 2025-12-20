import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks/useI18n';
import { useDispute } from '../../context/DisputeContext';
import useDisputeSocket from '../../hooks/useDisputeSocket';
import {
  getDisputeStatusColor,
  getDisputeStatusText,
  getDisputeTypeColor,
  getDisputeTypeText,
  formatDate
} from '../../utils/disputeHelpers';

const DisputeList = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { disputes, isLoading, loadMyDisputes } = useDispute();
  
  const [filters, setFilters] = useState({
    status: '',
    type: ''
  });
  
  // Initialize socket for realtime updates with custom callbacks
  const { isConnected } = useDisputeSocket({
    onDisputeCreated: () => {
      // Reload list khi có dispute mới
      console.log('📡 [Socket] New dispute, reloading list...');
      loadMyDisputes(filters);
    },
    onDisputeStatusChanged: () => {
      // Reload list khi status thay đổi
      console.log('📡 [Socket] Status changed, reloading list...');
      loadMyDisputes(filters);
    },
    onResponseReceived: () => {
      // Reload list khi nhận phản hồi
      console.log('📡 [Socket] Response received, reloading list...');
      loadMyDisputes(filters);
    },
    onDisputeCompleted: () => {
      // Reload list khi dispute hoàn thành
      console.log('📡 [Socket] Dispute completed, reloading list...');
      loadMyDisputes(filters);
    }
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
              {t('disputes.status')}
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">{t('disputes.allStatuses')}</option>
              <option value="OPEN">{t('disputes.open')}</option>
              <option value="IN_NEGOTIATION">{t('disputes.inNegotiation')}</option>
              <option value="ADMIN_REVIEWING">{t('disputes.adminReviewing')}</option>
              <option value="THIRD_PARTY_ESCALATED">{t('disputes.thirdPartyEscalated')}</option>
              <option value="RESOLVED">{t('disputes.resolved')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('disputes.category')}
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">{t('disputes.allCategories')}</option>
              <option value="PRODUCT_NOT_AS_DESCRIBED">{t('disputes.notAsDescribed')}</option>
              <option value="MISSING_ITEMS">{t('disputes.missingItems')}</option>
              <option value="DAMAGED_BY_SHIPPER">{t('disputes.damagedByShipper')}</option>
              <option value="PRODUCT_DEFECT">{t('disputes.productDefect')}</option>
              <option value="DAMAGED_ON_RETURN">{t('disputes.damagedOnReturn')}</option>
              <option value="LATE_RETURN">{t('disputes.lateReturn')}</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', type: '' })}
              className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              {t('disputes.clearFilters')}
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
                {t('disputes.disputeId')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('disputes.type')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('disputes.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('disputes.createdDate')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {disputes.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  {t('disputes.noDisputes')}
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
