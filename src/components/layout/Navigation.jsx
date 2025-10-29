import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../context/CartContext";
import UserDropdown from "../common/UserDropdown";
import WalletBalance from "../wallet/WalletBalance";
import WishlistPopup from "../common/WishlistPopup";
import LogoutModal from "../common/LogoutModal";
import useChatSocket from "../../hooks/useChatSocket";
import useChat from "../../hooks/useChat";
import { ROUTES } from "../../utils/constants";

const Navigation = () => {
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
  }, [user, connected, fetchConversations]);

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
  }, [connected, onNewMessage, onNotification, fetchConversations, user]);

  // Search realtime với debounce 300ms
  useEffect(() => {
    const keyword = searchInput.trim();
    const timer = setTimeout(() => {
      if (window.location.pathname.startsWith(ROUTES.PRODUCTS)) {
        if (keyword) {
          navigate(`${ROUTES.PRODUCTS}?search=${encodeURIComponent(keyword)}`);
        } else {
          navigate(ROUTES.PRODUCTS);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, navigate]);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: Brand + Menu */}
            <div className="flex items-center gap-8">
              {/* Brand */}
              <Link to={ROUTES.HOME} className="flex items-center gap-2 group">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <span className="text-white text-xl font-bold">P</span>
                </div>
                <span className="text-2xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  PIRA
                </span>
              </Link>

              {/* Primary menu */}
              <div className="hidden md:flex items-center gap-1">
                <Link
                  to={ROUTES.HOME}
                  className="px-4 py-2 text-gray-700 hover:text-primary-700 hover:bg-primary-50 rounded-lg text-sm font-semibold transition-all"
                >
                  Trang Chủ
                </Link>
                <Link
                  to={ROUTES.PRODUCTS}
                  className="px-4 py-2 text-gray-700 hover:text-primary-700 hover:bg-primary-50 rounded-lg text-sm font-semibold transition-all"
                >
                  Tìm Kiếm
                </Link>
                <Link
                  to="#"
                  className="px-4 py-2 text-gray-700 hover:text-primary-700 hover:bg-primary-50 rounded-lg text-sm font-semibold transition-all"
                >
                  Đơn Hàng
                </Link>
              </div>
            </div>

            {/* Center: Search bar */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <div className="flex items-center w-full border-2 border-gray-200 hover:border-primary-400 focus-within:border-primary-500 rounded-xl px-4 py-2.5 bg-gray-50 focus-within:bg-white transition-all shadow-sm">
                <span className="text-gray-400 text-lg mr-3">🔎</span>
                <input
                  className="w-full outline-none bg-transparent text-gray-700 placeholder:text-gray-400 font-medium"
                  placeholder="Tìm kiếm thiết bị du lịch..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>

            {/* Right: Icons + Auth */}
            <div className="flex items-center gap-3">
              {/* Language */}
              <button className="hidden md:flex items-center gap-1 px-3 py-2 text-sm font-semibold text-gray-700 hover:text-primary-700 hover:bg-gray-100 rounded-lg transition-all">
                <span className="text-base">🌐</span>
                <span>VI</span>
              </button>

              {/* Action Icons */}
              <div className="flex items-center gap-1">
                {/* Cart */}
                <button
                  title="Giỏ hàng"
                  onClick={toggleCart}
                  className="relative p-2.5 text-gray-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all"
                >
                  <span className="text-xl">🛒</span>
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse shadow-lg">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </button>

                {/* Wishlist */}
                <button
                  title="Yêu thích"
                  onClick={() => setShowWishlist(true)}
                  className="p-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <span className="text-xl">❤️</span>
                </button>

                {/* Chat */}
                <button
                  title="Chat"
                  onClick={handleChatClick}
                  className="relative p-2.5 text-gray-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all"
                >
                  <span className="text-xl">💬</span>
                  {user && unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse shadow-lg">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Wallet Balance - show only for authenticated users */}
              {user && <WalletBalance />}

              {/* Auth Section */}
              {!user ? (
                <div className="flex items-center gap-2 ml-2">
                  <Link
                    to={ROUTES.LOGIN}
                    className="px-4 py-2 text-gray-700 hover:text-primary-700 hover:bg-gray-100 rounded-lg text-sm font-semibold transition-all"
                  >
                    Đăng Nhập
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    Đăng Ký
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <UserDropdown />
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    disabled={loading}
                    className="hidden md:block bg-red-600 text-white hover:bg-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                  >
                    Đăng Xuất
                  </button>
                </div>
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
