# Rental Orders Page Translation Guide

## Overview
Complete Vietnamese (vi) and English (en) translations have been added to support the Rental Orders management page in PIRA.

## File Locations
- **Vietnamese Translations**: `src/locales/vi.json`
- **English Translations**: `src/locales/en.json`

## New Translation Section: `rentalOrders`

### Usage in Components
All translations should be accessed using the i18n hook:

```jsx
import { useI18n } from '../hooks/useI18n';

const YourComponent = () => {
  const t = useI18n();
  
  return (
    <h1>{t('rentalOrders.title')}</h1>
    <p>{t('rentalOrders.subtitle')}</p>
  );
};
```

## Translation Keys Reference

### Main Page Texts
| Key | Vietnamese | English |
|-----|------------|---------|
| `rentalOrders.title` | Quản Lý Đơn Thuê | Manage Rental Orders |
| `rentalOrders.subtitle` | Theo dõi và quản lý các đơn hàng thuê của bạn | Track and manage your rental orders |
| `rentalOrders.myRentals` | Đơn thuê của tôi | My Rentals |
| `rentalOrders.orderManagement` | Quản lý đơn thuê | Order Management |

### Empty State Messages
| Key | Vietnamese | English |
|-----|------------|---------|
| `rentalOrders.noRentals` | Không có đơn hàng nào | No Orders |
| `rentalOrders.noRentalsDesc` | Bạn chưa có đơn thuê nào. Hãy tạo đơn thuê đầu tiên! | You haven't created any rental orders yet. Start renting now! |
| `rentalOrders.noBrowseRentals` | Bạn cần đăng nhập để xem đơn hàng | You need to login to view your orders |
| `rentalOrders.notFound` | Không tìm thấy đơn hàng nào | No orders found |

### User Actions
| Key | Vietnamese | English |
|-----|------------|---------|
| `rentalOrders.viewProducts` | Xem sản phẩm | View Products |
| `rentalOrders.login` | Đăng nhập | Login |

### Search & Filter
| Key | Vietnamese | English |
|-----|------------|---------|
| `rentalOrders.searchPlaceholder` | Tìm kiếm đơn hàng... | Search orders... |
| `rentalOrders.allStatuses` | Tất cả trạng thái | All Statuses |
| `rentalOrders.ordersFound` | đơn hàng | orders |
| `rentalOrders.loading` | Đang tải đơn hàng... | Loading orders... |

### Pagination
| Key | Vietnamese | English |
|-----|------------|---------|
| `rentalOrders.pagination.page` | Trang | Page |
| `rentalOrders.pagination.of` | / | / |
| `rentalOrders.pagination.previous` | Trước | Previous |
| `rentalOrders.pagination.next` | Sau | Next |

### Table Headers
| Key | Vietnamese | English |
|-----|------------|---------|
| `rentalOrders.table.orderNumber` | Mã đơn | Order Number |
| `rentalOrders.table.createdDate` | Ngày tạo | Created Date |
| `rentalOrders.table.numberOfItems` | Số sản phẩm | Number of Items |
| `rentalOrders.table.delivery` | Giao hàng | Delivery |
| `rentalOrders.table.totalPrice` | Tổng tiền | Total Price |
| `rentalOrders.table.status` | Trạng thái | Status |
| `rentalOrders.table.actions` | Hành động | Actions |

### Table Actions
| Key | Vietnamese | English |
|-----|------------|---------|
| `rentalOrders.table.details` | Chi tiết | Details |
| `rentalOrders.table.earlyReturn` | Trả sớm | Early Return |
| `rentalOrders.table.extend` | Gia hạn | Extend |
| `rentalOrders.table.confirm` | Xác nhận | Confirm |
| `rentalOrders.table.contract` | Hợp đồng | Contract |
| `rentalOrders.table.shipments` | Lô hàng | Shipments |

### Order Statuses
| Key | Vietnamese | English |
|-----|------------|---------|
| `rentalOrders.statuses.DRAFT` | Nháp | Draft |
| `rentalOrders.statuses.PENDING_PAYMENT` | Chờ thanh toán | Pending Payment |
| `rentalOrders.statuses.PAYMENT_COMPLETED` | Đã thanh toán | Payment Completed |
| `rentalOrders.statuses.PENDING_CONFIRMATION` | Chờ xác nhận | Pending Confirmation |
| `rentalOrders.statuses.CONFIRMED` | Đã xác nhận | Confirmed |
| `rentalOrders.statuses.PARTIALLY_CANCELLED` | Xác nhận một phần | Partially Confirmed |
| `rentalOrders.statuses.READY_FOR_CONTRACT` | Sẵn sàng ký HĐ | Ready for Contract |
| `rentalOrders.statuses.CONTRACT_SIGNED` | Đã ký HĐ | Contract Signed |
| `rentalOrders.statuses.ACTIVE` | Đang thuê | Active Rental |
| `rentalOrders.statuses.COMPLETED` | Hoàn thành | Completed |
| `rentalOrders.statuses.CANCELLED` | Đã hủy | Cancelled |

