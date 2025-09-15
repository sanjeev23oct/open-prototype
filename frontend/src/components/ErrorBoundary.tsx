import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { ErrorService } from '../services/error.service';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRecovery?: boolean;
  showErrorDetails?: boolean;
  level?: 'page' | 'component' | 'section';
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  retryCount: number;
  showDetails: boolean;
  isReporting: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private errorService: ErrorService;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0, 
      showDetails: false,
      isReporting: false
    };
    this.errorService = ErrorService.getInstance();
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.errorService.logError({
      level: 'error',
      message: `React Error Boundary: ${error.message}`,
      stack: error.stack,
      context: {
        componentStack: errorInfo.componentStack,
        level: this.props.level || 'component',
        retryCount: this.state.retryCount
      }
    });

    this.setState({ 
      error, 
      errorInfo, 
      errorId,
      showDetails: this.props.showErrorDetails || false
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        errorId: undefined,
        retryCount: this.state.retryCount + 1
      });
    }
  };

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined,
      retryCount: 0
    });
  };

  handleReportError = async () => {
    if (!this.state.error || this.state.isReporting) return;

    this.setState({ isReporting: true });

    try {
      // Simulate error reporting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would send to your error reporting service
      console.log('Error reported:', {
        errorId: this.state.errorId,
        message: this.state.error.message,
        stack: this.state.error.stack,
        componentStack: this.state.errorInfo?.componentStack
      });

      alert('Error report sent successfully. Thank you for helping us improve!');
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
      alert('Failed to send error report. Please try again later.');
    } finally {
      this.setState({ isReporting: false });
    }
  };

  toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails });
  };

  getErrorSeverity = (): 'low' | 'medium' | 'high' => {
    if (!this.state.error) return 'low';
    
    const message = this.state.error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'medium';
    }
    
    if (message.includes('chunk') || message.includes('loading')) {
      return 'low';
    }
    
    return 'high';
  };

  getRecoveryActions = () => {
    const severity = this.getErrorSeverity();
    const canRetry = this.state.retryCount < this.maxRetries;
    
    const actions = [];

    if (canRetry && this.props.enableRecovery !== false) {
      actions.push({
        label: 'Try Again',
        action: this.handleRetry,
        primary: true,
        icon: RefreshCw
      });
    }

    if (severity === 'low' || severity === 'medium') {
      actions.push({
        label: 'Reset Component',
        action: this.handleReset,
        primary: false,
        icon: RefreshCw
      });
    }

    actions.push({
      label: 'Refresh Page',
      action: () => window.location.reload(),
      primary: severity === 'high',
      icon: RefreshCw
    });

    return actions;
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const severity = this.getErrorSeverity();
      const recoveryActions = this.getRecoveryActions();
      const userFriendlyMessage = this.errorService.getUserFriendlyMessage(this.state.error!);

      // Component-level error (smaller, inline)
      if (this.props.level === 'component' || this.props.level === 'section') {
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-red-800">
                  Component Error
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {userFriendlyMessage}
                </p>
                
                <div className="mt-3 flex items-center space-x-2">
                  {recoveryActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className={`inline-flex items-center px-3 py-1 text-xs rounded-md transition-colors ${
                        action.primary
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      <action.icon className="h-3 w-3 mr-1" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Page-level error (full screen)
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
            <div className="flex items-center mb-6">
              <div className={`p-3 rounded-full mr-4 ${
                severity === 'high' ? 'bg-red-100' :
                severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
              }`}>
                <AlertTriangle className={`h-8 w-8 ${
                  severity === 'high' ? 'text-red-500' :
                  severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                }`} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {severity === 'high' ? 'Critical Error' :
                   severity === 'medium' ? 'Connection Issue' : 'Minor Issue'}
                </h1>
                <p className="text-sm text-gray-600">
                  Error ID: {this.state.errorId}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                {userFriendlyMessage}
              </p>
              
              {this.state.retryCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    Retry attempt {this.state.retryCount} of {this.maxRetries}
                  </p>
                </div>
              )}
            </div>

            {/* Error Details */}
            <div className="mb-6">
              <button
                onClick={this.toggleDetails}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {this.state.showDetails ? (
                  <ChevronUp className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-1" />
                )}
                {this.state.showDetails ? 'Hide' : 'Show'} technical details
              </button>
              
              {this.state.showDetails && this.state.error && (
                <div className="mt-3 p-3 bg-gray-100 rounded-md">
                  <div className="text-xs font-mono text-gray-800 mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                        Stack trace
                      </summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
            
            {/* Recovery Actions */}
            <div className="flex flex-wrap gap-3 mb-4">
              {recoveryActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                    action.primary
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  <action.icon className="h-4 w-4 mr-2" />
                  {action.label}
                </button>
              ))}
            </div>

            {/* Report Error */}
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={this.handleReportError}
                disabled={this.state.isReporting}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                {this.state.isReporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Sending report...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Report this error
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Help us improve by reporting this issue
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}