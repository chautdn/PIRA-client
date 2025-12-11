import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../context/CartContext";
import UserDropdown from "../common/UserDropdown";
import WalletBalance from "../wallet/WalletBalance";
import WishlistPopup from "../common/WishlistPopup";
import LogoutModal from "../common/LogoutModal";
import NotificationBell from "../common/NotificationBell";
import LanguageSwitcher from "../common/LanguageSwitcher";
import useChatSocket from "../../hooks/useChatSocket";
import useChat from "../../hooks/useChat";
import { ROUTES } from "../../utils/constants";
import icons from "../../utils/icons";

const { TbWorld, IoBarChart, BsCart4, FaRegBell, IoIosHeart, LuBoxes, LuPackageSearch, FaSearchengin, IoChatboxEllipsesOutline,LuPackagePlus, FaBalanceScale } = icons;

// Owner Menu Dropdown Component
const OwnerMenuDropdown = ({ user }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const menuItems = [
    {
      icon: <LuBoxes />,
      label: t("owner.myProducts"),
      description: t("owner.myProductsDesc"),
      route: ROUTES.OWNER_PRODUCTS,
    },
    {
      icon: <LuPackagePlus />,
      label: t("owner.newProduct"),
      description: t("owner.newProductDesc"),
      route: ROUTES.OWNER_CREATE_PRODUCT,
      requiresVerification: true,
    },
    {
      icon: <LuPackageSearch />,
      label: t("owner.rentalRequests"),
      description: t("owner.rentalRequestsDesc"),
      route: "/owner/rental-requests",
    },
    {
      icon: <FaBalanceScale />,
      label: t("owner.disputes"),
      description: t("owner.disputesDesc"),
      route: "/disputes",
    },
    {
      icon: <IoBarChart />,
      label: t("owner.statistics"),
      description: t("owner.statisticsDesc"),
      route: ROUTES.OWNER_STATISTICS,
    },
  ];

  const handleItemClick = (route, requiresVerification = false) => {
    setIsOpen(false);

    if (route === "#") {
      return;
    }

    // If this is the create product route, we'll let the page handle verification
    // But we can show a quick info toast if not verified
    if (requiresVerification && route === ROUTES.OWNER_CREATE_PRODUCT) {
      const cccdVerified = user?.cccd?.isVerified || false;
      const bankAccountAdded = !!(
        user?.bankAccount?.accountNumber && user?.bankAccount?.bankCode
      );

      if (!cccdVerified || !bankAccountAdded) {
        // Still navigate, but the page will show verification screen
        navigate(route);
        return;
      }
    }

    navigate(route);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-primary-700 hover:bg-primary-50 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
      >
        <LuBoxes className="text-xl" />
        <span>{t("owner.manageOwner")}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">
              {t("owner.manageRental")}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("common.about")}
            </p>
          </div>

          <div className="py-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() =>
                  handleItemClick(item.route, item.requiresVerification)
                }
                disabled={item.route === "#"}
                className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left ${
                  item.route === "#" ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    {item.label}
                    {item.route === "#" && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                        {t("owner.comingSoon")}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.description}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-gradient-to-r from-primary-50 to-primary-100">
            <div className="flex items-center gap-2 text-xs text-primary-800">
              <span>💡</span>
              <span className="font-medium">
                {t("owner.tip")}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Navigation = () => {
  const { t } = useTranslation();
  const { user, logout, loading } = useAuth();
  const { cartCount, toggleCart } = useCart();
  const navigate = useNavigate();

  // State
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [showWishlist, setShowWishlist] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Chat hooks (chỉ khi user đăng nhập)
  const chatHook = user
    ? useChat()
    : { conversations: [], fetchConversations: () => {} };
  const socketHook = user
    ? useChatSocket()
    : { connected: false, onNewMessage: () => {}, onNotification: () => {} };

  const { conversations, fetchConversations } = chatHook;
  const { connected, onNewMessage, onNotification } = socketHook;

  // Tính tổng tin nhắn chưa đọc
  useEffect(() => {
    if (conversations && conversations.length > 0) {
      const total = conversations.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0
      );
      setUnreadCount(total);
    } else {
      setUnreadCount(0);
    }
  }, [conversations]);

  // Lấy danh sách cuộc trò chuyện khi kết nối socket
  useEffect(() => {
    if (user && connected) {
      fetchConversations();
    }
  }, [user, connected]); // Removed fetchConversations to prevent infinite loop

  // Lắng nghe tin nhắn mới qua socket
  useEffect(() => {
    if (!connected || !user) return;

    const unsubscribeMessage = onNewMessage(() => {
      fetchConversations(); // Cập nhật lại danh sách
    });

    const unsubscribeNotification = onNotification((notification) => {
      if (notification.type === "new-message") {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      unsubscribeMessage?.();
      unsubscribeNotification?.();
    };
  }, [connected, onNewMessage, onNotification, user]); // Removed fetchConversations to prevent infinite loop

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    const keyword = searchInput.trim();
    if (keyword) {
      navigate(`${ROUTES.PRODUCTS}?search=${encodeURIComponent(keyword)}`);
    } else {
      navigate(ROUTES.PRODUCTS);
    }
  };

  // Xử lý đăng xuất
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

  // Xử lý click vào Chat
  const handleChatClick = () => {
    if (user) {
      navigate(ROUTES.CHAT);
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

  return (
    <>
      <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40">
        <div className="w-full px-2 xs:px-3 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 justify-between max-w-[1920px] mx-auto">
            {/* Left: Brand + Menu */}
            <div className="flex items-center gap-1 xs:gap-2 sm:gap-4 md:gap-6 flex-shrink-0">
              {/* Brand */}
              <Link to={ROUTES.HOME} className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 group">
                <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <span className="text-white text-lg xs:text-xl sm:text-2xl font-bold">P</span>
                </div>
                <span className="text-xl xs:text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  PIRA
                </span>
              </Link>

              {/* Primary menu */}
              <div className="hidden md:flex items-center gap-1">
                <Link
                  to={ROUTES.HOME}
                  className="px-4 py-2.5 text-gray-700 hover:text-primary-700 hover:bg-primary-50 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
                >
                  {t("navigation.home")}
                </Link>
                {user ? (
                  <Link
                    to="/rental-orders"
                    className="px-4 py-2.5 text-gray-700 hover:text-primary-700 hover:bg-primary-50 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
                  >
                    {t("navigation.myRentals")}
                  </Link>
                ) : (
                  <Link
                    to={ROUTES.LOGIN}
                    className="px-4 py-2.5 text-gray-700 hover:text-primary-700 hover:bg-primary-50 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
                  >
                    {t("navigation.myRentals")}
                  </Link>
                )}

                {/* Owner Menu Dropdown - Show for authenticated users who can become owners */}
                {user && (user.role === "OWNER" || user.role === "RENTER") && (
                  <OwnerMenuDropdown user={user} />
                )}
              </div>
            </div>

            {/* Center: Search bar */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-6">
              <form onSubmit={handleSearch} className="w-full relative">
                <div className="flex items-center w-full border-2 border-gray-200 hover:border-primary-400 focus-within:border-primary-500 rounded-xl px-4 py-2.5 bg-gray-50 hover:bg-white transition-all shadow-sm">
                  <button
                    type="submit"
                    className="text-gray-400 hover:text-primary-600 transition-colors flex-shrink-0"
                    aria-label="Search"
                  >
                    <FaSearchengin className="text-xl" />
                  </button>
                  <input
                    type="text"
                    className="w-full outline-none bg-transparent text-gray-700 placeholder:text-gray-400 font-medium text-base ml-3 mr-2"
                    value={searchInput}
                    placeholder={t("navigation.search")}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => setSearchInput("")}
                      className="text-gray-400 hover:text-gray-600 text-lg flex-shrink-0"
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Right: Icons + Auth */}
            <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
              {/* Language Switcher - Hide on mobile */}
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-0.5">
                {/* Cart */}
                <button
                  title={t("navigation.cart")}
                  onClick={toggleCart}
                  className="relative p-1.5 xs:p-2 sm:p-2.5 text-gray-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all"
                >
                  <BsCart4 className="text-lg xs:text-xl sm:text-2xl" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-primary-600 text-white text-[10px] xs:text-xs rounded-full h-4 w-4 xs:h-5 xs:w-5 flex items-center justify-center font-bold animate-pulse shadow-lg">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </button>

                {/* Wishlist */}
                <button
                  title={t("navigation.wishlist")}
                  onClick={() => setShowWishlist(true)}
                  className="p-1.5 xs:p-2 sm:p-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <IoIosHeart className="text-lg xs:text-xl sm:text-2xl" />
                </button>

                {/* Chat */}
                <button
                  title={t("navigation.myChats")}
                  onClick={handleChatClick}
                  className="relative p-1.5 xs:p-2 sm:p-2.5 text-gray-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all"
                >
                  <IoChatboxEllipsesOutline className="text-lg xs:text-xl sm:text-2xl" />
                  {user && unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] xs:text-xs rounded-full h-4 w-4 xs:h-5 xs:w-5 flex items-center justify-center font-bold animate-pulse shadow-lg">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Bell - Only show for authenticated users */}
                {user && (
                  <div className="hidden xs:block">
                    <NotificationBell />
                  </div>
                )}
              </div>

              {/* Wallet Balance - show only for authenticated users */}
              {user && <WalletBalance />}

              {/* Auth Section */}
              {!user ? (
                <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-2">
                  <Link
                    to={ROUTES.LOGIN}
                    className="px-1.5 xs:px-2 sm:px-4 py-1 xs:py-1.5 sm:py-2 text-gray-700 hover:text-primary-700 hover:bg-gray-100 rounded-lg text-[10px] xs:text-xs sm:text-sm font-semibold transition-all whitespace-nowrap"
                  >
                    {t("navigation.signIn")}
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    className="px-2 xs:px-3 sm:px-5 py-1 xs:py-1.5 sm:py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg text-[10px] xs:text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                  >
                    {t("navigation.signUp")}
                  </Link>
                </div>
              ) : (
                <UserDropdown />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modals & Popups */}
      <WishlistPopup
        open={showWishlist}
        onClose={() => setShowWishlist(false)}
      />
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
