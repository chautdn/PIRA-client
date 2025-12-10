import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useI18n } from "../../hooks/useI18n";
import { ROUTES } from "../../utils/constants";
import voucherService from "../../services/voucher";
import icons from "../../utils/icons";

const {
  FiUser,
  FiGift,
  FiPackage,
  FiClipboard,
  FiAlertTriangle,
  FiDollarSign,
  FiSettings,
  FiTruck,
  FiLogOut,
} = icons;

const UserDropdown = () => {
  const { user, logout, loading } = useAuth();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch loyalty points when dropdown opens
  useEffect(() => {
    if (isOpen && user) {
      fetchLoyaltyData();
    }
  }, [isOpen, user]);

  const fetchLoyaltyData = async () => {
    try {
      const response = await voucherService.getLoyaltyPoints();
      setLoyaltyData(response);
    } catch (error) {
      console.error("Error fetching loyalty data:", error);
      // Silently fail - don't show error to user
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      setIsOpen(false);
      navigate(ROUTES.LOGIN);
    } catch (error) {
      // Handle logout error
    } finally {
      setLogoutLoading(false);
    }
  };

  if (!user) return null;

  const displayName = user.profile?.firstName
    ? `${user.profile.firstName} ${user.profile?.lastName || ""}`.trim()
    : user.email.split("@")[0];

  const avatarUrl = user.profile?.avatar || null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-gray-700 hover:text-primary-700 transition-colors group"
        disabled={loading}
      >
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center ring-2 ring-gray-200 group-hover:ring-primary-400 transition-all shadow-sm">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <span className="text-white font-bold text-lg">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Name and Arrow */}
        <div className="flex items-center space-x-2">
          <span className="text-base font-semibold hidden sm:block max-w-[120px] truncate">
            {displayName}
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
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
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Info */}
          <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 ring-2 ring-blue-200">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-xl">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {displayName}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              to="/profile"
              className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <FiUser className="mr-3 text-lg text-blue-500" />
              {t("userDropdown.profile")}
            </Link>

            <Link
              to="/vouchers"
              className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors group"
              onClick={() => setIsOpen(false)}
            >
              <FiGift className="mr-3 text-lg text-purple-500" />
              <span>{t("userDropdown.vouchers")}</span>
            </Link>

            <Link
              to="/my-products"
              className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <FiPackage className="mr-3 text-lg text-green-500" />
              {t("userDropdown.myProducts")}
            </Link>

            <Link
              to="/bookings"
              className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <FiClipboard className="mr-3 text-lg text-orange-500" />
              {t("userDropdown.myRentals")}
            </Link>

            <Link
              to={ROUTES.MY_REPORTS}
              className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <FiAlertTriangle className="mr-3 text-lg text-red-500" />
              {t("userDropdown.reports")}
            </Link>

            <Link
              to="/withdrawals"
              className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <FiDollarSign className="mr-3 text-lg text-emerald-500" />
              {t("userDropdown.withdraw")}
            </Link>

            <Link
              to="/settings"
              className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <FiSettings className="mr-3 text-lg text-gray-500" />
              {t("userDropdown.settings")}
            </Link>

            {user?.role === 'SHIPPER' && (
              <Link
                to="/shipments"
                className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <FiTruck className="mr-3 text-lg text-blue-600" />
                {t("userDropdown.shipments")}
              </Link>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 py-2">
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
            >
              <FiLogOut className="mr-3 text-lg text-red-500" />
              {logoutLoading ? t("userDropdown.loggingOut") : t("userDropdown.logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
