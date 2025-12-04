import React from "react";
import { useAuth } from "../../hooks/useAuth";
import useChatSocket from "../../hooks/useChatSocket";

const ChatHeader = ({ conversation, otherParticipant }) => {
  const { user } = useAuth();
  const { isUserOnline } = useChatSocket();

  // If no conversation or participant, show a simple header
  if (!conversation || !otherParticipant) {
    return (
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="text-gray-500">Chat</div>
      </div>
    );
  }

  const isOnline = isUserOnline(otherParticipant._id);
  const displayName =
    `${otherParticipant.profile?.firstName || ""} ${
      otherParticipant.profile?.lastName || ""
    }`.trim() || "Unknown User";
  const avatarUrl = otherParticipant.profile?.avatar || "https://cdn4.vectorstock.com/i/1000x1000/96/43/avatar-photo-default-user-icon-picture-face-vector-48139643.jpg";

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* User Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-gray-200 overflow-hidden">
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://cdn4.vectorstock.com/i/1000x1000/96/43/avatar-photo-default-user-icon-picture-face-vector-48139643.jpg";
                }}
              />
            </div>
            {/* Online Status Indicator */}
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">
              {displayName}
            </h3>
            <p className="text-sm text-gray-500">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Conversation Context */}
        {(conversation.listingId || conversation.bookingId) && (
          <div className="text-right">
            {conversation.listingId && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Product:</span>{" "}
                {conversation.listingId.title}
              </div>
            )}
            {conversation.bookingId && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Order:</span> #
                {conversation.bookingId._id?.slice(-6)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product/Order Preview (if available) */}
      {conversation.listingId && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {conversation.listingId.images?.[0]?.url && (
              <img
                src={conversation.listingId.images[0].url}
                alt={conversation.listingId.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-800">
                {conversation.listingId.title}
              </h4>
              {conversation.listingId.price && (
                <p className="text-sm text-gray-600">
                  ${conversation.listingId.price}/day
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
