// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  // FIX: Reverted from a class property initializer to a standard constructor.
  // The error "Property 'props' does not exist" indicates a potential issue with
  // component initialization. Using a constructor and calling super(props) is the
  // canonical and most robust way to ensure `this.props` is set up correctly.
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-text-body p-4">
          <div className="max-w-xl text-center">
            <h1 className="text-3xl font-bold text-primary mb-4">Waduh, Ada Masalah Nih!</h1>
            <p className="mb-4">Sepertinya terjadi kesalahan yang tidak terduga. Coba refresh halaman ini. Jika masalah berlanjut, hubungi developer.</p>
            <details className="text-left bg-surface p-4 rounded-lg text-sm text-text-muted">
              <summary>Detail Error</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words">
                {this.state.error?.toString()}
              </pre>
            </details>
             <button
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
            >
              Refresh Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;