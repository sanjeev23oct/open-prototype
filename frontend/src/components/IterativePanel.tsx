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
    if (!iterativePrompt.trim() || !generatedCode) return;
    
    setIsRefining(true);
    try {
      // For simple text changes, try surgical editing first
      if (isSimpleTextEdit(iterativePrompt)) {
        try {
          await handleSurgicalEdit(iterativePrompt);
          setIterativePrompt('');
          return; // Success! No need for full regeneration
        } catch (error) {
          if (error instanceof Error && error.message === 'REQUIRES_FULL_REGENERATION') {
            console.log('Falling back to full regeneration for complex edit');
            // Continue to full regeneration below
          } else {
            throw error; // Re-throw other errors
          }
        }
      }
      
      // For complex changes or surgical edit fallback, create a new plan
      const enhancedPrompt = `
        Based on the existing prototype: "${currentPlan?.description || 'Current prototype'}"
        
        Current components: ${currentPlan?.components.map(c => c.name).join(', ') || 'Generated components'}
        
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

  const isSimpleTextEdit = (prompt: string): boolean => {
    const surgicalEditKeywords = [
      'rename', 'change text', 'update label', 'modify title', 'replace text',
      'change color', 'update button text', 'change heading', 'modify placeholder',
      'update content', 'change wording', 'fix typo', 'correct spelling',
      'change font', 'update link', 'modify alt text', 'change class name',
      'update id', 'change attribute', 'fix spacing', 'adjust margin',
      'change padding', 'update border', 'modify background', 'change to',
      'update to', 'modify to', 'replace with'
    ];

    const complexEditKeywords = [
      'add new', 'create', 'build', 'implement', 'remove section',
      'delete component', 'restructure', 'reorganize', 'add feature',
      'new functionality', 'integrate', 'connect to', 'add database',
      'add api', 'add authentication', 'add validation'
    ];

    const lowerPrompt = prompt.toLowerCase();
    
    console.log('🔍 Checking if surgical edit:', lowerPrompt);
    
    const isSurgical = surgicalEditKeywords.some(keyword => {
      const matches = lowerPrompt.includes(keyword);
      if (matches) console.log(`✅ Found surgical keyword: ${keyword}`);
      return matches;
    });
    
    const isComplex = complexEditKeywords.some(keyword => {
      const matches = lowerPrompt.includes(keyword);
      if (matches) console.log(`❌ Found complex keyword: ${keyword}`);
      return matches;
    });

    const result = isSurgical && !isComplex;
    console.log(`🎯 Surgical edit decision: ${result} (surgical: ${isSurgical}, complex: ${isComplex})`);
    
    return result;
  };

  const handleSurgicalEdit = async (editPrompt: string) => {
    try {
      console.log('🔧 Attempting surgical edit:', editPrompt);
      console.log('📄 Current code length:', generatedCode?.completeHTML?.length || 0);
      
      // Call surgical edit API
      const response = await fetch('/api/generate/surgical-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentCode: generatedCode?.completeHTML || '',
          editInstruction: editPrompt,
          projectId: currentPlan?.id || 'unknown'
        })
      });

      console.log('📡 Surgical edit response status:', response.status);
      
      const result = await response.json();
      console.log('📋 Surgical edit result:', result);

      if (!response.ok) {
        if (result.requiresFullRegeneration) {
          // If surgical edit is not suitable, fall back to full regeneration
          console.log('⚠️ Surgical edit not suitable, falling back to full regeneration');
          throw new Error('REQUIRES_FULL_REGENERATION');
        }
        console.error('❌ Surgical edit API error:', result);
        throw new Error(result.message || 'Surgical edit failed');
      }
      
      // Update the store with the surgically edited code
      useGenerationStore.getState().updatePreview({
        htmlContent: result.updatedCode,
        cssContent: generatedCode?.cssContent || '',
        jsContent: generatedCode?.jsContent || ''
      });

      // Show success message
      console.log(`✅ Surgical edit applied successfully: ${result.changesSummary}`);
      
    } catch (error) {
      if (error instanceof Error && error.message === 'REQUIRES_FULL_REGENERATION') {
        // Fall back to full regeneration for complex edits
        console.log('🔄 Falling back to full regeneration');
        throw error;
      }
      console.error('❌ Surgical edit failed:', error);
      throw error;
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

      {/* Edit Type Indicator */}
      {iterativePrompt.trim() && (
        <div className="mb-4 p-3 rounded-md border">
          {isSimpleTextEdit(iterativePrompt) ? (
            <div className="flex items-center text-green-700 bg-green-50 border-green-200 rounded-md p-2">
              <Edit3 className="h-4 w-4 mr-2" />
              <span className="text-sm">
                ⚡ Quick surgical edit - will apply changes instantly
              </span>
            </div>
          ) : (
            <div className="flex items-center text-blue-700 bg-blue-50 border-blue-200 rounded-md p-2">
              <Wand2 className="h-4 w-4 mr-2" />
              <span className="text-sm">
                🔄 Complex change - will regenerate with new plan
              </span>
            </div>
          )}
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
              : isSimpleTextEdit(iterativePrompt) 
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRefining ? (
            <>
              <Wand2 className="h-4 w-4 mr-2 animate-spin" />
              {isSimpleTextEdit(iterativePrompt) ? 'Applying Quick Edit...' : 'Creating Refined Plan...'}
            </>
          ) : (
            <>
              {isSimpleTextEdit(iterativePrompt) ? (
                <>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Apply Quick Edit
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Refine Prototype
                </>
              )}
            </>
          )}
        </button>
      </div>

      {/* Tips */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <h5 className="text-xs font-medium text-gray-700 mb-2">💡 Refinement Tips:</h5>
        
        <div className="space-y-2">
          <div>
            <h6 className="text-xs font-medium text-green-700 mb-1">⚡ Quick Edits (Instant):</h6>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• "Change button text to 'Get Started'"</li>
              <li>• "Update heading to 'Welcome'"</li>
              <li>• "Fix typo in description"</li>
              <li>• "Change color to blue"</li>
            </ul>
          </div>
          
          <div>
            <h6 className="text-xs font-medium text-blue-700 mb-1">🔄 Complex Changes (Regeneration):</h6>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• "Add a new contact form section"</li>
              <li>• "Create a testimonials carousel"</li>
              <li>• "Add authentication features"</li>
              <li>• "Restructure the layout"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};