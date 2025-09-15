interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'timing' | 'memory' | 'network' | 'render';
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalLoadTime: number;
    memoryUsage: number;
    renderTime: number;
    networkRequests: number;
  };
  recommendations: string[];
}

export class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Performance Observer for navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: entry.name,
              value: entry.duration,
              timestamp: Date.now(),
              type: 'timing'
            });
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);

        // Resource timing observer
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: `resource-${entry.name}`,
              value: entry.duration,
              timestamp: Date.now(),
              type: 'network'
            });
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);

        // Measure observer for custom metrics
        const measureObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: entry.name,
              value: entry.duration,
              timestamp: Date.now(),
              type: 'timing'
            });
          }
        });
        measureObserver.observe({ entryTypes: ['measure'] });
        this.observers.push(measureObserver);
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }
  }

  // Record custom performance metrics
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  // Start timing a custom operation
  startTiming(name: string) {
    performance.mark(`${name}-start`);
  }

  // End timing and record the metric
  endTiming(name: string) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }

  // Measure component render time
  measureRender(componentName: string, renderFn: () => void) {
    this.startTiming(`render-${componentName}`);
    renderFn();
    this.endTiming(`render-${componentName}`);
  }

  // Measure async operations
  async measureAsync<T>(name: string, asyncFn: () => Promise<T>): Promise<T> {
    this.startTiming(name);
    try {
      const result = await asyncFn();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      throw error;
    }
  }

  // Get memory usage information
  getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  // Monitor memory usage
  monitorMemory() {
    const memory = this.getMemoryUsage();
    if (memory) {
      this.recordMetric({
        name: 'memory-usage',
        value: memory.used,
        timestamp: Date.now(),
        type: 'memory'
      });
    }
  }

  // Get Core Web Vitals
  getCoreWebVitals(): Promise<PerformanceReport> {
    return new Promise((resolve) => {
      const report: PerformanceReport = {
        metrics: [...this.metrics],
        summary: {
          totalLoadTime: 0,
          memoryUsage: 0,
          renderTime: 0,
          networkRequests: 0
        },
        recommendations: []
      };

      // Calculate summary metrics
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        report.summary.totalLoadTime = nav.loadEventEnd - nav.navigationStart;
      }

      const memory = this.getMemoryUsage();
      if (memory) {
        report.summary.memoryUsage = memory.used;
      }

      const resourceEntries = performance.getEntriesByType('resource');
      report.summary.networkRequests = resourceEntries.length;

      // Generate recommendations
      report.recommendations = this.generateRecommendations(report);

      resolve(report);
    });
  }

  private generateRecommendations(report: PerformanceReport): string[] {
    const recommendations: string[] = [];

    // Check load time
    if (report.summary.totalLoadTime > 3000) {
      recommendations.push('Consider optimizing initial load time - currently over 3 seconds');
    }

    // Check memory usage
    const memory = this.getMemoryUsage();
    if (memory && memory.used > memory.limit * 0.8) {
      recommendations.push('High memory usage detected - consider optimizing component lifecycle');
    }

    // Check network requests
    if (report.summary.networkRequests > 50) {
      recommendations.push('High number of network requests - consider bundling or lazy loading');
    }

    // Check for long tasks
    const longTasks = this.metrics.filter(m => m.type === 'timing' && m.value > 50);
    if (longTasks.length > 0) {
      recommendations.push('Long tasks detected - consider code splitting or web workers');
    }

    return recommendations;
  }

  // Debounce utility for performance
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Throttle utility for performance
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Lazy loading utility
  createIntersectionObserver(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    return new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    });
  }

  // Virtual scrolling helper
  calculateVisibleItems(
    containerHeight: number,
    itemHeight: number,
    scrollTop: number,
    totalItems: number,
    overscan: number = 5
  ) {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + overscan * 2);

    return {
      startIndex,
      endIndex,
      visibleCount,
      offsetY: startIndex * itemHeight
    };
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }

  // Get performance insights
  getInsights() {
    const insights = {
      slowestOperations: this.metrics
        .filter(m => m.type === 'timing')
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      
      memoryTrend: this.metrics
        .filter(m => m.type === 'memory')
        .slice(-10),
      
      networkActivity: this.metrics
        .filter(m => m.type === 'network')
        .length,
      
      averageRenderTime: this.metrics
        .filter(m => m.name.startsWith('render-'))
        .reduce((sum, m, _, arr) => sum + m.value / arr.length, 0)
    };

    return insights;
  }
}