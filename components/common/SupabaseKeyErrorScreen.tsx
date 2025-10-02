import React, { useState } from 'react';
import Button from './Button';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const SupabaseKeyErrorScreen = ({ error }: { error: string }) => {
    const [isCopied, setIsCopied] = useState(false);
    
    // The user-facing message is now static and on-brand.
    const userFriendlyMessage = "Waduh, Juragan! Kayaknya ada yang nyabut kabel server Mang AI, nih. Jadi nggak bisa nyambung ke database.";
    const secretErrorCode = "[ERROR: KABEL_SBLS]"; // SBLS = Supabase Login Services. Your secret code.

    const handleCopy = () => {
        // Copy the friendly message AND the secret code for debugging.
        navigator.clipboard.writeText(`${userFriendlyMessage}\n\n${secretErrorCode}\n(Internal: ${error})`);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center p-4 text-center">
        <div className="max-w-md w-full flex flex-col items-center gap-6">
            <img 
                src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                alt="Mang AI tersandung kabel"
                className="w-40 h-40 object-contain animate-tripped-ai"
                style={{ imageRendering: 'pixelated' }}
            />
            <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-lg">
                <h2 className="text-2xl font-bold text-yellow-400 mb-2">Koneksi Gagal!</h2>
                <p className="text-gray-300">{userFriendlyMessage}</p>
                 <p className="mt-4 text-sm text-gray-500 font-mono bg-gray-900/50 inline-block px-2 py-1 rounded">
                    {secretErrorCode}
                </p>
            </div>
            <Button onClick={handleCopy} variant="secondary" size="small" className="!border-yellow-500/50 !text-yellow-300 hover:!bg-yellow-500/20">
                {isCopied ? 'Info Tersalin!' : 'Salin Info Error'}
            </Button>
        </div>
    </div>
    );
};

export default SupabaseKeyErrorScreen;