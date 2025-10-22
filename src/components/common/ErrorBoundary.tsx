// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from './Button'; // Menggunakan komponen Button kustom kita

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  copied: boolean;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
    copied: false,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleCopyError = () => {
    if (this.state.error) {
      navigator.clipboard.writeText(this.state.error.toString());
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-text-body p-4">
          <div className="max-w-lg text-center bg-surface p-8 rounded-2xl shadow-xl border border-border-main">
            <img 
              src={`${GITHUB_ASSETS_URL}Mang_AI_Pusing.png`} 
              alt="Mang AI Pusing" 
              className="w-32 h-32 mx-auto mb-4"
              style={{ imageRendering: 'pixelated' }}
            />
            <h1 className="text-3xl font-bold text-primary mb-4" style={{ fontFamily: 'var(--font-display)' }}>Waduh, Mang AI Lagi Pusing!</h1>
            <p className="mb-6 text-text-muted">Sepertinya terjadi kesalahan yang tidak terduga di aplikasi. Coba refresh halaman ini. Jika masalah berlanjut, laporkan ke developer ya, Juragan!</p>
            
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => window.location.reload()}
                variant="primary"
              >
                🔄 Refresh Halaman
              </Button>
              <Button 
                onClick={this.handleCopyError}
                variant="secondary"
              >
                {this.state.copied ? '✓ Tersalin!' : '📋 Salin Info Error'}
              </Button>
            </div>

            <details className="text-left mt-6 bg-background p-3 rounded-lg text-xs text-text-muted">
              <summary className="cursor-pointer">Lihat Detail Teknis</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words font-mono">
                {this.state.error?.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;