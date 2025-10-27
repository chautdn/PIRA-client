import React from 'react';
import { Toaster, toast as hotToast } from 'react-hot-toast';

// Re-export the toast helper and provide a small Toaster container
export const toast = hotToast;

export default function ToastContainer() {
  return <Toaster position="top-right" toastOptions={{ duration: 4000 }} />;
}
