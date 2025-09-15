import React, { useState } from 'react';
import { Play, Pause, Square, RotateCcw, Settings, AlertTriangle } from 'lucide-react';
import { useGenerationStore } from '../stores/generationStore';
import { useWebSocket } from '../providers/WebSocketProvider';
import { useToast } from '../stores/toastStore';

interface GenerationControlsProps {
  projectId: string;
  onStop?: () => void;
  onRestart?: () => void;
}

export const GenerationControls: React.FC<GenerationControlsProps> = ({
  projectId,
  onStop,
  onRestart
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  
  const { 
    isGenerating, 
    currentPhase, 
    generationProgress,
    error 
  } = useGenerationStore();
  
  const { 
    pauseGeneration, 
    resumeGeneration, 
    isConnected 
  } = useWebSocket();
  
  const { success, error: showError } = useToast();

  const handlePauseResume = async () => {
    if (!isConnected) {
      showError('Not connected to server');
      return;
    }

    try {
      if (isPaused) {
        resumeGeneration(projectId);
        setIsPaused(false);
        success('Generation resumed');
      } else {
        pauseGeneration(projectId);
        setIsPaused(true);
        success('Generation paused');
      }
    } catch (err) {
      showError('Failed to control generation');
    }
  };

  const handleStop = () => {
    if (showStopConfirm) {
      // Actually stop generation
      onStop?.();
      setShowStopConfirm(false);
      setIsPaused(false);
      success('Generation stopped');
    } else {
      setShowStopConfirm(true);
      // Auto-hide confirmation after 5 seconds
      setTimeout(() => setShowStopConfirm(false), 5000);
    }
  };

  const handleRestart = () => {
    onRestart?.();
    setIsPaused(false);
    setShowStopConfirm(false);
  };

  const getStatusColor = () => {
    if (error) return 'text-red-600 bg-red-50 border-red-200';
    if (isPaused) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (isGenerating) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (isPaused) return 'Paused';
    if (isGenerating) return 'Generating';
    return 'Ready';
  };

  if (!isGenerating) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        {/* Status Indicator */}
        <div className="flex items-center">
          <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor()}`}>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                error ? 'bg-red-500' :
                isPaused ? 'bg-yellow-500' :
                isGenerating ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
              }`} />
              {getStatusText()}
            </div>
          </div>
          
          {currentPhase && (
            <span className="ml-3 text-sm text-gray-600 capitalize">
              {currentPhase} Phase
            </span>
          )}
          
          {generationProgress && (
            <span className="ml-3 text-sm text-gray-500">
              {generationProgress.percentage}% complete
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Connection Status */}
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} title={isConnected ? 'Connected' : 'Disconnected'} />

          {/* Pause/Resume Button */}
          <button
            onClick={handlePauseResume}
            disabled={!isConnected || error !== null}
            className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={isPaused ? 'Resume generation' : 'Pause generation'}
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-1" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </>
            )}
          </button>

          {/* Stop Button */}
          <button
            onClick={handleStop}
            className={`flex items-center px-3 py-2 rounded-md transition-colors ${
              showStopConfirm
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={showStopConfirm ? 'Click again to confirm stop' : 'Stop generation'}
          >
            {showStopConfirm ? (
              <>
                <AlertTriangle className="h-4 w-4 mr-1" />
                Confirm Stop
              </>
            ) : (
              <>
                <Square className="h-4 w-4 mr-1" />
                Stop
              </>
            )}
          </button>

          {/* Restart Button */}
          {(error || !isGenerating) && (
            <button
              onClick={handleRestart}
              className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
              title="Restart generation"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Restart
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Generation Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Details */}
      {generationProgress && !error && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Current: {generationProgress.currentStep}</span>
            <span>ETA: {generationProgress.estimatedTimeRemaining}s</span>
          </div>
          
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${generationProgress.percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};