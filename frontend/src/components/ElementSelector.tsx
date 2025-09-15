import React, { useState, useRef, useEffect } from 'react';
import { MousePointer, Edit3, Trash2, Copy, Move, Eye, EyeOff } from 'lucide-react';
import { useGenerationStore } from '../stores/generationStore';
import { useWebSocket } from '../providers/WebSocketProvider';

interface ElementSelectorProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onElementSelect?: (elementInfo: ElementInfo) => void;
  className?: string;
}

interface ElementInfo {
  id: string;
  tagName: string;
  className: string;
  textContent: string;
  innerHTML: string;
  outerHTML: string;
  attributes: Array<{ name: string; value: string }>;
  boundingRect: DOMRect;
  selector: string;
}

export const ElementSelector: React.FC<ElementSelectorProps> = ({
  iframeRef,
  onElementSelect,
  className = ''
}) => {
  const [isActive, setIsActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const { generatedCode } = useGenerationStore();
  const { editElement } = useWebSocket();

  // Generate unique selector for element
  const generateSelector = (element: Element): string => {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }
    
    // Fallback to nth-child selector
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element) + 1;
      return `${element.tagName.toLowerCase()}:nth-child(${index})`;
    }
    
    return element.tagName.toLowerCase();
  };

  // Extract element information
  const extractElementInfo = (element: Element): ElementInfo => {
    const rect = element.getBoundingClientRect();
    
    return {
      id: element.id || `element-${Date.now()}`,
      tagName: element.tagName.toLowerCase(),
      className: element.className,
      textContent: element.textContent?.trim() || '',
      innerHTML: element.innerHTML,
      outerHTML: element.outerHTML,
      attributes: Array.from(element.attributes).map(attr => ({
        name: attr.name,
        value: attr.value
      })),
      boundingRect: rect,
      selector: generateSelector(element)
    };
  };

  // Add selection functionality to iframe
  useEffect(() => {
    if (!isActive || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument;
    
    if (!doc) return;

    // Inject selection styles
    const style = doc.createElement('style');
    style.id = 'kiro-selector-styles';
    style.textContent = `
      .kiro-hover {
        outline: 2px dashed #3b82f6 !important;
        outline-offset: 2px !important;
        cursor: pointer !important;
        position: relative !important;
      }
      
      .kiro-selected {
        outline: 3px solid #ef4444 !important;
        outline-offset: 2px !important;
        background-color: rgba(239, 68, 68, 0.1) !important;
        position: relative !important;
      }
      
      .kiro-hover::before {
        content: attr(data-kiro-tag);
        position: absolute;
        top: -24px;
        left: 0;
        background: #3b82f6;
        color: white;
        padding: 2px 6px;
        font-size: 11px;
        font-family: monospace;
        border-radius: 2px;
        z-index: 10000;
        pointer-events: none;
      }
      
      .kiro-selected::before {
        content: attr(data-kiro-tag);
        background: #ef4444;
      }
    `;
    
    // Remove existing styles
    const existingStyle = doc.getElementById('kiro-selector-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    doc.head.appendChild(style);

    // Add event listeners to all elements
    const elements = doc.querySelectorAll('*');
    
    const handleMouseEnter = (e: Event) => {
      const element = e.target as Element;
      if (element === doc.body || element === doc.documentElement) return;
      
      element.classList.add('kiro-hover');
      element.setAttribute('data-kiro-tag', element.tagName.toLowerCase());
      setHoveredElement(element.tagName.toLowerCase());
    };

    const handleMouseLeave = (e: Event) => {
      const element = e.target as Element;
      element.classList.remove('kiro-hover');
      element.removeAttribute('data-kiro-tag');
      setHoveredElement(null);
    };

    const handleClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      
      const element = e.target as Element;
      if (element === doc.body || element === doc.documentElement) return;
      
      // Clear previous selection
      doc.querySelectorAll('.kiro-selected').forEach(el => {
        el.classList.remove('kiro-selected');
        el.removeAttribute('data-kiro-tag');
      });
      
      // Select clicked element
      element.classList.remove('kiro-hover');
      element.classList.add('kiro-selected');
      element.setAttribute('data-kiro-tag', element.tagName.toLowerCase());
      
      const elementInfo = extractElementInfo(element);
      setSelectedElement(elementInfo);
      onElementSelect?.(elementInfo);
    };

    elements.forEach(element => {
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
      element.addEventListener('click', handleClick);
    });

    // Cleanup function
    return () => {
      elements.forEach(element => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
        element.removeEventListener('click', handleClick);
        element.classList.remove('kiro-hover', 'kiro-selected');
        element.removeAttribute('data-kiro-tag');
      });
      
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [isActive, iframeRef, onElementSelect]);

  const clearSelection = () => {
    setSelectedElement(null);
    setHoveredElement(null);
    
    if (iframeRef.current?.contentDocument) {
      const doc = iframeRef.current.contentDocument;
      doc.querySelectorAll('.kiro-selected, .kiro-hover').forEach(el => {
        el.classList.remove('kiro-selected', 'kiro-hover');
        el.removeAttribute('data-kiro-tag');
      });
    }
  };

  const copyElementHTML = () => {
    if (selectedElement) {
      navigator.clipboard.writeText(selectedElement.outerHTML);
    }
  };

  const deleteElement = () => {
    if (!selectedElement || !iframeRef.current?.contentDocument) return;
    
    const doc = iframeRef.current.contentDocument;
    const element = doc.querySelector(selectedElement.selector);
    
    if (element) {
      element.remove();
      setSelectedElement(null);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <MousePointer className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Element Selector</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className={`p-2 rounded-md transition-colors ${
              showOverlay
                ? 'text-blue-600 bg-blue-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title={showOverlay ? 'Hide Overlay' : 'Show Overlay'}
          >
            {showOverlay ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          
          <button
            onClick={() => setIsActive(!isActive)}
            className={`px-3 py-2 rounded-md transition-colors ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isActive ? 'Disable Selector' : 'Enable Selector'}
          </button>
        </div>
      </div>

      {/* Status */}
      {isActive && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-blue-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
              Selector Active - Click elements to select
            </div>
            {hoveredElement && (
              <div className="text-blue-600 font-mono">
                Hovering: &lt;{hoveredElement}&gt;
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Element Info */}
      {selectedElement && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Selected Element</h4>
            <div className="flex items-center space-x-1">
              <button
                onClick={copyElementHTML}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Copy HTML"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={deleteElement}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                title="Delete Element"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={clearSelection}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <span className="text-gray-600 w-16">Tag:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-blue-600">
                &lt;{selectedElement.tagName}&gt;
              </code>
            </div>
            
            {selectedElement.className && (
              <div className="flex items-center">
                <span className="text-gray-600 w-16">Class:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-green-600">
                  {selectedElement.className}
                </code>
              </div>
            )}
            
            <div className="flex items-center">
              <span className="text-gray-600 w-16">Selector:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-purple-600">
                {selectedElement.selector}
              </code>
            </div>
            
            {selectedElement.textContent && (
              <div>
                <span className="text-gray-600">Content:</span>
                <div className="mt-1 p-2 bg-gray-100 rounded text-gray-800 max-h-20 overflow-y-auto">
                  {selectedElement.textContent}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isActive && (
        <div className="p-4 text-center text-gray-500">
          <MousePointer className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Enable the selector to start selecting elements</p>
          <p className="text-xs mt-1">Click on any element in the preview to select it</p>
        </div>
      )}
    </div>
  );
};