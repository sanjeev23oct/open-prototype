import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, XCircle, Clock, AlertTriangle, Download } from 'lucide-react';
import { TestingService, initializeDefaultTests } from '../services/testing.service';
import { useToast } from '../stores/toastStore';

interface TestRunnerProps {
  className?: string;
}

export const TestRunner: React.FC<TestRunnerProps> = ({ className = '' }) => {
  const [testingService] = useState(() => {
    const service = TestingService.getInstance();
    initializeDefaultTests();
    return service;
  });
  
  const [testSuites, setTestSuites] = useState(testingService.getTestSuites());
  const [testResults, setTestResults] = useState(testingService.getTestResults());
  const [testStats, setTestStats] = useState(testingService.getTestStats());
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  
  const { success, error } = useToast();

  useEffect(() => {
    const updateState = () => {
      setTestSuites(testingService.getTestSuites());
      setTestResults(testingService.getTestResults());
      setTestStats(testingService.getTestStats());
      setIsRunning(testingService.isTestRunning());
    };

    const interval = setInterval(updateState, 1000);
    return () => clearInterval(interval);
  }, [testingService]);

  const handleRunTests = async () => {
    try {
      setIsRunning(true);
      
      if (selectedSuite === 'all') {
        await testingService.runAllTests();
        success('All tests completed');
      } else {
        const suite = testSuites.find(s => s.id === selectedSuite);
        if (suite) {
          await testingService.runSuite(suite);
          success(`${suite.name} tests completed`);
        }
      }
    } catch (err: any) {
      error(`Test execution failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearResults = () => {
    testingService.clearResults();
    setTestResults([]);
    setTestStats(testingService.getTestStats());
    success('Test results cleared');
  };

  const handleExportResults = () => {
    const results = {
      timestamp: new Date().toISOString(),
      stats: testStats,
      results: testResults,
      suites: testSuites
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    success('Test results exported');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'skipped':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'running':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'skipped':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'unit':
        return 'bg-blue-100 text-blue-800';
      case 'integration':
        return 'bg-green-100 text-green-800';
      case 'e2e':
        return 'bg-purple-100 text-purple-800';
      case 'performance':
        return 'bg-orange-100 text-orange-800';
      case 'accessibility':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <Play className="h-5 w-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Test Runner</h3>
          <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            {testStats.total} tests
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedSuite}
            onChange={(e) => setSelectedSuite(e.target.value)}
            disabled={isRunning}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="all">All Suites</option>
            {testSuites.map(suite => (
              <option key={suite.id} value={suite.id}>{suite.name}</option>
            ))}
          </select>
          
          <button
            onClick={handleExportResults}
            disabled={testResults.length === 0}
            className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          
          <button
            onClick={handleClearResults}
            disabled={isRunning || testResults.length === 0}
            className="flex items-center px-3 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </button>
          
          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2 animate-pulse" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Tests
              </>
            )}
          </button>
        </div>
      </div>

      {/* Test Statistics */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{testStats.total}</div>
            <div className="text-sm text-gray-600">Total Tests</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-900">{testStats.passed}</div>
            <div className="text-sm text-green-600">Passed</div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-900">{testStats.failed}</div>
            <div className="text-sm text-red-600">Failed</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-900">{Math.round(testStats.passRate)}%</div>
            <div className="text-sm text-blue-600">Pass Rate</div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Test Categories</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(testStats.byCategory).map(([category, stats]) => (
              <div key={category} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(category)}`}>
                    {category}
                  </span>
                </div>
                <div className="text-sm text-gray-900">
                  {stats.passed}/{stats.total}
                </div>
                <div className="text-xs text-gray-600">
                  {Math.round((stats.passed / stats.total) * 100)}% pass
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Test Suites */}
      <div className="max-h-96 overflow-y-auto">
        {testSuites.map(suite => (
          <div key={suite.id} className="border-b border-gray-200 last:border-b-0">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{suite.name}</h4>
                <span className="text-sm text-gray-600">
                  {suite.tests.length} tests
                </span>
              </div>
              
              <div className="space-y-2">
                {suite.tests.map(test => {
                  const result = testResults.find(r => r.test === test.id);
                  
                  return (
                    <div key={test.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {getStatusIcon(test.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">{test.name}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(test.category)}`}>
                              {test.category}
                            </span>
                            {test.status !== 'pending' && (
                              <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(test.status)}`}>
                                {test.status}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{test.description}</p>
                          {test.duration && (
                            <p className="text-xs text-gray-500 mt-1">
                              Duration: {test.duration}ms
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {result && (
                        <button
                          onClick={() => setShowDetails(showDetails === test.id ? null : test.id)}
                          className="ml-4 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          {showDetails === test.id ? 'Hide' : 'Details'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Test Details */}
            {suite.tests.map(test => {
              const result = testResults.find(r => r.test === test.id);
              
              return showDetails === test.id && result && (
                <div key={`${test.id}-details`} className="px-4 pb-4">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="space-y-3">
                      {/* Test Result Summary */}
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">Test Result</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      
                      {/* Duration */}
                      <div className="text-sm text-gray-600">
                        <strong>Duration:</strong> {result.duration}ms
                      </div>
                      
                      {/* Error */}
                      {result.error && (
                        <div className="text-sm">
                          <strong className="text-red-700">Error:</strong>
                          <pre className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs overflow-auto">
                            {result.error}
                          </pre>
                        </div>
                      )}
                      
                      {/* Assertions */}
                      {result.assertions.length > 0 && (
                        <div>
                          <strong className="text-gray-700">Assertions:</strong>
                          <div className="mt-2 space-y-2">
                            {result.assertions.map((assertion, index) => (
                              <div key={index} className={`p-2 rounded border text-xs ${
                                assertion.passed 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-red-50 border-red-200'
                              }`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium">{assertion.description}</span>
                                  {assertion.passed ? (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <XCircle className="h-3 w-3 text-red-500" />
                                  )}
                                </div>
                                <div className="text-gray-600">
                                  <div>Expected: {JSON.stringify(assertion.expected)}</div>
                                  <div>Actual: {JSON.stringify(assertion.actual)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            {isRunning ? 'Tests running...' : `Last run: ${testResults.length > 0 ? 'Recently' : 'Never'}`}
          </span>
          <span>
            Avg duration: {Math.round(testStats.averageDuration)}ms
          </span>
        </div>
      </div>
    </div>
  );
};