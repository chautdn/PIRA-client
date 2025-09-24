import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import LogoutModal from "../common/LogoutModal";
import useChatSocket from "../../hooks/useChatSocket";
import useChat from "../../hooks/useChat";
import { ROUTES } from "../../utils/constants";

const Navigation = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get chat data and socket connection only if user is logged in
  const chatHook = useChat();
  const socketHook = useChatSocket();

  const { conversations, fetchConversations } = user
    ? chatHook
    : { conversations: [], fetchConversations: () => {} };

  const { connected, onNewMessage, onNotification } = user
    ? socketHook
    : { connected: false, onNewMessage: () => {}, onNotification: () => {} };

  // Calculate total unread messages
  useEffect(() => {
    if (conversations && conversations.length > 0) {
      const total = conversations.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0
      );
      setUnreadCount(total);
    }
  }, [conversations]);

  // Fetch conversations on user login
  useEffect(() => {
    if (user && connected) {
      fetchConversations();
    }
  }, [user, connected, fetchConversations]);

  // Listen for new messages
  useEffect(() => {
    if (!connected || !user) return;

    const unsubscribeMessage = onNewMessage(() => {
      fetchConversations();
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

  const handleChatClick = () => {
    if (user) {
      navigate(ROUTES.CHAT);
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

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
      <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            {/* Brand */}
            <Link to={ROUTES.HOME} className="text-xl font-bold text-primary-700">
              PIRA
            </Link>

            {/* Primary menu */}
            <div className="hidden md:flex items-center gap-5">
              <Link
                to={ROUTES.HOME}
                className="text-gray-800 hover:text-primary-700 text-sm font-medium"
              >
                Trang Chủ
              </Link>
              <Link
                to={ROUTES.PRODUCTS}
                className="text-gray-800 hover:text-primary-700 text-sm font-medium"
              >
                Tìm Kiếm
              </Link>
              <Link
                to="#"
                className="text-gray-800 hover:text-primary-700 text-sm font-medium"
              >
                Đơn Hàng
              </Link>
            </div>

            {/* Search bar */}
            <div className="flex-1 max-w-xl ml-2">
              <div className="flex items-center w-full border border-gray-300 rounded-full px-3 py-2 text-sm bg-white">
                <span className="mr-2">🔎</span>
                <input
                  className="w-full outline-none placeholder:text-gray-400"
                  placeholder="Tìm kiếm thiết bị du lịch..."
                />
              </div>
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-4 ml-2">
              {/* Language */}
              <div className="flex items-center text-sm text-gray-700 mr-2">
                <span className="mr-1">🌐</span> VI
              </div>

              {/* Action icons */}
              <button
                title="Giỏ hàng"
                className="text-gray-700 hover:text-primary-700 p-2 rounded-lg transition-colors"
              >
                🛒
              </button>
              <button
                title="Yêu thích"
                className="text-gray-700 hover:text-primary-700 p-2 rounded-lg transition-colors"
              >
                ❤️
              </button>
              <button
                title="Chat"
                onClick={handleChatClick}
                className="relative text-gray-700 hover:text-primary-700 p-2 rounded-lg transition-colors"
              >
                💬
                {user && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Auth section */}
              {!user ? (
                <>
                  <Link
                    to={ROUTES.LOGIN}
                    className="text-gray-700 hover:text-primary-700 text-sm font-medium"
                  >
                    Đăng Nhập
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Đăng Ký
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  {/* Avatar + name */}
                  <Link
                    to={ROUTES.PROFILE}
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-700"
                    title="Tài khoản"
                  >
                    {user.profile?.avatar ? (
                      <img
                        src={user.profile.avatar}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        👤
                      </div>
                    )}
                    <span className="text-sm">
                      {user.profile?.firstName || user.email?.split("@")[0]}
                    </span>
                  </Link>

                  <Link
                    to={ROUTES.DASHBOARD}
                    className="text-gray-700 hover:text-primary-700 text-sm"
                  >
                    Bảng Điều Khiển
                  </Link>

                  <button
                    onClick={() => setShowLogoutModal(true)}
                    disabled={loading}
                    className="bg-red-600 text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    Đăng Xuất
                  </button>
                </div>
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
