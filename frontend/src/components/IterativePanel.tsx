import React, { useState } from 'react';
import { Send, Wand2, RotateCcw, Download, Share2, Edit3 } from 'lucide-react';
import { useGenerationStore } from '../stores/generationStore';
import { useWebSocket } from '../providers/WebSocketProvider';

export const IterativePanel: React.FC = () => {
  const [iterativePrompt, setIterativePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  
  const { 
    currentPlan,
    generatedCode,
    isGenerating,
    generatePlan,
    startGeneration,
    reset
  } = useGenerationStore();
  
  const { wsService } = useWebSocket();

  const handleIterativeImprovement = async () => {
    if (!iterativePrompt.trim() || !currentPlan) return;
    
    setIsRefining(true);
    try {
      // Create a new plan based on the current one + new requirements
      const enhancedPrompt = `
        Based on the existing prototype: "${currentPlan.description}"
        
        Current components: ${currentPlan.components.map(c => c.name).join(', ')}
        
        New requirement: ${iterativePrompt}
        
        Please modify or enhance the existing prototype to incorporate this new requirement.
      `;
      
      await generatePlan(enhancedPrompt, {
        outputType: 'html-js',
        framework: 'vanilla',
        styling: 'tailwind',
        responsive: true,
        accessibility: true
      });
      
      setIterativePrompt('');
    } catch (error) {
      console.error('Failed to generate iterative improvement:', error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleStartOver = () => {
    if (confirm('Are you sure you want to start over? This will clear the current prototype.')) {
      reset();
    }
  };

  const handleExport = () => {
    if (!generatedCode?.completeHTML) return;
    
    const blob = new Blob([generatedCode.completeHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prototype.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isDisabled = isGenerating || !iterativePrompt.trim();

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          🎉 Prototype Generated!
        </h2>
        <p className="text-sm text-gray-600">
          Your prototype is ready! You can now refine it, export it, or start a new one.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          onClick={handleExport}
          disabled={!generatedCode?.completeHTML}
          className="flex items-center justify-center px-4 py-3 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          Export HTML
        </button>
        
        <button
          onClick={handleStartOver}
          className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Start Over
        </button>
      </div>

      {/* Iterative Improvement */}
      <div className="mb-6">
        <label htmlFor="iterative-prompt" className="block text-sm font-medium text-gray-700 mb-2">
          Refine Your Prototype
        </label>
        <textarea
          id="iterative-prompt"
          value={iterativePrompt}
          onChange={(e) => setIterativePrompt(e.target.value)}
          placeholder="e.g., Add a dark mode toggle, Make the hero section more prominent, Add a testimonials section..."
          className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={isGenerating || isRefining}
        />
        <p className="text-xs text-gray-500 mt-1">
          Describe what you'd like to change or add to your prototype.
        </p>
      </div>

      {/* Current Prototype Info */}
      {currentPlan && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Current Prototype</h4>
          <p className="text-sm text-blue-700 mb-2">{currentPlan.description}</p>
          <div className="text-xs text-blue-600">
            Components: {currentPlan.components.map(c => c.name).join(', ')}
          </div>
        </div>
      )}

      {/* Refine Button */}
      <div className="mt-auto">
        <button
          onClick={handleIterativeImprovement}
          disabled={isDisabled || isRefining}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-md font-medium transition-colors ${
            isDisabled || isRefining
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRefining ? (
            <>
              <Wand2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Refined Plan...
            </>
          ) : (
            <>
              <Edit3 className="h-4 w-4 mr-2" />
              Refine Prototype
            </>
          )}
        </button>
      </div>

      {/* Tips */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <h5 className="text-xs font-medium text-gray-700 mb-1">💡 Tips for refinement:</h5>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Be specific about what you want to change</li>
          <li>• Mention colors, layout, or functionality changes</li>
          <li>• Ask for new sections or components</li>
          <li>• Request style or interaction improvements</li>
        </ul>
      </div>
    </div>
  );
};