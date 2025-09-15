import { WSServer } from './websocket-server.js';
import {
  WS_EVENTS,
  GenerationProgress,
  StreamingUpdate,
  ElementGenerated,
  PatchUpdate,
  GenerationError,
  PreviewRefresh,
} from '../types/websocket.js';

export class WebSocketHandlers {
  constructor(private wsServer: WSServer) {}

  // Generation streaming handlers
  
  public streamGenerationUpdate(projectId: string, update: StreamingUpdate): void {
    this.wsServer.sendToProject(projectId, WS_EVENTS.GENERATION_STREAM, update);
  }

  public sendGenerationProgress(projectId: string, progress: GenerationProgress): void {
    this.wsServer.sendToProject(projectId, WS_EVENTS.GENERATION_PROGRESS, progress);
  }

  public sendElementGenerated(projectId: string, element: ElementGenerated): void {
    this.wsServer.sendToProject(projectId, WS_EVENTS.ELEMENT_GENERATED, element);
  }

  public sendGenerationComplete(projectId: string, result: any): void {
    this.wsServer.sendToProject(projectId, WS_EVENTS.GENERATION_COMPLETE, {
      projectId,
      result,
      timestamp: Date.now(),
    });
  }

  public sendGenerationError(projectId: string, error: GenerationError): void {
    this.wsServer.sendToProject(projectId, WS_EVENTS.GENERATION_ERROR, error);
  }

  // Edit and patch handlers

  public sendPatchUpdate(projectId: string, patch: PatchUpdate): void {
    this.wsServer.sendToProject(projectId, WS_EVENTS.EDIT_PATCH, patch);
  }

  public sendEditComplete(projectId: string, elementId: string, newContent: string): void {
    this.wsServer.sendToProject(projectId, WS_EVENTS.EDIT_COMPLETE, {
      projectId,
      elementId,
      newContent,
      timestamp: Date.now(),
    });
  }

  // Preview update handlers

  public sendPreviewUpdate(projectId: string, preview: PreviewRefresh): void {
    this.wsServer.sendToProject(projectId, WS_EVENTS.PREVIEW_UPDATE, preview);
  }

  // Utility methods for common streaming patterns

  public async streamText(
    projectId: string,
    text: string,
    options: {
      type: StreamingUpdate['type'];
      elementId?: string;
      sectionName?: string;
      chunkSize?: number;
      delay?: number;
    }
  ): Promise<void> {
    const { type, elementId, sectionName, chunkSize = 10, delay = 50 } = options;
    
    let currentText = '';
    
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize);
      currentText += chunk;
      
      const update: StreamingUpdate = {
        type,
        content: currentText,
        elementId,
        sectionName,
        isComplete: i + chunkSize >= text.length,
      };
      
      this.streamGenerationUpdate(projectId, update);
      
      if (delay > 0 && i + chunkSize < text.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  public createProgressUpdate(
    projectId: string,
    phase: GenerationProgress['phase'],
    currentStep: string,
    completedSteps: string[],
    totalSteps: number,
    explanation: string,
    estimatedTimeRemaining: number
  ): GenerationProgress {
    const percentage = Math.round((completedSteps.length / totalSteps) * 100);
    
    return {
      projectId,
      phase,
      currentStep,
      completedSteps,
      totalSteps,
      explanation,
      estimatedTimeRemaining,
      percentage,
    };
  }

  public createElementGenerated(
    elementId: string,
    elementType: ElementGenerated['elementType'],
    htmlContent: string,
    position: ElementGenerated['position'],
    cssContent?: string,
    jsContent?: string,
    documentation?: string
  ): ElementGenerated {
    return {
      elementId,
      elementType,
      htmlContent,
      cssContent,
      jsContent,
      documentation: documentation || '',
      position,
    };
  }

  public createGenerationError(
    projectId: string,
    error: string,
    step?: string,
    recoverable: boolean = true,
    suggestions?: string[]
  ): GenerationError {
    return {
      projectId,
      error,
      step,
      recoverable,
      suggestions,
    };
  }

  // Batch operations for efficiency

  public sendBatchUpdates(projectId: string, updates: Array<{
    type: string;
    payload: any;
  }>): void {
    updates.forEach(update => {
      this.wsServer.sendToProject(projectId, update.type as any, update.payload);
    });
  }

  // Connection status helpers

  public notifyProjectStatus(projectId: string, status: string, details?: any): void {
    this.wsServer.sendToProject(projectId, 'project:status', {
      projectId,
      status,
      details,
      timestamp: Date.now(),
    });
  }

  public getProjectConnectionCount(projectId: string): number {
    return this.wsServer.getProjectClients(projectId);
  }

  public getTotalConnectionCount(): number {
    return this.wsServer.getConnectedClients();
  }
}