import React, { useState, useEffect, useRef } from 'react';
import { Code, Copy, Download, Eye, EyeOff, Maximize2 } from 'lucide-react';
import { useGenerationStore } from '../stores/generationStore';
import { useToast } from '../stores/toastStore';

interface LiveCodeStreamProps {
  className?: string;
}

export const LiveCodeStream: React.FC<LiveCodeStreamProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const codeRef = useRef<HTMLPreElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { streamingContent, isGenerating, currentPhase } = useGenerationStore();
  const { success, error } = useToast();

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (autoScroll && codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [streamingContent, autoScroll]);

  const handleCopyCode = async () => {
    if (!streamingContent) return;
    
    try {
      await navigator.clipboard.writeText(streamingContent);
      success('Code copied to clipboard');
    } catch (err) {
      error('Failed to copy code');
    }
  };

  const handleDownloadCode = () => {
    if (!streamingContent) return;
    
    const blob = new Blob([streamingContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-code-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    success('Code downloaded');
  };

  const getLanguageFromPhase = (phase: string) => {
    switch (phase) {
      case 'generating':
        return 'html';
      case 'documenting':
        return 'markdown';
      default:
        return 'text';
    }
  };

  const formatCodeWithLineNumbers = (code: string) => {
    if (!showLineNumbers) return code;
    
    const lines = code.split('\n');
    return lines.map((line, index) => {
      const lineNumber = (index + 1).toString().padStart(3, ' ');
      return `${lineNumber} | ${line}`;
    }).join('\n');
  };

  if (!isGenerating || !streamingContent) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-32 text-gray-500">
          <div className="text-center">
            <Code className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Code will stream here during generation</p>
          </div>
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
          <h3 className="font-semibold text-gray-900">Live Code Stream</h3>
          <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            {getLanguageFromPhase(currentPhase || '')}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title={showLineNumbers ? 'Hide line numbers' : 'Show line numbers'}
          >
            {showLineNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-2 rounded-md transition-colors ${
              autoScroll 
                ? 'text-blue-600 bg-blue-100' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleCopyCode}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Copy code"
          >
            <Copy className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleDownloadCode}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Download code"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div 
        ref={containerRef}
        className={`relative ${isExpanded ? 'h-96' : 'h-64'}`}
      >
        <pre
          ref={codeRef}
          className="absolute inset-0 p-4 bg-gray-900 text-green-400 font-mono text-sm overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
          style={{ 
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            lineHeight: '1.5'
          }}
        >
          {formatCodeWithLineNumbers(streamingContent)}
          <span className="animate-pulse text-green-300">█</span>
        </pre>
        
        {/* Scroll indicator */}
        {!autoScroll && (
          <div className="absolute bottom-4 right-4">
            <button
              onClick={() => {
                if (codeRef.current) {
                  codeRef.current.scrollTop = codeRef.current.scrollHeight;
                }
              }}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 transition-colors"
            >
              Scroll to bottom
            </button>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Lines: {streamingContent.split('\n').length}</span>
          <span>Characters: {streamingContent.length}</span>
          <span>Language: {getLanguageFromPhase(currentPhase || '')}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Streaming live</span>
        </div>
      </div>
    </div>
  );
};