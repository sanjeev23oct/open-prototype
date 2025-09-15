import { LLMService } from './llm.service.js';
import { LLMConfigService } from './llm-config.service.js';
import { LLMConfig } from '../types/llm.js';

export class LLMFactory {
  private static instance: LLMFactory;
  private services: Map<string, LLMService> = new Map();
  private configService: LLMConfigService;

  private constructor() {
    this.configService = LLMConfigService.getInstance();
  }

  static getInstance(): LLMFactory {
    if (!LLMFactory.instance) {
      LLMFactory.instance = new LLMFactory();
    }
    return LLMFactory.instance;
  }

  /**
   * Get or create an LLM service instance with the current configuration
   */
  getLLMService(): LLMService {
    const config = this.configService.getConfig();
    const key = this.createServiceKey(config);

    if (!this.services.has(key)) {
      this.services.set(key, new LLMService(config));
    }

    return this.services.get(key)!;
  }

  /**
   * Get an LLM service with a specific configuration
   */
  getLLMServiceWithConfig(config: LLMConfig): LLMService {
    const key = this.createServiceKey(config);

    if (!this.services.has(key)) {
      this.services.set(key, new LLMService(config));
    }

    return this.services.get(key)!;
  }

  /**
   * Update the default configuration and clear cached services
   */
  updateConfig(updates: Partial<LLMConfig>): void {
    this.configService.updateConfig(updates);
    // Clear cache to force recreation with new config
    this.services.clear();
  }

  /**
   * Test connection with current configuration
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return this.configService.testConnection();
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return this.configService.getAvailableModels();
  }

  /**
   * Validate current configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    return this.configService.validateConfig();
  }

  /**
   * Health check for the current LLM service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: string }> {
    try {
      const service = this.getLLMService();
      return await service.healthCheck();
    } catch (error: any) {
      return {
        status: 'unhealthy',
        details: error.message || 'Service creation failed',
      };
    }
  }

  /**
   * Clear all cached service instances
   */
  clearCache(): void {
    this.services.clear();
  }

  /**
   * Get current configuration
   */
  getConfig(): LLMConfig {
    return this.configService.getConfig();
  }

  private createServiceKey(config: LLMConfig): string {
    return `${config.gatewayUrl}:${config.model}:${config.temperature}:${config.maxTokens}`;
  }
}