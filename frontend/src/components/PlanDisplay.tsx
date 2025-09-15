import React from 'react';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { GenerationPlan } from '../types/generation';

interface PlanDisplayProps {
  plan: GenerationPlan;
  isLoading?: boolean;
}

export const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center mb-6">
            <div className="h-6 w-6 bg-gray-300 rounded-full mr-3"></div>
            <div className="h-6 w-32 bg-gray-300 rounded"></div>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-4 w-3/4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 w-full bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getTotalComplexityScore = () => {
    const scores = { low: 1, medium: 2, high: 3 };
    return plan.components.reduce((total, comp) => 
      total + (scores[comp.estimatedComplexity] || 2), 0
    );
  };

  const getComplexityLevel = (score: number) => {
    if (score <= plan.components.length * 1.5) return { level: 'Simple', color: 'text-green-600' };
    if (score <= plan.components.length * 2.5) return { level: 'Moderate', color: 'text-yellow-600' };
    return { level: 'Complex', color: 'text-red-600' };
  };

  const complexityScore = getTotalComplexityScore();
  const complexity = getComplexityLevel(complexityScore);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Plan Ready</h2>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500">Overall Complexity</div>
          <div className={`font-medium ${complexity.color}`}>
            {complexity.level}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {plan.components.length}
          </div>
          <div className="text-sm text-gray-600">Components</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {plan.timeline.estimatedMinutes}m
          </div>
          <div className="text-sm text-gray-600">Est. Time</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {plan.dependencies.length}
          </div>
          <div className="text-sm text-gray-600">Dependencies</div>
        </div>
      </div>

      {/* Components Preview */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Components Overview</h3>
        <div className="space-y-2">
          {plan.components.slice(0, 5).map((component, index) => (
            <div key={component.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <span className="text-lg mr-3">
                  {component.type === 'layout' ? '🏗️' : 
                   component.type === 'component' ? '🧩' : 
                   component.type === 'feature' ? '⚡' : '🔧'}
                </span>
                <div>
                  <div className="font-medium text-gray-900">{component.name}</div>
                  <div className="text-sm text-gray-600 truncate max-w-xs">
                    {component.description}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  component.estimatedComplexity === 'low' ? 'bg-green-100 text-green-700' :
                  component.estimatedComplexity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {component.estimatedComplexity}
                </span>
              </div>
            </div>
          ))}
          
          {plan.components.length > 5 && (
            <div className="text-center py-2 text-sm text-gray-500">
              +{plan.components.length - 5} more components...
            </div>
          )}
        </div>
      </div>

      {/* Architecture Summary */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Technical Approach</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Framework:</span>
            <span className="ml-2 font-medium">{plan.architecture.framework}</span>
          </div>
          <div>
            <span className="text-gray-600">Styling:</span>
            <span className="ml-2 font-medium">{plan.architecture.styling}</span>
          </div>
          <div>
            <span className="text-gray-600">Structure:</span>
            <span className="ml-2 font-medium">{plan.architecture.structure}</span>
          </div>
          <div>
            <span className="text-gray-600">Responsive:</span>
            <span className="ml-2 font-medium">
              {plan.architecture.responsive ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Breakdown */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3 flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Timeline Breakdown
        </h3>
        <div className="flex items-center space-x-4">
          {plan.timeline.phases.map((phase, index) => (
            <React.Fragment key={phase}>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-700">{phase}</span>
              </div>
              {index < plan.timeline.phases.length - 1 && (
                <div className="flex-1 h-px bg-gray-300"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Dependencies */}
      {plan.dependencies.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Required Dependencies</h3>
          <div className="flex flex-wrap gap-2">
            {plan.dependencies.map((dep, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
              >
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Warnings or Notes */}
      {complexity.level === 'Complex' && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Complex Project Detected</h4>
              <p className="text-sm text-yellow-700 mt-1">
                This project has high complexity. Generation may take longer than estimated, 
                and you might want to consider breaking it into smaller phases.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};