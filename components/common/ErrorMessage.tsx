import React, { useState } from 'react';
import Button from './Button';

interface ErrorMessageProps {
    message: string;
    onGoToDashboard?: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onGoToDashboard }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    };

    return (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 flex flex-col sm:flex-row items-start gap-4">
            <img 
                src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                alt="Mang AI looking confused"
                className="w-16 h-16 object-contain filter grayscale opacity-80 flex-shrink-0"
                style={{ imageRendering: 'pixelated' }}
            />
            <div className="flex-1">
                <h4 className="font-bold text-red-400 text-lg mb-1">Waduh, Ada Masalah!</h4>
                <p className="text-red-200 text-sm selectable-text">{message}</p>
                <div className="flex items-center gap-4 mt-4">
                    <Button 
                        onClick={handleCopy} 
                        variant="secondary" 
                        size="small" 
                        className="!border-red-500/50 !text-red-300 hover:!bg-red-500/20"
                    >
                        {isCopied ? 'Tersalin!' : 'Salin Detail Error'}
                    </Button>
                    {onGoToDashboard && (
                        <Button
                            onClick={onGoToDashboard}
                            variant="secondary"
                            size="small"
                        >
                            &larr; Kembali ke Menu
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ErrorMessage;