import React, { useState, useEffect, useCallback } from 'react';
import styles from './Toast.module.css';

// global context so any component can trigger a toast
const ToastContext = React.createContext();

// custom hook so we don't have to import useContext everywhere
export const useToast = () => React.useContext(ToastContext);

// incrementing id so every toast is unique
let toastId = 0;

// provider component that wraps our app and manages all active toasts
export const ToastProvider = ({ children }) => {
  // array of active toast messages
  const [toasts, setToasts] = useState([]);

  // useCallback so this function doesn't get recreated on every render
  // adds a new toast to the state and sets a timeout to remove it
  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* render all active toasts in a fixed container over the UI */}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
            <span className={styles.icon}>
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <span className={styles.message}>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
