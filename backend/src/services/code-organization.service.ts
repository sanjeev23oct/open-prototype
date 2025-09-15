import { CodeSection } from '../types/database';
import { OrganizedHTML, ElementLocation } from '../types/generation';

export class CodeOrganizationService {
  
  organizeHTML(htmlContent: string): OrganizedHTML {
    const sections = this.parseHTMLSections(htmlContent);
    const elementMap = this.createElementMap(htmlContent);
    
    return {
      sections,
      elementMap
    };
  }

  private parseHTMLSections(htmlContent: string): OrganizedHTML['sections'] {
    const lines = htmlContent.split('\n');
    const sections: OrganizedHTML['sections'] = {
      header: { content: '', startLine: 0, endLine: 0, elements: [] },
      navigation: { content: '', startLine: 0, endLine: 0, elements: [] },
      main: { content: '', startLine: 0, endLine: 0, elements: [] },
      footer: { content: '', startLine: 0, endLine: 0, elements: [] },
      styles: { content: '', startLine: 0, endLine: 0, rules: [] },
      scripts: { content: '', startLine: 0, endLine: 0, functions: [] }
    };

    let currentSection = '';
    let sectionStart = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect section comments
      if (line.includes('<!-- HEADER') || line.includes('<header')) {
        currentSection = 'header';
        sectionStart = i;
      } else if (line.includes('<!-- NAVIGATION') || line.includes('<nav')) {
        currentSection = 'navigation';
        sectionStart = i;
      } else if (line.includes('<!-- MAIN') || line.includes('<main')) {
        currentSection = 'main';
        sectionStart = i;
      } else if (line.includes('<!-- FOOTER') || line.includes('<footer')) {
        currentSection = 'footer';
        sectionStart = i;
      } else if (line.includes('<style>')) {
        currentSection = 'styles';
        sectionStart = i;
      } else if (line.includes('<script>')) {
        currentSection = 'scripts';
        sectionStart = i;
      }

      // Detect section end
      if (line.includes('<!-- END') || 
          line.includes('</header>') || 
          line.includes('</nav>') || 
          line.includes('</main>') || 
          line.includes('</footer>') ||
          line.includes('</style>') ||
          line.includes('</script>')) {
        
        if (currentSection && sections[currentSection as keyof typeof sections]) {
          const section = sections[currentSection as keyof typeof sections];
          section.startLine = sectionStart;
          section.endLine = i;
          section.content = lines.slice(sectionStart, i + 1).join('\n');
          
          if (currentSection !== 'styles' && currentSection !== 'scripts') {
            (section as any).elements = this.extractElements(section.content);
          }
        }
        currentSection = '';
      }
    }

    return sections;
  }

  private createElementMap(htmlContent: string): Map<string, ElementLocation> {
    const elementMap = new Map<string, ElementLocation>();
    const lines = htmlContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for elements with IDs or classes that can be targeted
      const idMatch = line.match(/id=["']([^"']+)["']/);
      const classMatch = line.match(/class=["']([^"']+)["']/);
      const tagMatch = line.match(/<(\w+)/);
      
      if (idMatch || classMatch || tagMatch) {
        const elementId = idMatch?.[1] || 
                         classMatch?.[1]?.split(' ')[0] || 
                         tagMatch?.[1] || 
                         `element-${i}`;
        
        const sectionName = this.determineSectionFromLine(i, lines);
        
        elementMap.set(elementId, {
          sectionName,
          startLine: i,
          endLine: this.findElementEndLine(i, lines),
          elementId,
          elementType: tagMatch?.[1] || 'div'
        });
      }
    }
    
    return elementMap;
  }

  private extractElements(content: string): Array<{id: string, type: string, content: string}> {
    const elements: Array<{id: string, type: string, content: string}> = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const tagMatch = line.match(/<(\w+)([^>]*)>/);
      
      if (tagMatch && !line.includes('</')) {
        const tag = tagMatch[1];
        const attributes = tagMatch[2];
        const idMatch = attributes.match(/id=["']([^"']+)["']/);
        
        elements.push({
          id: idMatch?.[1] || `${tag}-${i}`,
          type: tag,
          content: line.trim()
        });
      }
    }
    
    return elements;
  }

  private determineSectionFromLine(lineIndex: number, lines: string[]): string {
    // Look backwards to find the section this line belongs to
    for (let i = lineIndex; i >= 0; i--) {
      const line = lines[i].toLowerCase();
      
      if (line.includes('header') || line.includes('<!-- header')) return 'header';
      if (line.includes('nav') || line.includes('<!-- nav')) return 'navigation';
      if (line.includes('main') || line.includes('<!-- main')) return 'main';
      if (line.includes('footer') || line.includes('<!-- footer')) return 'footer';
      if (line.includes('<style>')) return 'styles';
      if (line.includes('<script>')) return 'scripts';
    }
    
    return 'main'; // default
  }

  private findElementEndLine(startLine: number, lines: string[]): number {
    const startTag = lines[startLine].match(/<(\w+)/)?.[1];
    if (!startTag) return startLine;
    
    let depth = 0;
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes(`<${startTag}`)) depth++;
      if (line.includes(`</${startTag}>`)) {
        depth--;
        if (depth === 0) return i;
      }
    }
    
    return startLine;
  }

  generateSectionMap(codeSections: CodeSection[]): Map<string, CodeSection> {
    const sectionMap = new Map<string, CodeSection>();
    
    for (const section of codeSections) {
      sectionMap.set(section.sectionName, section);
    }
    
    return sectionMap;
  }

  extractEditableElements(htmlContent: string): Array<{
    id: string;
    selector: string;
    type: string;
    content: string;
    section: string;
  }> {
    const elements: Array<{
      id: string;
      selector: string;
      type: string;
      content: string;
      section: string;
    }> = [];
    
    const lines = htmlContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for common editable elements
      const editablePatterns = [
        { pattern: /<h[1-6][^>]*>(.*?)<\/h[1-6]>/, type: 'heading' },
        { pattern: /<p[^>]*>(.*?)<\/p>/, type: 'paragraph' },
        { pattern: /<button[^>]*>(.*?)<\/button>/, type: 'button' },
        { pattern: /<a[^>]*>(.*?)<\/a>/, type: 'link' },
        { pattern: /<img[^>]*>/, type: 'image' },
        { pattern: /<div[^>]*class="[^"]*card[^"]*"/, type: 'card' }
      ];
      
      for (const { pattern, type } of editablePatterns) {
        const match = line.match(pattern);
        if (match) {
          const elementId = `${type}-${i}`;
          const selector = this.generateCSSSelector(line);
          const section = this.determineSectionFromLine(i, lines);
          
          elements.push({
            id: elementId,
            selector,
            type,
            content: match[1] || match[0],
            section
          });
        }
      }
    }
    
    return elements;
  }

  private generateCSSSelector(htmlLine: string): string {
    const idMatch = htmlLine.match(/id=["']([^"']+)["']/);
    if (idMatch) return `#${idMatch[1]}`;
    
    const classMatch = htmlLine.match(/class=["']([^"']+)["']/);
    if (classMatch) {
      const firstClass = classMatch[1].split(' ')[0];
      return `.${firstClass}`;
    }
    
    const tagMatch = htmlLine.match(/<(\w+)/);
    return tagMatch ? tagMatch[1] : 'div';
  }
}