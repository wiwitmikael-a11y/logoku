import React, { ErrorInfo, ReactNode } from 'react';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isCopied?: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: undefined,
    isCopied: false,
  };

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, isCopied: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  
  handleCopy = () => {
      if(this.state.error) {
          navigator.clipboard.writeText(this.state.error.toString());
          this.setState({ isCopied: true });
          setTimeout(() => this.setState({ isCopied: false }), 2000);
      }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // FIX: Improved type safety for inline styles.
      const imgStyle: React.CSSProperties = { imageRendering: 'pixelated' };
      return (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-8 my-8 flex flex-col items-center gap-4 text-center">
            <img 
                src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                alt="Mang AI looking very concerned"
                className="w-24 h-24 object-contain filter grayscale opacity-80"
                style={imgStyle}
            />
            <div className="flex-1">
                <h1 className="font-bold text-red-400 text-2xl mb-2">Waduh, Aplikasinya Error!</h1>
                <p className="text-red-200 mb-4">
                    Mang AI pusing, ada yang rusak di dalam aplikasi. Coba refresh halaman ini. Kalau masih error, mungkin Mang AI lagi istirahat dulu.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                    Refresh Halaman
                </button>
                {this.state.error && (
                    <details className="mt-4 text-left text-xs text-gray-400">
                        <summary className="cursor-pointer">Detail Error (untuk developer)</summary>
                        <pre className="mt-2 p-2 bg-gray-800 rounded overflow-auto">
                            {this.state.error.toString()}
                        </pre>
                        <button onClick={this.handleCopy} className="mt-2 px-3 py-1 text-xs font-semibold rounded-md text-indigo-300 bg-transparent border border-indigo-500 hover:bg-indigo-500/20">
                            {this.state.isCopied ? 'Tersalin!' : 'Salin Detail'}
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