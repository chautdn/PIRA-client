import { useEffect, useRef, useCallback, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./useAuth";
import toast from "react-hot-toast";

// Get socket server URL from API URL
const getServerUrl = () => {
  const apiUrl =
    import.meta.env.VITE_API_URL || "https://api.pira.asia/api";
  // Remove /api suffix if present
  return apiUrl.replace(/\/api$/, "");
};

const SERVER_URL = getServerUrl();

const useChatSocket = () => {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Map()); // conversationId -> Set of userIds

  // CRITICAL: Stable connect function
  const connect = useCallback(() => {
    if (!token || !user || socketRef.current) {
      return;
    }

    const socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      autoConnect: false,
    });

    socketRef.current = socket;
    socket.connect();

    // Handle authentication
    socket.on("connect", () => {
      socket.emit("authenticate", token);
    });

    socket.on("auth:success", (data) => {
      setConnected(true);
    });

    socket.on("auth:error", (error) => {
      console.error("Chat connection failed");
      setConnected(false);
    });

    // Handle online users
    socket.on("chat:online-users", (data) => {
      setOnlineUsers(data.userIds || []);
    });

    // Handle typing indicators
    socket.on("chat:user-typing", (data) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        const conversationTyping = newMap.get(data.conversationId) || new Set();
        conversationTyping.add(data.userId);
        newMap.set(data.conversationId, conversationTyping);
        return newMap;
      });
    });

    socket.on("chat:user-stop-typing", (data) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        const conversationTyping = newMap.get(data.conversationId);
        if (conversationTyping) {
          conversationTyping.delete(data.userId);
          if (conversationTyping.size === 0) {
            newMap.delete(data.conversationId);
          } else {
            newMap.set(data.conversationId, conversationTyping);
          }
        }
        return newMap;
      });
    });

    // Handle connection errors
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setConnected(false);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setConnected(false);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  }, [token, user]); // CRITICAL: Only primitive dependencies

  // CRITICAL: Cleanup on unmount
  useEffect(() => {
    if (user && token) {
      connect();
    }

    return () => {
      if (socketRef.current) {
        console.log("Cleaning up socket connection");
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
    };
  }, [user, token, connect]);

  // CRITICAL: Stable callback functions
  const joinConversations = useCallback(
    (conversationIds) => {
      if (socketRef.current && connected && Array.isArray(conversationIds)) {
        socketRef.current.emit("chat:join", { conversationIds });
      }
    },
    [connected]
  );

  const leaveConversations = useCallback(
    (conversationIds) => {
      if (socketRef.current && connected && Array.isArray(conversationIds)) {
        socketRef.current.emit("chat:leave", { conversationIds });
      }
    },
    [connected]
  );

  const startTyping = useCallback(
    (conversationId) => {
      if (socketRef.current && connected && conversationId) {
        socketRef.current.emit("chat:typing", { conversationId });
      }
    },
    [connected]
  );

  const stopTyping = useCallback(
    (conversationId) => {
      if (socketRef.current && connected && conversationId) {
        socketRef.current.emit("chat:stop-typing", { conversationId });
      }
    },
    [connected]
  );

  // Event subscription functions
  const onNewMessage = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on("chat:new-message", callback);
      return () => {
        if (socketRef.current) {
          socketRef.current.off("chat:new-message", callback);
        }
      };
    }
  }, []);

  const onMessageDeleted = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on("chat:message-deleted", callback);
      return () => {
        if (socketRef.current) {
          socketRef.current.off("chat:message-deleted", callback);
        }
      };
    }
  }, []);

  const onMarkedAsRead = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on("chat:marked-as-read", callback);
      return () => {
        if (socketRef.current) {
          socketRef.current.off("chat:marked-as-read", callback);
        }
      };
    }
  }, []);

  const onNotification = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on("notification", callback);
      return () => {
        if (socketRef.current) {
          socketRef.current.off("notification", callback);
        }
      };
    }
  }, []);

  // Helper functions
  const isUserOnline = useCallback(
    (userId) => {
      return onlineUsers.includes(userId);
    },
    [onlineUsers]
  );

  const getUsersTypingInConversation = useCallback(
    (conversationId) => {
      return Array.from(typingUsers.get(conversationId) || []);
    },
    [typingUsers]
  );

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
      setOnlineUsers([]);
      setTypingUsers(new Map());
    }
  }, []);

  return {
    connected,
    onlineUsers,

    // Connection management
    connect,
    disconnect,

    // Conversation management
    joinConversations,
    leaveConversations,

    // Typing indicators
    startTyping,
    stopTyping,
    getUsersTypingInConversation,

    // Event subscriptions
    onNewMessage,
    onMessageDeleted,
    onMarkedAsRead,
    onNotification,

    // Utility functions
    isUserOnline,

    // Socket reference (for advanced usage)
    socket: socketRef.current,
  };
};

export default useChatSocket;
