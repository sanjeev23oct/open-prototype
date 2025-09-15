import React, { useState } from 'react';
import { X, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { GenerationPlan, ComponentPlan } from '../types/generation';

interface PlanModificationModalProps {
  plan: GenerationPlan;
  isOpen: boolean;
  onClose: () => void;
  onSave: (modifiedPlan: GenerationPlan) => void;
}

export const PlanModificationModal: React.FC<PlanModificationModalProps> = ({
  plan,
  isOpen,
  onClose,
  onSave,
}) => {
  const [modifiedPlan, setModifiedPlan] = useState<GenerationPlan>(plan);
  const [activeTab, setActiveTab] = useState<'components' | 'architecture' | 'timeline'>('components');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(modifiedPlan);
    onClose();
  };

  const addComponent = () => {
    const newComponent: ComponentPlan = {
      id: crypto.randomUUID(),
      name: 'New Component',
      type: 'component',
      description: 'Add description...',
      dependencies: [],
      estimatedComplexity: 'medium',
    };

    setModifiedPlan(prev => ({
      ...prev,
      components: [...prev.components, newComponent],
    }));
  };

  const updateComponent = (index: number, updates: Partial<ComponentPlan>) => {
    setModifiedPlan(prev => ({
      ...prev,
      components: prev.components.map((comp, i) => 
        i === index ? { ...comp, ...updates } : comp
      ),
    }));
  };

  const removeComponent = (index: number) => {
    setModifiedPlan(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index),
    }));
  };

  const updateArchitecture = (updates: Partial<typeof plan.architecture>) => {
    setModifiedPlan(prev => ({
      ...prev,
      architecture: { ...prev.architecture, ...updates },
    }));
  };

  const updateTimeline = (updates: Partial<typeof plan.timeline>) => {
    setModifiedPlan(prev => ({
      ...prev,
      timeline: { ...prev.timeline, ...updates },
    }));
  };

  const addDependency = (dependency: string) => {
    if (dependency && !modifiedPlan.dependencies.includes(dependency)) {
      setModifiedPlan(prev => ({
        ...prev,
        dependencies: [...prev.dependencies, dependency],
      }));
    }
  };

  const removeDependency = (index: number) => {
    setModifiedPlan(prev => ({
      ...prev,
      dependencies: prev.dependencies.filter((_, i) => i !== index),
    }));
  };

  const tabs = [
    { id: 'components' as const, label: 'Components', count: modifiedPlan.components.length },
    { id: 'architecture' as const, label: 'Architecture' },
    { id: 'timeline' as const, label: 'Timeline & Dependencies' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Modify Generation Plan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'components' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Components</h3>
                <button
                  onClick={addComponent}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Component
                </button>
              </div>

              <div className="space-y-4">
                {modifiedPlan.components.map((component, index) => (
                  <div key={component.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Component Name
                        </label>
                        <input
                          type="text"
                          value={component.name}
                          onChange={(e) => updateComponent(index, { name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={component.type}
                          onChange={(e) => updateComponent(index, { type: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="layout">Layout</option>
                          <option value="component">Component</option>
                          <option value="feature">Feature</option>
                          <option value="utility">Utility</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={component.description}
                        onChange={(e) => updateComponent(index, { description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Complexity
                        </label>
                        <select
                          value={component.estimatedComplexity}
                          onChange={(e) => updateComponent(index, { estimatedComplexity: e.target.value as any })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      <button
                        onClick={() => removeComponent(index)}
                        className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Architecture Settings</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Framework
                  </label>
                  <select
                    value={modifiedPlan.architecture.framework}
                    onChange={(e) => updateArchitecture({ framework: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="vanilla">Vanilla JavaScript</option>
                    <option value="react">React</option>
                    <option value="vue">Vue.js</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Styling
                  </label>
                  <select
                    value={modifiedPlan.architecture.styling}
                    onChange={(e) => updateArchitecture({ styling: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="tailwind">TailwindCSS</option>
                    <option value="css">Custom CSS</option>
                    <option value="styled-components">Styled Components</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Structure Description
                </label>
                <textarea
                  value={modifiedPlan.architecture.structure}
                  onChange={(e) => updateArchitecture({ structure: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="responsive"
                  checked={modifiedPlan.architecture.responsive}
                  onChange={(e) => updateArchitecture({ responsive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="responsive" className="ml-2 text-sm text-gray-700">
                  Responsive Design
                </label>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Minutes
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={modifiedPlan.timeline.estimatedMinutes}
                    onChange={(e) => updateTimeline({ estimatedMinutes: parseInt(e.target.value) })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dependencies</h3>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {modifiedPlan.dependencies.map((dep, index) => (
                      <span
                        key={index}
                        className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {dep}
                        <button
                          onClick={() => removeDependency(index)}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Add dependency (e.g., tailwindcss)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addDependency((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                        addDependency(input.value);
                        input.value = '';
                      }}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Plan Modifications</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Changes to the plan may affect the estimated timeline and final output. 
                Review your modifications carefully before proceeding.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};