import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, RefreshCw, ExternalLink, Download, Eye, Code, Maximize2 } from 'lucide-react';
import { useGenerationStore } from '../stores/generationStore';
import { useResponsive } from '../hooks/useResponsive';
import { LoadingSpinner } from './LoadingSpinner';

export const PreviewPanel: React.FC = () => {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewMode, setPreviewMode] = useState<'preview' | 'code'>('preview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { isMobile } = useResponsive();
  
  const { 
    generatedCode, 
    streamingContent, 
    isGenerating,
    currentPhase,
    error 
  } = useGenerationStore();

  const refreshPreview = async () => {
    setIsRefreshing(true);
    setLastUpdateTime(new Date());
    
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (iframeRef.current) {
      updateIframeContent();
    }
    
    setIsRefreshing(false);
  };

  const updateIframeContent = () => {
    if (!iframeRef.current) return;

    const htmlContent = generatedCode?.completeHTML || getPreviewHTML();
    console.log('🖼️ Updating iframe with content:', htmlContent.substring(0, 200) + '...');
    
    const doc = iframeRef.current.contentDocument;
    
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
    }
  };

  const getPreviewHTML = () => {
    if (isGenerating && streamingContent) {
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AI Prototype Generator - Live Preview</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            .streaming-cursor::after {
              content: '|';
              animation: blink 1s infinite;
            }
            @keyframes blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0; }
            }
          </style>
        </head>
        <body class="bg-gray-50 p-4">
          <div class="max-w-4xl mx-auto">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h1 class="text-2xl font-bold text-gray-900 mb-4">🚀 Generating Your Prototype...</h1>
              <div class="bg-gray-100 rounded-lg p-4 font-mono text-sm">
                <div class="streaming-cursor">${streamingContent}</div>
              </div>
              <div class="mt-4 text-sm text-gray-600">
                Phase: <span class="font-medium">${currentPhase || 'Initializing'}</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    if (generatedCode?.completeHTML) {
      return generatedCode.completeHTML;
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Prototype Generator</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-50 flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="text-6xl mb-4">🎨</div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Ready to Create</h1>
          <p class="text-gray-600">Enter your prompt to start generating your prototype</p>
        </div>
      </body>
      </html>
    `;
  };

  const getViewportSize = () => {
    switch (viewMode) {
      case 'mobile':
        return { width: '375px', height: '667px', scale: isMobile ? 0.8 : 1 };
      case 'tablet':
        return { width: '768px', height: '1024px', scale: isMobile ? 0.6 : 0.9 };
      default:
        return { width: '100%', height: '100%', scale: 1 };
    }
  };

  const downloadHTML = () => {
    const htmlContent = generatedCode?.completeHTML || getPreviewHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prototype.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openInNewTab = () => {
    const htmlContent = generatedCode?.completeHTML || getPreviewHTML();
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Auto-refresh when content changes
  useEffect(() => {
    console.log('🔄 Preview panel effect triggered:', {
      hasGeneratedCode: !!generatedCode,
      hasCompleteHTML: !!generatedCode?.completeHTML,
      streamingContent,
      isGenerating,
      currentPhase
    });
    updateIframeContent();
    setLastUpdateTime(new Date());
  }, [generatedCode, streamingContent, isGenerating, currentPhase]);

  // Handle fullscreen mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  const viewportSize = getViewportSize();

  const getPreviewContent = () => {
    if (isGenerating && currentPhase === 'generating' && streamingContent) {
      return (
        <div className="flex items-center justify-center h-full bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{streamingContent}</p>
          </div>
        </div>
      );
    }

    if (!generatedCode?.completeHTML) {
      return (
        <div className="flex items-center justify-center h-full bg-white">
          <div className="text-center">
            <Monitor className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Preview will appear here
            </h3>
            <p className="text-gray-500">
              Generate a prototype to see the live preview
            </p>
          </div>
        </div>
      );
    }

    return (
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        title="Generated Prototype Preview"
        sandbox="allow-scripts allow-same-origin"
      />
    );
  };

  return (
    <div className={`h-full flex flex-col bg-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Eye className="h-5 w-5 mr-2 text-blue-600" />
            Live Preview
          </h2>
          
          {/* Mode Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode('preview')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                previewMode === 'preview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setPreviewMode('code')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                previewMode === 'code'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Code
            </button>
          </div>
          
          {/* Device Toggle */}
          {previewMode === 'preview' && (
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'desktop'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Desktop View"
              >
                <Monitor className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => setViewMode('tablet')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'tablet'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Tablet View"
              >
                <Tablet className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'mobile'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Mobile View"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        
        {/* Status and Actions */}
        <div className="flex items-center space-x-3">
          {lastUpdateTime && (
            <div className="text-xs text-gray-500">
              Updated: {lastUpdateTime.toLocaleTimeString()}
            </div>
          )}
          
          {isGenerating && (
            <div className="flex items-center text-sm text-blue-600">
              <LoadingSpinner size="sm" className="mr-2" />
              Generating...
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <button
              onClick={refreshPreview}
              disabled={isRefreshing}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              title="Refresh Preview"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            
            <button
              onClick={openInNewTab}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="Open in New Tab"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
            
            <button
              onClick={downloadHTML}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="Download HTML"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {previewMode === 'preview' ? (
          <div className="h-full p-4 bg-gray-100 overflow-auto">
            <div className="h-full flex items-center justify-center">
              {/* Device Frame */}
              <div 
                className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300"
                style={{
                  width: viewportSize.width,
                  height: viewportSize.height,
                  maxWidth: '100%',
                  maxHeight: '100%',
                  transform: `scale(${viewportSize.scale})`
                }}
              >
                {error ? (
                  <div className="h-full flex items-center justify-center bg-red-50">
                    <div className="text-center p-6">
                      <div className="text-4xl mb-4">⚠️</div>
                      <h3 className="text-lg font-medium text-red-900 mb-2">Generation Error</h3>
                      <p className="text-red-700 text-sm">{error}</p>
                      <button
                        onClick={refreshPreview}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : (
                  getPreviewContent()
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full bg-gray-900 text-gray-100 overflow-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Code className="h-5 w-5 mr-2" />
                  Generated Code
                </h3>
                <div className="text-sm text-gray-400">
                  {generatedCode?.completeHTML ? 
                    `${generatedCode.completeHTML.length} characters` : 
                    'No code generated yet'
                  }
                </div>
              </div>
              
              <pre className="text-sm overflow-x-auto">
                <code className="language-html">
                  {generatedCode?.completeHTML || getPreviewHTML()}
                </code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};