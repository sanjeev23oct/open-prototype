import React from 'react';
import { CheckCircle, Circle, Clock, AlertCircle, Zap } from 'lucide-react';
import { GenerationProgress as ProgressType } from '../types/generation';

interface GenerationProgressProps {
  progress: ProgressType;
  isActive?: boolean;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({ 
  progress, 
  isActive = false 
}) => {
  const getStepStatus = (stepName: string) => {
    if (progress.completedSteps.includes(stepName)) return 'completed';
    if (progress.currentStep === stepName) return 'active';
    return 'pending';
  };

  const getStepIcon = (stepName: string) => {
    const status = getStepStatus(stepName);
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <Circle className="h-4 w-4 text-gray-300" />;
    }
  };

  const getAllSteps = () => {
    const allSteps = [...progress.completedSteps];
    if (!allSteps.includes(progress.currentStep)) {
      allSteps.push(progress.currentStep);
    }
    
    // Add remaining steps based on total
    const remainingCount = progress.totalSteps - allSteps.length;
    for (let i = 0; i < remainingCount; i++) {
      allSteps.push(`Step ${allSteps.length + 1}`);
    }
    
    return allSteps.slice(0, progress.totalSteps);
  };

  const steps = getAllSteps();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Zap className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            {progress.phase.charAt(0).toUpperCase() + progress.phase.slice(1)} Progress
          </h3>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {progress.percentage}%
          </div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Overall Progress</span>
          <span>{progress.completedSteps.length} of {progress.totalSteps} steps</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Current Step Highlight */}
      {isActive && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-600 mr-3 animate-pulse" />
            <div>
              <h4 className="font-medium text-blue-900">Currently Working On</h4>
              <p className="text-sm text-blue-700">{progress.currentStep}</p>
              {progress.explanation && (
                <p className="text-xs text-blue-600 mt-1">{progress.explanation}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const status = getStepStatus(step);
          const isCurrentStep = progress.currentStep === step;
          
          return (
            <div 
              key={index}
              className={`flex items-center p-3 rounded-lg border transition-colors ${
                status === 'completed' 
                  ? 'bg-green-50 border-green-200' 
                  : status === 'active'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex-shrink-0 mr-3">
                {getStepIcon(step)}
              </div>
              
              <div className="flex-1">
                <div className={`font-medium ${
                  status === 'completed' 
                    ? 'text-green-900' 
                    : status === 'active'
                    ? 'text-blue-900'
                    : 'text-gray-700'
                }`}>
                  {step}
                </div>
                
                {isCurrentStep && progress.explanation && (
                  <div className="text-sm text-blue-600 mt-1">
                    {progress.explanation}
                  </div>
                )}
              </div>
              
              <div className="flex-shrink-0 text-xs text-gray-500">
                {status === 'completed' && '✓'}
                {status === 'active' && (
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {progress.estimatedTimeRemaining}s
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time Estimate */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Estimated time remaining:</span>
          <span className="font-medium text-gray-900">
            {Math.max(0, progress.estimatedTimeRemaining)} seconds
          </span>
        </div>
      </div>
    </div>
  );
};