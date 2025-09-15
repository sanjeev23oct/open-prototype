import React, { useState, useEffect } from 'react';
import { Bug, AlertTriangle, Info, Download, Trash2, Filter, Search, TrendingUp } from 'lucide-react';
import { ErrorService } from '../services/error.service';
import { useToast } from '../stores/toastStore';

interface ErrorReportingPanelProps {
  className?: string;
}

export const ErrorReportingPanel: React.FC<ErrorReportingPanelProps> = ({ className = '' }) => {
  const [errorStats, setErrorStats] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  
  const errorService = ErrorService.getInstance();
  const { success, error } = useToast();

  useEffect(() => {
    const updateStats = () => {
      const stats = errorService.getErrorStats();
      setErrorStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [errorService]);

  const handleExportLogs = () => {
    try {
      const logs = errorService.exportErrorLogs();
      const blob = new Blob([logs], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('Error logs exported successfully');
    } catch (err) {
      error('Failed to export error logs');
    }
  };

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all error logs? This action cannot be undone.')) {
      errorService.clearErrorLogs();
      setErrorStats(errorService.getErrorStats());
      success('Error logs cleared');
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bug className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const filteredErrors = errorStats?.recentErrors?.filter((errorLog: any) => {
    const matchesLevel = selectedLevel === 'all' || errorLog.level === selectedLevel;
    const matchesSearch = !searchTerm || 
      errorLog.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (errorLog.context?.type || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesLevel && matchesSearch;
  }) || [];

  if (!errorStats) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center">
          <Bug className="h-5 w-5 text-gray-400 mr-2 animate-pulse" />
          <span className="text-sm text-gray-600">Loading error statistics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <Bug className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Error Reporting</h3>
          <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
            {errorStats.total} total
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportLogs}
            className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          
          <button
            onClick={handleClearLogs}
            className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{errorStats.total}</div>
                <div className="text-sm text-gray-600">Total Errors</div>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-900">{errorStats.byLevel.error || 0}</div>
                <div className="text-sm text-red-600">Critical</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-900">{errorStats.byLevel.warning || 0}</div>
                <div className="text-sm text-yellow-600">Warnings</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-900">{errorStats.last24Hours}</div>
                <div className="text-sm text-blue-600">Last 24h</div>
              </div>
              <Info className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Error Types Breakdown */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Error Types</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(errorStats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900 capitalize">{type}</span>
                <span className="text-sm text-gray-600">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="error">Errors Only</option>
              <option value="warning">Warnings Only</option>
              <option value="info">Info Only</option>
            </select>
          </div>
          
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search errors..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredErrors.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Bug className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No errors found matching your criteria</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredErrors.map((errorLog: any) => (
              <div key={errorLog.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    {getLevelIcon(errorLog.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getLevelColor(errorLog.level)}`}>
                          {errorLog.level}
                        </span>
                        {errorLog.context?.type && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                            {errorLog.context.type}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(errorLog.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-900 mb-1 truncate">
                        {errorLog.message}
                      </p>
                      
                      {errorLog.url && (
                        <p className="text-xs text-gray-500 truncate">
                          {errorLog.url}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowDetails(showDetails === errorLog.id ? null : errorLog.id)}
                    className="ml-4 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    {showDetails === errorLog.id ? 'Hide' : 'Details'}
                  </button>
                </div>
                
                {showDetails === errorLog.id && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <div className="space-y-2 text-xs">
                      <div>
                        <strong>Error ID:</strong> {errorLog.id}
                      </div>
                      <div>
                        <strong>User Agent:</strong> {errorLog.userAgent}
                      </div>
                      <div>
                        <strong>Session ID:</strong> {errorLog.sessionId}
                      </div>
                      {errorLog.context && (
                        <div>
                          <strong>Context:</strong>
                          <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto">
                            {JSON.stringify(errorLog.context, null, 2)}
                          </pre>
                        </div>
                      )}
                      {errorLog.stack && (
                        <div>
                          <strong>Stack Trace:</strong>
                          <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto max-h-32">
                            {errorLog.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Showing {filteredErrors.length} of {errorStats.total} errors</span>
          <span>Auto-refresh: 10s</span>
        </div>
      </div>
    </div>
  );
};