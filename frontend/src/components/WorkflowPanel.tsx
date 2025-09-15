import React from 'react';
import { CheckCircle, Circle, Clock, ArrowRight } from 'lucide-react';
import { useGenerationStore } from '../stores/generationStore';

export const WorkflowPanel: React.FC = () => {
  const { 
    currentPhase, 
    isGenerating, 
    generationProgress,
    completedPhases 
  } = useGenerationStore();

  const phases = [
    { 
      id: 'planning', 
      label: 'Planning', 
      description: 'Analyzing requirements and creating detailed plan' 
    },
    { 
      id: 'generating', 
      label: 'Generation', 
      description: 'Building components with real-time explanations' 
    },
    { 
      id: 'documenting', 
      label: 'Documentation', 
      description: 'Creating comprehensive usage guide' 
    }
  ];

  const getPhaseStatus = (phaseId: string) => {
    if (completedPhases.includes(phaseId)) return 'completed';
    if (currentPhase === phaseId && isGenerating) return 'active';
    return 'pending';
  };

  const getPhaseIcon = (phaseId: string) => {
    const status = getPhaseStatus(phaseId);
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'active':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  const getPhaseStyles = (phaseId: string) => {
    const status = getPhaseStatus(phaseId);
    
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'active':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Generation Workflow</h3>
        
        {generationProgress && (
          <div className="text-sm text-gray-600">
            Progress: {Math.round(generationProgress.percentage)}%
          </div>
        )}
      </div>

      {/* Phase Indicators */}
      <div className="flex items-center space-x-4">
        {phases.map((phase, index) => (
          <React.Fragment key={phase.id}>
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border transition-colors ${getPhaseStyles(phase.id)}`}>
              {getPhaseIcon(phase.id)}
              
              <div>
                <div className="font-medium text-sm">{phase.label}</div>
                <div className="text-xs opacity-75">{phase.description}</div>
              </div>
            </div>
            
            {index < phases.length - 1 && (
              <ArrowRight className="h-4 w-4 text-gray-400" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Progress Bar */}
      {isGenerating && generationProgress && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>{generationProgress.currentStep}</span>
            <span>{generationProgress.estimatedTimeRemaining}s remaining</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${generationProgress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Current Activity */}
      {isGenerating && currentPhase && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-sm text-blue-700">
              {currentPhase === 'planning' && 'Creating detailed plan...'}
              {currentPhase === 'generating' && 'Generating components...'}
              {currentPhase === 'documenting' && 'Creating documentation...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};