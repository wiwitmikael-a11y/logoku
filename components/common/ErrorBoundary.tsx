// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { ErrorInfo, ReactNode } from 'react';
import Button from './Button';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

interface Props {
  children?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  isCopied: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  // FIX: Reverted to constructor-based state initialization and method binding
  // to ensure 'this' context is correctly bound in all environments,
  // resolving potential issues with class property syntax.
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      isCopied: false,
    };
    this.handleCopy = this.handleCopy.bind(this);
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleCopy() {
    if (this.state.error) {
      navigator.clipboard.writeText(this.state.error.toString() + "\n" + (this.state.error.stack || ''));
      this.setState({ isCopied: true });
      setTimeout(() => this.setState({ isCopied: false }), 2000);
    }
  }

  render() {
    if (this.state.hasError) {
      const { error, isCopied } = this.state;
      const { onReset } = this.props;
      const imgStyle: React.CSSProperties = { imageRendering: 'pixelated' };
      return (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 my-8 flex flex-col items-center gap-4 text-center">
            <img 
                src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                alt="Mang AI looking very concerned"
                className="w-24 h-24 object-contain"
                style={imgStyle}
            />
            <div className="flex-1">
                <h1 className="font-bold text-red-400 text-2xl mb-2">Waduh, Aplikasinya Error!</h1>
                <p className="text-red-300 mb-4">
                    Mang AI pusing, ada yang rusak di dalam aplikasi. Coba refresh halaman ini. Kalau masih error, mungkin Mang AI lagi istirahat dulu.
                </p>
                <div className="flex flex-wrap justify-center items-center gap-4">
                    <button onClick={() => window.location.reload()} className="!bg-red-600 !text-white hover:!bg-red-700 focus:!ring-red-500">
                        Refresh Halaman
                    </button>
                    {onReset && (
                        <Button onClick={onReset} variant="secondary">
                            &larr; Kembali ke Menu
                        </Button>
                    )}
                </div>
                {error && (
                    <details className="mt-6 text-left text-xs text-text-muted">
                        <summary className="cursor-pointer">Detail Error (untuk developer)</summary>
                        <pre className="mt-2 p-2 bg-background rounded overflow-auto selectable-text">
                            {error.stack || error.toString()}
                        </pre>
                        <button onClick={this.handleCopy} className="mt-2 px-3 py-1 text-xs font-semibold rounded-md text-primary bg-transparent border border-primary/30 hover:bg-primary/10">
                            {isCopied ? 'Tersalin!' : 'Salin Detail'}
                        </button>
                    </details>
                )}
            </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
