import { useContext, useMemo } from 'react';
import { ToastContext } from './ToastManager';

export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  const { addToast } = context;

  return useMemo(
    () => ({
      success: (message: string, duration?: number) => addToast('success', message, duration),
      error: (message: string, duration?: number) => addToast('error', message, duration),
      warning: (message: string, duration?: number) => addToast('warning', message, duration),
      info: (message: string, duration?: number) => addToast('info', message, duration),
    }),
    [addToast]
  );
};