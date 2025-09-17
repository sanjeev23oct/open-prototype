import { DeepSeekService } from './deepseek.service.js';
import {
  LLMConfig,
  GenerationPreferences,
  GenerationPlanData,
} from '../types/llm.js';

export class LLMService {
  private deepSeekService: DeepSeekService;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.deepSeekService = new DeepSeekService({
      apiKey: config.apiKey || '',
      apiUrl: config.gatewayUrl,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });
  }

  async generatePlan(
    prompt: string,
    preferences: GenerationPreferences,
    retries = 3
  ): Promise<GenerationPlanData> {
    return this.deepSeekService.generatePlan(prompt, preferences, retries);
  }

  async *generateCodeStream(
    plan: GenerationPlanData,
    sectionName: string,
    preferences: GenerationPreferences
  ): AsyncGenerator<string, void, unknown> {
    yield* this.deepSeekService.generateCodeStream(plan, sectionName, preferences);
  }

  async generateDocumentation(
    codeContent: string,
    componentName: string,
    preferences: GenerationPreferences,
    retries = 2
  ): Promise<string> {
    return this.deepSeekService.generateDocumentation(codeContent, componentName, preferences, retries);
  }



  // Health check method for monitoring
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: string }> {
    return this.deepSeekService.healthCheck();
  }
}