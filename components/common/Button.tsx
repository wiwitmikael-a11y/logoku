// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect } from 'react';
import { playSound, unlockAudio } from '../../services/soundService';
import LoadingMessage from './LoadingMessage';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'normal' | 'small' | 'large';
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const Button: React.FC<ButtonProps> = ({ children, onClick, isLoading, variant = 'primary', size = 'normal', ...props }) => {
  
  useEffect(() => {
    if (!isLoading) return;
    let timeoutIds: number[] = [];
    const playBounceSounds = () => {
      timeoutIds.push(window.setTimeout(() => playSound('bounce'), 240));
      timeoutIds.push(window.setTimeout(() => playSound('bounce'), 720));
    };
    playBounceSounds();
    const intervalId = setInterval(playBounceSounds, 1200);
    return () => {
      clearInterval(intervalId);
      timeoutIds.forEach(clearTimeout);
    };
  }, [isLoading]);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    await unlockAudio();
    playSound('click');
    if (onClick) onClick(e);
  };

  const handleMouseEnter = async () => {
    await unlockAudio();
    playSound('hover');
  }
  
  const baseClasses = "relative inline-flex items-center justify-center gap-2 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed transition-all duration-200 ease-in-out";
  
  const variantClasses = {
    primary: "text-white bg-sky-500 shadow-sm hover:bg-sky-600 focus:ring-sky-500 disabled:bg-sky-500/50",
    secondary: "text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:ring-sky-500 disabled:bg-slate-50 disabled:text-slate-400",
    accent: "text-white bg-orange-500 shadow-sm hover:bg-orange-600 focus:ring-orange-500 disabled:bg-orange-500/50",
  };
  
  const sizeClasses = {
    small: "px-4 py-2 text-sm",
    normal: "px-5 py-2.5",
    large: "px-6 py-3 text-base"
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={isLoading || props.disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${props.className || ''}`}
    >
      {isLoading && (
        <img
          src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
          alt="Mang AI working..."
          className="animate-bouncing-ai absolute left-1/2 -translate-x-1/2 bottom-full w-24 h-24"
        />
      )}
      {isLoading ? <LoadingMessage /> : children}
    </button>
  );
};

export default Button;