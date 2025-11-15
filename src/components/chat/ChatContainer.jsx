import React, { useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import useChat from "../../hooks/useChat";
import useChatSocket from "../../hooks/useChatSocket";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import Loading from "../common/Loading";

const ChatContainer = () => {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const {
    messages,
    messagesLoading,
    fetchMessages,
    markAsRead,
    updateMessagesCache,
    selectedConversation,
    setSelectedConversation,
  } = useChat(conversationId);
  const { t } = useTranslation();

  const {
    connected,
    joinConversations,
    leaveConversations,
    onNewMessage,
    onMessageDeleted,
    onMarkedAsRead,
  } = useChatSocket();

  const messageEndRef = useRef(null);

  // CRITICAL: Load messages only once on mount
  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId]); // CRITICAL: Empty dependency array except for conversationId

  // CRITICAL: Join conversation room when connected
  useEffect(() => {
    if (connected && conversationId) {
      joinConversations([conversationId]);

      return () => {
        leaveConversations([conversationId]);
      };
    }
  }, [connected, conversationId]); // CRITICAL: No function dependencies

  // CRITICAL: Handle real-time messages
  useEffect(() => {
    if (!connected) {
      return;
    }

    const unsubscribeNewMessage = onNewMessage((data) => {
      if (data.conversationId === conversationId) {
        updateMessagesCache(data.message);
      }
    });

    const unsubscribeDeleted = onMessageDeleted((data) => {
      // Handle message deletion
    });

    const unsubscribeRead = onMarkedAsRead((data) => {
      // Handle messages marked as read
    });

    return () => {
      unsubscribeNewMessage?.();
      unsubscribeDeleted?.();
      unsubscribeRead?.();
    };
  }, [
    connected,
    conversationId,
    onNewMessage,
    onMessageDeleted,
    onMarkedAsRead,
    updateMessagesCache,
  ]);

  // CRITICAL: Mark as read with throttling
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        markAsRead(conversationId);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [conversationId, messages.length]); // CRITICAL: No function dependencies

  // CRITICAL: Auto-scroll to bottom
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-500 text-lg">
            {t('chat.selectConversation')}
          </div>
        </div>
      </div>
    );
  }

  if (messagesLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <ChatHeader conversation={selectedConversation} />
        <div className="flex-1 flex items-center justify-center">
          <Loading />
        </div>
        <MessageInput conversationId={conversationId} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <ChatHeader conversation={selectedConversation} />
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <MessageList
          messages={messages}
          currentUserId={user?._id}
          messageEndRef={messageEndRef}
        />
      </div>

      {/* Fixed Input */}
      <div className="flex-shrink-0">
        <MessageInput conversationId={conversationId} />
      </div>
    </div>
  );
};

export default ChatContainer;
