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
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to={ROUTES.HOME} className="text-xl font-bold text-blue-600">
              PIRA System
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-4">
              {!user ? (
                <>
                  <Link
                    to={ROUTES.LOGIN}
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Register
                  </Link>
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