### Early Return Feature
| Key | Vietnamese | English |
|-----|------------|---------|
| `rentalOrders.earlyReturn.title` | Trả Hàng Sớm | Early Return |
| `rentalOrders.earlyReturn.requestEarlyReturn` | Yêu cầu trả sớm | Request Early Return |
| `rentalOrders.earlyReturn.approveRequest` | Phê duyệt | Approve |
| `rentalOrders.earlyReturn.rejectRequest` | Từ chối | Reject |
| `rentalOrders.earlyReturn.pendingApproval` | Chờ phê duyệt | Pending Approval |
| `rentalOrders.earlyReturn.approved` | Đã phê duyệt | Approved |
| `rentalOrders.earlyReturn.rejected` | Đã từ chối | Rejected |
| `rentalOrders.earlyReturn.noRequests` | Không có yêu cầu nào | No requests |

### Extend Rental Feature
| Key | Vietnamese | English |
|-----|------------|---------|
| `rentalOrders.extendRental.title` | Gia Hạn Thuê | Extend Rental |
| `rentalOrders.extendRental.requestExtend` | Yêu cầu gia hạn | Request Extension |
| `rentalOrders.extendRental.extendPeriod` | Gia hạn thêm | Extend for |
| `rentalOrders.extendRental.newEndDate` | Ngày kết thúc mới | New End Date |
| `rentalOrders.extendRental.additionalFee` | Phí bổ sung | Additional Fee |
| `rentalOrders.extendRental.successMessage` | Yêu cầu gia hạn đã được gửi! | Extension request sent successfully! |

### Order Detail Page
| Key | Vietnamese | English |
|-----|------------|---------|
| `rentalOrders.orderDetail.title` | Chi Tiết Đơn Thuê | Rental Order Details |
| `rentalOrders.orderDetail.overview` | Tổng quan | Overview |
| `rentalOrders.orderDetail.rentalInfo` | Thông tin thuê | Rental Information |
| `rentalOrders.orderDetail.deliveryInfo` | Thông tin giao hàng | Delivery Information |
| `rentalOrders.orderDetail.productInfo` | Thông tin sản phẩm | Product Information |
| `rentalOrders.orderDetail.timeline` | Dòng thời gian | Timeline |
| `rentalOrders.orderDetail.documents` | Tài liệu | Documents |
| `rentalOrders.orderDetail.actions` | Hành động | Actions |
| `rentalOrders.orderDetail.rentalPeriod` | Thời gian thuê | Rental Period |
| `rentalOrders.orderDetail.rentalDates` | Ngày thuê | Rental Dates |
| `rentalOrders.orderDetail.deliveryStatus` | Trạng thái giao hàng | Delivery Status |
| `rentalOrders.orderDetail.estimatedDelivery` | Dự kiến giao hàng | Estimated Delivery |
| `rentalOrders.orderDetail.owner` | Chủ sở hữu | Owner |
| `rentalOrders.orderDetail.renter` | Người thuê | Renter |
| `rentalOrders.orderDetail.items` | Sản phẩm | Items |
| `rentalOrders.orderDetail.subtotal` | Tổng phụ | Subtotal |
| `rentalOrders.orderDetail.deposit` | Tiền cọc | Deposit |
| `rentalOrders.orderDetail.fees` | Phí | Fees |
| `rentalOrders.orderDetail.total` | Tổng cộng | Total |

### Filter & Sort
| Key | Vietnamese | English |
|-----|------------|---------|
| `rentalOrders.filters.filter` | Lọc | Filter |
| `rentalOrders.filters.sort` | Sắp xếp | Sort |
| `rentalOrders.filters.apply` | Áp dụng | Apply |
| `rentalOrders.filters.clear` | Xóa | Clear |

### Messages
| Key | Vietnamese | English |
|-----|------------|---------|
| `rentalOrders.messages.success` | Thành công! | Success! |
| `rentalOrders.messages.error` | Có lỗi xảy ra | An error occurred |
| `rentalOrders.messages.loading` | Đang tải... | Loading... |
| `rentalOrders.messages.retryLoading` | Thử lại | Retry |
| `rentalOrders.messages.noData` | Không có dữ liệu | No data available |

## Implementation Examples

### Page Header
```jsx
import { useI18n } from '../hooks/useI18n';

const RentalOrdersPage = () => {
  const t = useI18n();
  
  return (
    <div>
      <h1>{t('rentalOrders.title')}</h1>
      <p>{t('rentalOrders.subtitle')}</p>
    </div>
  );
};
```

### Empty State
```jsx
{orders.length === 0 && (
  <div className="text-center p-8">
    <h3>{t('rentalOrders.noRentals')}</h3>
    <p>{t('rentalOrders.noRentalsDesc')}</p>
    <button onClick={() => navigate('/products')}>
      {t('rentalOrders.viewProducts')}
    </button>
  </div>
)}
```

### Status Badge
```jsx
<span className="status-badge">
  {t(`rentalOrders.statuses.${order.status}`)}
</span>
```

### Action Buttons
```jsx
<button>{t('rentalOrders.table.earlyReturn')}</button>
<button>{t('rentalOrders.table.extend')}</button>
<button>{t('rentalOrders.table.details')}</button>
```

## Notes
- All translations maintain consistency with the existing PIRA branding and tone
- Vietnamese translations follow natural language conventions for Vietnamese speakers
- English translations are clear and concise for international users
- Status names match the system's status enum values exactly
