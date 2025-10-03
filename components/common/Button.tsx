// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect } from 'react';
import { playSound, unlockAudio } from '../../services/soundService';
import LoadingMessage from './LoadingMessage';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'splash';
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
  
  const baseClasses = "relative inline-flex items-center justify-center gap-2 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed transition-all duration-200 ease-in-out overflow-hidden transform hover:-translate-y-0.5 active:translate-y-0";
  
  const variantClasses = {
    primary: "text-white bg-primary shadow-lg shadow-sky-500/20 hover:bg-primary-hover focus:ring-primary disabled:bg-primary/50",
    secondary: "text-text-body bg-surface border border-border-main hover:bg-background hover:border-border-light focus:ring-primary disabled:bg-background disabled:text-text-muted",
    accent: "text-white bg-accent shadow-lg shadow-orange-500/20 hover:bg-accent-hover focus:ring-accent disabled:bg-accent/50",
    splash: "text-white bg-splash shadow-lg shadow-fuchsia-500/30 hover:bg-splash-hover focus:ring-splash disabled:bg-splash/50 btn-splash-hover z-0",
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
      <span className="relative z-10">{isLoading ? <LoadingMessage /> : children}</span>
    </button>
  );
};

export default Button;