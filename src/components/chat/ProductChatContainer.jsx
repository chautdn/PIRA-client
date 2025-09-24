import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import useChat from "../../hooks/useChat";
import useChatSocket from "../../hooks/useChatSocket";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ProductCard from "./ProductCard";
import Loading from "../common/Loading";
import toast from "react-hot-toast";

const ProductChatContainer = () => {
  const { productId, ownerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get product info from location state
  const [productInfo, setProductInfo] = useState(
    location.state?.product || null
  );
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ownerInfo, setOwnerInfo] = useState(null);

  const messagesEndRef = useRef(null);

  // Initialize chat hook with conversation ID
  const chatHook = useChat(conversation?._id);
  const {
    sendMessage,
    createConversation,
    fetchMessages,
    messagesLoading,
    messages: hookMessages,
    selectedConversation,
    setSelectedConversation,
  } = chatHook;

  const { connected, joinConversations, onNewMessage } = useChatSocket();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize conversation - always create/get conversation immediately
  useEffect(() => {
    const initialize = async () => {
      if (!user || !productId || !ownerId) {
        navigate("/chat");
        return;
      }

      // Check if user is trying to message themselves
      if (user._id === ownerId) {
        toast.error("You cannot message yourself");
        navigate("/chat");
        return;
      }

      // If we don't have product info, we need to redirect back
      if (!productInfo) {
        toast.error("Product information not found");
        navigate("/chat");
        return;
      }

      try {
        setLoading(true);

        // Set owner info from product data
        setOwnerInfo(productInfo.owner);

        // Create or get existing conversation immediately (unified - ignores productId)
        const conversationData = await createConversation(ownerId, productId);

        if (conversationData) {
          setConversation(conversationData);
          setSelectedConversation(conversationData);

          // Join the conversation for real-time updates
          if (connected) {
            joinConversations([conversationData._id]);
          }

          // Fetch messages
          await fetchMessages(conversationData._id);
        }
      } catch (error) {
        toast.error("Failed to load conversation");
        navigate("/chat");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [
    user,
    productId,
    ownerId,
    productInfo,
    navigate,
    createConversation,
    setSelectedConversation,
    connected,
    joinConversations,
    fetchMessages,
  ]);

  // Handle auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [hookMessages]);

  const handleSendMessage = async (content, type = "TEXT") => {
    if (!content.trim() || !conversation) return;

    try {
      // Send the message using the chat hook
      await sendMessage({
        content: content.trim(),
        type,
      });
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  // Get other participant info
  const otherParticipant =
    conversation?.participants?.find((p) => p._id !== user?._id) || ownerInfo;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  if (!productInfo || !ownerInfo || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-4">
            {!productInfo || !ownerInfo
              ? "Product information not found"
              : "Failed to load conversation"}
          </div>
          <button
            onClick={() => navigate("/chat")}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <ChatHeader
          conversation={conversation}
          otherParticipant={otherParticipant}
        />
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 space-y-4">
          {/* Product Card - Always show at top */}
          {productInfo && <ProductCard product={productInfo} isFirst={true} />}

          {/* Messages */}
          {hookMessages.length > 0 ? (
            <MessageList
              messages={hookMessages}
              currentUserId={user?._id}
              messageEndRef={messagesEndRef}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="text-center text-gray-500">
                <div className="text-lg mb-2">No messages yet</div>
                <div className="text-sm">
                  Send a message to{" "}
                  {otherParticipant?.profile?.firstName || "the owner"} about
                  this product
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Message Input */}
      <div className="flex-shrink-0 border-t border-gray-200">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={messagesLoading}
          placeholder={`Message ${
            otherParticipant?.profile?.firstName || "owner"
          } about this product...`}
        />
      </div>
    </div>
  );
};

export default ProductChatContainer;
