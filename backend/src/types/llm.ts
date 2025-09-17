export interface LLMConfig {
  gatewayUrl: string;
  model: string;
  apiKey?: string | undefined;
  temperature: number;
  maxTokens: number;
  stream?: boolean;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }[];
}

export interface GenerationPreferences {
  outputType: 'html-js' | 'react';
  framework: 'vanilla' | 'react' | 'vue';
  styling: 'tailwind' | 'css' | 'styled-components';
  responsive: boolean;
  accessibility: boolean;
}

export interface GenerationPlanData {
  id: string;
  components: ComponentPlan[];
  architecture: ArchitecturePlan;
  timeline: TimelineEstimate;
  dependencies: string[];
}

export interface ComponentPlan {
  id: string;
  name: string;
  type: 'header' | 'hero' | 'features' | 'form' | 'footer' | 'custom';
  description: string;
  features: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
}

export interface ArchitecturePlan {
  structure: string;
  styling: string;
  interactions: string;
  responsive: boolean;
}

export interface TimelineEstimate {
  totalMinutes: number;
  phases: {
    planning: number;
    generation: number;
    documentation: number;
  };
}