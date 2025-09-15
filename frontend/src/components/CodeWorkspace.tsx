import React, { useState } from 'react';
import { Code, FileText, Navigation, Layers } from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { DocumentationPanel } from './DocumentationPanel';
import { CodeSectionNavigator } from './CodeSectionNavigator';
import { useGenerationStore } from '../stores/generationStore';

interface CodeWorkspaceProps {
  className?: string;
}

type WorkspaceTab = 'editor' | 'documentation' | 'navigator';

export const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('editor');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  const { generatedCode, isGenerating } = useGenerationStore();

  const handleSectionSelect = (section: any) => {
    // Switch to editor tab and scroll to the selected section
    setActiveTab('editor');
    // TODO: Implement scrolling to specific line in editor
    console.log('Selected section:', section);
  };

  const tabs = [
    {
      id: 'editor' as const,
      label: 'Code Editor',
      icon: Code,
      description: 'View and edit generated code'
    },
    {
      id: 'documentation' as const,
      label: 'Documentation',
      icon: FileText,
      description: 'Comprehensive usage guide'
    },
    {
      id: 'navigator' as const,
      label: 'Navigator',
      icon: Navigation,
      description: 'Navigate code sections'
    }
  ];

  if (!generatedCode?.completeHTML && !isGenerating) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Code className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Generate content first to access the code workspace</p>
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
          <h3 className="text-lg font-semibold text-gray-900">Code Workspace</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Tab Navigation */}
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

          {/* Sidebar Toggle */}
          <button
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className={`p-2 rounded-md transition-colors ${
              sidebarVisible
                ? 'text-blue-600 bg-blue-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title={sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
          >
            <Layers className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex h-[600px]">
        {/* Main Content */}
        <div className={`flex-1 ${sidebarVisible ? 'border-r border-gray-200' : ''}`}>
          {activeTab === 'editor' && (
            <CodeEditor className="h-full border-0 rounded-none" />
          )}
          
          {activeTab === 'documentation' && (
            <DocumentationPanel className="h-full border-0 rounded-none" />
          )}
          
          {activeTab === 'navigator' && (
            <CodeSectionNavigator 
              onSectionSelect={handleSectionSelect}
              className="h-full border-0 rounded-none" 
            />
          )}
        </div>

        {/* Sidebar */}
        {sidebarVisible && (
          <div className="w-80 bg-gray-50">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Quick Navigation</h4>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Quick Stats */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Code Stats</h5>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Total Lines:</span>
                    <span>{generatedCode?.completeHTML?.split('\n').length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Characters:</span>
                    <span>{generatedCode?.completeHTML?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File Size:</span>
                    <span>{Math.round((generatedCode?.completeHTML?.length || 0) / 1024)}KB</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h5>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('editor')}
                    className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    View Code
                  </button>
                  <button
                    onClick={() => setActiveTab('documentation')}
                    className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Read Docs
                  </button>
                  <button
                    onClick={() => setActiveTab('navigator')}
                    className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Navigate Sections
                  </button>
                </div>
              </div>

              {/* Recent Sections */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Recent Sections</h5>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center justify-between py-1">
                    <span>Header</span>
                    <span className="text-blue-600">L12</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span>Navigation</span>
                    <span className="text-blue-600">L45</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span>Main Content</span>
                    <span className="text-blue-600">L78</span>
                  </div>
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Shortcuts</h5>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Copy Code:</span>
                    <kbd className="bg-gray-100 px-1 rounded">Ctrl+C</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Search:</span>
                    <kbd className="bg-gray-100 px-1 rounded">Ctrl+F</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Download:</span>
                    <kbd className="bg-gray-100 px-1 rounded">Ctrl+S</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Active: {activeTab}</span>
            <span>Sidebar: {sidebarVisible ? 'Visible' : 'Hidden'}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isGenerating ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
              }`} />
              {isGenerating ? 'Generating' : 'Ready'}
            </div>
            <span>Workspace Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};