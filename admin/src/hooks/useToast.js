import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ type, title, message, duration = 3000 }) => {
    const id = Date.now();
    const newToast = { id, type, title, message, visible: true };
    
    setToasts(prev => [...prev, newToast]);

    // Tự động ẩn sau duration
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }

    return id;
  }, []);

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, visible: false } : toast
    ));
    
    // Xóa toast khỏi state sau khi animation kết thúc
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 200);
  }, []);

  const showSuccess = useCallback((title, message, duration) => {
    return showToast({ type: 'success', title, message, duration });
  }, [showToast]);

  const showError = useCallback((title, message, duration) => {
    return showToast({ type: 'error', title, message, duration });
  }, [showToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    hideToast,
    clearAll
  };
};
