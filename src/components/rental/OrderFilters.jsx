import React from "react";
import { Search, Filter } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";

const OrderFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  filteredCount,
  totalCount,
}) => {
  const { t } = useI18n();
  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('rentalOrders.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{t('rentalOrders.allStatuses')}</option>
              <option value="DRAFT">{t('rentalOrders.statuses.DRAFT')}</option>
              <option value="PENDING_PAYMENT">{t('rentalOrders.statuses.PENDING_PAYMENT')}</option>
              <option value="PAYMENT_COMPLETED">{t('rentalOrders.statuses.PAYMENT_COMPLETED')}</option>
              <option value="PENDING_CONFIRMATION">{t('rentalOrders.statuses.PENDING_CONFIRMATION')}</option>
              <option value="CONFIRMED">{t('rentalOrders.statuses.CONFIRMED')}</option>
              <option value="PARTIALLY_CANCELLED">{t('rentalOrders.statuses.PARTIALLY_CANCELLED')}</option>
              <option value="READY_FOR_CONTRACT">{t('rentalOrders.statuses.READY_FOR_CONTRACT')}</option>
              <option value="CONTRACT_SIGNED">{t('rentalOrders.statuses.CONTRACT_SIGNED')}</option>
              <option value="ACTIVE">{t('rentalOrders.statuses.ACTIVE')}</option>
              <option value="COMPLETED">{t('rentalOrders.statuses.COMPLETED')}</option>
              <option value="CANCELLED">{t('rentalOrders.statuses.CANCELLED')}</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {filteredCount} / {totalCount} {t('rentalOrders.ordersFound')}
        </div>
      </div>
    </div>
  );
};

export default OrderFilters;
