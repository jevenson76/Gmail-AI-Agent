import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Settings } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error, errorInfo });
    
    // Log error to console or an error reporting service
    console.error('Uncaught error:', error, errorInfo);
    
    // Here you could add error logging to a service like Sentry
    // if (typeof window.ErrorReportingService !== 'undefined') {
    //   window.ErrorReportingService.captureException(error, { extra: errorInfo });
    // }
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleClearStorage = (): void => {
    try {
      sessionStorage.removeItem('gmail_access_token');
      localStorage.removeItem('lastEmailSync');
      window.location.reload();
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
  };

  private handleGoToSettings = (): void => {
    // This is a simple approach - ideally we would use React Router or a state management solution
    window.location.href = '/?settings=true';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      const isAuthError = this.state.error?.message.toLowerCase().includes('auth') || 
                         this.state.error?.message.toLowerCase().includes('token') ||
                         this.state.error?.message.toLowerCase().includes('permission');

      const isNetworkError = this.state.error?.message.toLowerCase().includes('network') ||
                           this.state.error?.message.toLowerCase().includes('fetch') ||
                           this.state.error?.message.toLowerCase().includes('request');

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-center text-gray-800 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 text-center mb-6">
              {isAuthError 
                ? "We're having trouble with your authentication. Please try logging in again."
                : isNetworkError
                ? "There seems to be a network issue. Please check your internet connection."
                : "We've encountered an unexpected error. Our team has been notified."}
            </p>
            
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-sm text-gray-500 mb-4">
                Choose an option to resolve this issue:
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload the application</span>
                </button>
                
                {isAuthError && (
                  <button 
                    onClick={this.handleClearStorage}
                    className="w-full flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md transition duration-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Clear login data and reload</span>
                  </button>
                )}
                
                <button 
                  onClick={this.handleGoToSettings}
                  className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition duration-200"
                >
                  <Settings className="w-4 h-4" />
                  <span>Go to settings</span>
                </button>
              </div>
            </div>
            
            {this.state.errorInfo && (
              <details className="mt-6 text-xs text-gray-500 border-t border-gray-200 pt-4">
                <summary className="cursor-pointer font-medium mb-2">Error details (for developers)</summary>
                <p className="font-mono bg-gray-100 p-2 rounded overflow-auto max-h-64">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </p>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}