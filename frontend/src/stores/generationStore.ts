import { create } from 'zustand';
import { GenerationPlan, GeneratedCode, GenerationProgress } from '../types/generation';
import { useModelStore } from './modelStore';

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
  startGeneration: (wsService?: any) => Promise<void>;
  updateProgress: (progress: GenerationProgress) => void;
  updateStreamingContent: (content: string) => void;
  addGeneratedElement: (element: any) => void;
  updatePreview: (preview: any) => void;
  completeGeneration: (result: any) => void;
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate plan');
      }

      const plan = await response.json();
      
      // Convert createdAt string to Date object if it exists
      const planWithDate = {
        ...plan,
        createdAt: plan.createdAt ? new Date(plan.createdAt) : new Date()
      };
      
      set({ 
        currentPlan: planWithDate,
        completedPhases: ['planning'],
        currentPhase: null,
        isGenerating: false,
        streamingContent: null
      });
    } catch (error) {
      console.error('Plan generation error:', error);
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
    if (!currentPlan) {
      set({ error: 'No plan to approve' });
      return;
    }

    try {
      const response = await fetch(`/api/generate/plan/${currentPlan.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve plan');
      }
      
      // Plan is approved, ready for generation
      console.log('Plan approved successfully');
    } catch (error) {
      console.error('Plan approval error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to approve plan' });
    }
  },

  startGeneration: async (wsService?: any) => {
    const { currentPlan } = get();
    if (!currentPlan) return;

    set({ 
      isGenerating: true, 
      currentPhase: 'generating',
      error: null,
      streamingContent: 'Starting code generation...'
    });

    try {
      // Join WebSocket project FIRST, before starting generation
      if (wsService && wsService.joinProject) {
        wsService.joinProject(currentPlan.id);
        console.log('🔌 Joined WebSocket project:', currentPlan.id);
        
        // Wait a moment for the WebSocket connection to be established
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Get current model config for preferences
      const modelConfig = useModelStore.getState().config;
      
      const response = await fetch('/api/generate/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: currentPlan.id,
          plan: currentPlan,
          preferences: {
            framework: 'react',
            styling: 'tailwind',
            complexity: 'medium',
            model: modelConfig.model,
            temperature: modelConfig.temperature,
            maxTokens: modelConfig.maxTokens
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start generation');
      }

      const result = await response.json();
      console.log('✅ Code generation started:', result);
      
      // WebSocket will handle the streaming updates
    } catch (error) {
      console.error('❌ Generation start error:', error);
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
    console.log('🎨 Adding generated element:', element);
    const { generatedCode } = get();
    
    // Convert element to CodeSection format
    const codeSection = {
      id: element.elementId,
      name: element.position?.sectionName || 'unknown',
      type: 'html' as const,
      content: element.htmlContent,
      documentation: element.documentation
    };
    
    const updatedCode = {
      ...generatedCode,
      sections: [...(generatedCode?.sections || []), codeSection],
      documentation: [...(generatedCode?.documentation || [])]
    };
    set({ generatedCode: updatedCode });
  },

  updatePreview: (preview: any) => {
    console.log('🎨 Updating preview in store:', preview);
    const { generatedCode } = get();
    const updatedCode = {
      ...generatedCode,
      completeHTML: preview.htmlContent,
      cssContent: preview.cssContent,
      jsContent: preview.jsContent
    };
    set({ generatedCode: updatedCode });
  },

  completeGeneration: (result: any) => {
    console.log('✅ Generation completed in store:', result);
    set({ 
      isGenerating: false,
      currentPhase: null,
      completedPhases: ['planning', 'generating'],
      streamingContent: 'Generation completed successfully!'
    });
    
    // If the result contains code sections, update the generated code
    if (result.codeSections && result.codeSections.length > 0) {
      const completeHtmlSection = result.codeSections.find((section: any) => 
        section.sectionName === 'complete-html'
      );
      
      if (completeHtmlSection) {
        console.log('🎯 Setting complete HTML:', completeHtmlSection.codeContent.substring(0, 200) + '...');
        
        // Convert backend CodeSections to frontend format
        const sections = result.codeSections.map((section: any) => ({
          id: section.id,
          name: section.sectionName,
          type: section.sectionType,
          content: section.codeContent,
          documentation: section.documentation
        }));
        
        const updatedCode = {
          completeHTML: completeHtmlSection.codeContent,
          sections: sections,
          documentation: []
        };
        
        set({ generatedCode: updatedCode });
      }
    }
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