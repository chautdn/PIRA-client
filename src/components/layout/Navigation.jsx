import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import UserDropdown from "../common/UserDropdown";
import useChatSocket from "../../hooks/useChatSocket";
import useChat from "../../hooks/useChat";
import { ROUTES } from "../../utils/constants";

const Navigation = () => {
  const { user } = useAuth();
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
    <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          {/* 1) Brand */}
          <Link to={ROUTES.HOME} className="text-xl font-bold text-primary-700">
            PIRA
          </Link>

          {/* 2) Primary menu (Trang chủ, Tìm kiếm, Đơn hàng) */}
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

          {/* 3) Search bar */}
          <div className="flex-1 max-w-xl ml-2">
            <div className="flex items-center w-full border border-gray-300 rounded-full px-3 py-2 text-sm bg-white">
              <span className="mr-2">🔎</span>
              <input
                className="w-full outline-none placeholder:text-gray-400"
                placeholder="Tìm kiếm thiết bị du lịch..."
              />
            </div>
          </div>

          {/* 4) Language + icons + auth (right aligned) */}
          <div className="hidden md:flex items-center gap-4 ml-2">
            {/* Language */}
            <div className="flex items-center text-sm text-gray-700 mr-2">
              <span className="mr-1">🌐</span> VI
            </div>

            {/* Icons: cart, heart, chat */}
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
              <UserDropdown />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;