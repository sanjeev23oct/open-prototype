import React, { useState } from 'react';
import { CheckCircle, Clock, Edit3, Play, AlertCircle, BarChart3, Timeline } from 'lucide-react';
import { GenerationPlan, ComponentPlan } from '../types/generation';
import { useGenerationStore } from '../stores/generationStore';
import { PlanDisplay } from './PlanDisplay';
import { PlanTimeline } from './PlanTimeline';
import { ComplexityAnalyzer } from './ComplexityAnalyzer';
import { PlanModificationModal } from './PlanModificationModal';

interface PlanningPhaseProps {
  plan: GenerationPlan;
  onApprove: () => void;
  onModify: (modifications: Partial<GenerationPlan>) => void;
}

export const PlanningPhase: React.FC<PlanningPhaseProps> = ({ 
  plan, 
  onApprove, 
  onModify 
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'timeline' | 'complexity'>('overview');
  const [showModificationModal, setShowModificationModal] = useState(false);
  const { isGenerating, currentPhase, completedPhases } = useGenerationStore();

  const handleModifyPlan = (modifiedPlan: GenerationPlan) => {
    onModify(modifiedPlan);
  };

  const views = [
    { id: 'overview' as const, label: 'Overview', icon: CheckCircle },
    { id: 'timeline' as const, label: 'Timeline', icon: Timeline },
    { id: 'complexity' as const, label: 'Analysis', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Generation Plan Ready</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowModificationModal(true)}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              disabled={isGenerating}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Modify Plan
            </button>
            
            <button
              onClick={onApprove}
              disabled={isGenerating}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-4 w-4 mr-2" />
              Approve & Generate
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {views.map((view) => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeView === view.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 inline mr-2" />
                  {view.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeView === 'overview' && <PlanDisplay plan={plan} />}
      {activeView === 'timeline' && (
        <PlanTimeline 
          plan={plan} 
          currentPhase={currentPhase || undefined}
          completedPhases={completedPhases}
        />
      )}
      {activeView === 'complexity' && <ComplexityAnalyzer plan={plan} />}

      {/* Modification Modal */}
      <PlanModificationModal
        plan={plan}
        isOpen={showModificationModal}
        onClose={() => setShowModificationModal(false)}
        onSave={handleModifyPlan}
      />
    </div>
  );
};


  );
};