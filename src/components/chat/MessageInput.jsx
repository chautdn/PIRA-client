import React, { useState, useRef, useCallback } from "react";
import useChat from "../../hooks/useChat";
import useChatSocket from "../../hooks/useChatSocket";
import chatService from "../../services/chat";
import toast from "react-hot-toast";

const MessageInput = ({ conversationId }) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { sendMessage, sendingMessage } = useChat(conversationId);
  const { startTyping, stopTyping } = useChatSocket();

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (!isTyping && conversationId) {
      setIsTyping(true);
      startTyping(conversationId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(conversationId);
    }, 1000);
  }, [isTyping, conversationId, startTyping, stopTyping]);

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping) {
      setIsTyping(false);
      stopTyping(conversationId);
    }
  }, [isTyping, conversationId, stopTyping]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    handleTypingStart();
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    try {
      // Convert to base64 for preview
      const base64 = await chatService.convertImageToBase64(file);
      setImagePreview(base64);
    } catch (error) {
      toast.error("Failed to process image");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!conversationId) {
      toast.error("No conversation selected");
      return;
    }

    // Check if we have content to send
    const hasTextContent = message.trim().length > 0;
    const hasImageContent = imagePreview !== null;

    if (!hasTextContent && !hasImageContent) {
      return;
    }

    handleTypingStop();

    try {
      let messageData = {};

      // Handle image message
      if (hasImageContent) {
        setUploadingImage(true);

        // Send as base64 image (similar to reference app)
        messageData = {
          type: "IMAGE",
          content: hasTextContent ? message.trim() : undefined,
          media: {
            url: imagePreview, // Base64 data URL
            mime: "image/jpeg", // Default mime type
          },
        };
      } else {
        // Text message
        messageData = {
          type: "TEXT",
          content: message.trim(),
        };
      }

      await sendMessage(messageData);

      // Clear inputs
      setMessage("");
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImagePreview = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isDisabled = sendingMessage || uploadingImage;

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-4 relative inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-w-xs max-h-32 rounded-lg object-cover border border-gray-200"
          />
          <button
            onClick={removeImagePreview}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
            type="button"
          >
            ×
          </button>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center space-x-3"
      >
        {/* Image Upload Button */}
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            disabled={isDisabled}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isDisabled}
            title="Attach image"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>
        </div>

        {/* Message Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            onBlur={handleTypingStop}
            placeholder={
              imagePreview ? "Add a caption..." : "Type a message..."
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isDisabled}
            maxLength={2000}
          />
          {message.length > 1800 && (
            <div className="absolute -top-6 right-0 text-xs text-gray-500">
              {message.length}/2000
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={isDisabled || (!message.trim() && !imagePreview)}
          className={`px-6 py-2 rounded-full font-medium transition-colors ${
            isDisabled || (!message.trim() && !imagePreview)
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {uploadingImage ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Sending...</span>
            </div>
          ) : sendingMessage ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Sending...</span>
            </div>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;

