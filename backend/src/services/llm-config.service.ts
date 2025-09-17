import { LLMConfig } from '../types/llm.js';

export class LLMConfigService {
  private static instance: LLMConfigService;
  private config: LLMConfig;

  private constructor() {
    this.config = this.loadDefaultConfig();
  }

  static getInstance(): LLMConfigService {
    if (!LLMConfigService.instance) {
      LLMConfigService.instance = new LLMConfigService();
    }
    return LLMConfigService.instance;
  }

  getConfig(): LLMConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<LLMConfig>): LLMConfig {
    this.config = {
      ...this.config,
      ...updates,
    };
    return this.getConfig();
  }

  updateModel(model: string): LLMConfig {
    return this.updateConfig({ model });
  }

  updateTemperature(temperature: number): LLMConfig {
    if (temperature < 0 || temperature > 2) {
      throw new Error('Temperature must be between 0 and 2');
    }
    return this.updateConfig({ temperature });
  }

  updateMaxTokens(maxTokens: number): LLMConfig {
    if (maxTokens < 1 || maxTokens > 8000) {
      throw new Error('Max tokens must be between 1 and 8000');
    }
    return this.updateConfig({ maxTokens });
  }

  getAvailableModels(): string[] {
    return [
      'deepseek-chat',
      'deepseek-coder',
    ];
  }

  validateModel(model: string): boolean {
    return this.getAvailableModels().includes(model);
  }

  resetToDefaults(): LLMConfig {
    this.config = this.loadDefaultConfig();
    return this.getConfig();
  }

  private loadDefaultConfig(): LLMConfig {
    return {
      gatewayUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
      model: process.env.DEFAULT_MODEL || 'deepseek-chat',
      apiKey: process.env.DEEPSEEK_API_KEY,
      temperature: 0.7,
      maxTokens: 4000,
      stream: true,
    };
  }

  // Validate configuration before use
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.gatewayUrl) {
      errors.push('Gateway URL is required');
    }

    if (!this.config.model) {
      errors.push('Model is required');
    } else if (!this.validateModel(this.config.model)) {
      errors.push(`Invalid model: ${this.config.model}`);
    }

    if (this.config.temperature < 0 || this.config.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }

    if (this.config.maxTokens < 1 || this.config.maxTokens > 8000) {
      errors.push('Max tokens must be between 1 and 8000');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Test connection to DeepSeek API
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const axios = (await import('axios')).default;
      
      const response = await axios.post(
        `${this.config.gatewayUrl}/chat/completions`,
        {
          model: this.config.model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          timeout: 10000,
        }
      );

      return { success: response.status === 200 };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Connection failed',
      };
    }
  }
}