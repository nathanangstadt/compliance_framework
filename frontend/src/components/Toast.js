import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', title = null, duration = 5000) => {
    const id = Date.now();
    const toast = { id, message, type, title };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message, title = 'Success') => {
    return addToast(message, 'success', title);
  }, [addToast]);

  const error = useCallback((message, title = 'Error') => {
    return addToast(message, 'error', title);
  }, [addToast]);

  const info = useCallback((message, title = 'Info') => {
    return addToast(message, 'info', title);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info, addToast, removeToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onClose }) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'info': return 'ℹ';
      default: return 'ℹ';
    }
  };

  return (
    <div className={`toast ${toast.type}`}>
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-content">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        <div className="toast-message">{toast.message}</div>
      </div>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}

export default Toast;
