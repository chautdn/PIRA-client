import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";
import { ROUTES } from "../../utils/constants";
import icons from "../../utils/icons";
import { CiDeliveryTruck } from "react-icons/ci";

const { IoBarChart, FiUser, FiPackage, BiCreditCard, FiGift, BsCart4, FiAlertTriangle, FaBalanceScale, BsBuildings, FiDollarSign, FiSettings } = icons;

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  // Check if user is admin
  React.useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      navigate("/login");
    }
  }, [user, navigate]);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: <IoBarChart />,
    },
    {
      name: "Quản lý User",
      path: "/admin/users",
      icon: <FiUser />,
    },
    {
      name: "Quản lý Sản phẩm",
      path: "/admin/products",
      icon: <FiPackage />,
    },
    {
      name: "Quản lý Giao dịch",
      path: "/admin/transactions",
      icon: <BiCreditCard />,
    },
    {
      name: "Khuyến mãi Hệ thống",
      path: "/admin/promotions",
      icon: <FiGift />,
    },
    {
      name: "Quản lý Đơn hàng",
      path: "/admin/orders",
      icon: <BsCart4 />,
    },
    {
      name: "Quản lý Báo cáo",
      path: "/admin/reports",
      icon: <FiAlertTriangle />,
    },
    {
      name: "Quản lý Tranh chấp",
      path: "/admin/disputes",
      icon: <FaBalanceScale />,
    },
    {
      name: "Xác minh Ngân hàng",
      path: "/admin/bank-accounts",
      icon: <BsBuildings />,
    },
    {
      name: "Quản lý Rút tiền",
      path: "/admin/withdrawals",
      icon: <FiDollarSign />,
    },
    {
      name: "Quản lí Vận chuyển",
      path: "/admin/shipments",
      icon: <CiDeliveryTruck />,
    },
    {
      name: "Cài đặt",
      path: "/admin/settings",
      icon: <FiSettings />,
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      // Small delay to ensure state is cleared
      setTimeout(() => {
        navigate(ROUTES.HOME, { replace: true });
      }, 100);
    } catch (error) {
      console.error("Logout error:", error);
      // Navigate anyway if logout fails
      navigate(ROUTES.HOME, { replace: true });
    }
  };

  if (!user || user.role !== "ADMIN") {
    return null;
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } transition-all duration-300 bg-white dark:bg-gray-800 shadow-lg flex flex-col relative`}
      >
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded flex items-center justify-center text-white font-bold">
              P
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-lg text-gray-800 dark:text-white">PIRA Admin</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Quản trị hệ thống</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 mt-6 px-4 pb-20">
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/admin" &&
                location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-2 transition-colors ${
                  isActive
                    ? "bg-blue-600 dark:bg-blue-500 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {sidebarOpen && (
                  <span className="font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4 border-t dark:border-gray-700">
          {sidebarOpen ? (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                  {user?.firstName?.charAt(0) || "A"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                {user?.firstName?.charAt(0) || "A"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 px-6 py-4 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-800 dark:text-white"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {menuItems.find(
                  (item) =>
                    location.pathname === item.path ||
                    (item.path !== "/admin" &&
                      location.pathname.startsWith(item.path))
                )?.name || "Dashboard"}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-800 dark:text-white">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-5 5v-5zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-800 dark:text-white">
                  <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                    {user?.firstName?.charAt(0) || "A"}
                  </div>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="p-4 border-b dark:border-gray-700">
                    <p className="font-medium text-gray-800 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                  <div className="py-2">
                    <Link
                      to={ROUTES.ADMIN.PROFILE}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Thông tin cá nhân
                    </Link>
                    <Link
                      to={ROUTES.ADMIN.SETTINGS}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Cài đặt
                    </Link>
                    <hr className="my-2 dark:border-gray-700" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto bg-gray-50 dark:bg-gray-900 transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  );

};

export default AdminLayout;
