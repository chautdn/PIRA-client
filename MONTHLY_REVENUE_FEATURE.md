# Tính năng Doanh thu theo Tháng - Admin Dashboard

## 📊 Tổng quan

Tính năng hiển thị doanh thu thực tế của hệ thống theo từng tháng (6 tháng gần nhất) trên Admin Dashboard với giao diện trực quan và thông tin chi tiết.

## ✨ Tính năng đã triển khai

### Backend (Server)
- **File**: `server/PIRA-server/src/services/admin.service.js`
- **Method**: `getMonthlyRevenue()`
- **Nguồn dữ liệu**: Collection `Transaction`
- **Điều kiện lọc**:
  - Status: `success` (chỉ tính giao dịch thành công)
  - Thời gian: 6 tháng gần nhất
  - Các loại giao dịch:
    - Phí hệ thống: `toSystemWallet: true, systemWalletAction: 'revenue'`
    - Phí khuyến mãi: `type: 'PROMOTION_REVENUE'`
    - Phí dịch vụ: `systemWalletAction: 'fee_collection'`
    - Phí phạt: `systemWalletAction: 'penalty'`

#### 3. Response Format
```javascript
[
  {
    _id: { year: 2025, month: 12 },
    subOrderRevenue: 5000000,      // Doanh thu từ SubOrder
    orderCount: 15,                 // Số lượng đơn
    transactionRevenue: 500000,     // Doanh thu từ Transaction
    transactionCount: 8,            // Số lượng giao dịch
    revenue: 5500000,               // Tổng doanh thu
    systemBalance: 10000000         // Số dư System Wallet (chỉ tháng cuối)
  }
]
```

### Frontend (Client)
- **File**: `client/PIRA-client/src/pages/admin/AdminDashboard.jsx`
- **Components cập nhật**:
  1. **StatCard** - Hiển thị tổng doanh thu
  2. **Monthly Revenue Chart** - Biểu đồ cột theo tháng
  3. **Revenue Sources Info** - Thông tin nguồn doanh thu

## 🎨 UI/UX Improvements

### 1. Biểu đồ Doanh thu theo Tháng
- ✅ Hiển thị cột màu xanh lá với gradient đẹp mắt
- ✅ Tooltip chi tiết khi hover (tháng/năm + số tiền)
- ✅ Hiển thị giá trị trên cột (format: X.XM đ)
- ✅ Hiển thị tên tháng và năm dưới mỗi cột
- ✅ Thống kê tóm tắt: Trung bình, Cao nhất, Thấp nhất
- ✅ Empty state có icon và text hướng dẫn

### 2. StatCard - Tổng Doanh Thu
- ✅ Prop `isCurrency` để format số tiền
- ✅ Tự động hiển thị M (triệu) cho số lớn
- ✅ Format theo locale VN (dấu phẩy ngăn cách)
- ✅ Icon 💰 và màu indigo nổi bật

### 3. Revenue Sources Info Section
- ✅ Background gradient đẹp (indigo to purple)
- ✅ 4 nguồn doanh thu chính với icon và mô tả
- ✅ Badge "Dữ liệu từ Transaction"
- ✅ Hiển thị "Real-time" để nhấn mạnh tính cập nhật

## 📈 Biểu đồ Xu hướng (Line Chart)

### 4. Revenue Trend Line Chart
- ✅ **Biểu đồ đường** với Chart.js và react-chartjs-2
- ✅ **3 đường dữ liệu**:
  - Tổng doanh thu (đường nét liền, màu indigo, có fill)
  - SubOrder (đường nét đứt, màu xanh dương)
  - Transaction (đường nét đứt, màu xanh lá)
- ✅ **Interactive tooltips**: 
  - Hiển thị giá trị format VND
  - Footer với số đơn hàng và giao dịch
- ✅ **Smooth curves**: Tension 0.4 cho đường cong mượt mà
- ✅ **Point styles**: Điểm tròn với border trắng, hover effect
- ✅ **Grid styling**: Grid nhẹ màu xám, trục Y format M/K
- ✅ **Legend**: Hiển thị ở góc trên bên phải với point style

