import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Send } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorId: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9)
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to monitoring service
    this.logError(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      id: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: 'anonymous', // Could be enhanced with actual user ID
      formData: this.getFormData(),
      localStorageSize: this.getLocalStorageSize()
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error Data:', errorData);
      console.groupEnd();
    }

    // In production, you would send this to your monitoring service
    // Example: Sentry, LogRocket, Bugsnag, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example implementation:
      // this.sendToMonitoringService(errorData);
    }

    // Store in local storage as backup
    try {
      const existingErrors = JSON.parse(localStorage.getItem('error-logs') || '[]');
      existingErrors.push(errorData);
      // Keep only last 10 errors to prevent storage bloat
      localStorage.setItem('error-logs', JSON.stringify(existingErrors.slice(-10)));
    } catch (e) {
      console.warn('Failed to store error in localStorage:', e);
    }
  };

  private getFormData = () => {
    try {
      // Try to get current form state for debugging
      const formState = localStorage.getItem('meta-form-builder-storage');
      if (formState) {
        const parsed = JSON.parse(formState);
        // Return sanitized version (no sensitive data)
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
      return { error: 'Failed to retrieve form data' };
    }
    return null;
  };

  private getLocalStorageSize = () => {
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
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: ''
    });
  };

  private sendErrorReport = () => {
    const subject = `Error Report: ${this.state.error?.message || 'Unknown Error'}`;
    const body = `Error ID: ${this.state.errorId}

Error Details:
- Message: ${this.state.error?.message}
- URL: ${window.location.href}
- User Agent: ${navigator.userAgent}
- Timestamp: ${new Date().toISOString()}

Component Stack:
${this.state.errorInfo?.componentStack}

Stack Trace:
${this.state.error?.stack}`;

    const mailtoLink = `mailto:support@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>

              <h1 className="text-lg font-semibold text-gray-900 mb-2">
                Something went wrong
              </h1>

              <p className="text-sm text-gray-600 mb-6">
                We're sorry, but something unexpected happened. Your work has been automatically saved.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center gap-2"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>

                <Button
                  onClick={this.handleReload}
                  className="w-full"
                  variant="outline"
                >
                  Reload Page
                </Button>
              </div>

              {this.props.showDetails && this.state.error && (
                <div className="mt-6 p-4 bg-gray-50 rounded-md text-left">
                  <details className="cursor-pointer">
                    <summary className="text-sm font-medium text-gray-700 mb-2">
                      Error Details (ID: {this.state.errorId})
                    </summary>
                    <div className="text-xs text-gray-600 space-y-2">
                      <div>
                        <strong>Message:</strong> {this.state.error.message}
                      </div>
                      <div>
                        <strong>Component:</strong>
                        <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                          {this.state.errorInfo?.componentStack}
                        </pre>
                      </div>
                    </div>
                  </details>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={this.sendErrorReport}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 w-full"
                >
                  <Send className="w-3 h-3" />
                  Send Error Report
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}