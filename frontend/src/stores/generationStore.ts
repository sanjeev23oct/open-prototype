import { create } from 'zustand';
import { GenerationPlan, GeneratedCode, GenerationProgress } from '../types/generation';

interface GenerationState {
  // Current state
  isGenerating: boolean;
  currentPhase: 'planning' | 'generating' | 'documenting' | null;
  completedPhases: string[];
  error: string | null;

  // Generation data
  currentPlan: GenerationPlan | null;
  generatedCode: GeneratedCode | null;
  generationProgress: GenerationProgress | null;
  streamingContent: string | null;

  // Actions
  generatePlan: (prompt: string, preferences: any) => Promise<void>;
  approvePlan: () => Promise<void>;
  startGeneration: () => Promise<void>;
  updateProgress: (progress: GenerationProgress) => void;
  updateStreamingContent: (content: string) => void;
  addGeneratedElement: (element: any) => void;
  updatePreview: (preview: any) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  // Initial state
  isGenerating: false,
  currentPhase: null,
  completedPhases: [],
  error: null,
  currentPlan: null,
  generatedCode: null,
  generationProgress: null,
  streamingContent: null,

  // Actions
  generatePlan: async (prompt: string, preferences: any) => {
    set({ 
      isGenerating: true, 
      currentPhase: 'planning', 
      error: null,
      streamingContent: 'Analyzing your requirements...'
    });

    try {
      const response = await fetch('/api/generate/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, preferences })
      });

      if (!response.ok) {
        throw new Error('Failed to generate plan');
      }

      const plan = await response.json();
      
      set({ 
        currentPlan: plan,
        completedPhases: ['planning'],
        currentPhase: null,
        isGenerating: false,
        streamingContent: null
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to generate plan',
        isGenerating: false,
        currentPhase: null,
        streamingContent: null
      });
    }
  },

  approvePlan: async () => {
    const { currentPlan } = get();
    if (!currentPlan) return;

    try {
      await fetch(`/api/generate/plan/${currentPlan.id}/approve`, {
        method: 'PUT'
      });
      
      // Plan is approved, ready for generation
    } catch (error) {
      set({ error: 'Failed to approve plan' });
    }
  },

  startGeneration: async () => {
    const { currentPlan } = get();
    if (!currentPlan) return;

    set({ 
      isGenerating: true, 
      currentPhase: 'generating',
      error: null,
      streamingContent: 'Starting code generation...'
    });

    try {
      const response = await fetch('/api/generate/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: currentPlan.id })
      });

      if (!response.ok) {
        throw new Error('Failed to start generation');
      }

      // WebSocket will handle the streaming updates
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to start generation',
        isGenerating: false,
        currentPhase: null
      });
    }
  },

  updateProgress: (progress: GenerationProgress) => {
    set({ generationProgress: progress });
  },

  updateStreamingContent: (content: string) => {
    set({ streamingContent: content });
  },

  addGeneratedElement: (element: any) => {
    const { generatedCode } = get();
    const updatedCode = {
      ...generatedCode,
      elements: [...(generatedCode?.elements || []), element]
    };
    set({ generatedCode: updatedCode });
  },

  updatePreview: (preview: any) => {
    const { generatedCode } = get();
    const updatedCode = {
      ...generatedCode,
      completeHTML: preview.htmlContent,
      cssContent: preview.cssContent,
      jsContent: preview.jsContent
    };
    set({ generatedCode: updatedCode });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  reset: () => {
    set({
      isGenerating: false,
      currentPhase: null,
      completedPhases: [],
      error: null,
      currentPlan: null,
      generatedCode: null,
      generationProgress: null,
      streamingContent: null
    });
  }
}));