// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { Suspense } from 'react';
import Spinner from './Spinner';

const LoadingFallback: React.FC = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface rounded-lg min-h-[400px]">
        <Spinner />
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