import React from 'react';
import { Clock, CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { GenerationPlan } from '../types/generation';

interface PlanTimelineProps {
  plan: GenerationPlan;
  currentPhase?: string;
  completedPhases?: string[];
}

export const PlanTimeline: React.FC<PlanTimelineProps> = ({ 
  plan, 
  currentPhase,
  completedPhases = [] 
}) => {
  const phases = [
    {
      id: 'planning',
      name: 'Planning',
      description: 'Analyze requirements and create detailed plan',
      estimatedTime: Math.round(plan.timeline.estimatedMinutes * 0.2),
    },
    {
      id: 'generation',
      name: 'Code Generation',
      description: 'Generate components with real-time streaming',
      estimatedTime: Math.round(plan.timeline.estimatedMinutes * 0.7),
    },
    {
      id: 'documentation',
      name: 'Documentation',
      description: 'Create comprehensive usage documentation',
      estimatedTime: Math.round(plan.timeline.estimatedMinutes * 0.1),
    },
  ];

  const getPhaseStatus = (phaseId: string) => {
    if (completedPhases.includes(phaseId)) return 'completed';
    if (currentPhase === phaseId) return 'active';
    return 'pending';
  };

  const getPhaseIcon = (phaseId: string) => {
    const status = getPhaseStatus(phaseId);
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'active':
        return <Clock className="h-6 w-6 text-blue-500 animate-pulse" />;
      default:
        return <Circle className="h-6 w-6 text-gray-300" />;
    }
  };

  const getPhaseStyles = (phaseId: string) => {
    const status = getPhaseStatus(phaseId);
    
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'active':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getTotalTime = () => {
    return phases.reduce((total, phase) => total + phase.estimatedTime, 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Generation Timeline</h3>
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-1" />
          Total: {getTotalTime()} minutes
        </div>
      </div>

      <div className="space-y-4">
        {phases.map((phase, index) => (
          <React.Fragment key={phase.id}>
            <div className={`border rounded-lg p-4 transition-colors ${getPhaseStyles(phase.id)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getPhaseIcon(phase.id)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{phase.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{phase.description}</p>
                    
                    {/* Component breakdown for generation phase */}
                    {phase.id === 'generation' && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-2">Components to build:</div>
                        <div className="flex flex-wrap gap-1">
                          {plan.components.slice(0, 6).map((component, idx) => (
                            <span
                              key={component.id}
                              className="text-xs px-2 py-1 bg-white border border-gray-200 rounded text-gray-700"
                            >
                              {component.name}
                            </span>
                          ))}
                          {plan.components.length > 6 && (
                            <span className="text-xs px-2 py-1 text-gray-500">
                              +{plan.components.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {phase.estimatedTime}m
                  </div>
                  <div className="text-xs text-gray-500">estimated</div>
                </div>
              </div>
            </div>
            
            {index < phases.length - 1 && (
              <div className="flex justify-center">
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Overall Progress</span>
          <span>{Math.round((completedPhases.length / phases.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedPhases.length / phases.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};