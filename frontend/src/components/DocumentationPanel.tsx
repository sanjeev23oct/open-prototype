import React, { useState, useEffect } from 'react';
import { FileText, Search, Download, Copy, BookOpen, Lightbulb, Settings, Zap } from 'lucide-react';
import { useGenerationStore } from '../stores/generationStore';
import { useToast } from '../stores/toastStore';

interface DocumentationPanelProps {
  className?: string;
}

interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  type: 'overview' | 'component' | 'customization' | 'integration';
  icon: React.ComponentType<any>;
}

export const DocumentationPanel: React.FC<DocumentationPanelProps> = ({ className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [documentation, setDocumentation] = useState<DocumentationSection[]>([]);
  
  const { generatedCode, currentPlan, isGenerating } = useGenerationStore();
  const { success, error } = useToast();

  // Generate documentation based on generated code and plan
  useEffect(() => {
    if (generatedCode?.completeHTML || currentPlan) {
      generateDocumentation();
    }
  }, [generatedCode, currentPlan]);

  const generateDocumentation = () => {
    const docs: DocumentationSection[] = [];

    // Overview section
    docs.push({
      id: 'overview',
      title: 'Project Overview',
      type: 'overview',
      icon: BookOpen,
      content: generateOverviewDoc()
    });

    // Component documentation
    if (currentPlan?.components) {
      currentPlan.components.forEach((component, index) => {
        docs.push({
          id: `component-${index}`,
          title: component.name,
          type: 'component',
          icon: Zap,
          content: generateComponentDoc(component)
        });
      });
    }

    // Customization guide
    docs.push({
      id: 'customization',
      title: 'Customization Guide',
      type: 'customization',
      icon: Settings,
      content: generateCustomizationDoc()
    });

    // Integration guide
    docs.push({
      id: 'integration',
      title: 'Integration Guide',
      type: 'integration',
      icon: Lightbulb,
      content: generateIntegrationDoc()
    });

    setDocumentation(docs);
  };

  const generateOverviewDoc = () => {
    const plan = currentPlan;
    const componentCount = plan?.components?.length || 0;
    const dependencies = plan?.dependencies || [];

    return `# Project Overview

## Description
This prototype was generated using AI-powered code generation, creating a modern, responsive web application.

## Architecture
- **Framework**: ${plan?.architecture?.framework || 'Vanilla JavaScript'}
- **Styling**: ${plan?.architecture?.styling || 'TailwindCSS'}
- **Components**: ${componentCount} components
- **Responsive**: ${plan?.architecture?.responsive ? 'Yes' : 'No'}

## Dependencies
${dependencies.length > 0 ? dependencies.map(dep => `- ${dep}`).join('\n') : 'No external dependencies'}

## Features
${plan?.components?.map(comp => `- **${comp.name}**: ${comp.description}`).join('\n') || 'No components defined'}

## Getting Started
1. Save the generated HTML file
2. Open in a web browser
3. Customize as needed using the guide below

## File Structure
\`\`\`
prototype.html          # Complete HTML file
├── HTML Structure      # Semantic markup
├── CSS Styles         # Embedded styles
└── JavaScript         # Interactive functionality
\`\`\`
`;
  };

  const generateComponentDoc = (component: any) => {
    return `# ${component.name}

## Description
${component.description}

## Type
${component.type}

## Complexity
${component.estimatedComplexity}

## Features
${component.features?.map((feature: string) => `- ${feature}`).join('\n') || 'No specific features listed'}

## Dependencies
${component.dependencies?.map((dep: string) => `- ${dep}`).join('\n') || 'No dependencies'}

## Customization Options

### Styling
You can customize this component by modifying the CSS classes:

\`\`\`css
/* Example customizations */
.${component.name.toLowerCase().replace(/\s+/g, '-')} {
  /* Add your custom styles here */
}
\`\`\`

### Content
Update the text content and structure as needed for your use case.

### Behavior
If this component includes JavaScript functionality, you can extend it by:
1. Adding event listeners
2. Modifying existing functions
3. Integrating with external APIs

## Best Practices
- Keep the semantic HTML structure intact
- Use CSS custom properties for easy theming
- Test responsiveness across different screen sizes
- Ensure accessibility standards are maintained
`;
  };

  const generateCustomizationDoc = () => {
    return `# Customization Guide

## Quick Customizations

### Colors
The prototype uses a consistent color scheme. You can easily change colors by modifying CSS custom properties:

\`\`\`css
:root {
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --accent-color: #10b981;
  --background-color: #ffffff;
  --text-color: #1f2937;
}
\`\`\`

### Typography
Adjust fonts and text sizes:

\`\`\`css
body {
  font-family: 'Your Font', sans-serif;
  font-size: 16px;
  line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Your Heading Font', serif;
}
\`\`\`

### Layout
Modify spacing and layout:

\`\`\`css
.container {
  max-width: 1200px; /* Adjust container width */
  padding: 0 20px;   /* Adjust padding */
}

.section {
  margin-bottom: 4rem; /* Adjust section spacing */
}
\`\`\`

## Advanced Customizations

### Adding New Sections
1. Copy an existing section structure
2. Modify the content and classes
3. Update any JavaScript selectors if needed

### Responsive Breakpoints
Customize responsive behavior:

\`\`\`css
/* Mobile */
@media (max-width: 768px) {
  /* Mobile styles */
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  /* Tablet styles */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Desktop styles */
}
\`\`\`

### Animation and Interactions
Add smooth transitions and hover effects:

\`\`\`css
.button {
  transition: all 0.3s ease;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
\`\`\`

## Performance Tips
- Optimize images for web
- Minify CSS and JavaScript for production
- Use CDN for external libraries
- Enable gzip compression on your server
`;
  };

  const generateIntegrationDoc = () => {
    return `# Integration Guide

## Framework Integration

### React Integration
Convert to React components:

\`\`\`jsx
import React from 'react';

const MyComponent = () => {
  return (
    <div className="component-class">
      {/* Your HTML content here */}
    </div>
  );
};

export default MyComponent;
\`\`\`

### Vue.js Integration
Convert to Vue components:

\`\`\`vue
<template>
  <div class="component-class">
    <!-- Your HTML content here -->
  </div>
</template>

<script>
export default {
  name: 'MyComponent',
  // Component logic
}
</script>

<style scoped>
/* Component styles */
</style>
\`\`\`

### Angular Integration
Convert to Angular components:

\`\`\`typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-my-component',
  template: \`
    <div class="component-class">
      <!-- Your HTML content here -->
    </div>
  \`,
  styleUrls: ['./my-component.component.css']
})
export class MyComponent { }
\`\`\`

## CMS Integration

### WordPress
1. Create a new page template
2. Copy the HTML structure
3. Convert to PHP with WordPress functions
4. Enqueue styles and scripts properly

### Webflow
1. Create a new page in Webflow
2. Use the HTML structure as a reference
3. Rebuild using Webflow's visual editor
4. Export and customize as needed

## API Integration

### Fetch Data
Replace static content with dynamic data:

\`\`\`javascript
async function loadData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    updateContent(data);
  } catch (error) {
    console.error('Error loading data:', error);
  }
}
\`\`\`

### Form Handling
Add form submission functionality:

\`\`\`javascript
document.getElementById('contact-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showSuccessMessage();
    }
  } catch (error) {
    showErrorMessage();
  }
});
\`\`\`

## Deployment

### Static Hosting
- Netlify: Drag and drop the HTML file
- Vercel: Connect your Git repository
- GitHub Pages: Push to a GitHub repository

### Dynamic Hosting
- Node.js: Use Express to serve the file
- PHP: Include the HTML in PHP templates
- Python: Use Flask or Django templates

## SEO Optimization
- Add meta tags for social sharing
- Include structured data markup
- Optimize images with alt text
- Ensure proper heading hierarchy
- Add a sitemap.xml file
`;
  };

  const filteredDocs = documentation.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeDoc = documentation.find(doc => doc.id === activeSection);

  const copyDocumentation = async () => {
    if (!activeDoc) return;
    
    try {
      await navigator.clipboard.writeText(activeDoc.content);
      success('Documentation copied to clipboard');
    } catch (err) {
      error('Failed to copy documentation');
    }
  };

  const downloadDocumentation = () => {
    if (!activeDoc) return;
    
    const blob = new Blob([activeDoc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDoc.title.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    success('Documentation downloaded');
  };

  const downloadAllDocumentation = () => {
    const allDocs = documentation.map(doc => 
      `# ${doc.title}\n\n${doc.content}\n\n---\n\n`
    ).join('');
    
    const blob = new Blob([allDocs], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'complete-documentation.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    success('Complete documentation downloaded');
  };

  if (!generatedCode?.completeHTML && !currentPlan && !isGenerating) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Generate content first to view documentation</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Documentation</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search docs..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Actions */}
          <button
            onClick={copyDocumentation}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Copy Current Section"
          >
            <Copy className="h-4 w-4" />
          </button>
          
          <button
            onClick={downloadDocumentation}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Download Current Section"
          >
            <Download className="h-4 w-4" />
          </button>
          
          <button
            onClick={downloadAllDocumentation}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            Download All
          </button>
        </div>
      </div>

      <div className="flex h-96">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-gray-50">
          <div className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">Sections</h4>
            <nav className="space-y-1">
              {filteredDocs.map((doc) => {
                const Icon = doc.icon;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setActiveSection(doc.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                      activeSection === doc.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {doc.title}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isGenerating ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating documentation...</p>
              </div>
            </div>
          ) : activeDoc ? (
            <div className="p-6">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                  {activeDoc.content}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <p>Select a section to view documentation</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Sections: {documentation.length}</span>
            {searchTerm && <span>Filtered: {filteredDocs.length}</span>}
          </div>
          <div className="flex items-center space-x-4">
            <span>Format: Markdown</span>
            <span>Auto-generated from code and plan</span>
          </div>
        </div>
      </div>
    </div>
  );
};