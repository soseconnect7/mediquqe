import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';

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
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log error to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportError = () => {
    const errorReport = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Copy error report to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error report copied to clipboard. Please share this with support.');
      })
      .catch(() => {
        console.error('Failed to copy error report');
      });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <Card className="w-full max-w-2xl">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Oops! Something went wrong
                </h1>
                <p className="text-gray-600 mb-6">
                  We're sorry, but something unexpected happened. Don't worry - your data is safe.
                </p>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
                  <p className="text-sm text-red-700 font-mono">
                    {this.state.error?.message || 'Unknown error occurred'}
                  </p>
                  {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-red-800 font-medium">
                        Stack Trace (Development)
                      </summary>
                      <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={this.handleRefresh} className="flex items-center">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Page
                    </Button>
                    
                    <Button onClick={this.handleGoHome} variant="outline" className="flex items-center">
                      <Home className="h-4 w-4 mr-2" />
                      Go to Home
                    </Button>
                  </div>

                  <Button 
                    onClick={this.handleReportError} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center"
                  >
                    <Bug className="h-4 w-4 mr-2" />
                    Copy Error Report
                  </Button>
                </div>

                <div className="mt-8 text-sm text-gray-500">
                  <p>If this problem persists, please contact support with the error report.</p>
                  <p className="mt-2">
                    <strong>Error ID:</strong> {Date.now().toString(36).toUpperCase()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}