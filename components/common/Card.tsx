
import React from 'react';
import { playSound, unlockAudio } from '../../services/soundService';

interface CardProps {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, onClick, isSelected, className }) => {
  
  const handleClick = () => {
    if (onClick) {
      // Also unlock audio here for the first interaction if it's a card click.
      unlockAudio();
      playSound('select');
      onClick();
    }
  };
  
  const handleMouseEnter = () => {
    if (onClick) { // Only play hover sound on clickable cards
      unlockAudio();
      playSound('hover');
    }
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`bg-gray-800 border rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${className} ${
        onClick ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/50'
          : 'border-gray-700 hover:border-indigo-500/50'
      }`}
    >
      <div className="p-5">
        <h3 className="text-lg font-bold text-indigo-400 mb-3">{title}</h3>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Card;
