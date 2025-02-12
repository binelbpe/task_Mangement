import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    console.log('Adding toast:', message, type); 
    const id = Math.random().toString(36).substr(2, 9);
    
    setToasts(prev => {
      console.log('Previous toasts:', prev); 
      return [...prev, { id, message, type }];
    });

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

  console.log('Current toasts:', toasts); 

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div 
        className="fixed top-4 right-4 z-[9999] space-y-4" 
        style={{ pointerEvents: 'auto' }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              transform transition-all duration-300 ease-in-out
              ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}
              text-white px-6 py-3 rounded-lg shadow-lg
              flex items-center justify-between min-w-[300px]
              animate-slide-up
            `}
            role="alert"
          >
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="ml-4 text-white hover:text-gray-200 focus:outline-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
} 