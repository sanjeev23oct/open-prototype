import React, { useState, useRef, useEffect } from 'react';
import { MousePointer, Hand, Eye, EyeOff, Maximize2, RotateCcw } from 'lucide-react';
import { useGenerationStore } from '../stores/generationStore';

interface InteractivePreviewProps {
  className?: string;
}

type InteractionMode = 'view' | 'select' | 'interact';

export const InteractivePreview: React.FC<InteractivePreviewProps> = ({ className = '' }) => {
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('view');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [showElementOutlines, setShowElementOutlines] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const { generatedCode, isGenerating } = useGenerationStore();

  // Inject interaction scripts into iframe
  useEffect(() => {
    if (!iframeRef.current || !generatedCode?.completeHTML) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument;
    
    if (doc) {
      // Inject CSS for element highlighting
      const style = doc.createElement('style');
      style.textContent = `
        .kiro-element-hover {
          outline: 2px dashed #3b82f6 !important;
          outline-offset: 2px !important;
          cursor: pointer !important;
        }
        .kiro-element-selected {
          outline: 2px solid #ef4444 !important;
          outline-offset: 2px !important;
          background-color: rgba(239, 68, 68, 0.1) !important;
        }
        .kiro-element-outline {
          outline: 1px solid rgba(156, 163, 175, 0.5) !important;
          outline-offset: 1px !important;
        }
      `;
      doc.head.appendChild(style);

      // Add interaction event listeners
      if (interactionMode === 'select') {
        addSelectionListeners(doc);
      } else {
        removeSelectionListeners(doc);
      }

      // Add element outlines if enabled
      if (showElementOutlines) {
        addElementOutlines(doc);
      } else {
        removeElementOutlines(doc);
      }
    }
  }, [generatedCode, interactionMode, showElementOutlines]);

  const addSelectionListeners = (doc: Document) => {
    const elements = doc.querySelectorAll('*');
    
    elements.forEach((element, index) => {
      const elementId = `kiro-element-${index}`;
      element.setAttribute('data-kiro-id', elementId);
      
      element.addEventListener('mouseenter', () => {
        element.classList.add('kiro-element-hover');
        setHoveredElement(elementId);
      });
      
      element.addEventListener('mouseleave', () => {
        element.classList.remove('kiro-element-hover');
        setHoveredElement(null);
      });
      
      element.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Remove previous selection
        doc.querySelectorAll('.kiro-element-selected').forEach(el => {
          el.classList.remove('kiro-element-selected');
        });
        
        // Add selection to clicked element
        element.classList.add('kiro-element-selected');
        setSelectedElement(elementId);
      });
    });
  };

  const removeSelectionListeners = (doc: Document) => {
    const elements = doc.querySelectorAll('[data-kiro-id]');
    elements.forEach(element => {
      element.classList.remove('kiro-element-hover', 'kiro-element-selected');
      // Note: We can't remove event listeners added this way, but they won't interfere
    });
    setSelectedElement(null);
    setHoveredElement(null);
  };

  const addElementOutlines = (doc: Document) => {
    const elements = doc.querySelectorAll('div, section, article, header, footer, nav, main, aside, p, h1, h2, h3, h4, h5, h6');
    elements.forEach(element => {
      element.classList.add('kiro-element-outline');
    });
  };

  const removeElementOutlines = (doc: Document) => {
    const elements = doc.querySelectorAll('.kiro-element-outline');
    elements.forEach(element => {
      element.classList.remove('kiro-element-outline');
    });
  };

  const getSelectedElementInfo = () => {
    if (!selectedElement || !iframeRef.current) return null;
    
    const doc = iframeRef.current.contentDocument;
    if (!doc) return null;
    
    const element = doc.querySelector(`[data-kiro-id="${selectedElement}"]`);
    if (!element) return null;
    
    return {
      tagName: element.tagName.toLowerCase(),
      className: element.className,
      id: element.id,
      textContent: element.textContent?.slice(0, 100) + (element.textContent && element.textContent.length > 100 ? '...' : ''),
      attributes: Array.from(element.attributes).map(attr => ({
        name: attr.name,
        value: attr.value
      }))
    };
  };

  const resetInteractions = () => {
    setInteractionMode('view');
    setSelectedElement(null);
    setHoveredElement(null);
    setShowElementOutlines(false);
    
    if (iframeRef.current?.contentDocument) {
      removeSelectionListeners(iframeRef.current.contentDocument);
      removeElementOutlines(iframeRef.current.contentDocument);
    }
  };

  const selectedInfo = getSelectedElementInfo();

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Interactive Preview</h3>
        
        <div className="flex items-center space-x-2">
          {/* Interaction Mode Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setInteractionMode('view')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                interactionMode === 'view'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="View Mode"
            >
              <Eye className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setInteractionMode('select')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                interactionMode === 'select'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Select Mode"
            >
              <MousePointer className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setInteractionMode('interact')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                interactionMode === 'interact'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Interact Mode"
            >
              <Hand className="h-4 w-4" />
            </button>
          </div>

          {/* Element Outlines Toggle */}
          <button
            onClick={() => setShowElementOutlines(!showElementOutlines)}
            className={`p-2 rounded-md transition-colors ${
              showElementOutlines
                ? 'text-blue-600 bg-blue-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title={showElementOutlines ? 'Hide Element Outlines' : 'Show Element Outlines'}
          >
            {showElementOutlines ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>

          {/* Reset Button */}
          <button
            onClick={resetInteractions}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Reset Interactions"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex">
        {/* Preview Area */}
        <div className="flex-1 relative">
          <div className="h-96 bg-gray-100 overflow-hidden">
            {generatedCode?.completeHTML ? (
              <iframe
                ref={iframeRef}
                className="w-full h-full border-0"
                title="Interactive Preview"
                sandbox="allow-scripts allow-same-origin"
                srcDoc={generatedCode.completeHTML}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Maximize2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No content to preview yet</p>
                  {isGenerating && <p className="text-sm mt-1">Generating...</p>}
                </div>
              </div>
            )}
          </div>

          {/* Interaction Overlay */}
          <div 
            ref={overlayRef}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Mode Indicator */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded">
              Mode: {interactionMode}
            </div>

            {/* Hovered Element Info */}
            {hoveredElement && interactionMode === 'select' && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                Hovering: {hoveredElement}
              </div>
            )}
          </div>
        </div>

        {/* Element Inspector */}
        {selectedElement && selectedInfo && (
          <div className="w-80 border-l border-gray-200 bg-gray-50">
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Element Inspector</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700">Tag</label>
                  <div className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                    &lt;{selectedInfo.tagName}&gt;
                  </div>
                </div>

                {selectedInfo.id && (
                  <div>
                    <label className="text-xs font-medium text-gray-700">ID</label>
                    <div className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                      #{selectedInfo.id}
                    </div>
                  </div>
                )}

                {selectedInfo.className && (
                  <div>
                    <label className="text-xs font-medium text-gray-700">Classes</label>
                    <div className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                      .{selectedInfo.className.split(' ').join(' .')}
                    </div>
                  </div>
                )}

                {selectedInfo.textContent && (
                  <div>
                    <label className="text-xs font-medium text-gray-700">Content</label>
                    <div className="text-sm text-gray-900 bg-white px-2 py-1 rounded border max-h-20 overflow-y-auto">
                      {selectedInfo.textContent}
                    </div>
                  </div>
                )}

                {selectedInfo.attributes.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-700">Attributes</label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedInfo.attributes.map((attr, index) => (
                        <div key={index} className="text-xs bg-white px-2 py-1 rounded border">
                          <span className="font-mono text-blue-600">{attr.name}</span>
                          <span className="text-gray-500">="</span>
                          <span className="font-mono text-green-600">{attr.value}</span>
                          <span className="text-gray-500">"</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedElement(null)}
                  className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Mode: {interactionMode}</span>
            {selectedElement && <span>Selected: {selectedElement}</span>}
            {hoveredElement && <span>Hovered: {hoveredElement}</span>}
          </div>
          <div className="flex items-center space-x-4">
            <span>Outlines: {showElementOutlines ? 'On' : 'Off'}</span>
            <span>Interactive: {interactionMode !== 'view' ? 'On' : 'Off'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};