import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LLMConfig {
  gatewayUrl: string;
  model: string;
  apiKey?: string;
  temperature: number;
  maxTokens: number;
}

interface ModelState {
  config: LLMConfig;
  availableModels: string[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updateConfig: (config: LLMConfig) => Promise<void>;
  testConnection: (config: LLMConfig) => Promise<void>;
  loadAvailableModels: () => Promise<void>;
  setError: (error: string | null) => void;
}

const defaultConfig: LLMConfig = {
  gatewayUrl: 'https://api.litellm.ai/v1',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 4000
};

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      availableModels: [],
      isLoading: false,
      error: null,

      updateConfig: async (config: LLMConfig) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/llm/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
          });

          if (!response.ok) {
            throw new Error('Failed to update configuration');
          }

          set({ config, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update config',
            isLoading: false 
          });
          throw error;
        }
      },

      testConnection: async (config: LLMConfig) => {
        const response = await fetch('/api/llm/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Connection test failed');
        }

        return response.json();
      },

      loadAvailableModels: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/llm/models');
          
          if (!response.ok) {
            throw new Error('Failed to load models');
          }

          const models = await response.json();
          set({ availableModels: models, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load models',
            isLoading: false 
          });
        }
      },

      setError: (error: string | null) => {
        set({ error });
      }
    }),
    {
      name: 'model-config',
      partialize: (state) => ({ config: state.config })
    }
  )
);

// Computed values
export const useCurrentModel = () => {
  const config = useModelStore(state => state.config);
  return config.model;
};