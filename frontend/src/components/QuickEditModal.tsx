import React, { useState, useEffect } from 'react';
import { X, Save, Wand2, RotateCcw, Eye, Code, Palette, Type } from 'lucide-react';
import { useWebSocket } from '../providers/WebSocketProvider';
import { useToast } from '../stores/toastStore';

interface QuickEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  elementInfo: ElementInfo | null;
  projectId: string;
}

interface ElementInfo {
  id: string;
  tagName: string;
  className: string;
  textContent: string;
  innerHTML: string;
  outerHTML: string;
  selector: string;
  attributes: Array<{ name: string; value: string }>;
}

type EditMode = 'text' | 'style' | 'attributes' | 'ai';

export const QuickEditModal: React.FC<QuickEditModalProps> = ({
  isOpen,
  onClose,
  elementInfo,
  projectId
}) => {
  const [editMode, setEditMode] = useState<EditMode>('text');
  const [textContent, setTextContent] = useState('');
  const [styleChanges, setStyleChanges] = useState('');
  const [attributeChanges, setAttributeChanges] = useState<Array<{ name: string; value: string }>>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewChanges, setPreviewChanges] = useState(false);
  
  const { editElement } = useWebSocket();
  const { success, error } = useToast();

  // Initialize form data when element changes
  useEffect(() => {
    if (elementInfo) {
      setTextContent(elementInfo.textContent);
      setAttributeChanges([...elementInfo.attributes]);
      setStyleChanges('');
      setAiPrompt('');
    }
  }, [elementInfo]);

  if (!isOpen || !elementInfo) return null;

  const handleSave = async () => {
    setIsProcessing(true);
    
    try {
      let editRequest = '';
      
      switch (editMode) {
        case 'text':
          editRequest = `Change the text content of ${elementInfo.selector} to: "${textContent}"`;
          break;
        case 'style':
          editRequest = `Apply these CSS styles to ${elementInfo.selector}: ${styleChanges}`;
          break;
        case 'attributes':
          const attrChanges = attributeChanges
            .filter(attr => attr.name && attr.value)
            .map(attr => `${attr.name}="${attr.value}"`)
            .join(' ');
          editRequest = `Update attributes of ${elementInfo.selector} to: ${attrChanges}`;
          break;
        case 'ai':
          editRequest = aiPrompt;
          break;
      }
      
      await editElement(projectId, elementInfo.id, editRequest);
      success('Element updated successfully');
      onClose();
    } catch (err) {
      error('Failed to update element');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (elementInfo) {
      setTextContent(elementInfo.textContent);
      setAttributeChanges([...elementInfo.attributes]);
      setStyleChanges('');
      setAiPrompt('');
    }
  };

  const addAttribute = () => {
    setAttributeChanges([...attributeChanges, { name: '', value: '' }]);
  };

  const updateAttribute = (index: number, field: 'name' | 'value', value: string) => {
    const updated = [...attributeChanges];
    updated[index][field] = value;
    setAttributeChanges(updated);
  };

  const removeAttribute = (index: number) => {
    setAttributeChanges(attributeChanges.filter((_, i) => i !== index));
  };

  const editModes = [
    { id: 'text' as const, label: 'Text', icon: Type, description: 'Edit text content' },
    { id: 'style' as const, label: 'Style', icon: Palette, description: 'Add CSS styles' },
    { id: 'attributes' as const, label: 'Attributes', icon: Code, description: 'Edit HTML attributes' },
    { id: 'ai' as const, label: 'AI Edit', icon: Wand2, description: 'Describe changes in natural language' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Quick Edit Element</h2>
            <p className="text-sm text-gray-600 mt-1">
              <code className="bg-gray-100 px-2 py-1 rounded">{elementInfo.selector}</code>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Edit Mode Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {editModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => setEditMode(mode.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    editMode === mode.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 inline mr-2" />
                  {mode.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {editMode === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Content
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter new text content..."
              />
              <p className="text-xs text-gray-500 mt-1">
                This will replace the current text content of the element
              </p>
            </div>
          )}

          {editMode === 'style' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSS Styles
              </label>
              <textarea
                value={styleChanges}
                onChange={(e) => setStyleChanges(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
                placeholder="color: red;&#10;background: blue;&#10;padding: 10px;"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter CSS properties (one per line or separated by semicolons)
              </p>
            </div>
          )}

          {editMode === 'attributes' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  HTML Attributes
                </label>
                <button
                  onClick={addAttribute}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Add Attribute
                </button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {attributeChanges.map((attr, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={attr.name}
                      onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                      placeholder="attribute name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <span className="text-gray-500">=</span>
                    <input
                      type="text"
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                      placeholder="value"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      onClick={() => removeAttribute(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {editMode === 'ai' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe Your Changes
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="e.g., Make this button larger and change the color to green, or Add a subtle shadow and rounded corners..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Describe the changes you want in natural language. AI will interpret and apply them.
              </p>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Example prompts:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• "Make this text bold and center it"</li>
                  <li>• "Change the background color to light blue"</li>
                  <li>• "Add padding and make the corners rounded"</li>
                  <li>• "Make this button look more modern"</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </button>
            
            <button
              onClick={() => setPreviewChanges(!previewChanges)}
              className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                previewChanges
                  ? 'text-blue-600 bg-blue-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Apply Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};