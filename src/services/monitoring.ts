interface ErrorData {
  id: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  formData?: any;
  localStorageSize?: number;
  buildInfo?: {
    version: string;
    environment: string;
    buildTime: string;
  };
}

interface PerformanceData {
  id: string;
  timestamp: string;
  url: string;
  metrics: {
    loadTime: number;
    renderTime: number;
    interactionTime?: number;
    memoryUsage?: number;
  };
  userAgent: string;
}

interface UserActivity {
  id: string;
  timestamp: string;
  action: string;
  component?: string;
  data?: any;
  userId?: string;
}

class MonitoringService {
  private static instance: MonitoringService;
  private isEnabled: boolean = false;
  private errorQueue: ErrorData[] = [];
  private performanceQueue: PerformanceData[] = [];
  private activityQueue: UserActivity[] = [];
  private maxQueueSize = 50;
  private flushInterval = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Enable monitoring in development and production
    this.isEnabled = true;

    // Set up periodic flushing
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Set up performance monitoring
    this.setupPerformanceMonitoring();

    // Set up error event listeners
    this.setupGlobalErrorHandlers();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  private setupGlobalErrorHandlers() {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        source: 'global-error',
        lineno: event.lineno,
        colno: event.colno,
        filename: event.filename
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        source: 'unhandled-promise'
      });
    });
  }

  private setupPerformanceMonitoring() {
    // Monitor page load performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.logPerformance({
            type: 'page-load',
            loadTime: performance.now(),
            metrics: this.getPerformanceMetrics()
          });
        }, 0);
      });
    }
  }

  private getPerformanceMetrics() {
    if (!('performance' in window)) return {};

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    return {
      dns: navigation?.domainLookupEnd - navigation?.domainLookupStart,
      tcp: navigation?.connectEnd - navigation?.connectStart,
      ssl: navigation?.connectEnd - navigation?.secureConnectionStart,
      ttfb: navigation?.responseStart - navigation?.requestStart,
      download: navigation?.responseEnd - navigation?.responseStart,
      domProcessing: navigation?.domContentLoadedEventEnd - navigation?.responseEnd,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize
    };
  }

  logError(error: {
    message: string;
    stack?: string;
    componentStack?: string;
    source?: string;
    [key: string]: any;
  }) {
    if (!this.isEnabled) return;

    const errorData: ErrorData = {
      id: this.generateId(),
      message: error.message,
      stack: error.stack,
      componentStack: error.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: this.getUserId(),
      formData: this.getFormContext(),
      localStorageSize: this.getLocalStorageSize(),
      buildInfo: this.getBuildInfo()
    };

    this.errorQueue.push(errorData);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Monitoring Service - Error');
      console.error('Error:', error);
      console.log('Error Data:', errorData);
      console.groupEnd();
    }

    // Immediate flush for critical errors
    if (this.isCriticalError(error)) {
      this.flush();
    }

    this.checkQueueSize();
  }

  logPerformance(data: {
    type: string;
    loadTime?: number;
    renderTime?: number;
    interactionTime?: number;
    metrics?: any;
  }) {
    if (!this.isEnabled) return;

    const performanceData: PerformanceData = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: {
        loadTime: data.loadTime || 0,
        renderTime: data.renderTime || 0,
        interactionTime: data.interactionTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize,
        ...data.metrics
      }
    };

    this.performanceQueue.push(performanceData);

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance:', performanceData);
    }

    this.checkQueueSize();
  }

  logUserActivity(activity: {
    action: string;
    component?: string;
    data?: any;
  }) {
    if (!this.isEnabled) return;

    const activityData: UserActivity = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      action: activity.action,
      component: activity.component,
      data: activity.data,
      userId: this.getUserId()
    };

    this.activityQueue.push(activityData);

    if (process.env.NODE_ENV === 'development') {
      console.log('👤 User Activity:', activityData);
    }

    this.checkQueueSize();
  }

  private isCriticalError(error: any): boolean {
    const criticalKeywords = [
      'chunk load',
      'network error',
      'script error',
      'security',
      'cors',
      'auth'
    ];

    return criticalKeywords.some(keyword =>
      error.message?.toLowerCase().includes(keyword)
    );
  }

  private checkQueueSize() {
    if (this.errorQueue.length >= this.maxQueueSize ||
        this.performanceQueue.length >= this.maxQueueSize ||
        this.activityQueue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  private async flush() {
    if (this.errorQueue.length === 0 &&
        this.performanceQueue.length === 0 &&
        this.activityQueue.length === 0) {
      return;
    }

    const payload = {
      errors: [...this.errorQueue],
      performance: [...this.performanceQueue],
      activities: [...this.activityQueue],
      meta: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        sessionId: this.getSessionId()
      }
    };

    // Clear queues
    this.errorQueue = [];
    this.performanceQueue = [];
    this.activityQueue = [];

    try {
      // In development, just log to console
      if (process.env.NODE_ENV === 'development') {
        console.group('📡 Monitoring Service - Flush');
        console.log('Payload:', payload);
        console.groupEnd();
      } else {
        // In production, send to monitoring service
        await this.sendToMonitoringService(payload);
      }

      // Also save to localStorage as backup
      this.saveToLocalStorage(payload);
    } catch (error) {
      console.error('Failed to flush monitoring data:', error);
      // Re-queue on failure (with limit to prevent infinite growth)
      if (payload.errors.length < this.maxQueueSize / 2) {
        this.errorQueue.unshift(...payload.errors);
      }
    }
  }

  private async sendToMonitoringService(payload: any) {
    // Example implementation for production monitoring service
    // Replace with your actual monitoring service endpoint
    const endpoint = import.meta.env.VITE_MONITORING_ENDPOINT;

    // Skip monitoring if no endpoint is configured (production without backend)
    if (!endpoint) {
      console.debug('Monitoring service disabled - no endpoint configured');
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Monitoring service responded with ${response.status}`);
      }
    } catch (error) {
      console.debug('Monitoring service unavailable:', error);
      // Silently fail in production to not disrupt user experience
    }
  }

  private saveToLocalStorage(payload: any) {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('monitoring-logs') || '[]');
      const newLogs = [payload, ...existingLogs].slice(0, 10); // Keep last 10 batches
      localStorage.setItem('monitoring-logs', JSON.stringify(newLogs));
    } catch (error) {
      // If localStorage is full, clear old logs
      try {
        localStorage.removeItem('monitoring-logs');
        localStorage.setItem('monitoring-logs', JSON.stringify([payload]));
      } catch (e) {
        console.warn('Could not save monitoring logs to localStorage');
      }
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserId(): string {
    // Replace with actual user ID logic
    return localStorage.getItem('user-id') || 'anonymous';
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session-id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('session-id', sessionId);
    }
    return sessionId;
  }

  private getFormContext() {
    try {
      const formState = localStorage.getItem('meta-form-builder-storage');
      if (formState) {
        const parsed = JSON.parse(formState);
        // Return sanitized version
        return {
          hasActiveForm: !!parsed.state?.activeForm,
          currentView: parsed.state?.currentView,
          isDirty: parsed.state?.isDirty,
          formType: parsed.state?.activeForm?.formType,
          fieldsCount: parsed.state?.activeForm?.contactFields?.length || 0,
          qualifiersCount: parsed.state?.activeForm?.qualifiers?.length || 0
        };
      }
    } catch (e) {
      return { error: 'Failed to retrieve form context' };
    }
    return null;
  }

  private getLocalStorageSize(): number {
    try {
      let total = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      return Math.round(total / 1024); // KB
    } catch (e) {
      return 0;
    }
  }

  private getBuildInfo() {
    return {
      version: process.env.VITE_APP_VERSION || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
      buildTime: process.env.VITE_BUILD_TIME || 'unknown'
    };
  }

  // Public methods for manual tracking
  trackUserAction(action: string, component?: string, data?: any) {
    this.logUserActivity({ action, component, data });
  }

  trackPageView(path: string) {
    this.logUserActivity({
      action: 'page-view',
      data: { path }
    });
  }

  trackFormInteraction(action: string, fieldType?: string) {
    this.logUserActivity({
      action: 'form-interaction',
      component: 'form-builder',
      data: { action, fieldType }
    });
  }

  // Cleanup
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Final flush
    this.isEnabled = false;
  }
}

export const monitoringService = MonitoringService.getInstance();

// React hook for easy integration
export const useMonitoring = () => {
  return {
    trackError: (error: Error, componentStack?: string) => {
      monitoringService.logError({
        message: error.message,
        stack: error.stack,
        componentStack
      });
    },
    trackUserAction: monitoringService.trackUserAction.bind(monitoringService),
    trackPageView: monitoringService.trackPageView.bind(monitoringService),
    trackFormInteraction: monitoringService.trackFormInteraction.bind(monitoringService),
    trackPerformance: monitoringService.logPerformance.bind(monitoringService)
  };
};