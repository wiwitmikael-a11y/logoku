// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { playSound, unlockAudio } from '../../services/soundService';

interface CardProps {
  title: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, onClick, isSelected, className }) => {
  
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
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all duration-200 ${className} ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      } ${
        isSelected
          ? 'border-sky-500 ring-2 ring-sky-500/30'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <div className="p-5">
        <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Card;