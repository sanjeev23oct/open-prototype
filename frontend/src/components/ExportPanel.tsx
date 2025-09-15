import React, { useState } from 'react';
import { Download, Copy, Share2, FileText, Package, Code, Folder, Check, ExternalLink } from 'lucide-react';
import { ExportService, ExportOptions } from '../services/export.service';
import { useGenerationStore } from '../stores/generationStore';
import { useToast } from '../stores/toastStore';

interface ExportPanelProps {
  className?: string;
}

type ExportFormat = 'single' | 'separated' | 'react' | 'vue' | 'angular' | 'vanilla';

export const ExportPanel: React.FC<ExportPanelProps> = ({ className = '' }) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('single');
  const [includeDocumentation, setIncludeDocumentation] = useState(true);
  const [includeAssets, setIncludeAssets] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [shareableLink, setShareableLink] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  
  const { generatedCode, currentPlan } = useGenerationStore();
  const { success, error } = useToast();
  const exportService = ExportService.getInstance();

  const exportFormats = [
    {
      id: 'single' as const,
      name: 'Single HTML File',
      description: 'Complete prototype in one HTML file',
      icon: FileText,
      size: 'Small',
      compatibility: 'Universal'
    },
    {
      id: 'separated' as const,
      name: 'Separated Files',
      description: 'HTML, CSS, and JS in separate files',
      icon: Folder,
      size: 'Medium',
      compatibility: 'Universal'
    },
    {
      id: 'react' as const,
      name: 'React Project',
      description: 'Complete React application structure',
      icon: Code,
      size: 'Large',
      compatibility: 'React'
    },
    {
      id: 'vue' as const,
      name: 'Vue.js Project',
      description: 'Complete Vue application structure',
      icon: Code,
      size: 'Large',
      compatibility: 'Vue.js'
    },
    {
      id: 'angular' as const,
      name: 'Angular Project',
      description: 'Complete Angular application structure',
      icon: Code,
      size: 'Large',
      compatibility: 'Angular'
    },
    {
      id: 'vanilla' as const,
      name: 'Vanilla Project',
      description: 'Organized vanilla JavaScript project',
      icon: Package,
      size: 'Medium',
      compatibility: 'Universal'
    }
  ];

  const handleExport = async () => {
    if (!generatedCode?.completeHTML) {
      error('No code to export');
      return;
    }

    setIsExporting(true);

    try {
      const options: ExportOptions = {
        includeDocumentation,
        includeAssets,
        format: selectedFormat === 'single' ? 'single' : 'separated',
        framework: ['react', 'vue', 'angular'].includes(selectedFormat) ? selectedFormat as any : 'vanilla'
      };

      let result;

      switch (selectedFormat) {
        case 'single':
          result = await exportService.exportSingleHTML(generatedCode, currentPlan, options);
          break;
        case 'separated':
        case 'vanilla':
          result = await exportService.exportSeparatedFiles(generatedCode, currentPlan, options);
          break;
        case 'react':
        case 'vue':
        case 'angular':
          result = await exportService.exportFrameworkProject(generatedCode, currentPlan!, options);
          break;
        default:
          throw new Error('Invalid export format');
      }

      if (result.success) {
        success(`Exported as ${result.filename} (${Math.round(result.size / 1024)}KB)`);
      } else {
        error(result.error || 'Export failed');
      }
    } catch (err: any) {
      error(err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyCode = async (type: 'html' | 'css' | 'js' | 'complete') => {
    if (!generatedCode?.completeHTML) {
      error('No code to copy');
      return;
    }

    const success_result = await exportService.copyToClipboard(generatedCode.completeHTML, type);
    if (success_result) {
      success(`${type.toUpperCase()} code copied to clipboard`);
    } else {
      error('Failed to copy code');
    }
  };

  const handleGenerateShareLink = async () => {
    if (!generatedCode?.completeHTML) {
      error('No code to share');
      return;
    }

    try {
      const link = await exportService.generateShareableLink(generatedCode, currentPlan);
      setShareableLink(link);
      setShowShareModal(true);
    } catch (err: any) {
      error(err.message || 'Failed to generate share link');
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      success('Share link copied to clipboard');
    } catch (err) {
      error('Failed to copy share link');
    }
  };

  const selectedFormatInfo = exportFormats.find(f => f.id === selectedFormat);

  if (!generatedCode?.completeHTML) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Download className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Generate content first to export</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <Download className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Export & Share</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleGenerateShareLink}
            className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Actions */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Quick Copy</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { type: 'complete' as const, label: 'Complete', icon: FileText },
              { type: 'html' as const, label: 'HTML', icon: Code },
              { type: 'css' as const, label: 'CSS', icon: Code },
              { type: 'js' as const, label: 'JavaScript', icon: Code }
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => handleCopyCode(type)}
                className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Icon className="h-4 w-4 mr-2" />
                <Copy className="h-3 w-3 mr-1" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Export Formats */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Export Format</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exportFormats.map((format) => {
              const Icon = format.icon;
              return (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    selectedFormat === format.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <Icon className={`h-5 w-5 mt-0.5 mr-3 ${
                        selectedFormat === format.id ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                      <div>
                        <h5 className="font-medium text-gray-900">{format.name}</h5>
                        <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                        <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                          <span>Size: {format.size}</span>
                          <span>•</span>
                          <span>{format.compatibility}</span>
                        </div>
                      </div>
                    </div>
                    {selectedFormat === format.id && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Export Options */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Export Options</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeDocumentation}
                onChange={(e) => setIncludeDocumentation(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">Include documentation</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeAssets}
                onChange={(e) => setIncludeAssets(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">Include assets and dependencies</span>
            </label>
          </div>
        </div>

        {/* Selected Format Info */}
        {selectedFormatInfo && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <selectedFormatInfo.icon className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h5 className="font-medium text-blue-900">{selectedFormatInfo.name}</h5>
                <p className="text-sm text-blue-700 mt-1">{selectedFormatInfo.description}</p>
                <div className="mt-2 text-xs text-blue-600">
                  <span>Compatibility: {selectedFormatInfo.compatibility}</span>
                  <span className="mx-2">•</span>
                  <span>Expected size: {selectedFormatInfo.size}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export {selectedFormatInfo?.name}
            </>
          )}
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">Share Prototype</h4>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3">
                Share this link to let others view your prototype:
              </p>
              
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareableLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
                <button
                  onClick={copyShareLink}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              
              <div className="mt-4 flex items-center space-x-2">
                <button
                  onClick={() => window.open(shareableLink, '_blank')}
                  className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};