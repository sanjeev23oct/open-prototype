import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, Code, FileText, Zap } from 'lucide-react';
import { useGenerationStore } from '../stores/generationStore';
import { useWebSocket } from '../providers/WebSocketProvider';
import { LoadingSpinner } from './LoadingSpinner';

export const StreamingGeneration: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [explanation, setExplanation] = useState('');
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  
  const {
    isGenerating,
    currentPhase,
    generationProgress,
    streamingContent,
    error
  } = useGenerationStore();

  const { pauseGeneration, resumeGeneration } = useWebSocket();

  const handlePauseResume = () => {
    if (isPaused) {
      resumeGeneration('current-project-id'); // TODO: Get actual project ID
      setIsPaused(false);
    } else {
      pauseGeneration('current-project-id');
      setIsPaused(true);
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'planning':
        return <FileText className="h-5 w-5" />;
      case 'generating':
        return <Code className="h-5 w-5" />;
      case 'documenting':
        return <FileText className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'planning':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'generating':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'documenting':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isGenerating) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg border ${getPhaseColor(currentPhase || '')}`}>
            {getPhaseIcon(currentPhase || '')}
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentPhase === 'planning' && 'Creating Plan'}
              {currentPhase === 'generating' && 'Generating Code'}
              {currentPhase === 'documenting' && 'Writing Documentation'}
            </h3>
            <p className="text-sm text-gray-600">
              Real-time generation with step-by-step explanations
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePauseResume}
            className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Section */}
      {generationProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900">
                {generationProgress.currentStep}
              </span>
              {isPaused && (
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                  Paused
                </span>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              {generationProgress.estimatedTimeRemaining}s remaining
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${generationProgress.percentage}%` }}
            />
          </div>

          <div className="text-xs text-gray-500">
            {generationProgress.completedSteps.length} of {generationProgress.totalSteps} steps completed
          </div>
        </div>
      )}

      {/* Current Explanation */}
      {generationProgress?.explanation && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <LoadingSpinner size="sm" color="blue" className="mt-1" />
            </div>
            <div className="ml-3">
              <h4 className="font-medium text-blue-900">What I'm doing now</h4>
              <p className="text-sm text-blue-700 mt-1">
                {generationProgress.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Streaming Content */}
      {streamingContent && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Live Generation Stream</h4>
          <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
            <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
              {streamingContent}
              <span className="animate-pulse">|</span>
            </pre>
          </div>
        </div>
      )}

      {/* Completed Steps */}
      {generationProgress && generationProgress.completedSteps.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Completed Steps</h4>
          <div className="space-y-2">
            {generationProgress.completedSteps.map((step, index) => (
              <div key={index} className="flex items-center p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{index + 1}</span>
                </div>
                <span className="ml-3 text-sm text-green-800">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-900">Generation Error</h4>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Performance Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {generationProgress?.percentage || 0}%
          </div>
          <div className="text-xs text-gray-600">Complete</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {generationProgress?.completedSteps.length || 0}
          </div>
          <div className="text-xs text-gray-600">Steps Done</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Math.max(0, (generationProgress?.estimatedTimeRemaining || 0))}s
          </div>
          <div className="text-xs text-gray-600">ETA</div>
        </div>
      </div>
    </div>
  );
};