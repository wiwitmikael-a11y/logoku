// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useRef } from 'react';
import { playSound, unlockAudio } from '../../services/soundService';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, name, className, ...props }) => {
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
      <label htmlFor={name} className="block mb-1.5 text-sm font-medium text-slate-600">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        {...props}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        className="w-full px-3 py-2 text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-colors"
      />
    </div>
  );
};

export default Textarea;