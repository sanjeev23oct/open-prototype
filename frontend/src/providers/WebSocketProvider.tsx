import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useGenerationStore } from '../stores/generationStore';
import { WebSocketService, WebSocketEventHandlers } from '../services/websocket.service';
import {
  StreamingUpdate,
  ElementGenerated,
  GenerationProgress,
  GenerationError,
  PatchUpdate,
  PreviewRefresh,
} from '../types/generation';

interface WebSocketContextType {
  isConnected: boolean;
  wsService: WebSocketService | null;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  startGeneration: (projectId: string, prompt: string, preferences: any) => void;
  pauseGeneration: (projectId: string) => void;
  resumeGeneration: (projectId: string) => void;
  editElement: (projectId: string, elementId: string, editRequest: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  wsService: null,
  joinProject: () => {},
  leaveProject: () => {},
  startGeneration: () => {},
  pauseGeneration: () => {},
  resumeGeneration: () => {},
  editElement: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsServiceRef = useRef<WebSocketService | null>(null);
  
  const {
    updateProgress,
    updateStreamingContent,
    setError,
    addGeneratedElement,
    updatePreview,
    completeGeneration,
  } = useGenerationStore();

  useEffect(() => {
    // Determine WebSocket URL
    const wsUrl = import.meta.env.VITE_WS_URL || 
      (import.meta.env.DEV ? 'ws://localhost:3004' : `ws://${window.location.host}`);

    // Create WebSocket service
    wsServiceRef.current = new WebSocketService(wsUrl);

    // Define event handlers
    const handlers: WebSocketEventHandlers = {
      onProgress: (progress: GenerationProgress) => {
        console.log('📊 Generation progress:', progress);
        updateProgress(progress);
      },

      onStream: (update: StreamingUpdate) => {
        console.log('📡 Streaming update received in provider:', update);
        updateStreamingContent(update.content);
      },

      onElementGenerated: (element: ElementGenerated) => {
        console.log('🎨 Element generated:', element);
        addGeneratedElement(element);
      },

      onPatchUpdate: (patch: PatchUpdate) => {
        console.log('🔧 Patch update:', patch);
        // Handle patch updates for surgical edits
      },

      onError: (error: GenerationError) => {
        console.error('❌ Generation error:', error);
        setError(error.error);
      },

      onPreviewUpdate: (preview: PreviewRefresh) => {
        console.log('👁️ Preview update received in provider:', preview);
        updatePreview(preview);
      },

      onComplete: (result: any) => {
        console.log('✅ Generation complete:', result);
        completeGeneration(result);
      },
    };

    // Connect to WebSocket
    console.log('🔌 Attempting WebSocket connection to:', wsUrl);
    wsServiceRef.current.connect(handlers)
      .then(() => {
        setIsConnected(true);
        console.log('🔌 WebSocket connection established to:', wsUrl);
      })
      .catch((error) => {
        console.error('🔌 WebSocket connection failed to:', wsUrl, error);
        setError('Failed to connect to server');
      });

    // Cleanup on unmount
    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [updateProgress, updateStreamingContent, setError, addGeneratedElement, updatePreview, completeGeneration]);

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      const connected = wsServiceRef.current?.isConnected() || false;
      if (connected !== isConnected) {
        setIsConnected(connected);
      }
    };

    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Context methods
  const joinProject = (projectId: string) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.joinProject(projectId);
    }
  };

  const leaveProject = (projectId: string) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.leaveProject(projectId);
    }
  };

  const startGeneration = (projectId: string, prompt: string, preferences: any) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.startGeneration(projectId, prompt, preferences);
    }
  };

  const pauseGeneration = (projectId: string) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.pauseGeneration(projectId);
    }
  };

  const resumeGeneration = (projectId: string) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.resumeGeneration(projectId);
    }
  };

  const editElement = (projectId: string, elementId: string, editRequest: string) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.editElement(projectId, elementId, editRequest);
    }
  };

  const contextValue: WebSocketContextType = {
    isConnected,
    wsService: wsServiceRef.current,
    joinProject,
    leaveProject,
    startGeneration,
    pauseGeneration,
    resumeGeneration,
    editElement,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};