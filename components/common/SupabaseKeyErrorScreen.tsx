import React, { useState } from 'react';
import Button from './Button';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const SupabaseKeyErrorScreen = ({ error }: { error: string }) => {
    const [isCopied, setIsCopied] = useState(false);
    
    const userFriendlyMessage = "Waduh, Juragan! Kayaknya ada yang nyabut kabel server Mang AI, nih. Jadi nggak bisa nyambung ke database.";
    const secretErrorCode = "[ERROR: KABEL_SBLS]";

    const handleCopy = () => {
        navigator.clipboard.writeText(`${userFriendlyMessage}\n\n${secretErrorCode}\n(Internal: ${error})`);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const tripAnimation = ` @keyframes mang-ai-tripped { 0% { transform: translateY(0) rotate(0deg); } 20% { transform: translateY(-20px) rotate(-15deg); } 40% { transform: translateY(0) rotate(15deg) scale(1.1, 0.9); } 50% { transform: translateY(-10px) rotate(-10deg); } 60% { transform: translateY(0) rotate(5deg); } 70% { transform: translateY(0) rotate(0deg) scale(0.95, 1.05); } 80%, 100% { transform: translateY(0) rotate(0deg); } } .animate-tripped-ai { animation: mang-ai-tripped 1.5s ease-in-out infinite; transform-origin: bottom center; } `;

    return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4 text-center transition-colors duration-300">
        <style>{tripAnimation}</style>
        <div className="max-w-md w-full flex flex-col items-center gap-6">
            <img 
                src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                alt="Mang AI tersandung kabel"
                className="w-40 h-40 object-contain animate-tripped-ai"
                style={{ imageRendering: 'pixelated' }}
            />
            <div className="bg-surface border border-border-main p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-accent mb-2">Koneksi Gagal!</h2>
                <p className="text-text-body">{userFriendlyMessage}</p>
                 <p className="mt-4 text-sm text-text-muted font-mono bg-background inline-block px-2 py-1 rounded">
                    {secretErrorCode}
                </p>
            </div>
            <Button onClick={handleCopy} variant="secondary" size="small" className="!border-accent/50 !text-accent hover:!bg-accent/10">
                {isCopied ? 'Info Tersalin!' : 'Salin Info Error'}
            </Button>
        </div>
    </div>
    );
};

export default SupabaseKeyErrorScreen;