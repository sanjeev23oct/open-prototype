import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';
import { WebSocketMessage, WS_EVENTS, WSEventType } from '../types/websocket.js';

export interface ExtendedWebSocket extends WebSocket {
  id: string;
  projectId?: string;
  userId?: string;
  isAlive: boolean;
}

export class WSServer {
  private wss: WebSocketServer;
  private clients: Map<string, ExtendedWebSocket> = new Map();
  private projectRooms: Map<string, Set<string>> = new Map();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupServer();
    console.log(`🔌 WebSocket server running on port ${port}`);
  }

  private setupServer(): void {
    this.wss.on('connection', (ws: ExtendedWebSocket, request: IncomingMessage) => {
      const { query } = parse(request.url || '', true);
      const clientId = this.generateClientId();
      
      ws.id = clientId;
      ws.userId = query.userId as string || 'user-12345'; // Default user for MVP
      ws.isAlive = true;
      
      this.clients.set(clientId, ws);
      
      console.log(`📱 Client connected: ${clientId} (Total: ${this.clients.size})`);
      
      // Send connection confirmation
      this.sendToClient(clientId, WS_EVENTS.CONNECTED, {
        clientId,
        userId: ws.userId,
        timestamp: Date.now(),
        serverInfo: {
          version: '1.0.0',
          features: ['streaming', 'surgical-editing', 'real-time-preview'],
        },
      });

      // Set up message handling
      ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error(`Invalid WebSocket message from ${clientId}:`, error);
          this.sendError(clientId, 'Invalid message format');
        }
      });

      // Handle client disconnect
      ws.on('close', (code: number, reason: Buffer) => {
        console.log(`📱 Client ${clientId} disconnected: ${code} ${reason.toString()}`);
        this.handleDisconnect(clientId);
      });

      // Handle connection errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.handleDisconnect(clientId);
      });

      // Set up ping/pong for connection health
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Send initial ping to establish heartbeat
      ws.ping();
    });

    // Set up periodic ping to check connection health
    const heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: ExtendedWebSocket) => {
        if (!ws.isAlive) {
          console.log(`💔 Terminating dead connection: ${ws.id}`);
          this.handleDisconnect(ws.id);
          ws.terminate();
          return;
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds

    // Handle server shutdown
    process.on('SIGTERM', () => {
      console.log('🔌 Shutting down WebSocket server...');
      clearInterval(heartbeatInterval);
      this.close();
    });

    process.on('SIGINT', () => {
      console.log('🔌 Shutting down WebSocket server...');
      clearInterval(heartbeatInterval);
      this.close();
    });
  }

  private handleMessage(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case WS_EVENTS.JOIN_PROJECT:
        this.handleJoinProject(clientId, message.payload.projectId);
        break;
        
      case WS_EVENTS.LEAVE_PROJECT:
        this.handleLeaveProject(clientId, message.payload.projectId);
        break;
        
      default:
        console.log(`📨 Received message: ${message.type}`, message.payload);
        // Forward other messages to appropriate handlers
        this.forwardMessage(clientId, message);
    }
  }

  private handleJoinProject(clientId: string, projectId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Leave previous project if any
    if (client.projectId) {
      this.handleLeaveProject(clientId, client.projectId);
    }

    // Join new project
    client.projectId = projectId;
    
    if (!this.projectRooms.has(projectId)) {
      this.projectRooms.set(projectId, new Set());
    }
    
    this.projectRooms.get(projectId)!.add(clientId);
    
    console.log(`📂 Client ${clientId} joined project ${projectId}`);
    
    // Confirm project join
    this.sendToClient(clientId, 'project:joined', {
      projectId,
      timestamp: Date.now(),
    });
  }

  private handleLeaveProject(clientId: string, projectId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const room = this.projectRooms.get(projectId);
    if (room) {
      room.delete(clientId);
      if (room.size === 0) {
        this.projectRooms.delete(projectId);
      }
    }

    client.projectId = undefined;
    
    console.log(`📂 Client ${clientId} left project ${projectId}`);
  }

  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Leave project room if in one
    if (client.projectId) {
      this.handleLeaveProject(clientId, client.projectId);
    }

    // Remove client
    this.clients.delete(clientId);
    
    console.log(`📱 Client disconnected: ${clientId}`);
  }

  private forwardMessage(clientId: string, message: WebSocketMessage): void {
    // Forward messages to integration service if available
    if (this.integrationService) {
      this.integrationService.handleMessage(clientId, message);
    } else {
      console.log(`🔄 No integration service available for message: ${message.type}`);
    }
  }

  // Integration service for handling business logic
  private integrationService: any = null;

  public setIntegrationService(service: any): void {
    this.integrationService = service;
    console.log('🔗 Integration service connected to WebSocket server');
  }

  // Public methods for sending messages

  public sendToClient(clientId: string, type: WSEventType, payload: any): boolean {
    const client = this.clients.get(clientId);
    if (!client || client.readyState !== WebSocket.OPEN) {
      return false;
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      id: this.generateMessageId(),
    };

    try {
      client.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Failed to send message to client ${clientId}:`, error);
      return false;
    }
  }

  public sendToProject(projectId: string, type: WSEventType, payload: any): number {
    const room = this.projectRooms.get(projectId);
    if (!room) return 0;

    let sentCount = 0;
    room.forEach(clientId => {
      if (this.sendToClient(clientId, type, payload)) {
        sentCount++;
      }
    });

    return sentCount;
  }

  public sendToAll(type: WSEventType, payload: any): number {
    let sentCount = 0;
    this.clients.forEach((client, clientId) => {
      if (this.sendToClient(clientId, type, payload)) {
        sentCount++;
      }
    });

    return sentCount;
  }

  public sendError(clientId: string, error: string): boolean {
    return this.sendToClient(clientId, WS_EVENTS.ERROR, {
      error,
      timestamp: Date.now(),
    });
  }

  // Utility methods

  public getConnectedClients(): number {
    return this.clients.size;
  }

  public getProjectClients(projectId: string): number {
    return this.projectRooms.get(projectId)?.size || 0;
  }

  public isClientConnected(clientId: string): boolean {
    const client = this.clients.get(clientId);
    return client ? client.readyState === WebSocket.OPEN : false;
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public close(): void {
    this.wss.close();
    console.log('🔌 WebSocket server closed');
  }
}