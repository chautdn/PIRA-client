import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import LogoutModal from "../common/LogoutModal";
import { ROUTES } from "../../utils/constants";

const Navigation = () => {
  const { user, logout, loading } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLogoutLoading(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            {/* 1) Brand */}
            <Link to={ROUTES.HOME} className="text-xl font-bold text-primary-700">PIRA</Link>

            {/* 2) Primary menu (Trang chủ, Tìm kiếm, Đơn hàng) */}
            <div className="hidden md:flex items-center gap-5">
              <Link to={ROUTES.HOME} className="text-gray-800 hover:text-primary-700 text-sm font-medium">Trang Chủ</Link>
              <Link to={ROUTES.PRODUCTS} className="text-gray-800 hover:text-primary-700 text-sm font-medium">Tìm Kiếm</Link>
              <Link to="#" className="text-gray-800 hover:text-primary-700 text-sm font-medium">Đơn Hàng</Link>
            </div>

            {/* 3) Search bar */}
            <div className="flex-1 max-w-xl ml-2">
              <div className="flex items-center w-full border border-gray-300 rounded-full px-3 py-2 text-sm bg-white">
                <span className="mr-2">🔎</span>
                <input className="w-full outline-none placeholder:text-gray-400" placeholder="Tìm kiếm thiết bị du lịch..." />
              </div>
            </div>

            {/* 4) Language + icons + auth (right aligned) */}
            <div className="hidden md:flex items-center gap-4 ml-2">
              {/* Language */}
              <div className="flex items-center text-sm text-gray-700 mr-2">
                <span className="mr-1">🌐</span> VI
              </div>
              {/* Icons: cart, heart, chat, user */}
              <button title="Giỏ hàng" className="text-gray-700 hover:text-primary-700">🛒</button>
              <button title="Yêu thích" className="text-gray-700 hover:text-primary-700">❤</button>
              <button title="Chat" className="text-gray-700 hover:text-primary-700">💬</button>
              <button title="Tài khoản" className="text-gray-700 hover:text-primary-700">👤</button>

              {!user ? (
                <>
                  <Link to={ROUTES.LOGIN} className="text-gray-700 hover:text-primary-700 text-sm">Đăng Nhập</Link>
                  <Link to={ROUTES.REGISTER} className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-md text-sm font-medium">Đăng Ký</Link>
                </>
              ) : (
                <>
                  <Link
                    to={ROUTES.DASHBOARD}
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to={ROUTES.CHAT}
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Messages
                  </Link>
                  <Link
                    to={ROUTES.CHAT_DEMO}
                    className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Chat Demo
                  </Link>

                  <div className="flex items-center space-x-3">
                    <span className="text-gray-700 text-sm">
                      Welcome,{" "}
                      {user.profile?.firstName || user.email.split("@")[0]}
                    </span>
                    <button
                      onClick={() => setShowLogoutModal(true)}
                      disabled={loading}
                      className="bg-red-600 text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
        loading={logoutLoading}
      />
    </>
  );
};

export default Navigation;
