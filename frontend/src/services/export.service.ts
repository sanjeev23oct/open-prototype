import JSZip from 'jszip';
import { GeneratedCode, GenerationPlan } from '../types/generation';

export interface ExportOptions {
  includeDocumentation?: boolean;
  includeAssets?: boolean;
  format?: 'single' | 'separated' | 'project';
  framework?: 'vanilla' | 'react' | 'vue' | 'angular';
}

export interface ExportResult {
  success: boolean;
  filename: string;
  size: number;
  error?: string;
}

export class ExportService {
  private static instance: ExportService;

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  // Export as single HTML file
  async exportSingleHTML(
    generatedCode: GeneratedCode,
    plan?: GenerationPlan,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    try {
      const html = generatedCode.completeHTML;
      const blob = new Blob([html], { type: 'text/html' });
      const filename = `prototype-${Date.now()}.html`;
      
      this.downloadBlob(blob, filename);
      
      return {
        success: true,
        filename,
        size: blob.size
      };
    } catch (error: any) {
      return {
        success: false,
        filename: '',
        size: 0,
        error: error.message
      };
    }
  }

  // Export as separated files (HTML, CSS, JS)
  async exportSeparatedFiles(
    generatedCode: GeneratedCode,
    plan?: GenerationPlan,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    try {
      const zip = new JSZip();
      const projectName = `prototype-${Date.now()}`;
      
      // Extract code sections
      const sections = this.extractCodeSections(generatedCode.completeHTML);
      
      // Add HTML file
      zip.file(`${projectName}.html`, sections.html);
      
      // Add CSS file if exists
      if (sections.css.trim()) {
        zip.file(`${projectName}.css`, sections.css);
      }
      
      // Add JS file if exists
      if (sections.js.trim()) {
        zip.file(`${projectName}.js`, sections.js);
      }
      
      // Add documentation if requested
      if (options.includeDocumentation && plan) {
        const documentation = this.generateDocumentation(plan, generatedCode);
        zip.file('README.md', documentation);
      }
      
      // Add package.json for project structure
      const packageJson = this.generatePackageJson(projectName, plan);
      zip.file('package.json', JSON.stringify(packageJson, null, 2));
      
      // Generate and download zip
      const content = await zip.generateAsync({ type: 'blob' });
      const filename = `${projectName}.zip`;
      
      this.downloadBlob(content, filename);
      
      return {
        success: true,
        filename,
        size: content.size
      };
    } catch (error: any) {
      return {
        success: false,
        filename: '',
        size: 0,
        error: error.message
      };
    }
  }

  // Export as framework project
  async exportFrameworkProject(
    generatedCode: GeneratedCode,
    plan: GenerationPlan,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    try {
      const zip = new JSZip();
      const projectName = `prototype-${Date.now()}`;
      
      switch (options.framework) {
        case 'react':
          await this.generateReactProject(zip, projectName, generatedCode, plan);
          break;
        case 'vue':
          await this.generateVueProject(zip, projectName, generatedCode, plan);
          break;
        case 'angular':
          await this.generateAngularProject(zip, projectName, generatedCode, plan);
          break;
        default:
          await this.generateVanillaProject(zip, projectName, generatedCode, plan);
      }
      
      // Generate and download zip
      const content = await zip.generateAsync({ type: 'blob' });
      const filename = `${projectName}-${options.framework}.zip`;
      
      this.downloadBlob(content, filename);
      
      return {
        success: true,
        filename,
        size: content.size
      };
    } catch (error: any) {
      return {
        success: false,
        filename: '',
        size: 0,
        error: error.message
      };
    }
  }

