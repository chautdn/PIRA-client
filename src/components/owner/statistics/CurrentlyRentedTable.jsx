import React from 'react';
import { Clock, User, Package, MapPin } from 'lucide-react';
import { useI18n } from '../../../hooks/useI18n';

const CurrentlyRentedTable = ({ rentedProducts, loading }) => {
  const { t } = useI18n();
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      CONFIRMED: { color: 'bg-blue-100 text-blue-800', text: 'Đã xác nhận' },
      SHIPPER_CONFIRMED: { color: 'bg-yellow-100 text-yellow-800', text: 'Shipper đã nhận' },
      IN_TRANSIT: { color: 'bg-orange-100 text-orange-800', text: 'Đang vận chuyển' },
      DELIVERED: { color: 'bg-green-100 text-green-800', text: 'Đã giao' },
      ACTIVE: { color: 'bg-purple-100 text-purple-800', text: 'Đang thuê' },
    };
    const config = statusConfig[status] || statusConfig.CONFIRMED;
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
          <Clock className="text-blue-500" size={20} />
          {t("ownerStatistics.currentlyRented.title")}
        </h3>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!rentedProducts || rentedProducts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="text-blue-500" size={20} />
          {t("ownerStatistics.currentlyRented.title")}
        </h3>
        <div className="text-center py-8 text-gray-500">
          <Package size={48} className="mx-auto mb-2 opacity-50" />
          <p>{t("ownerStatistics.currentlyRented.noData")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="text-blue-500" size={20} />
        {t("ownerStatistics.currentlyRented.title")} ({rentedProducts.length})
      </h3>

      <div className="space-y-4">
        {rentedProducts.map((item) => (
          <div
            key={item.subOrderNumber}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {/* Product Info */}
            <div className="flex items-start gap-4 mb-4">
              {item.productImages && item.productImages.length > 0 ? (
                <img
                  src={item.productImages[0].url}
                  alt={item.productTitle}
                  className="w-20 h-20 object-cover rounded"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                  <Package size={24} className="text-gray-400" />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">
                      {item.productTitle}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {t("ownerStatistics.currentlyRented.orderId")}: {item.subOrderNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      Master Order: {item.masterOrderNumber}
                    </p>
                  </div>
                  {getStatusBadge(item.productStatus)}
                </div>

                {/* Rental Details */}
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Số lượng</p>
                    <p className="font-medium text-gray-800">{item.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Giá thuê/ngày</p>
                    <p className="font-medium text-green-600">
                      {formatCurrency(item.rentalRate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tiền cọc</p>
                    <p className="font-medium text-blue-600">
                      {formatCurrency(item.depositRate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t("ownerStatistics.currentlyRented.rentalPeriod")}</p>
                    <p className="font-medium text-gray-800">
                      {item.rentalPeriod?.duration?.value}{' '}
                      {item.rentalPeriod?.duration?.unit === 'DAY'
                        ? 'ngày'
                        : item.rentalPeriod?.duration?.unit === 'WEEK'
                        ? 'tuần'
                        : 'tháng'}
                    </p>
                  </div>
                </div>

                {/* Rental Period */}
                <div className="mt-3 p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Từ: </span>
                      <span className="font-medium text-gray-800">
                        {formatDate(item.rentalPeriod?.startDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Đến: </span>
                      <span className="font-medium text-gray-800">
                        {formatDate(item.rentalPeriod?.endDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Renter Info */}
                <div className="mt-3 p-3 bg-blue-50 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">
                      {t("ownerStatistics.currentlyRented.renter")}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Tên: </span>
                      <span className="font-medium text-gray-800">
                        {item.renter?.firstName} {item.renter?.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email: </span>
                      <span className="font-medium text-gray-800">
                        {item.renter?.email}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">SĐT: </span>
                      <span className="font-medium text-gray-800">
                        {item.renter?.phoneNumber}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrentlyRentedTable;
