import { WebSocketMessage, WS_EVENTS } from '../types/websocket.js';
import { WebSocketIntegrationService } from '../services/websocket-integration.service.js';

export class WebSocketRouter {
  constructor(private integrationService: WebSocketIntegrationService) {}

  async handleMessage(clientId: string, message: WebSocketMessage): Promise<void> {
    try {
      console.log(`📨 Routing message: ${message.type} from ${clientId}`);

      switch (message.type) {
        case WS_EVENTS.START_GENERATION:
          await this.handleStartGeneration(message.payload);
          break;

        case WS_EVENTS.PAUSE_GENERATION:
          await this.handlePauseGeneration(message.payload);
          break;

        case WS_EVENTS.RESUME_GENERATION:
          await this.handleResumeGeneration(message.payload);
          break;

        case WS_EVENTS.EDIT_ELEMENT:
          await this.handleEditElement(message.payload);
          break;

        default:
          console.log(`❓ Unknown message type: ${message.type}`);
      }
    } catch (error: any) {
      console.error(`❌ Error handling message ${message.type}:`, error);
      // Send error back to client if possible
      // This would need access to the WebSocket server to send errors
    }
  }

  private async handleStartGeneration(payload: any): Promise<void> {
    const { projectId, prompt, preferences } = payload;
    
    if (!projectId || !prompt || !preferences) {
      throw new Error('Missing required fields for generation');
    }

    await this.integrationService.handleStartGeneration(projectId, prompt, preferences);
  }

  private async handlePauseGeneration(payload: any): Promise<void> {
    const { projectId } = payload;
    
    if (!projectId) {
      throw new Error('Missing projectId for pause');
    }

    await this.integrationService.handlePauseGeneration(projectId);
  }

  private async handleResumeGeneration(payload: any): Promise<void> {
    const { projectId } = payload;
    
    if (!projectId) {
      throw new Error('Missing projectId for resume');
    }

    await this.integrationService.handleResumeGeneration(projectId);
  }

  private async handleEditElement(payload: any): Promise<void> {
    const { projectId, elementId, editRequest } = payload;
    
    if (!projectId || !elementId || !editRequest) {
      throw new Error('Missing required fields for edit');
    }

    await this.integrationService.handleEditElement(projectId, elementId, editRequest);
  }

  // Validation helpers
  private validateGenerationPayload(payload: any): boolean {
    return !!(payload.projectId && payload.prompt && payload.preferences);
  }

  private validateEditPayload(payload: any): boolean {
    return !!(payload.projectId && payload.elementId && payload.editRequest);
  }

  private validateProjectPayload(payload: any): boolean {
    return !!payload.projectId;
  }
}