import axios, { AxiosInstance } from 'axios';
import {
  LLMConfig,
  LLMMessage,
  LLMResponse,
  LLMStreamChunk,
  GenerationPreferences,
  GenerationPlanData,
} from '../types/llm.js';

export class LLMService {
  private client: AxiosInstance;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.gatewayUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
      timeout: 60000, // 60 seconds timeout
    });
  }

  async generatePlan(
    prompt: string,
    preferences: GenerationPreferences,
    retries = 3
  ): Promise<GenerationPlanData> {
    const systemPrompt = this.createPlanningSystemPrompt(preferences);
    const userPrompt = this.createPlanningUserPrompt(prompt, preferences);

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.client.post<LLMResponse>('/chat/completions', {
          model: this.config.model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: false,
        });

        const content = response.data.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No content received from LLM');
        }

        return this.parsePlanResponse(content);
      } catch (error: any) {
        console.error(`Error generating plan (attempt ${attempt}/${retries}):`, error);
        
        if (attempt === retries) {
          // On final attempt, return fallback plan
          console.warn('All retries failed, returning fallback plan');
          return this.createFallbackPlan();
        }
        
        // Wait before retry (exponential backoff)
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    // This should never be reached, but TypeScript requires it
    return this.createFallbackPlan();
  }

  async *generateCodeStream(
    plan: GenerationPlanData,
    sectionName: string,
    preferences: GenerationPreferences
  ): AsyncGenerator<string, void, unknown> {
    const systemPrompt = this.createCodeGenerationSystemPrompt(preferences);
    const userPrompt = this.createCodeGenerationUserPrompt(plan, sectionName, preferences);

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        const response = await this.client.post('/chat/completions', {
          model: this.config.model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: true,
        }, {
          responseType: 'stream',
          timeout: 30000, // 30 second timeout
        });

        let buffer = '';
        let hasYieldedContent = false;
        
        for await (const chunk of response.data) {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') return;

              try {
                const parsed: LLMStreamChunk = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content;
                if (content) {
                  hasYieldedContent = true;
                  yield content;
                }
              } catch (e) {
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        }

        // If we successfully processed the stream, return
        if (hasYieldedContent) {
          return;
        }

        throw new Error('No content received from stream');
      } catch (error: any) {
        console.error(`Error generating code stream (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
        retryCount++;
        
        if (retryCount > maxRetries) {
          // Yield fallback content on final failure
          const fallbackContent = this.generateFallbackCode(sectionName, preferences);
          for (const char of fallbackContent) {
            yield char;
            await this.delay(10); // Simulate streaming
          }
          return;
        }
        
        // Wait before retry
        await this.delay(1000 * retryCount);
      }
    }
  }

  async generateDocumentation(
    codeContent: string,
    componentName: string,
    preferences: GenerationPreferences,
    retries = 2
  ): Promise<string> {
    const systemPrompt = this.createDocumentationSystemPrompt();
    const userPrompt = this.createDocumentationUserPrompt(codeContent, componentName, preferences);

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.client.post<LLMResponse>('/chat/completions', {
          model: this.config.model,
          messages,
          temperature: 0.3, // Lower temperature for documentation
          max_tokens: 1000,
          stream: false,
        });

        return response.data.choices[0]?.message?.content || '';
      } catch (error: any) {
        console.error(`Error generating documentation (attempt ${attempt}/${retries}):`, error);
        
        if (attempt === retries) {
          // Return basic fallback documentation
          return `# ${componentName}\n\nThis component provides ${componentName.toLowerCase()} functionality for the prototype.\n\n## Features\n- Responsive design\n- Modern styling\n- Accessible markup\n\n## Customization\nModify the code to adjust styling, content, and behavior as needed.`;
        }
        
        await this.delay(1000 * attempt);
      }
    }

    return '';
  }

  private createPlanningSystemPrompt(preferences: GenerationPreferences): string {
    return `You are an expert web developer and UI/UX designer. Your task is to create a detailed plan for generating a ${preferences.outputType} prototype.

IMPORTANT: Respond with a valid JSON object that matches this exact structure:
{
  "id": "unique-plan-id",
  "components": [
    {
      "id": "component-id",
      "name": "Component Name",
      "type": "header|hero|features|form|footer|custom",
      "description": "Brief description",
      "features": ["feature1", "feature2"],
      "estimatedComplexity": "low|medium|high"
    }
  ],
  "architecture": {
    "structure": "Description of HTML structure",
    "styling": "Description of CSS approach",
    "interactions": "Description of JavaScript functionality",
    "responsive": true
  },
  "timeline": {
    "totalMinutes": 5,
    "phases": {
      "planning": 1,
      "generation": 3,
      "documentation": 1
    }
  },
  "dependencies": ["tailwindcss", "vanilla-js"]
}

Focus on creating modern, accessible, and responsive designs using ${preferences.styling} for styling.`;
  }

  private createPlanningUserPrompt(prompt: string, preferences: GenerationPreferences): string {
    return `Create a detailed plan for this prototype request:

"${prompt}"

Preferences:
- Output Type: ${preferences.outputType}
- Framework: ${preferences.framework}
- Styling: ${preferences.styling}
- Responsive: ${preferences.responsive}
- Accessibility: ${preferences.accessibility}

Generate a comprehensive plan that breaks down the prototype into logical components and provides a clear architecture overview.`;
  }

  private createCodeGenerationSystemPrompt(preferences: GenerationPreferences): string {
    return `You are an expert frontend developer. Generate clean, modern, production-ready code for web prototypes.

Requirements:
- Use ${preferences.styling} for styling
- Create ${preferences.responsive ? 'responsive' : 'fixed-width'} designs
- ${preferences.accessibility ? 'Include accessibility features (ARIA labels, semantic HTML)' : ''}
- Write clean, well-organized code with clear section comments
- Use modern best practices and semantic HTML
- Ensure code is ready to run without additional setup

Output format: Provide only the code without explanations or markdown formatting.`;
  }

  private createCodeGenerationUserPrompt(
    plan: GenerationPlanData,
    sectionName: string,
    preferences: GenerationPreferences
  ): string {
    const component = plan.components.find(c => c.name === sectionName);
    
    return `Generate the ${sectionName} code based on this plan:

Component Details:
${component ? `
- Name: ${component.name}
- Type: ${component.type}
- Description: ${component.description}
- Features: ${component.features.join(', ')}
` : `Section: ${sectionName}`}

Architecture:
- Structure: ${plan.architecture.structure}
- Styling: ${plan.architecture.styling}
- Interactions: ${plan.architecture.interactions}

Generate complete, production-ready code for this section that integrates well with the overall architecture.`;
  }

  private createDocumentationSystemPrompt(): string {
    return `You are a technical writer specializing in frontend documentation. Create clear, concise documentation for code components.

Focus on:
- Purpose and functionality
- Customization instructions
- Key features and interactions
- Integration notes

Keep documentation practical and developer-friendly.`;
  }

  private createDocumentationUserPrompt(
    codeContent: string,
    componentName: string,
    preferences: GenerationPreferences
  ): string {
    return `Create documentation for this ${componentName} component:

\`\`\`
${codeContent}
\`\`\`

Preferences: ${preferences.outputType}, ${preferences.styling} styling

Provide clear documentation covering the component's purpose, features, and customization options.`;
  }

  private parsePlanResponse(content: string): GenerationPlanData {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.id || !parsed.components || !parsed.architecture || !parsed.timeline) {
        throw new Error('Invalid plan structure');
      }

      return parsed as GenerationPlanData;
    } catch (error) {
      console.error('Error parsing plan response:', error);
      // Return a fallback plan
      return this.createFallbackPlan();
    }
  }

  private createFallbackPlan(): GenerationPlanData {
    return {
      id: `plan-${Date.now()}`,
      components: [
        {
          id: 'header',
          name: 'Header Navigation',
          type: 'header',
          description: 'Responsive navigation header',
          features: ['Logo', 'Navigation menu', 'Mobile hamburger'],
          estimatedComplexity: 'medium',
        },
        {
          id: 'main-content',
          name: 'Main Content',
          type: 'custom',
          description: 'Primary content area',
          features: ['Content sections', 'Responsive layout'],
          estimatedComplexity: 'medium',
        },
      ],
      architecture: {
        structure: 'Semantic HTML5 with proper sectioning',
        styling: 'TailwindCSS utility classes',
        interactions: 'Vanilla JavaScript for basic interactions',
        responsive: true,
      },
      timeline: {
        totalMinutes: 5,
        phases: {
          planning: 1,
          generation: 3,
          documentation: 1,
        },
      },
      dependencies: ['tailwindcss'],
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateFallbackCode(sectionName: string, preferences: GenerationPreferences): string {
    const className = sectionName.toLowerCase().replace(/\s+/g, '-');
    
    if (preferences.styling === 'tailwind') {
      return `<section class="py-8 px-4 bg-white">
  <div class="max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold text-gray-900 mb-4">${sectionName}</h2>
    <p class="text-gray-600">This is the ${sectionName.toLowerCase()} section of your prototype.</p>
  </div>
</section>`;
    } else {
      return `<section class="${className}">
  <div class="container">
    <h2>${sectionName}</h2>
    <p>This is the ${sectionName.toLowerCase()} section of your prototype.</p>
  </div>
</section>

<style>
.${className} {
  padding: 2rem 1rem;
  background: white;
}

.${className} .container {
  max-width: 1200px;
  margin: 0 auto;
}

.${className} h2 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 1rem;
}

.${className} p {
  color: #666;
}
</style>`;
    }
  }

  // Health check method for monitoring
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: string }> {
    try {
      const testResult = await this.client.post('/chat/completions', {
        model: this.config.model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      }, { timeout: 5000 });

      return {
        status: 'healthy',
        details: `Connected to ${this.config.model} via ${this.config.gatewayUrl}`,
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        details: error.message || 'Connection failed',
      };
    }
  }
}