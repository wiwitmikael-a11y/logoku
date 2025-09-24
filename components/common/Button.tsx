import React from 'react';
import { playSound, unlockAudio } from '../../services/soundService';
import LoadingMessage from './LoadingMessage';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
}

const GITHUB_ASSETS_URL = 'https://raw.githubusercontent.com/wiwitmikael-a11y/logoku-assets/main/';

const Button: React.FC<ButtonProps> = ({ children, onClick, isLoading, ...props }) => {
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Attempt to unlock the audio context on the first user interaction.
    // This is safe to call multiple times as it only runs once.
    unlockAudio();
    
    playSound('click');
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={isLoading || props.disabled}
      className="relative inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 disabled:bg-indigo-900/50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out"
    >
      {isLoading && (
        <img
          src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
          alt="Mang AI working..."
          className="animate-bouncing-ai absolute left-1/2 -translate-x-1/2 bottom-full w-12 h-12"
        />
      )}
      {isLoading ? <LoadingMessage /> : children}
    </button>
  );
};

export default Button;
