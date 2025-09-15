import { create } from 'zustand';
import { ToastType } from '../components/Toast';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { ...toast, id };
    
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  }
}));

// Convenience hooks for different toast types
export const useToast = () => {
  const { addToast } = useToastStore();

  return {
    success: (title: string, message?: string) => 
      addToast({ type: 'success', title, message }),
    
    error: (title: string, message?: string) => 
      addToast({ type: 'error', title, message }),
    
    warning: (title: string, message?: string) => 
      addToast({ type: 'warning', title, message }),
    
    info: (title: string, message?: string) => 
      addToast({ type: 'info', title, message }),
  };
};