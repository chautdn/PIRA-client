import React from "react";
import { useI18n } from "../../hooks/useI18n";
import MessageItem from "./MessageItem";

const MessageList = ({
  messages,
  currentUserId,
  messageEndRef,
  className = "",
}) => {
  const { t } = useI18n();
  
  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <div className="text-lg mb-2">{t('chat.noMessagesYet')}</div>
          <div className="text-sm">
            {t('chat.startNewChat')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 space-y-4 bg-gray-50 ${className}`}>
      {messages.map((message, index) => {
        const isCurrentUser =
          message.senderId?._id === currentUserId ||
          message.senderId === currentUserId;
        const showAvatar =
          index === 0 ||
          messages[index - 1].senderId?._id !== message.senderId?._id ||
          messages[index - 1].senderId !== message.senderId;

        return (
          <MessageItem
            key={message._id}
            message={message}
            isCurrentUser={isCurrentUser}
            showAvatar={showAvatar}
          />
        );
      })}
      <div ref={messageEndRef} />
    </div>
  );
};

export default MessageList;
