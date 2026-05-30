import { useState, useCallback, type ReactNode } from 'react';
import { ToastContext } from './ToastContext';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  action?: ToastAction;
}

export interface ToastContextValue {
  toasts: Toast[];
  showToast: (type: ToastType, title: string, message?: string, action?: ToastAction) => void;
  dismissToast: (id: string) => void;
}

export { ToastContext };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string, action?: ToastAction) => {
      const id = crypto.randomUUID();
      setToasts(prev => [...prev, { id, type, title, message, action }]);
      setTimeout(() => dismissToast(id), 6000);
    },
    [dismissToast]
  );

  const value: ToastContextValue = { toasts, showToast, dismissToast };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}