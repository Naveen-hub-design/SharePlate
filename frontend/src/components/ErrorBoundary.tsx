import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('SharePlate Application Error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200/90 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-50 text-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <span className="text-[11px] font-extrabold uppercase tracking-widest text-red-600 bg-red-100/70 px-3 py-1 rounded-full">
              Application Notice
            </span>

            <h2 className="text-2xl font-extrabold text-stone-900 mt-4 font-heading">
              Something went unexpected
            </h2>

            <p className="text-stone-600 text-xs sm:text-sm mt-2 leading-relaxed">
              We encountered an issue rendering this workspace module. Your credentials and session remain secure.
            </p>

            {this.state.error && (
              <div className="my-4 p-3 bg-stone-50 rounded-xl text-left border border-stone-200 text-xs font-mono text-red-800 break-words max-h-32 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1B4332] text-white font-bold text-sm shadow hover:bg-[#2D6A4F] transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <a
                href="/"
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-stone-600 hover:text-stone-900 text-xs font-semibold hover:bg-stone-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Return to Homepage</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
