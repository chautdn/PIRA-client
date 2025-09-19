import React, { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import ChatSidebar from "../components/chat/ChatSidebar";
import useChatSocket from "../hooks/useChatSocket";
import toast from "react-hot-toast";

const Chat = () => {
  const { conversationId } = useParams();
  const { connected, onNotification } = useChatSocket();

  // CRITICAL: Handle real-time notifications
  useEffect(() => {
    if (!connected) return;

    const unsubscribeNotification = onNotification((notification) => {
      // Handle different types of notifications
      switch (notification.type) {
        case "new-message":
          // Only show notification if not in the conversation
          if (notification.conversationId !== conversationId) {
            toast.success(
              `New message from ${notification.senderName || "someone"}`
            );
          }
          break;
        default:
          console.log("Received notification:", notification);
      }
    });

    return () => {
      unsubscribeNotification?.();
    };
  }, [connected, conversationId, onNotification]);

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <ChatSidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Connection Status */}
        {!connected && (
          <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2">
            <div className="text-yellow-800 text-sm flex items-center">
              <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Connecting to chat...
            </div>
          </div>
        )}

        {/* Chat Content */}
        <Outlet />
      </div>
    </div>
  );
};

export default Chat;

