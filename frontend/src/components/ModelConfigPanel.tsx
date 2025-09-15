import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Zap } from 'lucide-react';
import { useModelStore } from '../stores/modelStore';

interface ModelConfigPanelProps {
  onClose: () => void;
}

export const ModelConfigPanel: React.FC<ModelConfigPanelProps> = ({ onClose }) => {
  const {
    config,
    availableModels,
    isLoading,
    error,
    updateConfig,
    testConnection,
    loadAvailableModels
  } = useModelStore();

  const [localConfig, setLocalConfig] = useState(config);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadAvailableModels();
  }, [loadAvailableModels]);

  const handleSave = async () => {
    try {
      await updateConfig(localConfig);
      onClose();
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    
    try {
      await testConnection(localConfig);
      setConnectionStatus('success');
    } catch (error) {
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const modelOptions = [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', description: 'Fast and efficient for code generation' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Most capable OpenAI model' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced performance and speed' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fastest Claude model' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Zap className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">LLM Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Gateway URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LiteLLM Gateway URL
            </label>
            <input
              type="url"
              value={localConfig.gatewayUrl}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, gatewayUrl: e.target.value }))}
              placeholder="https://api.litellm.ai/v1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <div className="space-y-2">
              {modelOptions.map((model) => (
                <label key={model.id} className="flex items-start p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="model"
                    value={model.id}
                    checked={localConfig.model === model.id}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, model: e.target.value }))}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{model.name}</div>
                    <div className="text-sm text-gray-500">{model.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* API Key (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key (Optional)
            </label>
            <input
              type="password"
              value={localConfig.apiKey || ''}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="Leave empty if using gateway authentication"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localConfig.temperature}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Focused (0)</span>
                <span className="font-medium">{localConfig.temperature}</span>
                <span>Creative (1)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                min="100"
                max="8000"
                value={localConfig.maxTokens}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Connection Test */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Connection Test</h3>
              <button
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {isTestingConnection ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </button>
            </div>

            {connectionStatus === 'success' && (
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-green-700">Connection successful!</span>
              </div>
            )}

            {connectionStatus === 'error' && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm text-red-700">Connection failed. Please check your settings.</span>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
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
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};