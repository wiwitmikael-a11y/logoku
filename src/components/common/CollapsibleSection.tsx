// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import GlowingArrowButton from './GlowingArrowButton';

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  initialOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, children, initialOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div className="bg-surface rounded-2xl border border-border-main overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-bold text-text-header">{title}</h3>
        </div>
        <GlowingArrowButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
      </button>
      <div
        className={`transition-all duration-500 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
        style={{ display: 'grid' }}
      >
        <div className="overflow-hidden">
          <div className="p-4 border-t border-border-main">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
