// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { playSound, unlockAudio } from '../../services/soundService';

interface CardProps {
  title: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ title, children, onClick, isSelected, className, style }, ref) => {
  
  const handleClick = async () => {
    if (onClick) {
      await unlockAudio();
      playSound('select');
      onClick();
    }
  };
  
  const handleMouseEnter = async () => {
    if (onClick) {
      await unlockAudio();
      playSound('hover');
    }
  };

  return (
    <div
      ref={ref}
      style={style}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`bg-surface border rounded-xl shadow-lg shadow-black/20 overflow-hidden transition-all duration-300 ${className} 
      ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      } ${
        isSelected
          ? 'border-primary ring-4 ring-primary/30'
          : 'border-border-main hover:border-splash/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-splash/20'
      }`}
    >
      <div className="p-4 sm:p-5">
        <h3 className="text-2xl font-bold text-text-header mb-4" style={{ fontFamily: 'var(--font-display)' }}>{title}</h3>
        <div>{children}</div>
      </div>
    </div>
  );
});

Card.displayName = 'Card';

export default React.memo(Card);