import { LLMService } from './llm.service';
import { WSServer } from '../websocket/websocket-server';
import { GenerationPlan, ComponentPlan } from '../types/generation';
import { GenerationPlanData, ComponentPlan as LLMComponentPlan, GenerationPreferences as LLMGenerationPreferences } from '../types/llm';
import { CodeSection } from '../types/database';
import { WS_EVENTS } from '../types/websocket';
import { randomUUID } from 'crypto';

interface GenerationPreferences {
  framework?: string;
  styling?: string;
  complexity?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class CodeGenerationService {
  constructor(
    private llmService: LLMService,
    private wsService: WSServer
  ) {}

  async generateCode(
    plan: GenerationPlan,
    preferences: GenerationPreferences,
    projectId: string,
    userId: string
  ): Promise<CodeSection[]> {
    const codeSections: CodeSection[] = [];
    
    try {
      console.log(`🚀 Starting code generation for project ${projectId}`);
      
      // Check WebSocket service
      const connectedClients = this.wsService.getConnectedClients();
      const projectClients = this.wsService.getProjectClients(projectId);
      console.log(`🔌 WebSocket status: ${connectedClients} total clients, ${projectClients} in project ${projectId}`);
      
      // Emit generation start
      const sentCount = this.wsService.sendToProject(projectId, WS_EVENTS.GENERATION_STREAM, {
        type: 'generating',
        content: 'Starting code generation...',
        isComplete: false
      });
      
      console.log(`📡 Sent start message to ${sentCount} clients`);
      
      // Also send to all clients as fallback
      this.wsService.sendToAll(WS_EVENTS.GENERATION_STREAM, {
        type: 'generating',
        content: 'Starting code generation...',
        isComplete: false,
        projectId
      });

      // Wait a moment to ensure WebSocket client has joined
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate base structure first
      const baseStructure = await this.generateBaseStructure(preferences, projectId, userId);
      codeSections.push(...baseStructure);

      // Generate components one by one with streaming
      for (let i = 0; i < plan.components.length; i++) {
        const component = plan.components[i];
        if (!component) continue;
        
        console.log(`🔧 Generating component: ${component.name}`);
        
        this.wsService.sendToProject(projectId, WS_EVENTS.GENERATION_STREAM, {
          type: 'generating',
          content: `Generating ${component.name}...`,
          elementId: component.id,
          sectionName: component.name,
          isComplete: false
        });

        const componentCode = await this.generateComponent(
          component, 
          preferences, 
          codeSections,
          projectId,
          userId
        );
        
        codeSections.push(componentCode);

        // Emit element generated
        this.wsService.sendToProject(projectId, WS_EVENTS.ELEMENT_GENERATED, {
          elementId: component.id,
          elementType: 'component',
          htmlContent: componentCode.codeContent,
          documentation: componentCode.documentation || '',
          position: { 
            sectionName: component.name, 
            orderIndex: i 
          }
        });

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Generate final organized HTML
      console.log('🎯 Organizing final code sections');
      const finalHTML = await this.organizeCodeSections(codeSections, preferences);
      codeSections.push(finalHTML);

      // Send preview update
      console.log('📡 Sending preview update with HTML length:', finalHTML.codeContent.length);
      this.wsService.sendToProject(projectId, WS_EVENTS.PREVIEW_UPDATE, {
        projectId,
        htmlContent: finalHTML.codeContent,
        elementId: 'complete-html'
      });
      
      // Also send to all clients as fallback
      this.wsService.sendToAll(WS_EVENTS.PREVIEW_UPDATE, {
        projectId,
        htmlContent: finalHTML.codeContent,
        elementId: 'complete-html'
      });

      console.log('📡 Sending generation complete with', codeSections.length, 'code sections');
      this.wsService.sendToProject(projectId, WS_EVENTS.GENERATION_COMPLETE, {
        projectId,
        codeSections,
        message: 'Generation completed successfully!'
      });
      
      // Also send to all clients as fallback
      this.wsService.sendToAll(WS_EVENTS.GENERATION_COMPLETE, {
        projectId,
        codeSections,
        message: 'Generation completed successfully!'
      });

      console.log(`✅ Code generation completed for project ${projectId}`);
      return codeSections;
    } catch (error) {
      console.error(`❌ Code generation error for project ${projectId}:`, error);
      this.wsService.sendToProject(projectId, WS_EVENTS.GENERATION_ERROR, {
        error: error instanceof Error ? error.message : 'Unknown error',
        projectId,
        recoverable: true,
        suggestions: ['Try regenerating the component', 'Check your LLM configuration']
      });
      throw error;
    }
  }

  private async generateBaseStructure(
    preferences: GenerationPreferences,
    projectId: string,
    userId: string
  ): Promise<CodeSection[]> {
    const sections: CodeSection[] = [];

    // Convert preferences to LLM format
    const llmPreferences: LLMGenerationPreferences = {
      outputType: 'html-js',
      framework: 'vanilla',
      styling: preferences.styling === 'tailwind' ? 'tailwind' : 'css',
      responsive: true,
      accessibility: true
    };

    // Use the generateCodeStream method to get HTML structure
    let htmlContent = '';
    const mockPlan: GenerationPlanData = {
      id: 'base-structure',
      components: [],
      architecture: {
        structure: 'HTML5 semantic structure',
        styling: 'TailwindCSS',
        interactions: 'Vanilla JavaScript',
        responsive: true
      },
      timeline: { totalMinutes: 5, phases: { planning: 1, generation: 3, documentation: 1 } },
      dependencies: ['tailwindcss']
    };

    for await (const chunk of this.llmService.generateCodeStream(mockPlan, 'base-html', llmPreferences)) {
      htmlContent += chunk;
    }

    sections.push({
      id: randomUUID(),
      projectId,
      sectionName: 'base-html',
      sectionType: 'html',
      codeContent: this.extractCodeFromResponse(htmlContent),
      documentation: 'Base HTML5 structure with semantic elements',
      orderIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return sections;
  }

  private async generateComponent(
    component: ComponentPlan,
    preferences: GenerationPreferences,
    existingSections: CodeSection[],
    projectId: string,
    userId: string
  ): Promise<CodeSection> {
    // Convert component to LLM format
    const llmComponent: LLMComponentPlan = {
      id: component.id,
      name: component.name,
      type: this.mapComponentType(component.type),
      description: component.description,
      features: [], // Add default features
      estimatedComplexity: component.estimatedComplexity
    };

    // Convert preferences to LLM format
    const llmPreferences: LLMGenerationPreferences = {
      outputType: 'html-js',
      framework: 'vanilla',
      styling: preferences.styling === 'tailwind' ? 'tailwind' : 'css',
      responsive: true,
      accessibility: true
    };

    // Create a mock plan for the component
    const mockPlan: GenerationPlanData = {
      id: component.id,
      components: [llmComponent],
      architecture: {
        structure: 'HTML5 semantic structure',
        styling: preferences.styling || 'tailwind',
        interactions: 'Vanilla JavaScript',
        responsive: true
      },
      timeline: { totalMinutes: 5, phases: { planning: 1, generation: 3, documentation: 1 } },
      dependencies: ['tailwindcss']
    };

    // Generate code using the stream method
    let codeContent = '';
    for await (const chunk of this.llmService.generateCodeStream(mockPlan, component.name, llmPreferences)) {
      codeContent += chunk;
    }

    // Generate documentation
    const documentation = await this.llmService.generateDocumentation(
      codeContent,
      component.name,
      llmPreferences
    );

    return {
      id: randomUUID(),
      projectId,
      sectionName: component.name.toLowerCase().replace(/\s+/g, '-'),
      sectionType: this.inferSectionType(component.type),
      codeContent: this.extractCodeFromResponse(codeContent),
      documentation,
      orderIndex: existingSections.length,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async organizeCodeSections(
    sections: CodeSection[],
    preferences: GenerationPreferences
  ): Promise<CodeSection> {
    // Combine all sections into organized HTML
    const htmlSections = sections.filter(s => s.sectionType === 'html');
    const cssSections = sections.filter(s => s.sectionType === 'style');
    const jsSections = sections.filter(s => s.sectionType === 'script');

    let organizedHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Prototype</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
`;

    // Add HTML sections with clear comments
    for (const section of htmlSections) {
      if (section.sectionName !== 'base-html') {
        organizedHTML += `
    <!-- ${section.sectionName.toUpperCase()} SECTION -->
    ${section.codeContent}
    <!-- END ${section.sectionName.toUpperCase()} -->
`;
      }
    }

    // Add styles if any
    if (cssSections.length > 0) {
      organizedHTML += '\n    <style>\n';
      for (const section of cssSections) {
        organizedHTML += `        /* ${section.sectionName} styles */\n`;
        organizedHTML += `        ${section.codeContent}\n`;
      }
      organizedHTML += '    </style>\n';
    }

    // Add scripts if any
    if (jsSections.length > 0) {
      organizedHTML += '\n    <script>\n';
      for (const section of jsSections) {
        organizedHTML += `        // ${section.sectionName} functionality\n`;
        organizedHTML += `        ${section.codeContent}\n`;
      }
      organizedHTML += '    </script>\n';
    }

    organizedHTML += '\n</body>\n</html>';

    return {
      id: randomUUID(),
      projectId: sections[0]?.projectId || '',
      sectionName: 'complete-html',
      sectionType: 'html',
      codeContent: organizedHTML,
      documentation: 'Complete organized HTML with all components',
      orderIndex: 999,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private extractCodeFromResponse(content: string): string {
    // Extract code from markdown code blocks
    const codeMatch = content.match(/```(?:html|css|javascript|js)?\n([\s\S]*?)\n```/);
    return codeMatch && codeMatch[1] ? codeMatch[1].trim() : content.trim();
  }

  private extractDocumentationFromResponse(content: string): string {
    // Extract text that's not in code blocks
    const withoutCode = content.replace(/```[\s\S]*?```/g, '');
    return withoutCode.trim();
  }

  private mapComponentType(type: string): 'header' | 'hero' | 'features' | 'form' | 'footer' | 'custom' {
    switch (type) {
      case 'layout':
        return 'header';
      case 'component':
        return 'features';
      case 'feature':
        return 'features';
      case 'utility':
        return 'custom';
      default:
        return 'custom';
    }
  }

  private inferSectionType(componentType: string): 'html' | 'style' | 'script' {
    if (componentType.includes('style') || componentType.includes('css')) {
      return 'style';
    }
    if (componentType.includes('script') || componentType.includes('js')) {
      return 'script';
    }
    return 'html';
  }
}