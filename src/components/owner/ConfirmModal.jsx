import React from "react";
import {
  FiAlertTriangle,
  FiEyeOff,
  FiEye,
  FiTrash2,
  FiX,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "warning", // warning, danger, info
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <FiTrash2 className="w-12 h-12 text-red-600" />;
      case "hide":
        return <FiEyeOff className="w-12 h-12 text-orange-600" />;
      case "unhide":
        return <FiEye className="w-12 h-12 text-green-600" />;
      case "error":
        return <FiAlertCircle className="w-12 h-12 text-red-600" />;
      case "success":
        return <FiCheckCircle className="w-12 h-12 text-green-600" />;
      default:
        return <FiAlertTriangle className="w-12 h-12 text-yellow-600" />;
    }
  };

  const getButtonStyle = () => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "error":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "hide":
        return "bg-orange-600 hover:bg-orange-700 text-white";
      case "unhide":
        return "bg-green-600 hover:bg-green-700 text-white";
      case "success":
        return "bg-green-600 hover:bg-green-700 text-white";
      default:
        return "bg-blue-600 hover:bg-blue-700 text-white";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">{getIcon()}</div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-gray-600 text-center mb-6">{message}</p>

          {/* Actions */}
          <div className="flex gap-3">
            {cancelText && (
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`${
                cancelText ? "flex-1" : "w-full"
              } px-4 py-3 rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyle()}`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
