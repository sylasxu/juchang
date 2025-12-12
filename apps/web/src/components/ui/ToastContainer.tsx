'use client';

import { useState, useEffect } from 'react';
import Toast, { ToastManager, type ToastProps } from './Toast';

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  useEffect(() => {
    const unsubscribe = ToastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <Toast key={index} {...toast} />
      ))}
    </div>
  );
}