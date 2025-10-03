import React, { useState } from 'react';
import Button from './Button';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const ApiKeyErrorScreen = () => {
    const [isCopied, setIsCopied] = useState(false);
    const errorMessage = "Kesalahan Konfigurasi API Key: Waduh, API Key Google Gemini (`VITE_API_KEY`) nggak ketemu, bro! Pastikan environment variable `VITE_API_KEY` sudah diatur dengan benar di settingan aplikasi ini.";

    const handleCopy = () => {
        navigator.clipboard.writeText(errorMessage);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4 text-center transition-colors duration-300">
        <div className="max-w-md bg-surface border border-red-300 p-8 rounded-lg shadow-lg flex flex-col items-center gap-4">
            <img 
                src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                alt="Mang AI looking confused"
                className="w-24 h-24 object-contain filter grayscale opacity-80"
                style={{ imageRendering: 'pixelated' }}
            />
            <div>
                <h2 className="text-2xl font-bold text-red-600 mb-2">Kesalahan Konfigurasi API Key</h2>
                <p className="text-text-body">Waduh, API Key Google Gemini (`VITE_API_KEY`) nggak ketemu, bro!</p>
                <p className="text-text-muted mt-4 text-sm bg-background p-3 rounded-md">
                    Pastikan environment variable <strong className="text-text-header">`VITE_API_KEY`</strong> sudah diatur dengan benar di settingan aplikasi ini.
                </p>
            </div>
            <Button onClick={handleCopy} variant="secondary" size="small" className="mt-4 !border-red-300 !text-red-600 hover:!bg-red-500/10">
                {isCopied ? 'Info Tersalin!' : 'Salin Info Error'}
            </Button>
        </div>
    </div>
    );
};

export default ApiKeyErrorScreen;