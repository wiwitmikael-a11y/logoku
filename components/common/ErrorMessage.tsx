import React from 'react';

interface ErrorMessageProps {
    message: string;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
    return (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 flex items-start gap-4">
            <img 
                src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                alt="Mang AI looking confused"
                className="w-16 h-16 object-contain filter grayscale opacity-80"
                style={{ imageRendering: 'pixelated' }}
            />
            <div className="flex-1">
                <h4 className="font-bold text-red-400 text-lg mb-1">Waduh, Ada Masalah!</h4>
                <p className="text-red-200 text-sm">{message}</p>
            </div>
        </div>
    );
};

export default ErrorMessage;
