import React, { useState, useRef, useEffect } from 'react';
import { Code, Download, Copy, Search, FileText, Layers, Eye, EyeOff } from 'lucide-react';
import { useGenerationStore } from '../stores/generationStore';
import { useToast } from '../stores/toastStore';

interface CodeEditorProps {
  className?: string;
}

type CodeSection = 'html' | 'css' | 'js' | 'complete';

export const CodeEditor: React.FC<CodeEditorProps> = ({ className = '' }) => {
  const [activeSection, setActiveSection] = useState<CodeSection>('complete');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const editorRef = useRef<HTMLDivElement>(null);
  
  const { generatedCode, isGenerating } = useGenerationStore();
  const { success, error } = useToast();

  // Extract different code sections from complete HTML
  const extractCodeSections = () => {
    if (!generatedCode?.completeHTML) {
      return {
        html: '',
        css: '',
        js: '',
        complete: ''
      };
    }

    const html = generatedCode.completeHTML;
    
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

    // Clean HTML (remove style and script tags for HTML-only view)
    const cleanHtml = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/^\s*\n/gm, ''); // Remove empty lines

    return {
      html: cleanHtml,
      css: css || '/* No CSS found */',
      js: js || '// No JavaScript found',
      complete: html
    };
  };

  const codeSections = extractCodeSections();

  const getCurrentCode = () => {
    return codeSections[activeSection] || '';
  };

  const getLanguage = (section: CodeSection) => {
    switch (section) {
      case 'html': return 'html';
      case 'css': return 'css';
      case 'js': return 'javascript';
      case 'complete': return 'html';
      default: return 'html';
    }
  };

  const copyCode = async () => {
    const code = getCurrentCode();
    if (!code) {
      error('No code to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      success(`${activeSection.toUpperCase()} code copied to clipboard`);
    } catch (err) {
      error('Failed to copy code');
    }
  };

  const downloadCode = () => {
    const code = getCurrentCode();
    if (!code) {
      error('No code to download');
      return;
    }

    const extensions = {
      html: 'html',
      css: 'css',
      js: 'js',
      complete: 'html'
    };

    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prototype-${activeSection}.${extensions[activeSection]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    success(`${activeSection.toUpperCase()} code downloaded`);
  };

  const formatCode = (code: string) => {
    // Basic code formatting
    const lines = code.split('\n');
    let indentLevel = 0;
    const indentSize = 2;
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      // Decrease indent for closing tags
      if (trimmedLine.startsWith('</') || trimmedLine.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      const formattedLine = ' '.repeat(indentLevel * indentSize) + trimmedLine;
      
      // Increase indent for opening tags
      if (trimmedLine.includes('<') && !trimmedLine.includes('</') && !trimmedLine.endsWith('/>')) {
        indentLevel++;
      } else if (trimmedLine.endsWith('{')) {
        indentLevel++;
      }
      
      return formattedLine;
    }).join('\n');
  };

  const highlightSearchTerm = (code: string) => {
    if (!searchTerm) return code;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return code.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  const addLineNumbers = (code: string) => {
    if (!showLineNumbers) return code;
    
    const lines = code.split('\n');
    return lines.map((line, index) => {
      const lineNumber = (index + 1).toString().padStart(3, ' ');
      return `<span class="text-gray-500 select-none">${lineNumber}</span> ${line}`;
    }).join('\n');
  };

  const sections = [
    { id: 'complete' as const, label: 'Complete', icon: FileText, description: 'Full HTML file' },
    { id: 'html' as const, label: 'HTML', icon: Code, description: 'HTML structure only' },
    { id: 'css' as const, label: 'CSS', icon: Layers, description: 'Styles only' },
    { id: 'js' as const, label: 'JavaScript', icon: Code, description: 'Scripts only' }
  ];

  if (!generatedCode?.completeHTML && !isGenerating) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Code className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Generate content first to view code</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Code className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Code Editor</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search code..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Actions */}
          <button
            onClick={copyCode}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Copy Code"
          >
            <Copy className="h-4 w-4" />
          </button>
          
          <button
            onClick={downloadCode}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Download Code"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const codeLength = codeSections[section.id]?.length || 0;
            
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeSection === section.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title={section.description}
              >
                <Icon className="h-4 w-4 inline mr-2" />
                {section.label}
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {codeLength > 0 ? `${Math.round(codeLength / 1000)}k` : '0'}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Editor Controls */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Font Size:</label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={12}>12px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
              <option value={18}>18px</option>
            </select>
          </div>
          
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className={`flex items-center px-3 py-1 text-sm rounded transition-colors ${
              showLineNumbers
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showLineNumbers ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
            Line Numbers
          </button>
          
          <button
            onClick={() => setWordWrap(!wordWrap)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              wordWrap
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Word Wrap
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          Language: {getLanguage(activeSection)}
        </div>
      </div>

      {/* Code Content */}
      <div className="relative">
        {isGenerating ? (
          <div className="h-96 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating code...</p>
            </div>
          </div>
        ) : (
          <div 
            ref={editorRef}
            className="h-96 overflow-auto bg-gray-900 text-gray-100 p-4"
            style={{ fontSize: `${fontSize}px` }}
          >
            <pre 
              className={`font-mono leading-relaxed ${wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre'}`}
              dangerouslySetInnerHTML={{
                __html: addLineNumbers(highlightSearchTerm(formatCode(getCurrentCode())))
              }}
            />
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Section: {activeSection.toUpperCase()}</span>
            <span>Lines: {getCurrentCode().split('\n').length}</span>
            <span>Characters: {getCurrentCode().length}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Font: {fontSize}px</span>
            <span>Line Numbers: {showLineNumbers ? 'On' : 'Off'}</span>
            <span>Word Wrap: {wordWrap ? 'On' : 'Off'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};