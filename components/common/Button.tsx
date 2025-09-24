
import React from 'react';
import { playSound, unlockAudio } from '../../services/soundService';
import LoadingMessage from './LoadingMessage';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary';
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const Button: React.FC<ButtonProps> = ({ children, onClick, isLoading, variant = 'primary', ...props }) => {
  
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Make it async to wait for audio context to resume
    await unlockAudio();
    
    playSound('click');
    if (onClick) {
      onClick(e);
    }
  };

  const handleMouseEnter = async () => {
    await unlockAudio(); // Also unlock on hover
    playSound('hover');
  }
  
  const baseClasses = "relative inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 disabled:cursor-not-allowed transition-all duration-300 ease-in-out";
  const primaryClasses = "text-white bg-indigo-600 shadow-lg hover:bg-indigo-700 disabled:bg-indigo-900/50";
  const secondaryClasses = "text-indigo-300 bg-transparent border border-indigo-500 hover:bg-indigo-500/20 disabled:border-indigo-800/50 disabled:text-gray-500";
  
  const variantClasses = variant === 'primary' ? primaryClasses : secondaryClasses;


  return (
    <button
      {...props}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={isLoading || props.disabled}
      className={`${baseClasses} ${variantClasses}`}
    >
      {isLoading && variant === 'primary' && (
        <img
          src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
          alt="Mang AI working..."
          className="animate-bouncing-ai absolute left-1/2 -translate-x-1/2 bottom-full w-32 h-32"
        />
      )}
      {isLoading ? <LoadingMessage /> : children}
    </button>
  );
};

export default Button;