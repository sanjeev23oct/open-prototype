import React, { useState } from 'react';
import { Send, Wand2 } from 'lucide-react';
import { useGenerationStore } from '../stores/generationStore';
import { GenerationPreferences } from '../types/generation';

interface InputPanelProps {
  onGenerate?: () => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [preferences, setPreferences] = useState<GenerationPreferences>({
    outputType: 'html-js',
    framework: 'vanilla',
    styling: 'tailwind',
    responsive: true,
    accessibility: true
  });

  const { 
    isGenerating, 
    currentPhase, 
    generatePlan,
    error 
  } = useGenerationStore();

  const handleGeneratePlan = async () => {
    if (!prompt.trim()) return;
    
    try {
      await generatePlan(prompt, preferences);
      onGenerate?.();
    } catch (error) {
      console.error('Failed to generate plan:', error);
    }
  };

  const isDisabled = isGenerating || !prompt.trim();

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Describe Your Prototype
        </h2>
        <p className="text-sm text-gray-600">
          Tell us what you want to build and we'll create a detailed plan first.
        </p>
      </div>

      {/* Prompt Input */}
      <div className="mb-6">
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
          Prompt
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Create a modern landing page for a SaaS product with a hero section, feature cards, pricing table, and contact form..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={isGenerating}
        />
      </div>

      {/* Preferences */}
      <div className="mb-6 space-y-4">
        <h3 className="text-sm font-medium text-gray-900">Preferences</h3>
        
        {/* Output Type */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Output Type
          </label>
          <select
            value={preferences.outputType}
            onChange={(e) => setPreferences(prev => ({ 
              ...prev, 
              outputType: e.target.value as 'html-js' | 'react' 
            }))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isGenerating}
          >
            <option value="html-js">HTML + JavaScript</option>
            <option value="react">React Components</option>
          </select>
        </div>

        {/* Styling */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Styling
          </label>
          <select
            value={preferences.styling}
            onChange={(e) => setPreferences(prev => ({ 
              ...prev, 
              styling: e.target.value as 'tailwind' | 'css' | 'styled-components' 
            }))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isGenerating}
          >
            <option value="tailwind">TailwindCSS</option>
            <option value="css">Custom CSS</option>
            <option value="styled-components">Styled Components</option>
          </select>
        </div>

        {/* Checkboxes */}
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.responsive}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                responsive: e.target.checked 
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isGenerating}
            />
            <span className="ml-2 text-sm text-gray-700">Responsive Design</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.accessibility}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                accessibility: e.target.checked 
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isGenerating}
            />
            <span className="ml-2 text-sm text-gray-700">Accessibility Features</span>
          </label>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Generate Button */}
      <div className="mt-auto">
        <button
          onClick={handleGeneratePlan}
          disabled={isDisabled}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-md font-medium transition-colors ${
            isDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isGenerating ? (
            <>
              <Wand2 className="h-4 w-4 mr-2 animate-spin" />
              {currentPhase === 'planning' ? 'Creating Plan...' : 'Generating...'}
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Generate Plan
            </>
          )}
        </button>
      </div>
    </div>
  );
};