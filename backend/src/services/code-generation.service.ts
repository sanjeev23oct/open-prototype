import { LLMService } from './llm.service';
import { WebSocketService } from '../websocket/websocket-server';
import { GenerationPlan, ComponentPlan } from '../types/generation';
import { CodeSection, GenerationPreferences } from '../types/database';
import { PromptTemplates } from '../utils/prompt-templates';
import { ComponentDocumentation } from '../types/generation';

export class CodeGenerationService {
  constructor(
    private llmService: LLMService,
    private wsService: WebSocketService
  ) {}

  async generateCode(
    plan: GenerationPlan,
    preferences: GenerationPreferences,
    projectId: string,
    userId: string
  ): Promise<CodeSection[]> {
    const codeSections: CodeSection[] = [];
    
    try {
      // Emit generation start
      this.wsService.emitToUser(userId, 'generation:stream', {
        type: 'generating',
        content: 'Starting code generation...',
        isComplete: false
      });

      // Generate base structure first
      const baseStructure = await this.generateBaseStructure(preferences, projectId, userId);
      codeSections.push(...baseStructure);

      // Generate components one by one with streaming
      for (let i = 0; i < plan.components.length; i++) {
        const component = plan.components[i];
        
        this.wsService.emitToUser(userId, 'generation:stream', {
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
        this.wsService.emitToUser(userId, 'generation:element', {
          elementId: component.id,
          elementType: 'component',
          htmlContent: componentCode.codeContent,
          documentation: componentCode.documentation || '',
          position: { section: component.name, order: i }
        });

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Generate final organized HTML
      const finalHTML = await this.organizeCodeSections(codeSections, preferences);
      codeSections.push(finalHTML);

      this.wsService.emitToUser(userId, 'generation:complete', {
        projectId,
        codeSections,
        message: 'Generation completed successfully!'
      });

      return codeSections;
    } catch (error) {
      this.wsService.emitToUser(userId, 'generation:error', {
        error: error.message,
        projectId
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

    // Generate base HTML structure
    const htmlPrompt = `Create a base HTML5 structure with:
- Semantic HTML5 elements
- TailwindCSS CDN integration
- Responsive meta tags
- Clean, organized structure with clear sections
- Comments for each major section`;

    const htmlResponse = await this.llmService.generateCompletion({
      messages: [{ role: 'user', content: htmlPrompt }],
      temperature: 0.3,
      maxTokens: 1000
    });

    sections.push({
      id: crypto.randomUUID(),
      projectId,
      sectionName: 'base-html',
      sectionType: 'html',
      codeContent: this.extractCodeFromResponse(htmlResponse.content),
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
    const prompt = PromptTemplates.createCodeGenerationPrompt(component, preferences);
    
    const response = await this.llmService.generateCompletion({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      maxTokens: 1500
    });

    const codeContent = this.extractCodeFromResponse(response.content);
    const documentation = this.extractDocumentationFromResponse(response.content);

    return {
      id: crypto.randomUUID(),
      projectId,
      sectionName: component.name.toLowerCase().replace(/\s+/g, '-'),
      sectionType: this.inferSectionType(component.type),
      codeContent,
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
      id: crypto.randomUUID(),
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
    return codeMatch ? codeMatch[1].trim() : content.trim();
  }

  private extractDocumentationFromResponse(content: string): string {
    // Extract text that's not in code blocks
    const withoutCode = content.replace(/```[\s\S]*?```/g, '');
    return withoutCode.trim();
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