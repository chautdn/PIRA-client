import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useChat from "../../hooks/useChat";
import useChatSocket from "../../hooks/useChatSocket";
import { useAuth } from "../../hooks/useAuth";
import Loading from "../common/Loading";
import ConfirmModal from "../common/ConfirmModal";
import { MoreVertical, Trash2 } from "lucide-react";

const ChatSidebar = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user } = useAuth();
  const {
    conversations,
    conversationsLoading,
    fetchConversations,
    setSelectedConversation,
    deleteConversation,
    deletingConversation,
  } = useChat();
  const { isUserOnline } = useChatSocket();

  const [showDropdown, setShowDropdown] = useState(null); // Track which conversation's dropdown is open
  const [confirmDelete, setConfirmDelete] = useState(null); // Track conversation to delete

  // CRITICAL: Load conversations only once on mount
  useEffect(() => {
    fetchConversations();
  }, []); // CRITICAL: Empty dependency array

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown(null);
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
    navigate(`/chat/${conversation._id}`);
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    setShowDropdown(null);
    setConfirmDelete(convId);
  };

  const confirmDeleteConversation = async () => {
    if (confirmDelete) {
      try {
        await deleteConversation(confirmDelete);
        
        // If we're currently viewing the deleted conversation, navigate to chat home
        if (confirmDelete === conversationId) {
          navigate("/chat");
        }
      } catch (error) {
        // Error is already handled by the hook with toast
      }
      setConfirmDelete(null);
    }
  };

  const cancelDeleteConversation = () => {
    setConfirmDelete(null);
  };

  const toggleDropdown = (conversationId, e) => {
    e.stopPropagation(); // Prevent navigation when clicking menu
    setShowDropdown(showDropdown === conversationId ? null : conversationId);
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return "";

    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInMs = now - messageDate;
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return "now";
    if (diffInMins < 60) return `${diffInMins}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;

    return messageDate.toLocaleDateString();
  };

  const getLastMessagePreview = (conversation) => {
    if (!conversation.lastMessage) return "No messages yet";

    const lastMessage = conversation.lastMessage;

    if (lastMessage.type === "IMAGE") {
      return "📷 Image";
    }

    if (lastMessage.type === "SYSTEM") {
      return lastMessage.content;
    }

    return lastMessage.content?.length > 50
      ? `${lastMessage.content.substring(0, 50)}...`
      : lastMessage.content || "No preview available";
  };

  if (conversationsLoading) {
    return (
      <div className="h-full bg-white border-r border-gray-200 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header - Fixed */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0 bg-white">
        <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
        <p className="text-sm text-gray-600">
          {conversations.length} conversation
          {conversations.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Conversations List - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {conversations.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-500 mb-2">No conversations yet</div>
            <div className="text-sm text-gray-400">
              Start chatting by messaging other users
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conversation) => {
              // Get the other participant
              const otherParticipant = conversation.participants?.find(
                (participant) => participant._id !== user?._id
              );

              if (!otherParticipant) return null;

              const isSelected = conversationId === conversation._id;
              const isOnline = isUserOnline(otherParticipant._id);
              const hasUnread = conversation.unreadCount > 0;

              const displayName =
                `${otherParticipant.profile?.firstName || ""} ${
                  otherParticipant.profile?.lastName || ""
                }`.trim() || "Unknown User";
              const avatarUrl =
                otherParticipant.profile?.avatar || "https://cdn4.vectorstock.com/i/1000x1000/96/43/avatar-photo-default-user-icon-picture-face-vector-48139643.jpg";

              return (
                <div
                  key={conversation._id}
                  onClick={() => handleConversationClick(conversation)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors relative ${
                    isSelected ? "bg-blue-50 border-r-2 border-blue-500" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar with online status */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://cdn4.vectorstock.com/i/1000x1000/96/43/avatar-photo-default-user-icon-picture-face-vector-48139643.jpg";
                          }}
                        />
                      </div>
                      {isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`text-sm font-medium truncate ${
                            hasUnread ? "text-gray-900" : "text-gray-700"
                          }`}
                        >
                          {displayName}
                        </h3>
                        <div className="flex items-center space-x-1">
                          {hasUnread && (
                            <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {conversation.unreadCount > 9
                                ? "9+"
                                : conversation.unreadCount}
                            </div>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatLastMessageTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                      </div>

                      <p
                        className={`text-sm truncate ${
                          hasUnread
                            ? "text-gray-900 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {getLastMessagePreview(conversation)}
                      </p>

                      {/* Context Info */}
                      {(conversation.listingId || conversation.bookingId) && (
                        <div className="mt-1">
                          {conversation.listingId && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              {conversation.listingId.title}
                            </span>
                          )}
                          {conversation.bookingId && (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                              Order #{conversation.bookingId._id?.slice(-6)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Three-dot menu */}
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={(e) => toggleDropdown(conversation._id, e)}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        disabled={deletingConversation}
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>

                      {/* Dropdown menu */}
                      {showDropdown === conversation._id && (
                        <>
                          {/* Backdrop to close dropdown */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowDropdown(null)}
                          ></div>
                          
                          {/* Dropdown content */}
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
                            <button
                              onClick={(e) => handleDeleteConversation(conversation._id, e)}
                              disabled={deletingConversation}
                              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              {deletingConversation ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This will remove it from your chat list."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteConversation}
        onCancel={cancelDeleteConversation}
      />
    </div>
  );
};

export default ChatSidebar;
