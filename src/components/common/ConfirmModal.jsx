import React from 'react';

export default function ConfirmModal({ isOpen, title = 'Xác nhận', message = 'Bạn có chắc muốn tiếp tục?', onConfirm, onCancel, confirmLabel = 'Xóa', cancelLabel = 'Hủy' }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onCancel} />
      <div className="relative bg-white rounded shadow-lg w-full max-w-md mx-4 p-6 z-10">
        <div className="text-lg font-semibold mb-2">{title}</div>
        <div className="text-sm text-gray-700 mb-4">{message}</div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-100">{cancelLabel}</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
