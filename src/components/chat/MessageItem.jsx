import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import useChat from "../../hooks/useChat";

const MessageItem = ({ message, isCurrentUser, showAvatar }) => {
  const [showActions, setShowActions] = useState(false);
  const { deleteMessage } = useChat();

  const formatMessageTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };

  const handleDeleteMessage = async () => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMessage(message._id);
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
    }
  };

  const senderName = message.senderId?.profile
    ? `${message.senderId.profile.firstName || ""} ${
        message.senderId.profile.lastName || ""
      }`.trim()
    : "Unknown User";

  const avatarUrl = message.senderId?.profile?.avatar || "/avatar.png";

  return (
    <div
      className={`flex ${
        isCurrentUser ? "justify-end" : "justify-start"
      } group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={`flex max-w-xs lg:max-w-md ${
          isCurrentUser ? "flex-row-reverse" : "flex-row"
        } items-end space-x-2`}
      >
        {/* Avatar */}
        {!isCurrentUser && (
          <div
            className={`w-8 h-8 rounded-full overflow-hidden border ${
              showAvatar ? "visible" : "invisible"
            }`}
          >
            <img
              src={avatarUrl}
              alt={senderName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "/avatar.png";
              }}
            />
          </div>
        )}

        {/* Message Content */}
        <div
          className={`flex flex-col ${
            isCurrentUser ? "items-end" : "items-start"
          }`}
        >
          {/* Sender Name (only for received messages) */}
          {!isCurrentUser && showAvatar && (
            <div className="text-xs text-gray-500 mb-1 px-2">{senderName}</div>
          )}

          {/* Message Bubble */}
          <div
            className={`relative px-4 py-2 rounded-2xl ${
              isCurrentUser
                ? "bg-blue-500 text-white rounded-br-sm"
                : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
            } shadow-sm`}
          >
            {/* Reply To Message (if exists) */}
            {message.replyTo && (
              <div
                className={`p-2 mb-2 rounded-lg border-l-4 ${
                  isCurrentUser
                    ? "bg-blue-400 border-blue-200"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <div className="text-xs opacity-75 mb-1">
                  Replying to{" "}
                  {message.replyTo.senderId?.profile?.firstName || "Unknown"}
                </div>
                <div className="text-sm opacity-90">
                  {message.replyTo.type === "IMAGE"
                    ? "📷 Image"
                    : message.replyTo.content}
                </div>
              </div>
            )}

            {/* Image Message */}
            {message.type === "IMAGE" && message.media?.url && (
              <div className="mb-2">
                <img
                  src={message.media.url}
                  alt="Shared image"
                  className="max-w-full h-auto rounded-lg max-h-64 object-cover"
                  style={{ maxWidth: "200px" }}
                />
              </div>
            )}

            {/* Text Content */}
            {message.content && (
              <div className="break-words">{message.content}</div>
            )}

            {/* System Message */}
            {message.type === "SYSTEM" && (
              <div className="italic text-sm opacity-75">{message.content}</div>
            )}

            {/* Message Actions */}
            {showActions && isCurrentUser && (
              <div className="absolute -top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-1 flex space-x-1">
                <button
                  onClick={handleDeleteMessage}
                  className="text-red-500 hover:bg-red-50 p-1 rounded text-xs"
                  title="Delete message"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div
            className={`text-xs text-gray-400 mt-1 px-2 ${
              isCurrentUser ? "text-right" : "text-left"
            }`}
          >
            {formatMessageTime(message.createdAt)}
            {message.status && isCurrentUser && (
              <span className="ml-1">
                {message.status === "SENT" && "✓"}
                {message.status === "DELIVERED" && "✓✓"}
                {message.status === "READ" && "✓✓"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
