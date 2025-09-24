import React from 'react';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const AuthLoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center p-4">
            <img 
                src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                alt="Mang AI character"
                className="w-32 mb-4 animate-pulse"
                style={{ imageRendering: 'pixelated' }}
            />
            <h1 className="text-2xl font-bold text-indigo-400 animate-pulse">
                Ngecek status login...
            </h1>
        </div>
    );
};

export default AuthLoadingScreen;