### 5. Growth Insights (3 Cards)
- ✅ **Tăng trưởng**: Hiển thị % tăng/giảm so với tháng trước
  - Badge màu xanh (tăng) hoặc đỏ (giảm)
  - Icon 📈 hoặc 📉
- ✅ **Cao nhất**: Doanh thu peak với % so với trung bình
  - Icon 🏆
  - Background màu tím
- ✅ **Biến động**: Chênh lệch giữa max và min
  - Icon 📊
  - Background màu xanh dương

### 6. Time Period Comparison
- ✅ **So sánh 2 giai đoạn**: 3 tháng gần nhất vs 3 tháng trước
  - Card màu indigo (kỳ hiện tại)
  - Card màu xám (kỳ trước)
  - Badge % tăng trưởng giữa 2 kỳ
- ✅ **Bảng chi tiết**: Breakdown từng tháng
  - Cột SubOrder, Transaction, Tổng, Thay đổi
  - Hover effect trên từng row
  - Icon ↗/↘ cho % thay đổi
  - Color coding: xanh (tăng), đỏ (giảm)

## 📱 Responsive Design
- ✅ Grid layout tự động điều chỉnh theo kích thước màn hình
- ✅ Chart căn chỉnh đẹp trên mobile
- ✅ Revenue Sources stack theo chiều dọc trên mobile
- ✅ Line chart responsive với maintainAspectRatio: false
- ✅ Table có overflow-x-auto cho mobile

## 🔧 Technical Details

### Data Flow
```
Backend: Transaction.aggregate() 
  → getMonthlyRevenue()
  → getDashboardStats()
  → /api/admin/dashboard

Frontend: adminService.getDashboardStats()
  → stats.charts.monthlyRevenue[]
  → Render Chart + Stats
```

### Data Format
```javascript
monthlyRevenue: [
  {
    _id: { year: 2025, month: 12 },
    revenue: 1500000
  },
  // ...
]
```

## 🚀 Cách sử dụng

1. **Xem Dashboard**: 
   - Truy cập trang Admin Dashboard
   - Scroll xuống phần "Doanh thu theo tháng"

2. **Xem chi tiết**:
   - Hover vào cột để xem số tiền cụ thể
   - Check phần thống kê bên dưới chart

3. **Hiểu nguồn doanh thu**:
   - Đọc phần "Nguồn doanh thu" để biết data từ đâu

## 📝 Notes

- Doanh thu chỉ tính từ transactions có `status: 'success'`
- Dữ liệu real-time, cập nhật mỗi khi load dashboard
- Chart hiển thị tối đa 6 tháng gần nhất
- Format số tiền: VND với locale Việt Nam

## 🔄 Future Enhancements

- [ ] Thêm filter theo timeframe (3 tháng, 12 tháng, custom range)
- [ ] Export dữ liệu doanh thu (CSV, Excel, PDF)
- [ ] ✅ So sánh với kỳ trước (growth percentage) - DONE
- [ ] ✅ Breakdown theo từng loại revenue source - DONE
- [ ] Animation khi load chart (fade in, slide up)
- [ ] Cache data để giảm API calls (React Query)
- [ ] Forecast doanh thu tháng tiếp theo (ML model)
- [ ] Email report tự động hàng tuần/tháng
- [ ] Real-time updates với WebSocket
- [ ] Drill-down vào từng tháng để xem chi tiết transactions

## 📊 Chart Features Summary

| Feature | Bar Chart | Line Chart | Comparison Table |
|---------|-----------|------------|------------------|
| Stacked View | ✅ | ❌ | ❌ |
| Trend Analysis | ❌ | ✅ | ✅ |
| Interactive Tooltip | ✅ | ✅ | ❌ |
| Growth Rate | ❌ | ✅ (Insights) | ✅ |
| Time Comparison | ❌ | ✅ | ✅ |
| Data Breakdown | ✅ | ✅ | ✅ |
