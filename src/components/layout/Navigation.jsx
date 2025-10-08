import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../context/CartContext";
import UserDropdown from "../common/UserDropdown";
import useChatSocket from "../../hooks/useChatSocket";
import useChat from "../../hooks/useChat";
import { ROUTES } from "../../utils/constants";

const Navigation = () => {
  const { user } = useAuth();
  const { cartCount, toggleCart } = useCart();
  const navigate = useNavigate();
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

  // Listen for new messages to update unread count
  useEffect(() => {
    if (!connected || !user) return;

    const unsubscribeMessage = onNewMessage((message) => {
      // Refresh conversations to get updated unread counts
      fetchConversations();
    });

    const unsubscribeNotification = onNotification((notification) => {
      if (notification.type === "new-message") {
        // Update unread count immediately
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      unsubscribeMessage?.();
      unsubscribeNotification?.();
    };
  }, [connected, onNewMessage, onNotification, fetchConversations]);

  const handleChatClick = () => {
    if (user) {
      navigate(ROUTES.CHAT);
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Brand + Menu */}
          <div className="flex items-center gap-8">
            {/* Brand */}
            <Link 
              to={ROUTES.HOME} 
              className="flex items-center gap-2 group"
            >
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
              />
            </div>
          </div>

          {/* Right: Language + Icons + Auth */}
          <div className="flex items-center gap-3">
            {/* Language */}
            <button className="hidden md:flex items-center gap-1 px-3 py-2 text-sm font-semibold text-gray-700 hover:text-primary-700 hover:bg-gray-100 rounded-lg transition-all">
              <span className="text-base">🌐</span>
              <span>VI</span>
            </button>

            {/* Icon buttons */}
            <div className="flex items-center gap-1">
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
              <button
                title="Yêu thích"
                className="p-2.5 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <span className="text-xl">❤️</span>
              </button>
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

            {/* Auth buttons */}
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
              <UserDropdown />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;