// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'left'; // Simplified positioning
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'right' }) => {
  const positionClasses = {
    right: 'left-full ml-3 top-1/2 -translate-y-1/2',
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-3 top-1/2 -translate-y-1/2',
  };

  return (
    <div className="relative group flex items-center">
      {children}
      <div
        className={`absolute whitespace-nowrap bg-[rgb(var(--c-bg-inverse))] text-[rgb(var(--c-text-inverse))] text-xs font-semibold px-3 py-1.5 rounded-md
                   opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50
                   ${positionClasses[position]}`}
      >
        {text}
      </div>
    </div>
  );
};

export default Tooltip;
