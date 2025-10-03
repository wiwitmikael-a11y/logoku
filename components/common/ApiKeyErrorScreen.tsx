import React, { useState } from 'react';
import Button from './Button';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const ApiKeyErrorScreen = () => {
    const [isCopied, setIsCopied] = useState(false);
    const errorMessage = "Kesalahan Konfigurasi API Key: Waduh, API Key Google Gemini (`VITE_API_KEY`) nggak ketemu, bro! Untuk aplikasi frontend yang di-deploy di Vercel, semua environment variable wajib diawali dengan `VITE_` agar bisa diakses. Pastikan kamu sudah mengatur `VITE_API_KEY` di settingan Vercel.";

    const handleCopy = () => {
        navigator.clipboard.writeText(errorMessage);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex items-center justify-center p-4 text-center">
        <div className="max-w-md bg-white border border-red-300 p-8 rounded-lg shadow-lg flex flex-col items-center gap-4">
            <img 
                src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                alt="Mang AI looking confused"
                className="w-24 h-24 object-contain filter grayscale opacity-80"
                style={{ imageRendering: 'pixelated' }}
            />
            <div>
                <h2 className="text-2xl font-bold text-red-600 mb-2">Kesalahan Konfigurasi API Key</h2>
                <p className="text-slate-600">Waduh, API Key Google Gemini (`VITE_API_KEY`) nggak ketemu, bro!</p>
                <p className="text-slate-500 mt-4 text-sm bg-slate-100 p-3 rounded-md">
                    Untuk aplikasi frontend yang di-deploy di Vercel, semua environment variable <strong className="text-slate-700">wajib diawali dengan `VITE_`</strong> agar bisa diakses. Pastikan kamu sudah mengatur `VITE_API_KEY` di settingan Vercel.
                </p>
            </div>
            <Button onClick={handleCopy} variant="secondary" size="small" className="mt-4 !border-red-300 !text-red-600 hover:!bg-red-50">
                {isCopied ? 'Info Tersalin!' : 'Salin Info Error'}
            </Button>
        </div>
    </div>
    );
};

export default ApiKeyErrorScreen;