import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import notificationService from "../services/notification";
import useChatSocket from "../hooks/useChatSocket";

export const NotificationContext = createContext();

const notificationReducer = (state, action) => {
  switch (action.type) {
    case "SET_NOTIFICATIONS":
      return {
        ...state,
        notifications: action.payload.notifications,
        pagination: action.payload.pagination,
        loading: false,
        error: null,
      };
    case "SET_UNREAD_COUNT":
      return {
        ...state,
        unreadCount: action.payload,
      };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    case "MARK_AS_READ":
      return {
        ...state,
        notifications: state.notifications.map((notif) =>
          notif._id === action.payload
            ? { ...notif, status: "READ", readAt: new Date() }
            : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case "MARK_ALL_AS_READ":
      return {
        ...state,
        notifications: state.notifications.map((notif) => ({
          ...notif,
          status: "READ",
          readAt: new Date(),
        })),
        unreadCount: 0,
      };
    case "DELETE_NOTIFICATION":
      const deletedNotif = state.notifications.find(
        (n) => n._id === action.payload
      );
      return {
        ...state,
        notifications: state.notifications.filter(
          (notif) => notif._id !== action.payload
        ),
        unreadCount:
          deletedNotif && deletedNotif.status !== "READ"
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
      };
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    default:
      return state;
  }
};

const initialState = {
  notifications: [],
  unreadCount: 0,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  },
  loading: false,
  error: null,
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  const { socket } = useChatSocket();

  // Fetch notifications on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isAuthenticated, user]);

  // Listen for real-time notification updates
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleNewNotification = (data) => {
      console.log("📬 New notification received:", data);
      dispatch({ type: "ADD_NOTIFICATION", payload: data.notification });
      // Also refresh unread count
      fetchUnreadCount();
    };

    const handleNotificationCount = (data) => {
      console.log("🔔 Notification count update:", data);
      dispatch({ type: "SET_UNREAD_COUNT", payload: data.unreadCount });
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("notification:count", handleNotificationCount);

    console.log("✅ Notification socket listeners registered");

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:count", handleNotificationCount);
      console.log("🔌 Notification socket listeners removed");
    };
  }, [socket, isAuthenticated]);

  const fetchNotifications = async (page = 1, filters = {}, limit = 20) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const result = await notificationService.getUserNotifications(
        page,
        limit,
        filters
      );
      console.log("📋 Fetched notifications:", result);
      dispatch({ type: "SET_NOTIFICATIONS", payload: result });
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      console.log('🔢 [NotificationContext] Unread count fetched:', count);
      console.log('🔢 [NotificationContext] Dispatching SET_UNREAD_COUNT');
      dispatch({ type: 'SET_UNREAD_COUNT', payload: count });
    } catch (error) {
      console.error('❌ [NotificationContext] Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      dispatch({ type: "MARK_AS_READ", payload: notificationId });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      dispatch({ type: "MARK_ALL_AS_READ" });
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      dispatch({ type: "DELETE_NOTIFICATION", payload: notificationId });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const value = {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    pagination: state.pagination,
    loading: state.loading,
    error: state.error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};
