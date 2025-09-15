import {
  GenerationProgress,
  StreamingUpdate,
  ElementGenerated,
  PatchUpdate,
  GenerationError,
  PreviewRefresh,
} from '../types/generation';

export interface WebSocketEventHandlers {
  onProgress?: (progress: GenerationProgress) => void;
  onStream?: (update: StreamingUpdate) => void;
  onElementGenerated?: (element: ElementGenerated) => void;
  onPatchUpdate?: (patch: PatchUpdate) => void;
  onError?: (error: GenerationError) => void;
  onPreviewUpdate?: (preview: PreviewRefresh) => void;
  onComplete?: (result: any) => void;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: WebSocketEventHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private projectId: string | null = null;

  constructor(private url: string) {}

  connect(handlers: WebSocketEventHandlers = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;
      this.handlers = handlers;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('🔌 WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.handleDisconnect();
        };

        this.ws.onerror = (error) => {
          console.error('🔌 WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      console.log('🔌 Received WebSocket message:', message.type, message.payload);
      
      switch (message.type) {
        case 'generation:progress':
          console.log('📊 Progress update:', message.payload);
          this.handlers.onProgress?.(message.payload);
          break;
          
        case 'generation:stream':
          console.log('📡 Stream update:', message.payload);
          this.handlers.onStream?.(message.payload);
          break;
          
        case 'element:generated':
          console.log('🎨 Element generated:', message.payload);
          this.handlers.onElementGenerated?.(message.payload);
          break;
          
        case 'edit:patch':
          console.log('🔧 Patch update:', message.payload);
          this.handlers.onPatchUpdate?.(message.payload);
          break;
          
        case 'generation:error':
          console.log('❌ Generation error:', message.payload);
          this.handlers.onError?.(message.payload);
          break;
          
        case 'preview:update':
          console.log('👁️ Preview update:', message.payload);
          this.handlers.onPreviewUpdate?.(message.payload);
          break;
          
        case 'generation:complete':
          console.log('✅ Generation complete:', message.payload);
          this.handlers.onComplete?.(message.payload);
          break;
          
        case 'connected':
          console.log('🔌 Connection confirmed:', message.payload);
          break;
          
        case 'project:joined':
          console.log('📂 Project joined:', message.payload);
          break;
          
        default:
          console.log('🔌 Unknown message type:', message.type, message.payload);
      }
    } catch (error) {
      console.error('🔌 Failed to parse WebSocket message:', error, event.data);
    }
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      console.log(`🔌 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect(this.handlers).catch(error => {
          console.error('🔌 Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('🔌 Max reconnection attempts reached');
      this.handlers.onError?.({
        projectId: this.projectId || '',
        error: 'Connection lost and could not reconnect',
        recoverable: false,
      });
    }
  }

  send(type: string, payload: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('🔌 WebSocket not connected, cannot send message');
      return false;
    }

    try {
      const message = {
        type,
        payload,
        timestamp: Date.now(),
      };
      
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('🔌 Failed to send WebSocket message:', error);
      return false;
    }
  }

  joinProject(projectId: string): boolean {
    this.projectId = projectId;
    return this.send('join_project', { projectId });
  }

  leaveProject(projectId: string): boolean {
    if (this.projectId === projectId) {
      this.projectId = null;
    }
    return this.send('leave_project', { projectId });
  }

  startGeneration(projectId: string, prompt: string, preferences: any): boolean {
    return this.send('start_generation', {
      projectId,
      prompt,
      preferences,
    });
  }

  pauseGeneration(projectId: string): boolean {
    return this.send('pause_generation', { projectId });
  }

  resumeGeneration(projectId: string): boolean {
    return this.send('resume_generation', { projectId });
  }

  editElement(projectId: string, elementId: string, editRequest: string): boolean {
    return this.send('edit_element', {
      projectId,
      elementId,
      editRequest,
    });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.projectId = null;
    this.reconnectAttempts = 0;
  }

  updateHandlers(handlers: Partial<WebSocketEventHandlers>): void {
    this.handlers = { ...this.handlers, ...handlers };
  }
}
  