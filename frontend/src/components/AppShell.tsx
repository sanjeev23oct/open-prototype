import React, { useState } from 'react';
import { Settings, Zap, Menu, X, FolderOpen, Plus } from 'lucide-react';
import { InputPanel } from './InputPanel';
import { PreviewPanel } from './PreviewPanel';
import { WorkflowPanel } from './WorkflowPanel';
import { ModelConfigPanel } from './ModelConfigPanel';
import { PlanningPhase } from './PlanningPhase';
import { StreamingGeneration } from './StreamingGeneration';
import { IterativePanel } from './IterativePanel';
import { ProjectManager } from './ProjectManager';
import { useGenerationStore } from '../stores/generationStore';
import { useWebSocket } from '../providers/WebSocketProvider';
import { useResponsive } from '../hooks/useResponsive';

export const AppShell: React.FC = () => {
  const [showModelConfig, setShowModelConfig] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'projects'>('new');
  const { isMobile, isTablet } = useResponsive();
  
  const { 
    currentPhase, 
    currentPlan, 
    isGenerating,
    completedPhases,
    generatedCode,
    startGeneration,
    approvePlan 
  } = useGenerationStore();
  
  const { wsService, isConnected } = useWebSocket();
  const currentModel = 'DeepSeek Chat';

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              AI Prototype Generator
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {!isMobile && (
              <>
                <div className="text-sm text-gray-600">
                  Model: <span className="font-medium">{currentModel}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  {isConnected ? 'Connected' : 'Disconnected'}
                </div>
              </>
            )}
            
            <button
              onClick={() => setShowModelConfig(true)}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" />
              {!isMobile && 'Settings'}
            </button>

            {isMobile && (
              <button
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                {showMobileSidebar ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Input, Planning, Generation, or Iterative */}
        <div className={`${
          isMobile 
            ? `fixed inset-y-0 left-0 z-50 w-80 transform transition-transform ${
                showMobileSidebar ? 'translate-x-0' : '-translate-x-full'
              }`
            : isTablet 
              ? 'w-2/5' 
              : 'w-1/3'
        } border-r border-gray-200 bg-white overflow-y-auto flex flex-col`}>
          
          {/* Tab Navigation */}
          {!isGenerating && !currentPlan && (
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('new')}
                className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'new'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'projects'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                My Projects
              </button>
            </div>
          )}

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Show IterativePanel if generation is complete */}
            {completedPhases.includes('generating') && !isGenerating && generatedCode ? (
              <IterativePanel />
            ) : /* Show PlanningPhase if we have a plan but haven't started generating */
            currentPlan && !completedPhases.includes('generating') && currentPhase !== 'generating' && currentPhase !== 'documenting' ? (
              <div className="p-6">
                <PlanningPhase
                  plan={currentPlan}
                  onApprove={async () => {
                    await approvePlan();
                    await startGeneration(wsService);
                    if (isMobile) setShowMobileSidebar(false);
                  }}
                  onModify={(modifications) => {
                    // TODO: Implement plan modification
                    console.log('Plan modifications:', modifications);
                  }}
                />
              </div>
            ) : /* Show StreamingGeneration if currently generating */
            isGenerating ? (
              <div className="p-6">
                <StreamingGeneration />
              </div>
            ) : /* Show ProjectManager or InputPanel based on active tab */
            activeTab === 'projects' ? (
              <ProjectManager />
            ) : (
              <InputPanel onGenerate={() => {
                setActiveTab('new');
                if (isMobile) setShowMobileSidebar(false);
              }} />
            )}
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobile && showMobileSidebar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Right Panel - Preview */}
        <div className="flex-1 bg-gray-50">
          <PreviewPanel />
        </div>
      </div>

      {/* Bottom Panel - Workflow */}
      <div className="border-t border-gray-200 bg-white">
        <WorkflowPanel />
      </div>

      {/* Model Configuration Modal */}
      {showModelConfig && (
        <ModelConfigPanel onClose={() => setShowModelConfig(false)} />
      )}
    </div>
  );
};