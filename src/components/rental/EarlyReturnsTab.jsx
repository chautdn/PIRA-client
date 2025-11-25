import React from "react";
import { Package, Calendar, MapPin, Clock } from "lucide-react";
import { toast } from "../common/Toast";
import {
  getEarlyReturnStatusColor,
  getEarlyReturnStatusText,
  formatDate,
} from "../../utils/orderHelpers";

const EarlyReturnsTab = ({ earlyReturnRequests, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <span className="text-gray-600">Đang tải yêu cầu trả sớm...</span>
      </div>
    );
  }

  if (earlyReturnRequests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Chưa có yêu cầu trả sớm
        </h3>
        <p className="text-gray-600">Bạn chưa có yêu cầu trả hàng sớm nào</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="space-y-4">
        {earlyReturnRequests.map((request) => (
          <div
            key={request._id}
            className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-orange-500"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="font-semibold text-gray-800">
                    Mã yêu cầu: {request.requestNumber}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getEarlyReturnStatusColor(
                      request.status
                    )}`}
                  >
                    {getEarlyReturnStatusText(request.status)}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      Đơn hàng:{" "}
                      {request.masterOrder?.masterOrderNumber || "Đang tải..."}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      Ngày trả: {formatDate(request.requestedReturnDate)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Tạo lúc: {formatDate(request.createdAt)}
                </div>
                {request.returnAddress && (
                  <div className="mt-2 flex items-start space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <span className="text-gray-600">
                      {request.returnAddress.streetAddress},{" "}
                      {request.returnAddress.ward},{" "}
                      {request.returnAddress.district},{" "}
                      {request.returnAddress.city}
                    </span>
                  </div>
                )}
                {request.renterNotes && (
                  <div className="mt-2 text-sm text-gray-600 italic">
                    Ghi chú: {request.renterNotes}
                  </div>
                )}
              </div>
              <div className="ml-4">
                <button
                  onClick={() => {
                    toast.success("Chi tiết yêu cầu: " + request.requestNumber);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EarlyReturnsTab;
