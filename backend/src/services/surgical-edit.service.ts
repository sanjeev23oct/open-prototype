import { DeepSeekService } from './deepseek.service.js';
import { DiffPatchService } from './diff-patch.service.js';

interface SurgicalEditConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export class SurgicalEditService {
  private deepSeekService: DeepSeekService;
  private diffPatchService: DiffPatchService;

  constructor(config: SurgicalEditConfig) {
    this.deepSeekService = new DeepSeekService(config);
    this.diffPatchService = new DiffPatchService();
  }

  async applySurgicalEdit(
    currentCode: string,
    editInstruction: string,
    projectId?: string
  ): Promise<{
    updatedCode: string;
    patches: any[];
    changesSummary: string;
  }> {
    try {
      // Create a focused prompt for surgical editing
      const surgicalPrompt = this.createSurgicalEditPrompt(currentCode, editInstruction);
      
      // Use DeepSeek to generate the minimal edit
      const updatedCode = await this.generateSurgicalEdit(surgicalPrompt);
      
      // Create diff patches to track changes
      const patches = this.diffPatchService.createPatch(currentCode, updatedCode);
      
      // Validate that the edit is minimal and focused
      const isValidEdit = this.validateSurgicalEdit(currentCode, updatedCode, editInstruction);
      
      if (!isValidEdit) {
        throw new Error('Generated edit is too extensive for surgical editing');
      }

      return {
        updatedCode,
        patches,
        changesSummary: `Applied surgical edit: ${editInstruction}`
      };
    } catch (error) {
      console.error('Surgical edit failed:', error);
      throw new Error(`Surgical edit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createSurgicalEditPrompt(currentCode: string, editInstruction: string): string {
    return `You are a precise code editor that makes ONLY the specific change requested.

IMPORTANT RULES:
1. Make ONLY the exact change described in the instruction
2. Do NOT modify any other part of the code
3. Do NOT add new features or sections
4. Do NOT change the overall structure or layout
5. Return ONLY the modified HTML code without explanations

Current HTML:
${currentCode}

Edit Instruction: ${editInstruction}

Return the HTML with ONLY the requested change applied:`;
  }

  private async generateSurgicalEdit(prompt: string): Promise<string> {
    try {
      console.log('🤖 Generating surgical edit with DeepSeek...');
      
      // Use the simple text replacement approach first
      const editResult = await this.performSimpleTextReplacement(prompt);
      
      return editResult;
    } catch (error) {
      console.error('Failed to generate surgical edit:', error);
      throw error;
    }
  }

  private async performSimpleTextReplacement(prompt: string): Promise<string> {
    // Extract the original code and edit instruction from the prompt
    const lines = prompt.split('\n');
    const codeStartIndex = lines.findIndex(line => line.includes('Current HTML:'));
    const instructionIndex = lines.findIndex(line => line.includes('Edit Instruction:'));
    
    if (codeStartIndex === -1 || instructionIndex === -1) {
      throw new Error('Invalid prompt format for surgical edit');
    }
    
    const originalCode = lines.slice(codeStartIndex + 1, instructionIndex).join('\n').trim();
    const instruction = lines.slice(instructionIndex + 1).join('\n').trim();
    
    console.log('🔍 Performing surgical edit for:', instruction);
    
    // Use DeepSeek to perform the actual edit
    try {
      const response = await this.deepSeekService.generateCompletion(prompt);
      const editedCode = this.cleanGeneratedCode(response);
      
      // Validate that we got actual HTML back
      if (!editedCode.includes('<') || editedCode.length < originalCode.length * 0.5) {
        console.warn('Generated code seems invalid, falling back to simple text replacement');
        return this.performBasicTextReplacement(originalCode, instruction);
      }
      
      return editedCode;
    } catch (error) {
      console.error('AI-powered edit failed, falling back to basic replacement:', error);
      return this.performBasicTextReplacement(originalCode, instruction);
    }
  }

  private performBasicTextReplacement(originalCode: string, instruction: string): string {
    // Perform basic text replacements for common edit patterns
    const lowerInstruction = instruction.toLowerCase();
    
    // Handle text content changes
    if (lowerInstruction.includes('change text') || lowerInstruction.includes('update text')) {
      const textMatch = instruction.match(/(?:to|with)\s*['"](.*?)['"]|(?:to|with)\s*(.+?)(?:\.|$)/i);
      if (textMatch) {
        const newText = textMatch[1] || textMatch[2];
        // Find and replace text content in HTML elements
        return originalCode.replace(/>([^<]+)</g, (match, content) => {
          if (content.trim() && !content.includes('<')) {
            return `>${newText}<`;
          }
          return match;
        });
      }
    }
    
    // Handle color changes
    if (lowerInstruction.includes('color')) {
      const colorMatch = instruction.match(/(?:to|with)\s*([a-zA-Z]+|#[0-9a-fA-F]{3,6})/i);
      if (colorMatch) {
        const newColor = colorMatch[1];
        return originalCode.replace(/color:\s*[^;]+/gi, `color: ${newColor}`);
      }
    }
    
    // Handle class changes
    if (lowerInstruction.includes('class')) {
      const classMatch = instruction.match(/(?:to|with)\s*['"](.*?)['"]|(?:to|with)\s*([a-zA-Z0-9\s-]+)/i);
      if (classMatch) {
        const newClass = classMatch[1] || classMatch[2];
        return originalCode.replace(/class="[^"]*"/gi, `class="${newClass}"`);
      }
    }
    
    // If no specific pattern matches, return original code
    console.warn('No matching pattern found for instruction:', instruction);
    return originalCode;
  }

  private cleanGeneratedCode(code: string): string {
    // Remove any markdown formatting or explanations
    let cleaned = code.trim();
    
    // Remove markdown code blocks if present
    cleaned = cleaned.replace(/```html\n?/g, '');
    cleaned = cleaned.replace(/```\n?/g, '');
    
    // Remove any explanatory text before or after the HTML
    const htmlMatch = cleaned.match(/<(!DOCTYPE html|html[^>]*>)[\s\S]*<\/html>/i);
    if (htmlMatch) {
      cleaned = htmlMatch[0];
    }
    
    return cleaned.trim();
  }

  private validateSurgicalEdit(
    originalCode: string,
    updatedCode: string,
    editInstruction: string
  ): boolean {
    // Calculate the percentage of code that changed
    const patches = this.diffPatchService.createPatch(originalCode, updatedCode);
    const totalLines = originalCode.split('\n').length;
    const changedLines = patches.length;
    const changePercentage = (changedLines / totalLines) * 100;

    // If more than 20% of the code changed, it's probably not a surgical edit
    if (changePercentage > 20) {
      console.warn(`Surgical edit changed ${changePercentage.toFixed(1)}% of the code, which seems excessive`);
      return false;
    }

    // Check if the edit instruction suggests a simple change
    const simpleEditKeywords = [
      'rename', 'change text', 'update label', 'modify title', 'replace text',
      'change color', 'update button', 'change heading', 'modify placeholder',
      'fix typo', 'correct spelling', 'update content', 'change wording'
    ];

    const isSimpleEdit = simpleEditKeywords.some(keyword => 
      editInstruction.toLowerCase().includes(keyword)
    );

    if (isSimpleEdit && changePercentage > 5) {
      console.warn(`Simple edit changed ${changePercentage.toFixed(1)}% of the code, which seems excessive for: ${editInstruction}`);
      return false;
    }

    return true;
  }

  // Method to check if an edit instruction is suitable for surgical editing
  static isSuitableForSurgicalEdit(editInstruction: string): boolean {
    const surgicalEditKeywords = [
      'rename', 'change text', 'update label', 'modify title', 'replace text',
      'change color', 'update button text', 'change heading', 'modify placeholder',
      'update content', 'change wording', 'fix typo', 'correct spelling',
      'change font', 'update link', 'modify alt text', 'change class name',
      'update id', 'change attribute', 'fix spacing', 'adjust margin',
      'change padding', 'update border', 'modify background'
    ];

    const complexEditKeywords = [
      'add new', 'create', 'build', 'implement', 'remove section',
      'delete component', 'restructure', 'reorganize', 'add feature',
      'new functionality', 'integrate', 'connect to', 'add database',
      'add api', 'add authentication', 'add validation'
    ];

    const lowerInstruction = editInstruction.toLowerCase();
    
    const isSurgical = surgicalEditKeywords.some(keyword => 
      lowerInstruction.includes(keyword)
    );
    
    const isComplex = complexEditKeywords.some(keyword => 
      lowerInstruction.includes(keyword)
    );

    return isSurgical && !isComplex;
  }
}