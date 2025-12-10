import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ConfirmModal({ isOpen, title = 'common.confirm', message = 'common.confirmAction', onConfirm, onCancel, confirmLabel = 'common.delete', cancelLabel = 'common.cancel' }) {
  const { t } = useTranslation();
  
  if (!isOpen) return null;
  
  // Support both i18n keys and plain strings
  const getLabel = (label) => {
    if (typeof label === 'string' && label.startsWith('common.')) {
      return t(label);
    }
    return label;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onCancel} />
      <div className="relative bg-white rounded shadow-lg w-full max-w-md mx-4 p-6 z-10">
        <div className="text-lg font-semibold mb-2">{getLabel(title)}</div>
        <div className="text-sm text-gray-700 mb-4">{getLabel(message)}</div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-100">{getLabel(cancelLabel)}</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white">{getLabel(confirmLabel)}</button>
        </div>
      </div>
    </div>
  );
}
