
import React, { useState } from 'react';
import { playSound } from '../../services/soundService';

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  title?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy, className, title }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    playSound('select');
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title={isCopied ? "Teks tersalin!" : (title || "Salin teks")}
      className={`p-2 transition-colors bg-gray-800/50 hover:bg-gray-700/50 rounded-full ${isCopied ? 'text-green-400' : 'text-gray-400 hover:text-indigo-400'} ${className}`}
    >
      {isCopied ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
          <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" />
        </svg>
      )}
    </button>
  );
};

export default CopyButton;
