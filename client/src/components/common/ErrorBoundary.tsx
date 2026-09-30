import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/candidate/mock-tests';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[400px] flex items-center justify-center p-6"
        >
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-2xl border border-border bg-surface shadow-xl flex flex-col items-center text-center gap-4">
            <div
              className="p-3.5 rounded-2xl bg-status-error/15 text-status-error flex items-center justify-center"
              aria-hidden="true"
            >
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                {this.props.fallbackTitle || 'Mock Test Interface Encountered an Issue'}
              </h2>
              <p className="text-xs sm:text-sm text-foreground-secondary mt-1 leading-relaxed">
                {this.props.fallbackMessage ||
                  'The application recovered safely. Click below to reload or return to the mock test catalog.'}
              </p>
            </div>

            {this.state.error && (
              <pre className="w-full text-left font-mono text-[11px] p-3 rounded-lg bg-surface-elevated text-foreground-muted border border-border overflow-x-auto max-h-28">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-contrast font-bold text-xs hover:bg-primary-hover transition-colors min-h-[42px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                <span>Reload Interface</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-elevated border border-border text-foreground font-bold text-xs hover:bg-surface transition-colors min-h-[42px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Home className="w-4 h-4 text-foreground-secondary" aria-hidden="true" />
                <span>Mock Tests Directory</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