  // Copy code to clipboard
  async copyToClipboard(content: string, type: 'html' | 'css' | 'js' | 'complete' = 'complete'): Promise<boolean> {
    try {
      let textToCopy = content;
      
      if (type !== 'complete') {
        const sections = this.extractCodeSections(content);
        textToCopy = sections[type] || content;
      }
      
      await navigator.clipboard.writeText(textToCopy);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  // Generate shareable link
  async generateShareableLink(
    generatedCode: GeneratedCode,
    plan?: GenerationPlan
  ): Promise<string> {
    try {
      // Compress the data
      const data = {
        code: generatedCode,
        plan: plan,
        timestamp: Date.now()
      };
      
      const compressed = this.compressData(JSON.stringify(data));
      const shareId = this.generateShareId();
      
      // In a real implementation, this would save to a backend service
      // For now, we'll use localStorage as a demo
      localStorage.setItem(`share-${shareId}`, compressed);
      
      const baseUrl = window.location.origin;
      return `${baseUrl}/share/${shareId}`;
    } catch (error) {
      console.error('Failed to generate shareable link:', error);
      throw error;
    }
  }

  // Private helper methods
  private extractCodeSections(html: string) {
    // Extract CSS from style tags
    const cssMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
    const css = cssMatches
      .map(match => match.replace(/<\/?style[^>]*>/gi, ''))
      .join('\n\n');

    // Extract JS from script tags
    const jsMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
    const js = jsMatches
      .map(match => match.replace(/<\/?script[^>]*>/gi, ''))
      .filter(script => script.trim() && !script.includes('src='))
      .join('\n\n');

    // Clean HTML (remove style and script tags for separated version)
    const cleanHtml = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/^\s*\n/gm, '');

    return {
      html: cleanHtml,
      css: css || '/* No CSS found */',
      js: js || '// No JavaScript found'
    };
  }

  private generatePackageJson(projectName: string, plan?: GenerationPlan) {
    return {
      name: projectName,
      version: '1.0.0',
      description: plan ? `Generated prototype: ${plan.components.map(c => c.name).join(', ')}` : 'AI Generated Prototype',
      main: 'index.html',
      scripts: {
        start: 'npx serve .',
        build: 'echo "Static files ready for deployment"'
      },
      keywords: ['prototype', 'ai-generated', 'web'],
      author: 'AI Prototype Generator',
      license: 'MIT',
      devDependencies: {
        serve: '^14.0.0'
      }
    };
  }

  private generateDocumentation(plan: GenerationPlan, code: GeneratedCode): string {
    return `# ${plan.id} - AI Generated Prototype

## Overview
This prototype was generated using AI-powered code generation.

## Components
${plan.components.map(comp => `- **${comp.name}**: ${comp.description}`).join('\n')}

## Architecture
- **Framework**: ${plan.architecture.framework}
- **Styling**: ${plan.architecture.styling}
- **Responsive**: ${plan.architecture.responsive ? 'Yes' : 'No'}

## Dependencies
${plan.dependencies.map(dep => `- ${dep}`).join('\n')}

## Getting Started
1. Open \`index.html\` in a web browser
2. Or serve using: \`npx serve .\`
3. Customize the code as needed

## File Structure
\`\`\`
/
├── index.html          # Main HTML file
├── styles.css          # Stylesheet (if separated)
├── script.js           # JavaScript (if separated)
├── package.json        # Project configuration
└── README.md           # This file
\`\`\`

## Customization
Refer to the generated documentation for detailed customization instructions.

---
Generated on ${new Date().toISOString()}
`;
  }

  private async generateReactProject(zip: JSZip, projectName: string, code: GeneratedCode, plan: GenerationPlan) {
    const sections = this.extractCodeSections(code.completeHTML);
    
    // Package.json for React
    const packageJson = {
      name: projectName,
      version: '0.1.0',
      private: true,
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'react-scripts': '5.0.1'
      },
      scripts: {
        start: 'react-scripts start',
        build: 'react-scripts build',
        test: 'react-scripts test',
        eject: 'react-scripts eject'
      }
    };
    
    zip.file('package.json', JSON.stringify(packageJson, null, 2));
    
    // Public files
    zip.file('public/index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${projectName}</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`);
    
    // Source files
    zip.file('src/index.js', `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`);
    
    zip.file('src/App.js', this.convertHtmlToReact(sections.html));
    zip.file('src/index.css', sections.css);
    
    // README
    zip.file('README.md', this.generateDocumentation(plan, code));
  }

  private async generateVueProject(zip: JSZip, projectName: string, code: GeneratedCode, plan: GenerationPlan) {
    const sections = this.extractCodeSections(code.completeHTML);
    
    // Package.json for Vue
    const packageJson = {
      name: projectName,
      version: '0.1.0',
      private: true,
      scripts: {
        serve: 'vue-cli-service serve',
        build: 'vue-cli-service build'
      },
      dependencies: {
        'core-js': '^3.8.3',
        vue: '^3.2.13'
      },
      devDependencies: {
        '@vue/cli-service': '~5.0.0'
      }
    };
    
    zip.file('package.json', JSON.stringify(packageJson, null, 2));
    
    // Public files
    zip.file('public/index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${projectName}</title>
</head>
<body>
  <div id="app"></div>
</body>
</html>`);
    
    // Source files
    zip.file('src/main.js', `import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')`);
    
    zip.file('src/App.vue', this.convertHtmlToVue(sections.html, sections.css, sections.js));
    zip.file('src/style.css', sections.css);
  }

  private async generateAngularProject(zip: JSZip, projectName: string, code: GeneratedCode, plan: GenerationPlan) {
    // Simplified Angular structure
    const packageJson = {
      name: projectName,
      version: '0.0.0',
      scripts: {
        ng: 'ng',
        start: 'ng serve',
        build: 'ng build'
      },
      dependencies: {
        '@angular/animations': '^15.0.0',
        '@angular/common': '^15.0.0',
        '@angular/compiler': '^15.0.0',
        '@angular/core': '^15.0.0',
        '@angular/platform-browser': '^15.0.0',
        '@angular/platform-browser-dynamic': '^15.0.0'
      }
    };
    
    zip.file('package.json', JSON.stringify(packageJson, null, 2));
    
    // Basic Angular files would go here
    // This is a simplified version for demo purposes
  }

  private async generateVanillaProject(zip: JSZip, projectName: string, code: GeneratedCode, plan: GenerationPlan) {
    const sections = this.extractCodeSections(code.completeHTML);
    
    zip.file('index.html', sections.html);
    if (sections.css.trim()) zip.file('styles.css', sections.css);
    if (sections.js.trim()) zip.file('script.js', sections.js);
    
    const packageJson = this.generatePackageJson(projectName, plan);
    zip.file('package.json', JSON.stringify(packageJson, null, 2));
    zip.file('README.md', this.generateDocumentation(plan, code));
  }

  private convertHtmlToReact(html: string): string {
    // Basic HTML to React conversion
    // This is a simplified version - a full implementation would need proper parsing
    return `import React from 'react';

function App() {
  return (
    <div className="App">
      {/* Converted HTML content would go here */}
      <div dangerouslySetInnerHTML={{__html: \`${html.replace(/`/g, '\\`')}\`}} />
    </div>
  );
}

export default App;`;
  }

  private convertHtmlToVue(html: string, css: string, js: string): string {
    return `<template>
  <div class="app">
    <!-- Converted HTML content -->
    <div v-html="htmlContent"></div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      htmlContent: \`${html.replace(/`/g, '\\`')}\`
    }
  }
}
</script>

<style>
${css}
</style>`;
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private compressData(data: string): string {
    // Simple base64 encoding for demo - in production use proper compression
    return btoa(data);
  }

  private generateShareId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}