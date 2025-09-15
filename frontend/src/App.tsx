import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppShell } from './components/AppShell';
import { WebSocketProvider } from './providers/WebSocketProvider';
import { ToastContainer } from './components/Toast';
import { useToastStore } from './stores/toastStore';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const { toasts, removeToast } = useToastStore();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WebSocketProvider>
          <div className="min-h-screen bg-gray-50">
            <AppShell />
            <ToastContainer toasts={toasts} onClose={removeToast} />
          </div>
        </WebSocketProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;