// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import GlowingArrowButton from './GlowingArrowButton';

interface Props {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  initialOpen?: boolean;
}

const CollapsibleSection: React.FC<Props> = ({ title, icon, children, initialOpen = true }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div className="glass-effect rounded-xl transition-all duration-300">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-full text-primary text-xl">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-text-header" style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </h3>
        </div>
        <GlowingArrowButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
      </div>
      {isOpen && (
        <div className="p-4 pt-0 animate-content-fade-in">
          <div className="border-t border-border-main pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
