// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { playSound, unlockAudio } from '../../services/soundService';

interface CardProps {
  title: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
  // FIX: Added style prop to allow passing inline styles for animations.
  style?: React.CSSProperties;
}

// FIX: Converted component to use React.forwardRef to accept `ref` and `style` props.
// This resolves TypeScript errors where these props were passed for scrolling and animations
// but not defined in the original component signature.
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
      className={`bg-surface border rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${className} 
      dark:border-t-splash/50
      ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      } ${
        isSelected
          ? 'border-primary ring-2 ring-primary/30'
          : 'border-border-main hover:border-border-light hover:shadow-md'
      }`}
    >
      <div className="p-5">
        <h3 className="text-lg font-bold text-text-header mb-4">{title}</h3>
        <div>{children}</div>
      </div>
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
