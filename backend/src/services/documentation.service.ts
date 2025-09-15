import { LLMService } from './llm.service';
import { CodeSection, GenerationPreferences } from '../types/database';
import { ComponentDocumentation } from '../types/generation';
import { PromptTemplates } from '../utils/prompt-templates';

export class DocumentationService {
  constructor(private llmService: LLMService) {}

  async generateDocumentation(
    codeSections: CodeSection[],
    preferences: GenerationPreferences
  ): Promise<ComponentDocumentation[]> {
    const documentation: ComponentDocumentation[] = [];
    
    for (const section of codeSections) {
      if (section.sectionType === 'html' && section.sectionName !== 'complete-html') {
        const doc = await this.generateSectionDocumentation(section, preferences);
        documentation.push(doc);
      }
    }
    
    return documentation;
  }

  private async generateSectionDocumentation(
    section: CodeSection,
    preferences: GenerationPreferences
  ): Promise<ComponentDocumentation> {
    try {
      const prompt = PromptTemplates.createDocumentationPrompt(
        section.sectionName,
        section.codeContent,
        ['responsive design', 'modern styling', 'semantic HTML']
      );
      
      const response = await this.llmService.generateCompletion({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        maxTokens: 800
      });

      const parsedDoc = this.parseDocumentationResponse(response.content);
      
      return {
        id: crypto.randomUUID(),
        sectionId: section.id,
        sectionName: section.sectionName,
        title: parsedDoc.title || this.generateTitle(section.sectionName),
        description: parsedDoc.description || 'Component description',
        features: parsedDoc.features || [],
        customization: parsedDoc.customization || [],
        dependencies: parsedDoc.dependencies || [],
        examples: parsedDoc.examples || [],
        createdAt: new Date()
      };
    } catch (error) {
      // Fallback documentation if AI generation fails
      return this.generateFallbackDocumentation(section);
    }
  }

  private parseDocumentationResponse(content: string): {
    title?: string;
    description?: string;
    features?: string[];
    customization?: Array<{step: string; instruction: string}>;
    dependencies?: string[];
    examples?: Array<{title: string; code: string}>;
  } {
    const doc: any = {};
    
    // Extract title
    const titleMatch = content.match(/(?:^|\n)(?:#\s*)?(?:Title|Component):\s*(.+)/i);
    if (titleMatch) doc.title = titleMatch[1].trim();
    
    // Extract description
    const descMatch = content.match(/(?:Description|Overview):\s*((?:.|\n)*?)(?:\n(?:Features|Customization|Dependencies)|$)/i);
    if (descMatch) doc.description = descMatch[1].trim();
    
    // Extract features
    const featuresMatch = content.match(/Features?:\s*((?:.|\n)*?)(?:\n(?:Customization|Dependencies|Examples)|$)/i);
    if (featuresMatch) {
      doc.features = featuresMatch[1]
        .split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    
    // Extract customization steps
    const customMatch = content.match(/Customization:\s*((?:.|\n)*?)(?:\n(?:Dependencies|Examples)|$)/i);
    if (customMatch) {
      const steps = customMatch[1].split('\n').filter(line => line.trim());
      doc.customization = steps.map((step, index) => ({
        step: `Step ${index + 1}`,
        instruction: step.replace(/^[-•*]\s*/, '').trim()
      }));
    }
    
    return doc;
  }

  private generateTitle(sectionName: string): string {
    return sectionName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private generateFallbackDocumentation(section: CodeSection): ComponentDocumentation {
    const title = this.generateTitle(section.sectionName);
    
    return {
      id: crypto.randomUUID(),
      sectionId: section.id,
      sectionName: section.sectionName,
      title,
      description: `${title} component with responsive design and modern styling.`,
      features: [
        'Responsive design',
        'TailwindCSS styling',
        'Semantic HTML structure',
        'Accessible markup'
      ],
      customization: [
        {
          step: 'Colors',
          instruction: 'Modify color classes in the HTML to change the appearance'
        },
        {
          step: 'Layout',
          instruction: 'Adjust spacing and sizing classes for different layouts'
        },
        {
          step: 'Content',
          instruction: 'Replace placeholder text and images with your content'
        }
      ],
      dependencies: ['TailwindCSS'],
      examples: [],
      createdAt: new Date()
    };
  }

  generateUsageInstructions(
    documentation: ComponentDocumentation[],
    codeSections: CodeSection[]
  ): string {
    let instructions = `# Generated Prototype Usage Guide

## Overview
This prototype was generated with organized, editable sections. Each component is documented below with customization instructions.

## Quick Start
1. Open the complete HTML file in a browser
2. Use the element selector to make quick edits
3. Refer to the documentation below for detailed customization

## Components

`;

    for (const doc of documentation) {
      const section = codeSections.find(s => s.id === doc.sectionId);
      
      instructions += `### ${doc.title}

**Description:** ${doc.description}

**Features:**
${doc.features.map(feature => `- ${feature}`).join('\n')}

**Customization:**
${doc.customization.map((custom, index) => 
  `${index + 1}. **${custom.step}:** ${custom.instruction}`
).join('\n')}

**Location:** Section \`${doc.sectionName}\` in the HTML

---

`;
    }

    instructions += `## Technical Details

**Framework:** Vanilla HTML/CSS/JavaScript
**Styling:** TailwindCSS via CDN
**Structure:** Organized sections with clear comments
**Editing:** Use element selector for quick changes or edit code directly

## Support
- All components are responsive and mobile-friendly
- Code is organized in clear sections for easy editing
- Each section can be modified independently
`;

    return instructions;
  }

  async generateEditingHelp(
    elementType: string,
    currentContent: string
  ): Promise<string> {
    try {
      const prompt = `Provide brief, actionable editing suggestions for this ${elementType} element:

Current content: ${currentContent}

Give 3-4 specific suggestions for common edits (text, colors, sizing, etc.) in a concise format.`;

      const response = await this.llmService.generateCompletion({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        maxTokens: 300
      });

      return response.content;
    } catch (error) {
      return this.getFallbackEditingHelp(elementType);
    }
  }

  private getFallbackEditingHelp(elementType: string): string {
    const helpMap: Record<string, string> = {
      heading: '• Change text content\n• Modify heading level (h1-h6)\n• Update text color classes\n• Adjust font size classes',
      paragraph: '• Edit text content\n• Change text color\n• Modify font weight\n• Adjust line spacing',
      button: '• Update button text\n• Change background color\n• Modify padding/size\n• Update hover effects',
      card: '• Edit card content\n• Change background color\n• Modify border radius\n• Update shadow effects',
      image: '• Replace src URL\n• Update alt text\n• Change dimensions\n• Modify border radius'
    };

    return helpMap[elementType] || '• Edit content\n• Modify styling classes\n• Update attributes\n• Adjust layout';
  }
}