// hooks/useToast.ts
import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 5000) => {
    const id = Date.now().toString();
    const toast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showAnalysisStarted = useCallback(() => {
    return showToast('Analysis and estimate generation has begun...', 'info', 0);
  }, [showToast]);

  const showAnalysisCompleted = useCallback(() => {
    return showToast('Process concluded successfully!', 'success', 5000);
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    showAnalysisStarted,
    showAnalysisCompleted
  };
}