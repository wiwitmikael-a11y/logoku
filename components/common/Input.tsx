// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useRef } from 'react';
import { playSound, unlockAudio } from '../../services/soundService';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input: React.FC<InputProps> = ({ label, name, className, ...props }) => {
  const canPlayTypingSound = useRef(true);

  const handleKeyDown = () => {
    if (canPlayTypingSound.current) {
      playSound('typing');
      canPlayTypingSound.current = false;
      setTimeout(() => {
        canPlayTypingSound.current = true;
      }, 150);
    }
  };
  
  const handleFocus = async () => {
      await unlockAudio();
  };


  return (
    <div className={className}>
      <label htmlFor={name} className="block mb-1.5 text-sm font-medium text-text-muted">
        {label}
      </label>
      <input
        id={name}
        name={name}
        {...props}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        className="w-full px-3 py-2 text-text-body bg-surface border border-border-main rounded-lg focus:outline-none focus:ring-2 focus:ring-splash/50 focus:border-splash transition-colors"
      />
    </div>
  );
};

export default Input;