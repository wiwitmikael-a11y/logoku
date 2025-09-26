import React, { ErrorInfo, ReactNode } from 'react';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // The 'imageRendering' property is not standard in all TypeScript versions of React's CSSProperties.
      // This can cause a misleading type error on `this.props` in certain toolchains.
      // Extracting the style object into a variable with an `any` cast helps isolate the issue
      // and allows the compiler to correctly process the component.
      const imgStyle: any = { imageRendering: 'pixelated' };
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
                    </details>
                )}
            </div>
        </div>
      );
    }

    // FIX: The error "Property 'props' does not exist on type 'ErrorBoundary'" can be a symptom of a
    // toolchain or type inference issue. The previous implementation using direct access `this.props.children`
    // was failing. Switching to destructuring `children` from `this.props` to resolve this.
    const { children } = this.props;
    return children;
  }
}

export default ErrorBoundary;