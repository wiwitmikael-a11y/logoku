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
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col sm:flex-row items-start gap-4">
            <img 
                src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                alt="Mang AI looking confused"
                className="w-16 h-16 object-contain filter grayscale opacity-80 flex-shrink-0"
                style={{ imageRendering: 'pixelated' }}
            />
            <div className="flex-1">
                <h4 className="font-bold text-red-600 text-lg mb-1">Waduh, Ada Masalah!</h4>
                <p className="text-red-800 text-sm selectable-text">{message}</p>
                <div className="flex items-center gap-4 mt-4">
                    <Button 
                        onClick={handleCopy} 
                        variant="secondary" 
                        size="small" 
                        className="!border-red-300 !text-red-700 hover:!bg-red-100"
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