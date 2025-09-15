import { LLMService } from './llm.service';
import { GenerationPlan, ComponentPlan, ArchitecturePlan } from '../types/generation';
import { GenerationPreferences } from '../types/database';

export class PlanGenerationService {
  constructor(private llmService: LLMService) {}

  async generatePlan(
    prompt: string, 
    preferences: GenerationPreferences
  ): Promise<GenerationPlan> {
    try {
      // Convert GenerationPreferences to the format expected by LLMService
      const llmPreferences = {
        outputType: preferences.outputType || 'website',
        framework: preferences.framework || 'vanilla',
        styling: preferences.styling || 'tailwind',
        responsive: preferences.responsive !== false,
        accessibility: preferences.accessibility !== false
      };

      const planData = await this.llmService.generatePlan(prompt, llmPreferences);
      
      return {
        id: planData.id,
        components: planData.components.map(comp => ({
          id: comp.id,
          name: comp.name,
          type: this.mapComponentType(comp.type),
          description: comp.description,
          dependencies: [],
          estimatedComplexity: comp.estimatedComplexity
        })),
        architecture: {
          framework: llmPreferences.framework,
          styling: llmPreferences.styling,
          structure: planData.architecture.structure,
          responsive: planData.architecture.responsive
        },
        timeline: {
          estimatedMinutes: planData.timeline.totalMinutes,
          phases: Object.keys(planData.timeline.phases)
        },
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

  private mapComponentType(llmType: string): 'layout' | 'component' | 'feature' | 'utility' {
    const lower = llmType.toLowerCase();
    
    if (lower.includes('header') || lower.includes('footer') || lower === 'layout') {
      return 'layout';
    }
    if (lower.includes('form') || lower.includes('button') || lower.includes('card') || lower === 'component') {
      return 'component';
    }
    if (lower.includes('hero') || lower.includes('features') || lower === 'feature') {
      return 'feature';
    }
    
    return 'utility';
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