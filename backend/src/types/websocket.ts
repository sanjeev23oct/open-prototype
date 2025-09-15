export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  id?: string;
}

export interface StreamingUpdate {
  type: 'planning' | 'generating' | 'documenting';
  content: string;
  elementId?: string;
  sectionName?: string;
  isComplete: boolean;
}

export interface ElementGenerated {
  elementId: string;
  elementType: 'component' | 'section' | 'style';
  htmlContent: string;
  cssContent?: string;
  jsContent?: string;
  documentation: string;
  position: ElementPosition;
}

export interface ElementPosition {
  sectionName: string;
  orderIndex: number;
  parentId?: string;
}

export interface PatchUpdate {
  elementId: string;
  patches: DiffPatch[];
  newContent: string;
  affectedSections: string[];
}

export interface DiffPatch {
  operation: 'insert' | 'delete' | 'equal';
  text: string;
  position?: number;
}

export interface GenerationProgress {
  projectId: string;
  phase: 'planning' | 'generating' | 'documenting';
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  explanation: string;
  estimatedTimeRemaining: number;
  percentage: number;
}

export interface GenerationError {
  projectId: string;
  error: string;
  step?: string;
  recoverable: boolean;
  suggestions?: string[];
}

export interface PreviewRefresh {
  projectId: string;
  htmlContent: string;
  cssContent?: string;
  jsContent?: string;
  elementId?: string;
}

// WebSocket event types
export const WS_EVENTS = {
  // Client to Server
  JOIN_PROJECT: 'join_project',
  LEAVE_PROJECT: 'leave_project',
  START_GENERATION: 'start_generation',
  PAUSE_GENERATION: 'pause_generation',
  RESUME_GENERATION: 'resume_generation',
  EDIT_ELEMENT: 'edit_element',
  
  // Server to Client
  GENERATION_STREAM: 'generation:stream',
  GENERATION_PROGRESS: 'generation:progress',
  GENERATION_COMPLETE: 'generation:complete',
  GENERATION_ERROR: 'generation:error',
  ELEMENT_GENERATED: 'element:generated',
  EDIT_PATCH: 'edit:patch',
  EDIT_COMPLETE: 'edit:complete',
  PREVIEW_UPDATE: 'preview:update',
  
  // Connection events
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
} as const;

export type WSEventType = typeof WS_EVENTS[keyof typeof WS_EVENTS];