import React, { useState } from 'react';
import { Edit3, MousePointer, History } from 'lucide-react';
import { ElementSelector } from './ElementSelector';
import { QuickEditModal } from './QuickEditModal';
import { UndoRedoManager } from './UndoRedoManager';
import { useGenerationStore } from '../stores/generationStore';

interface SurgicalEditorProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  projectId: string;
  className?: string;
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

export const SurgicalEditor: React.FC<SurgicalEditorProps> = ({
  iframeRef,
  projectId,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'selector' | 'history'>('selector');
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const { generatedCode, isGenerating } = useGenerationStore();

  const handleElementSelect = (elementInfo: ElementInfo) => {
    setSelectedElement(elementInfo);
    setShowEditModal(true);
  };

  const handleEditComplete = () => {
    setShowEditModal(false);
    // Note: History management is handled by the UndoRedoManager component
  };

  const tabs = [
    {
      id: 'selector' as const,
      label: 'Element Selector',
      icon: MousePointer,
      description: 'Select and edit elements'
    },
    {
      id: 'history' as const,
      label: 'History',
      icon: History,
      description: 'Undo/redo changes'
    }
  ];

  if (!generatedCode?.completeHTML && !isGenerating) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Edit3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Generate content first to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Edit3 className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Surgical Editor</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title={tab.description}
                >
                  <Icon className="h-4 w-4 mr-2 inline" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'selector' && (
          <ElementSelector
            iframeRef={iframeRef}
            onElementSelect={handleElementSelect}
          />
        )}

        {activeTab === 'history' && (
          <UndoRedoManager
            iframeRef={iframeRef}
          />
        )}
      </div>

      {/* Quick Edit Modal */}
      <QuickEditModal
        isOpen={showEditModal}
        onClose={handleEditComplete}
        elementInfo={selectedElement}
        projectId="current-project"
      />

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Mode: {activeTab}</span>
            {selectedElement && (
              <span>Selected: {selectedElement.selector}</span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span>Project: {projectId}</span>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isGenerating ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
              }`} />
              {isGenerating ? 'Generating' : 'Ready'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};