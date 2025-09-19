import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-gray-600">
          <div>
            <div className="text-gray-900 font-semibold">PIRA</div>
            <p className="mt-2">Nền tảng tin cậy cho thuê thiết bị du lịch.</p>
          </div>
          <div>
            <div className="text-gray-900 font-semibold">Cho Người Thuê</div>
            <ul className="mt-2 space-y-1">
              <li>Duyệt Thiết Bị</li>
              <li>Cách Hoạt Động</li>
              <li>An Toàn & Bảo Hiểm</li>
              <li>Hỗ Trợ Khách Hàng</li>
            </ul>
          </div>
          <div>
            <div className="text-gray-900 font-semibold">Công Ty</div>
            <ul className="mt-2 space-y-1">
              <li>Về Chúng Tôi</li>
              <li>Liên Hệ</li>
              <li>Chính Sách Bảo Mật</li>
              <li>Điều Khoản Dịch Vụ</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-xs text-gray-500">© 2024 PIRA. Tất cả quyền được bảo lưu.</div>
      </div>
    </footer>
  );
}



