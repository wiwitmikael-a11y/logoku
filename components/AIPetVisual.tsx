// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import type { AIPetState } from '../types';

interface AIPetVisualProps {
  petState: AIPetState;
  className?: string;
}

const EggVisual: React.FC = () => (
    <svg viewBox="0 0 100 125">
        <g transform="translate(0, 5)">
            <path 
                d="M50,5 C25,5 10,40 10,70 C10,100 30,120 50,120 C70,120 90,100 90,70 C90,40 75,5 50,5Z" 
                fill="url(#eggGradient)" 
                stroke="#52525b" 
                strokeWidth="2"
            />
            <defs>
                <radialGradient id="eggGradient" cx="0.5" cy="0.9" r="0.9">
                    <stop offset="0%" stopColor="#e2e8f0" />
                    <stop offset="100%" stopColor="#f8fafc" />
                </radialGradient>
            </defs>
            <circle cx="50" cy="40" r="8" fill="#c084fc" opacity="0.5" />
            <circle cx="70" cy="70" r="12" fill="#60a5fa" opacity="0.5" />
            <circle cx="35" cy="85" r="10" fill="#f87171" opacity="0.5" />
        </g>
    </svg>
);


const AIPetVisual: React.FC<AIPetVisualProps> = ({ petState, className }) => {
  const { stats, stage, visual_base64 } = petState;

  const filterStyle: React.CSSProperties = {
    filter: stats.energy < 30 ? `saturate(${stats.energy + 20}%) opacity(0.8)` : 'none',
    overflow: 'visible',
    imageRendering: 'pixelated'
  };

  const animationClass = stage !== 'egg' ? 'animate-breathing-ai' : ''; 

  if (stage === 'egg' || !visual_base64) {
      return (
          <div style={filterStyle} className={`w-full h-full ${className || ''} animate-pulse`}>
              <EggVisual />
          </div>
      );
  }

  return (
    <img 
        src={visual_base64} 
        alt={petState.name}
        style={filterStyle}
        className={`w-full h-full object-contain ${animationClass} ${className || ''}`}
    />
  );
};

export default AIPetVisual;