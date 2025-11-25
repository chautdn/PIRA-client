import React from "react";
import { Search, Filter } from "lucide-react";

const OrderFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  filteredCount,
  totalCount,
}) => {
  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm đơn hàng..."
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
              <option value="all">Tất cả trạng thái</option>
              <option value="DRAFT">Nháp</option>
              <option value="PENDING_PAYMENT">Chờ thanh toán</option>
              <option value="PENDING_CONFIRMATION">Chờ xác nhận</option>
              <option value="READY_FOR_CONTRACT">Sẵn sàng ký HĐ</option>
              <option value="CONTRACT_SIGNED">Đã ký HĐ</option>
              <option value="ACTIVE">Đang thuê</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {filteredCount} / {totalCount} đơn hàng
        </div>
      </div>
    </div>
  );
};

export default OrderFilters;
