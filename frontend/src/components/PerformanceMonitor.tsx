import React, { useState, useEffect } from 'react';
import { Activity, Zap, Database, Wifi, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { PerformanceService } from '../services/performance.service';
import { CacheService } from '../services/cache.service';
import { WebSocketOptimizationService } from '../services/websocket-optimization.service';

interface PerformanceMonitorProps {
  className?: string;
  showDetails?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  className = '',
  showDetails = false
}) => {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [connectionHealth, setConnectionHealth] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(showDetails);
  
  const performanceService = PerformanceService.getInstance();
  const cacheService = CacheService.getInstance();
  const wsOptimization = WebSocketOptimizationService.getInstance();

  useEffect(() => {
    const updateMetrics = async () => {
      // Get performance data
      const perfReport = await performanceService.getCoreWebVitals();
      setPerformanceData(perfReport);

      // Get cache statistics
      const cache = cacheService.getStats();
      setCacheStats(cache);

      // Get connection health
      const health = wsOptimization.getConnectionHealth();
      setConnectionHealth(health);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [performanceService, cacheService, wsOptimization]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'poor':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return CheckCircle;
      case 'poor':
      case 'critical':
        return AlertTriangle;
      default:
        return Activity;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (!performanceData || !cacheStats || !connectionHealth) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center">
          <Activity className="h-5 w-5 text-gray-400 mr-2 animate-pulse" />
          <span className="text-sm text-gray-600">Loading performance metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Activity className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Performance Monitor</h3>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Quick Status */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Performance Status */}
          <div className="text-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              performanceData.summary.totalLoadTime < 3000 
                ? 'text-green-600 bg-green-100' 
                : 'text-yellow-600 bg-yellow-100'
            }`}>
              <Zap className="h-4 w-4 mr-1" />
              {performanceData.summary.totalLoadTime < 3000 ? 'Fast' : 'Slow'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Load: {formatTime(performanceData.summary.totalLoadTime)}
            </div>
          </div>

          {/* Cache Status */}
          <div className="text-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              cacheStats.hitRate > 0.8 
                ? 'text-green-600 bg-green-100' 
                : 'text-yellow-600 bg-yellow-100'
            }`}>
              <Database className="h-4 w-4 mr-1" />
              {cacheStats.hitRate > 0.8 ? 'Efficient' : 'Poor'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Hit Rate: {Math.round(cacheStats.hitRate * 100)}%
            </div>
          </div>

          {/* Connection Status */}
          <div className="text-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(connectionHealth.status)}`}>
              <Wifi className="h-4 w-4 mr-1" />
              {connectionHealth.status}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Latency: {connectionHealth.metrics.latency}ms
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          <div className="p-4 space-y-6">
            {/* Performance Metrics */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Performance Metrics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Load Time</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatTime(performanceData.summary.totalLoadTime)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Memory Usage</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatBytes(performanceData.summary.memoryUsage)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Render Time</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatTime(performanceData.summary.renderTime)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Network Requests</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {performanceData.summary.networkRequests}
                  </div>
                </div>
              </div>
            </div>

            {/* Cache Statistics */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Cache Statistics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Items Cached</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {cacheStats.size}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Cache Size</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatBytes(cacheStats.currentSize)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Hit Rate</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {Math.round(cacheStats.hitRate * 100)}%
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Utilization</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {Math.round((cacheStats.currentSize / cacheStats.maxSize) * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Health */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Wifi className="h-4 w-4 mr-2" />
                Connection Health
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Latency</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {connectionHealth.metrics.latency}ms
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Messages Sent</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {connectionHealth.metrics.messagesSent}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Messages Received</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {connectionHealth.metrics.messagesReceived}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Errors</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {connectionHealth.metrics.errors}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {(performanceData.recommendations.length > 0 || connectionHealth.recommendations.length > 0) && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Recommendations
                </h4>
                <div className="space-y-2">
                  {[...performanceData.recommendations, ...connectionHealth.recommendations].map((rec, index) => (
                    <div key={index} className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-yellow-800">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <span>Auto-refresh: 5s</span>
        </div>
      </div>
    </div>
  );
};