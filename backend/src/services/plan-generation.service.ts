import { LLMService } from './llm.service';
import { GenerationPlan, ComponentPlan, ArchitecturePlan } from '../types/generation';
import { GenerationPreferences } from '../types/database';
import { PromptTemplates } from '../utils/prompt-templates';
import { GenerationPlan, ComponentPlan, ArchitecturePlan } from '../types/generation';

export class PlanGenerationService {
  constructor(private llmService: LLMService) {}

  async generatePlan(
    prompt: string, 
    preferences: GenerationPreferences
  ): Promise<GenerationPlan> {
    try {
      const planPrompt = PromptTemplates.createPlanningPrompt(prompt, preferences);
      
      const response = await this.llmService.generateCompletion({
        messages: [{ role: 'user', content: planPrompt }],
        temperature: 0.7,
        maxTokens: 2000,
        stream: false
      });

      const planData = this.parsePlanResponse(response.content);
      
      return {
        id: crypto.randomUUID(),
        components: planData.components,
        architecture: planData.architecture,
        timeline: planData.timeline,
        dependencies: planData.dependencies || [],
        approved: false,
        createdAt: new Date()
      };
    } catch (error) {
      throw new Error(`Plan generation failed: ${error.message}`);
    }
  }

  private parsePlanResponse(content: string): {
    components: ComponentPlan[];
    architecture: ArchitecturePlan;
    timeline: { estimatedMinutes: number; phases: string[] };
  } {
    try {
      // Extract structured data from LLM response
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Fallback: parse text-based response
      return this.parseTextPlan(content);
    } catch (error) {
      throw new Error(`Failed to parse plan response: ${error.message}`);
    }
  }

  private parseTextPlan(content: string): {
    components: ComponentPlan[];
    architecture: ArchitecturePlan;
    timeline: { estimatedMinutes: number; phases: string[] };
  } {
    const components: ComponentPlan[] = [];
    const lines = content.split('\n');
    
    let currentSection = '';
    let estimatedMinutes = 5;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.includes('Component') || trimmed.includes('Section')) {
        const component: ComponentPlan = {
          id: crypto.randomUUID(),
          name: trimmed.replace(/[•\-\*]/g, '').trim(),
          type: this.inferComponentType(trimmed),
          description: '',
          dependencies: [],
          estimatedComplexity: 'medium'
        };
        components.push(component);
      }
      
      if (trimmed.includes('minute') || trimmed.includes('time')) {
        const timeMatch = trimmed.match(/(\d+)/);
        if (timeMatch) {
          estimatedMinutes = parseInt(timeMatch[1]);
        }
      }
    }

    return {
      components,
      architecture: {
        framework: 'vanilla',
        styling: 'tailwind',
        structure: 'single-page',
        responsive: true
      },
      timeline: {
        estimatedMinutes,
        phases: ['Planning', 'Generation', 'Documentation']
      }
    };
  }

  private inferComponentType(text: string): 'layout' | 'component' | 'feature' | 'utility' {
    const lower = text.toLowerCase();
    
    if (lower.includes('header') || lower.includes('footer') || lower.includes('layout')) {
      return 'layout';
    }
    if (lower.includes('form') || lower.includes('button') || lower.includes('card')) {
      return 'component';
    }
    if (lower.includes('auth') || lower.includes('search') || lower.includes('filter')) {
      return 'feature';
    }
    
    return 'utility';
  }

  async updatePlan(
    planId: string, 
    modifications: Partial<GenerationPlan>
  ): Promise<GenerationPlan> {
    // Implementation for plan updates
    throw new Error('Plan update not implemented yet');
  }
}