import api from "./api";

const chatService = {
  // Get all conversations for the current user
  getConversations: async (cursor = null, limit = 50) => {
    try {
      const params = new URLSearchParams();
      if (cursor) params.append("cursor", cursor);
      if (limit) params.append("limit", limit.toString());

      const response = await api.get(`/chat/conversations?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to get conversations"
      );
    }
  },

  // Get messages for a specific conversation
  getMessages: async (conversationId, cursor = null, limit = 50) => {
    try {
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }

      const params = new URLSearchParams();
      if (cursor) params.append("cursor", cursor);
      if (limit) params.append("limit", limit.toString());

      const response = await api.get(
        `/chat/${conversationId}/messages?${params}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to get messages"
      );
    }
  },

  // Send a message
  sendMessage: async (conversationId, messageData) => {
    try {
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }

      const response = await api.post(
        `/chat/${conversationId}/messages`,
        messageData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to send message"
      );
    }
  },

  // Create or get existing conversation (always creates/returns conversation)
  createOrGetConversation: async (
    targetUserId,
    listingId = null,
    bookingId = null
  ) => {
    try {
      if (!targetUserId) {
        throw new Error("Target user ID is required");
      }

      const requestData = {
        targetUserId,
        listingId,
        bookingId,
      };

      const response = await api.post("/chat/conversations", requestData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to create conversation"
      );
    }
  },

  // Find existing conversation without creating (returns null if not found)
  findExistingConversation: async (targetUserId, listingId = null) => {
    try {
      if (!targetUserId) {
        throw new Error("Target user ID is required");
      }

      const params = new URLSearchParams();
      params.append("targetUserId", targetUserId);
      if (listingId) params.append("listingId", listingId);

      const response = await api.get(`/chat/conversations/find?${params}`);
      return response.data;
    } catch (error) {
      // Return null if not found instead of throwing error
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(
        error.response?.data?.message || "Failed to find conversation"
      );
    }
  },

  // Mark messages as read
  markAsRead: async (conversationId) => {
    try {
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }

      const response = await api.put(`/chat/${conversationId}/read`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to mark as read"
      );
    }
  },

  // Block/unblock user in conversation
  toggleBlockUser: async (conversationId, targetUserId, block = true) => {
    try {
      if (!conversationId || !targetUserId) {
        throw new Error("Conversation ID and Target user ID are required");
      }

      const response = await api.put(`/chat/${conversationId}/block`, {
        targetUserId,
        block,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          `Failed to ${block ? "block" : "unblock"} user`
      );
    }
  },

  // Get users for sidebar
  getUsersForSidebar: async () => {
    try {
      const response = await api.get("/chat/users");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to get users");
    }
  },

  // Delete a message
  deleteMessage: async (messageId) => {
    try {
      if (!messageId) {
        throw new Error("Message ID is required");
      }

      const response = await api.delete(`/chat/messages/${messageId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to delete message"
      );
    }
  },

  // Delete conversation for current user
  deleteConversation: async (conversationId) => {
    try {
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }

      const response = await api.delete(`/chat/${conversationId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to delete conversation"
      );
    }
  },

  // Upload image for message
  uploadImage: async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await api.post("/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to upload image"
      );
    }
  },

  // Convert image to base64 (for compatibility with reference app style)
  convertImageToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  },
};

export default chatService;
