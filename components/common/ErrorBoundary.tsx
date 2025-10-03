// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { Component, ErrorInfo, ReactNode } from 'react';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // You could also log the error to an external service here
  }
  
  private handleReload = () => {
      window.location.reload();
  }
  
  private handleGoHome = () => {
      window.location.href = '/';
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-text-body flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-surface-content border border-red-500/30 rounded-xl p-8 text-center flex flex-col items-center shadow-lg">
                <img 
                    src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                    alt="Mang AI looking very confused"
                    className="w-32 h-32 object-contain filter grayscale opacity-70 mb-4"
                    style={{ imageRendering: 'pixelated' }}
                />
                <h1 className="text-3xl font-bold text-red-500 mb-2">Waduh, Sesuatu Meledak!</h1>
                <p className="text-text-muted mb-6">
                    Mang AI kayaknya kesandung kabel, nih. Ada error yang nggak terduga di aplikasi.
                    Coba muat ulang halaman, atau kalau masih bandel, kembali ke halaman utama.
                </p>
                
                {this.state.error && (
                    <details className="w-full bg-background p-3 rounded-md text-left mb-6">
                        <summary className="text-sm text-text-muted cursor-pointer">Lihat Detail Error Teknis</summary>
                        <pre className="text-xs text-red-400 mt-2 whitespace-pre-wrap break-words overflow-auto max-h-40">
                            {this.state.error.toString()}
                        </pre>
                    </details>
                )}

                <div className="flex items-center gap-4">
                    <button onClick={this.handleReload} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors">
                        Coba Muat Ulang
                    </button>
                    <button onClick={this.handleGoHome} className="px-5 py-2.5 bg-surface text-text-body font-semibold rounded-lg hover:bg-background transition-colors border border-border-main">
                        Kembali ke Beranda
                    </button>
                </div>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
