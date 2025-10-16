// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { Suspense } from 'react';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const LoadingFallback: React.FC = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface rounded-lg min-h-[400px]">
        <img
            src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
            alt="Mang AI working..."
            className="w-24 h-24 animate-bouncing-ai"
            style={{ imageRendering: 'pixelated' }}
        />
        <p className="mt-4 text-lg font-semibold animate-pulse">Memuat modul...</p>
    </div>
);

interface ModuleLoaderProps {
    children: React.ReactNode;
}

const ModuleLoader: React.FC<ModuleLoaderProps> = ({ children }) => {
    return (
        <Suspense fallback={<LoadingFallback />}>
            {children}
        </Suspense>
    );
};

export default ModuleLoader;
