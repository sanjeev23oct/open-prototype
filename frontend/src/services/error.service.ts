interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: any;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
}

interface ErrorRecoveryAction {
  id: string;
  label: string;
  action: () => void | Promise<void>;
  type: 'retry' | 'fallback' | 'reset' | 'redirect';
}

interface ErrorHandlerConfig {
  maxRetries: number;
  retryDelay: number;
  enableLogging: boolean;
  enableReporting: boolean;
  fallbackEnabled: boolean;
}

export class ErrorService {
  private static instance: ErrorService;
  private errorLogs: ErrorLog[] = [];
  private retryAttempts = new Map<string, number>();
  private config: ErrorHandlerConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    enableLogging: true,
    enableReporting: true,
    fallbackEnabled: true
  };

  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  constructor() {
    this.setupGlobalErrorHandlers();
  }

  // Setup global error handlers
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError({
        level: 'error',
        message: event.message,
        stack: event.error?.stack,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        level: 'error',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        context: { reason: event.reason }
      });
    });

    // Handle React error boundaries (if needed)
    if (typeof window !== 'undefined') {
      (window as any).__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ = {
        onBuildError: (error: Error) => {
          this.logError({
            level: 'error',
            message: `Build Error: ${error.message}`,
            stack: error.stack,
            context: { type: 'build' }
          });
        }
      };
    }
  }

  // Log error with context
  logError(errorData: Partial<ErrorLog>): string {
    const errorLog: ErrorLog = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      level: errorData.level || 'error',
      message: errorData.message || 'Unknown error',
      stack: errorData.stack,
      context: errorData.context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      ...errorData
    };

    this.errorLogs.push(errorLog);

    // Keep only last 100 errors to prevent memory leaks
    if (this.errorLogs.length > 100) {
      this.errorLogs = this.errorLogs.slice(-100);
    }

    // Report error if enabled
    if (this.config.enableReporting) {
      this.reportError(errorLog);
    }

    console.error('Error logged:', errorLog);
    return errorLog.id;
  }

  // Handle API errors with retry logic
  async handleApiError<T>(
    operation: () => Promise<T>,
    operationId: string,
    context?: any
  ): Promise<T> {
    const maxRetries = this.config.maxRetries;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Reset retry count on success
        this.retryAttempts.delete(operationId);
        return result;
      } catch (error: any) {
        lastError = error;
        
        const currentAttempts = this.retryAttempts.get(operationId) || 0;
        this.retryAttempts.set(operationId, currentAttempts + 1);

        // Log the error
        this.logError({
          level: 'error',
          message: `API Error (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}`,
          stack: error.stack,
          context: {
            operationId,
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            ...context
          }
        });

        // Don't retry on final attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry with exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, attempt);
        await this.delay(delay);
      }
    }

    // All retries failed
    throw new Error(`Operation failed after ${maxRetries + 1} attempts: ${lastError!.message}`);
  }

  // Handle WebSocket errors with reconnection
  handleWebSocketError(
    error: Event | Error,
    reconnectFn: () => void,
    context?: any
  ): void {
    const errorMessage = error instanceof Error ? error.message : 'WebSocket connection error';
    
    this.logError({
      level: 'error',
      message: errorMessage,
      context: {
        type: 'websocket',
        ...context
      }
    });

    // Attempt reconnection with exponential backoff
    const reconnectAttempts = this.retryAttempts.get('websocket') || 0;
    
    if (reconnectAttempts < this.config.maxRetries) {
      const delay = this.config.retryDelay * Math.pow(2, reconnectAttempts);
      
      setTimeout(() => {
        this.retryAttempts.set('websocket', reconnectAttempts + 1);
        reconnectFn();
      }, delay);
    } else {
      this.logError({
        level: 'error',
        message: 'WebSocket reconnection failed after maximum attempts',
        context: { maxAttempts: this.config.maxRetries }
      });
    }
  }

  // Handle generation errors with fallback
  handleGenerationError(
    error: Error,
    fallbackFn?: () => void,
    context?: any
  ): ErrorRecoveryAction[] {
    this.logError({
      level: 'error',
      message: `Generation Error: ${error.message}`,
      stack: error.stack,
      context: {
        type: 'generation',
        ...context
      }
    });

    const actions: ErrorRecoveryAction[] = [];

    // Retry action
    actions.push({
      id: 'retry-generation',
      label: 'Retry Generation',
      type: 'retry',
      action: () => {
        // This would be implemented by the calling component
        console.log('Retrying generation...');
      }
    });

    // Simplify prompt action
    actions.push({
      id: 'simplify-prompt',
      label: 'Simplify Prompt',
      type: 'fallback',
      action: () => {
        // This would be implemented by the calling component
        console.log('Suggesting prompt simplification...');
      }
    });

    // Use fallback if available
    if (fallbackFn && this.config.fallbackEnabled) {
      actions.push({
        id: 'use-fallback',
        label: 'Use Fallback',
        type: 'fallback',
        action: fallbackFn
      });
    }

    // Reset to initial state
    actions.push({
      id: 'reset-state',
      label: 'Reset Application',
      type: 'reset',
      action: () => {
        window.location.reload();
      }
    });

    return actions;
  }

  // Get user-friendly error message
  getUserFriendlyMessage(error: Error | string): string {
    const message = typeof error === 'string' ? error : error.message;

    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }

    // API errors
    if (message.includes('401') || message.includes('unauthorized')) {
      return 'Authentication required. Please refresh the page and try again.';
    }

    if (message.includes('403') || message.includes('forbidden')) {
      return 'Access denied. You may not have permission to perform this action.';
    }

    if (message.includes('404') || message.includes('not found')) {
      return 'The requested resource was not found. Please try again later.';
    }

    if (message.includes('429') || message.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    if (message.includes('500') || message.includes('internal server')) {
      return 'Server error. Our team has been notified. Please try again later.';
    }

    // Generation errors
    if (message.includes('generation') || message.includes('LLM') || message.includes('model')) {
      return 'AI generation failed. Try simplifying your prompt or check your model configuration.';
    }

    // WebSocket errors
    if (message.includes('websocket') || message.includes('connection')) {
      return 'Real-time connection lost. Attempting to reconnect...';
    }

    // Generic fallback
    return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
  }

  // Get error statistics
  getErrorStats() {
    const now = Date.now();
    const last24Hours = this.errorLogs.filter(log => 
      now - log.timestamp.getTime() < 24 * 60 * 60 * 1000
    );

    const errorsByLevel = this.errorLogs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsByType = this.errorLogs.reduce((acc, log) => {
      const type = log.context?.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.errorLogs.length,
      last24Hours: last24Hours.length,
      byLevel: errorsByLevel,
      byType: errorsByType,
      recentErrors: this.errorLogs.slice(-5)
    };
  }

  // Export error logs
  exportErrorLogs(): string {
    return JSON.stringify(this.errorLogs, null, 2);
  }

  // Clear error logs
  clearErrorLogs(): void {
    this.errorLogs = [];
    this.retryAttempts.clear();
  }

  // Update configuration
  updateConfig(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Private helper methods
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string {
    // This would integrate with your auth system
    return localStorage.getItem('userId') || 'anonymous';
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  private async reportError(errorLog: ErrorLog): Promise<void> {
    try {
      // In a real implementation, this would send to your error reporting service
      // For now, we'll just log to console
      console.log('Reporting error to service:', errorLog);
      
      // Example: Send to external service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorLog)
      // });
    } catch (error) {
      console.warn('Failed to report error:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cleanup
  cleanup(): void {
    this.errorLogs = [];
    this.retryAttempts.clear();
  }
}

// React hook for using error service
export const useErrorHandler = () => {
  const errorService = ErrorService.getInstance();

  return {
    logError: errorService.logError.bind(errorService),
    handleApiError: errorService.handleApiError.bind(errorService),
    handleWebSocketError: errorService.handleWebSocketError.bind(errorService),
    handleGenerationError: errorService.handleGenerationError.bind(errorService),
    getUserFriendlyMessage: errorService.getUserFriendlyMessage.bind(errorService),
    getErrorStats: errorService.getErrorStats.bind(errorService)
  };
};