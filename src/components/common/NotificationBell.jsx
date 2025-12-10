import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, X } from "lucide-react";
import { useNotification } from "../../hooks/useNotification";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../hooks/useI18n";

const NotificationBell = () => {
  const { t, language } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotification();

  // Debug log
  useEffect(() => {
    console.log('🔔 [NotificationBell] unreadCount changed:', unreadCount);
  }, [unreadCount]);

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Fetch only 5 notifications for the dropdown preview
      fetchNotifications(1, {}, 5);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (notification.status !== "READ") {
      await markAsRead(notification._id);
    }

    // Navigate based on notification action URL
    if (notification.actions && notification.actions.length > 0) {
      const action = notification.actions[0];
      if (action.url) {
        setIsOpen(false);
        navigate(action.url);
      }
    } else if (notification.relatedDispute) {
      // Fallback: Navigate to dispute detail
      setIsOpen(false);
      navigate(`/disputes/${notification.relatedDispute}`);
    } else if (notification.relatedOrder) {
      // Fallback: Navigate to order detail based on user role
      setIsOpen(false);
      // Check if user is owner or renter by notification type
      if (notification.type === 'DISPUTE' && notification.data?.disputeType) {
        navigate(`/disputes`);
      } else {
        navigate(`/rental-orders/${notification.relatedOrder}`);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "ERROR":
        return "bg-red-100 text-red-800";
      case "WARNING":
        return "bg-yellow-100 text-yellow-800";
      case "INFO":
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getTypeTranslation = (type) => {
    return t(`notifications.types.${type}`) || type;
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "SUCCESS":
        return "✓";
      case "ERROR":
        return "✗";
      case "WARNING":
        return "⚠";
      case "INFO":
      default:
        return "ℹ";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
        aria-label={t('notifications.notificationLabel')}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('notifications.title')}</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t('notifications.markAllAsRead')}
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                  <Bell className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">{t('notifications.noNotifications')}</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      notification.status !== "READ" ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Category Badge */}
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(
                              notification.category
                            )}`}
                          >
                            <span className="mr-1">
                              {getCategoryIcon(notification.category)}
                            </span>
                            {getTypeTranslation(notification.type)}
                          </span>
                          {notification.status !== "READ" && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>

                        {/* Title & Message */}
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>

                        {/* Timestamp */}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            {
                              addSuffix: true,
                              locale: language === 'vi' ? vi : enUS,
                            }
                          )}
                        </p>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDelete(e, notification._id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        aria-label={t('notifications.deleteNotification')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/notifications");
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t('notifications.viewAll')}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
