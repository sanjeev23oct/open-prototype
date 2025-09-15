import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Lightbulb, Settings, ArrowLeft, CheckCircle } from 'lucide-react';
import { useErrorHandler } from '../services/error.service';
import { useGenerationStore } from '../stores/generationStore';
import { useToast } from '../stores/toastStore';

interface GenerationFailureRecoveryProps {
  error: Error;
  onRetry: () => void;
  onCancel: () => void;
  originalPrompt?: string;
  className?: string;
}

export const GenerationFailureRecovery: React.FC<GenerationFailureRecoveryProps> = ({
  error,
  onRetry,
  onCancel,
  originalPrompt = '',
  className = ''
}) => {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [simplifiedPrompt, setSimplifiedPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPromptSuggestions, setShowPromptSuggestions] = useState(false);
  
  const { getUserFriendlyMessage, handleGenerationError } = useErrorHandler();
  const { updatePreferences } = useGenerationStore();
  const { success } = useToast();

  const recoveryActions = handleGenerationError(error);
  const userFriendlyMessage = getUserFriendlyMessage(error);

  const getErrorCategory = () => {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('slow')) {
      return 'timeout';
    }
    if (message.includes('rate limit') || message.includes('quota')) {
      return 'rate_limit';
    }
    if (message.includes('model') || message.includes('llm')) {
      return 'model_error';
    }
    if (message.includes('network') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('prompt') || message.includes('input')) {
      return 'prompt_issue';
    }
    
    return 'unknown';
  };

  const getPromptSuggestions = () => {
    const category = getErrorCategory();
    const suggestions = [];

    switch (category) {
      case 'timeout':
        suggestions.push(
          'Break down your request into smaller, more specific parts',
          'Remove complex requirements and focus on core functionality',
          'Use simpler language and fewer technical terms'
        );
        break;
      case 'prompt_issue':
        suggestions.push(
          'Be more specific about what you want to build',
          'Provide examples of similar websites or apps',
          'Focus on one main feature instead of multiple features'
        );
        break;
      case 'model_error':
        suggestions.push(
          'Try a different AI model in settings',
          'Reduce the complexity of your request',
          'Check if your prompt contains any restricted content'
        );
        break;
      default:
        suggestions.push(
          'Simplify your prompt and remove unnecessary details',
          'Focus on the most important features first',
          'Use clear, simple language to describe what you want'
        );
    }

    return suggestions;
  };

  const generateSimplifiedPrompt = () => {
    if (!originalPrompt) return '';

    // Simple prompt simplification logic
    const words = originalPrompt.split(' ');
    if (words.length <= 20) return originalPrompt;

    // Take first 15 words and add essential context
    const simplified = words.slice(0, 15).join(' ');
    return simplified + '...';
  };

  const handleActionSelect = (actionId: string) => {
    setSelectedAction(actionId);
    
    switch (actionId) {
      case 'simplify-prompt':
        setSimplifiedPrompt(generateSimplifiedPrompt());
        setShowPromptSuggestions(true);
        break;
      case 'retry-generation':
        handleRetry();
        break;
      case 'change-model':
        // This would open model settings
        break;
      case 'reset-state':
        window.location.reload();
        break;
    }
  };

  const handleRetry = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
      onRetry();
      success('Retrying generation...');
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimplifiedRetry = async () => {
    if (!simplifiedPrompt.trim()) return;
    
    setIsProcessing(true);
    try {
      // This would update the prompt and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      success('Retrying with simplified prompt...');
      onRetry();
    } catch (err) {
      console.error('Simplified retry failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const errorCategory = getErrorCategory();
  const promptSuggestions = getPromptSuggestions();

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-red-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="p-3 bg-red-100 rounded-full mr-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Generation Failed</h3>
            <p className="text-sm text-gray-600">Let's get you back on track</p>
          </div>
        </div>
      </div>

      {/* Error Details */}
      <div className="p-6 border-b border-gray-200">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-red-900 mb-2">What happened?</h4>
          <p className="text-sm text-red-800">{userFriendlyMessage}</p>
        </div>

        {/* Error Category Specific Help */}
        {errorCategory !== 'unknown' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Lightbulb className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">
                  {errorCategory === 'timeout' && 'Request Timeout'}
                  {errorCategory === 'rate_limit' && 'Rate Limit Reached'}
                  {errorCategory === 'model_error' && 'Model Issue'}
                  {errorCategory === 'network' && 'Network Problem'}
                  {errorCategory === 'prompt_issue' && 'Prompt Issue'}
                </h4>
                <p className="text-sm text-blue-800">
                  {errorCategory === 'timeout' && 'Your request was too complex and timed out. Try simplifying it.'}
                  {errorCategory === 'rate_limit' && 'You\'ve reached the usage limit. Please wait a moment before trying again.'}
                  {errorCategory === 'model_error' && 'There was an issue with the AI model. Try a different model or simplify your request.'}
                  {errorCategory === 'network' && 'There was a network connectivity issue. Check your connection and try again.'}
                  {errorCategory === 'prompt_issue' && 'There might be an issue with your prompt. Try rephrasing or simplifying it.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recovery Actions */}
      <div className="p-6">
        {!showPromptSuggestions ? (
          <>
            <h4 className="font-medium text-gray-900 mb-4">Choose a recovery option:</h4>
            <div className="space-y-3">
              {recoveryActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleActionSelect(action.id)}
                  className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-colors ${
                    selectedAction === action.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${
                      action.type === 'retry' ? 'bg-green-100' :
                      action.type === 'fallback' ? 'bg-yellow-100' :
                      action.type === 'reset' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {action.type === 'retry' && <RefreshCw className="h-4 w-4 text-green-600" />}
                      {action.type === 'fallback' && <Lightbulb className="h-4 w-4 text-yellow-600" />}
                      {action.type === 'reset' && <Settings className="h-4 w-4 text-red-600" />}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{action.label}</div>
                      <div className="text-sm text-gray-600">
                        {action.type === 'retry' && 'Try the same request again'}
                        {action.type === 'fallback' && 'Use a simpler approach'}
                        {action.type === 'reset' && 'Start over completely'}
                      </div>
                    </div>
                  </div>
                  <CheckCircle className={`h-5 w-5 ${
                    selectedAction === action.id ? 'text-blue-600' : 'text-gray-300'
                  }`} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Prompt Simplification Interface */}
            <div className="mb-4">
              <button
                onClick={() => setShowPromptSuggestions(false)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to options
              </button>
              
              <h4 className="font-medium text-gray-900 mb-4">Simplify Your Prompt</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Prompt:
                  </label>
                  <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-800">
                    {originalPrompt || 'No original prompt available'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Simplified Prompt:
                  </label>
                  <textarea
                    value={simplifiedPrompt}
                    onChange={(e) => setSimplifiedPrompt(e.target.value)}
                    placeholder="Enter a simpler version of your request..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="font-medium text-yellow-900 mb-2">💡 Suggestions:</h5>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {promptSuggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-600 mr-2">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex items-center space-x-3">
            {showPromptSuggestions ? (
              <button
                onClick={handleSimplifiedRetry}
                disabled={!simplifiedPrompt.trim() || isProcessing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry with Simplified Prompt
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleRetry}
                disabled={isProcessing}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Now
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};