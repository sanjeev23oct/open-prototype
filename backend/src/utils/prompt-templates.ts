import { GenerationPreferences, ComponentPlan } from '../types/llm.js';

export class PromptTemplates {
  static createPlanningPrompt(prompt: string, preferences: GenerationPreferences): string {
    return `Create a detailed generation plan for this prototype:

**User Request:** "${prompt}"

**Preferences:**
- Output: ${preferences.outputType}
- Framework: ${preferences.framework}
- Styling: ${preferences.styling}
- Responsive: ${preferences.responsive ? 'Yes' : 'No'}
- Accessibility: ${preferences.accessibility ? 'Yes' : 'No'}

**Required JSON Response Format:**
\`\`\`json
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
    "structure": "HTML structure approach",
    "styling": "CSS/styling approach",
    "interactions": "JavaScript functionality",
    "responsive": ${preferences.responsive}
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
\`\`\`

Focus on modern, clean design patterns and ensure all components work together cohesively.`;
  }

  static createCodeGenerationPrompt(
    component: ComponentPlan,
    preferences: GenerationPreferences,
    context?: string
  ): string {
    return `Generate production-ready code for the "${component.name}" component.

**Component Details:**
- Type: ${component.type}
- Description: ${component.description}
- Features: ${component.features.join(', ')}
- Complexity: ${component.estimatedComplexity}

**Technical Requirements:**
- Framework: ${preferences.framework}
- Styling: ${preferences.styling}
- Responsive: ${preferences.responsive ? 'Required' : 'Not required'}
- Accessibility: ${preferences.accessibility ? 'Include ARIA labels and semantic HTML' : 'Basic HTML'}

${context ? `**Context:** ${context}` : ''}

**Output Requirements:**
1. Clean, semantic HTML structure
2. ${preferences.styling === 'tailwind' ? 'TailwindCSS utility classes' : 'CSS styling'}
3. ${preferences.framework === 'vanilla' ? 'Vanilla JavaScript' : `${preferences.framework} components`}
4. Well-organized code with clear section comments
5. Production-ready without additional setup

Generate only the code without explanations or markdown formatting.`;
  }

  static createDocumentationPrompt(
    componentName: string,
    codeContent: string,
    features: string[]
  ): string {
    return `Create comprehensive documentation for the "${componentName}" component.

**Code:**
\`\`\`
${codeContent}
\`\`\`

**Features:** ${features.join(', ')}

**Documentation should include:**
1. **Purpose**: What this component does
2. **Features**: Key functionality and interactions
3. **Customization**: How to modify colors, text, layout
4. **Integration**: How it fits with other components
5. **Accessibility**: Any accessibility features included

Keep the documentation practical and developer-friendly. Focus on actionable information.`;
  }

  static createEditPrompt(
    elementId: string,
    currentCode: string,
    editRequest: string,
    preferences: GenerationPreferences
  ): string {
    return `Make a surgical edit to this code element.

**Element ID:** ${elementId}
**Edit Request:** ${editRequest}

**Current Code:**
\`\`\`
${currentCode}
\`\`\`

**Requirements:**
- Make only the requested changes
- Maintain existing styling approach (${preferences.styling})
- Keep the code structure intact
- Ensure changes are responsive if original was responsive
- Return only the modified code section

Generate the updated code without explanations.`;
  }

  static createOptimizationPrompt(
    codeContent: string,
    optimizationType: 'performance' | 'accessibility' | 'responsive' | 'cleanup'
  ): string {
    const optimizationInstructions = {
      performance: 'Optimize for loading speed and runtime performance',
      accessibility: 'Improve accessibility with proper ARIA labels, semantic HTML, and keyboard navigation',
      responsive: 'Enhance responsive design for all screen sizes',
      cleanup: 'Clean up code structure, remove redundancy, and improve readability',
    };

    return `Optimize this code for ${optimizationType}.

**Current Code:**
\`\`\`
${codeContent}
\`\`\`

**Optimization Goal:** ${optimizationInstructions[optimizationType]}

**Requirements:**
- Maintain existing functionality
- Keep the same visual appearance
- Improve ${optimizationType} aspects
- Return clean, production-ready code

Generate the optimized code without explanations.`;
  }

  static createExplanationPrompt(
    stepName: string,
    componentType: string,
    currentProgress: string
  ): string {
    return `Explain what you're currently building in a conversational, developer-friendly way.

**Current Step:** ${stepName}
**Component Type:** ${componentType}
**Progress:** ${currentProgress}

Provide a brief, engaging explanation (2-3 sentences) of:
1. What you're building right now
2. Why you're making specific design/technical decisions
3. How it fits into the overall prototype

Keep it conversational and informative, like you're pair programming with a colleague.`;
  }
}