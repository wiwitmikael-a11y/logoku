import React from 'react';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const SupabaseKeyErrorScreen = ({ error }: { error: string }) => (
    <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center p-4 text-center">
        <div className="max-w-md bg-red-900/50 border border-red-700 p-8 rounded-lg flex flex-col items-center gap-4">
            <img 
                src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                alt="Mang AI looking confused"
                className="w-24 h-24 object-contain filter grayscale opacity-80"
                style={{ imageRendering: 'pixelated' }}
            />
            <div>
                <h2 className="text-2xl font-bold text-red-400 mb-2">Kesalahan Konfigurasi Supabase</h2>
                <p className="text-red-200">{error}</p>
                <p className="text-gray-400 mt-4 text-sm">Pastikan kamu sudah mengatur environment variable di Vercel dengan awalan 'VITE_' dan melakukan deploy ulang ya.</p>
            </div>
        </div>
    </div>
);

export default SupabaseKeyErrorScreen;
