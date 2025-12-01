import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";
import chatService from "../services/chat";
import toast from "react-hot-toast";

const useChat = (conversationId = null) => {
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState(null);

  // CRITICAL: Manual fetching only
  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => chatService.getConversations(),
    enabled: false, // CRITICAL: Manual only
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });

  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => chatService.getMessages(conversationId),
    enabled: false, // CRITICAL: Manual only
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["chat-users"],
    queryFn: () => chatService.getUsersForSidebar(),
    enabled: false, // CRITICAL: Manual only
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, messageData }) =>
      chatService.sendMessage(conversationId, messageData),
    onSuccess: (data) => {
      // Update messages cache with duplicate prevention
      queryClient.setQueryData(["messages", conversationId], (oldData) => {
        if (!oldData?.data) return oldData;

        // Check if message already exists (prevent duplicates)
        const existsIndex = oldData.data.findIndex(
          (msg) => msg._id === data.data._id
        );
        if (existsIndex >= 0) {
          return oldData; // Already exists
        }

        return {
          ...oldData,
          data: [...oldData.data, data.data],
        };
      });

      // Update conversations cache
      queryClient.invalidateQueries(["conversations"]);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: ({ targetUserId, listingId, bookingId }) =>
      chatService.createOrGetConversation(targetUserId, listingId, bookingId),
    onSuccess: (data) => {
      // Update conversations cache
      queryClient.setQueryData(["conversations"], (oldData) => {
        if (!oldData?.data) return oldData;

        // Check if conversation already exists
        const existsIndex = oldData.data.findIndex(
          (conv) => conv._id === data.data._id
        );

        if (existsIndex >= 0) {
          return oldData; // Already exists
        }

        return {
          ...oldData,
          data: [data.data, ...oldData.data],
        };
      });

      // Don't show success toast - this is automatic
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (conversationId) => chatService.markAsRead(conversationId),
    onSuccess: () => {
      // Update conversations cache to reset unread count
      queryClient.invalidateQueries(["conversations"]);
    },
    onError: (error) => {
      // Handle mark as read error
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId) => chatService.deleteMessage(messageId),
    onSuccess: (data, messageId) => {
      // Update messages cache
      queryClient.setQueryData(["messages", conversationId], (oldData) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.filter((msg) => msg._id !== messageId),
        };
      });

      toast.success("Message deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (conversationId) => chatService.deleteConversation(conversationId),
    onSuccess: (data, deletedConversationId) => {
      // Remove conversation from cache
      queryClient.setQueryData(["conversations"], (oldData) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.filter((conv) => conv._id !== deletedConversationId),
        };
      });

      toast.success("Conversation deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // CRITICAL: Stable callback functions
  const fetchConversations = useCallback(() => {
    refetchConversations();
  }, []); // React Query refetch functions are stable

  const fetchMessages = useCallback(
    (convId) => {
      if (convId) {
        refetchMessages();
      }
    },
    [] // React Query refetch functions are stable
  );

  const fetchUsers = useCallback(() => {
    refetchUsers();
  }, []); // React Query refetch functions are stable

  const sendMessage = useCallback(
    (messageData) => {
      if (!conversationId) {
        toast.error("No conversation selected");
        return Promise.reject(new Error("No conversation selected"));
      }
      return sendMessageMutation.mutateAsync({ conversationId, messageData });
    },
    [conversationId, sendMessageMutation]
  );

  const createConversation = useCallback(
    (targetUserId, listingId = null, bookingId = null) => {
      return createConversationMutation.mutateAsync({
        targetUserId,
        listingId,
        bookingId,
      });
    },
    [createConversationMutation]
  );

  const findExistingConversation = useCallback(
    async (targetUserId, listingId = null) => {
      try {
        const conversation = await chatService.findExistingConversation(
          targetUserId,
          listingId
        );
        return conversation;
      } catch (error) {
        return null;
      }
    },
    []
  );

  const markAsRead = useCallback(
    (convId) => {
      if (convId) {
        // CRITICAL: Throttle to prevent spam
        const timeoutId = setTimeout(() => {
          markAsReadMutation.mutate(convId);
        }, 1000);

        return () => clearTimeout(timeoutId);
      }
    },
    [markAsReadMutation]
  );

  const deleteMessage = useCallback(
    (messageId) => {
      return deleteMessageMutation.mutateAsync(messageId);
    },
    [deleteMessageMutation]
  );

  const deleteConversation = useCallback(
    (conversationId) => {
      return deleteConversationMutation.mutateAsync(conversationId);
    },
    [deleteConversationMutation]
  );

  // Update messages in real-time
  const updateMessagesCache = useCallback(
    (newMessage) => {
      queryClient.setQueryData(
        ["messages", newMessage.conversationId],
        (oldData) => {
          if (!oldData?.data) return oldData;

          // Check if message already exists (prevent duplicates)
          const existsIndex = oldData.data.findIndex(
            (msg) => msg._id === newMessage._id
          );
          if (existsIndex >= 0) {
            return oldData; // Already exists
          }

          return {
            ...oldData,
            data: [...oldData.data, newMessage],
          };
        }
      );
    },
    [queryClient]
  );

  // Update conversations cache
  const updateConversationsCache = useCallback(
    (conversation) => {
      queryClient.setQueryData(["conversations"], (oldData) => {
        if (!oldData?.data) return oldData;

        const existsIndex = oldData.data.findIndex(
          (conv) => conv._id === conversation._id
        );

        if (existsIndex >= 0) {
          // Update existing conversation
          const updatedData = [...oldData.data];
          updatedData[existsIndex] = {
            ...updatedData[existsIndex],
            ...conversation,
          };
          return {
            ...oldData,
            data: updatedData,
          };
        } else {
          // Add new conversation
          return {
            ...oldData,
            data: [conversation, ...oldData.data],
          };
        }
      });
    },
    [queryClient]
  );

  // Remove message from cache (for real-time socket updates)
  const removeMessageFromCache = useCallback(
    (messageId, messageConversationId) => {
      queryClient.setQueryData(["messages", messageConversationId], (oldData) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.filter((msg) => msg._id !== messageId),
        };
      });
    },
    [queryClient]
  );

  return {
    // Data
    conversations: conversationsData?.data || [],
    messages: messagesData?.data || [],
    users: usersData?.data || [],

    // Loading states
    conversationsLoading,
    messagesLoading,
    usersLoading,

    // Error states
    conversationsError,
    messagesError,
    usersError,

    // Actions
    fetchConversations, // Manual fetch
    fetchMessages, // Manual fetch
    fetchUsers, // Manual fetch
    sendMessage,
    createConversation,
    findExistingConversation,
    markAsRead,
    deleteMessage,
    deleteConversation,

    // Real-time updates
    updateMessagesCache,
    updateConversationsCache,
    removeMessageFromCache,

    // State management
    selectedConversation,
    setSelectedConversation,

    // Mutation states
    sendingMessage: sendMessageMutation.isPending,
    creatingConversation: createConversationMutation.isPending,
    deletingMessage: deleteMessageMutation.isPending,
    deletingConversation: deleteConversationMutation.isPending,
  };
};

export default useChat;
