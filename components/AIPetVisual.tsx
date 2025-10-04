// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import type { AIPetState } from '../types';

interface AIPetVisualProps {
  petState: AIPetState;
  className?: string;
}

// --- EGG VISUAL (No changes needed) ---
const EggVisual: React.FC = () => {
    const eggAnimation = `
        @keyframes egg-pulse { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.03) translateY(-2px); } }
        @keyframes divine-glow { 0%, 100% { filter: drop-shadow(0 0 15px rgb(var(--c-splash) / 0.5)) drop-shadow(0 0 30px rgb(var(--c-splash) / 0.3)); } 50% { filter: drop-shadow(0 0 25px rgb(var(--c-splash) / 0.8)) drop-shadow(0 0 50px rgb(var(--c-splash) / 0.5)); } }
    `;
    return (
        <div className="w-full h-full" style={{ animation: `egg-pulse 2.5s ease-in-out infinite, divine-glow 3.5s ease-in-out infinite` }}>
            <style>{eggAnimation}</style>
            <svg viewBox="0 0 100 135" className="w-full h-full">
                <defs>
                    <pattern id="mecha-pattern-egg" patternUnits="userSpaceOnUse" width="12" height="12">
                        <path d="M-2,2 l4,-4 M0,12 l12,-12 M10,14 l4,-4" stroke="rgb(var(--c-border))" strokeWidth="0.7" />
                    </pattern>
                    <radialGradient id="eggShine" cx="0.3" cy="0.3" r="0.8">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </radialGradient>
                    <linearGradient id="metalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#404040" />
                        <stop offset="50%" stopColor="#2a2a2e" />
                        <stop offset="100%" stopColor="#404040" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <g id="mechanical-base">
                    <path d="M 20 115 C 30 130, 70 130, 80 115 L 75 110 C 65 120, 35 120, 25 110 Z" fill="url(#metalGradient)" stroke="#18181b" strokeWidth="2" />
                    <ellipse cx="50" cy="118" rx="15" ry="4" fill="rgb(var(--c-splash))" filter="url(#glow)" />
                    <path d="M 22 114 L 35 105 M 78 114 L 65 105" stroke="#18181b" strokeWidth="1.5" />
                </g>
                <g>
                    <path d="M50,5 C25,5 12,35 12,70 C12,105 30,120 50,120 C70,120 88,105 88,70 C88,35 75,5 50,5Z" fill="#404040" stroke="#18181b" strokeWidth="3"/>
                    <path d="M50,5 C25,5 12,35 12,70 C12,105 30,120 50,120 C70,120 88,105 88,70 C88,35 75,5 50,5Z" fill="url(#mecha-pattern-egg)" opacity="0.3"/>
                    <path d="M 40 20 Q 50 40 45 60 T 55 90" stroke="rgb(var(--c-splash))" strokeWidth="1.5" fill="none" strokeLinecap="round" filter="url(#glow)"/>
                    <path d="M 60 25 Q 75 50 60 75 T 70 100" stroke="rgb(var(--c-splash))" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.7" filter="url(#glow)"/>
                    <circle cx="50" cy="70" r="3" fill="rgb(var(--c-splash))" filter="url(#glow)" />
                    <path d="M50,5 C25,5 12,35 12,70 C12,105 30,120 50,120 C70,120 88,105 88,70 C88,35 75,5 50,5Z" fill="url(#eggShine)"/>
                </g>
            </svg>
        </div>
    );
};

// --- NEW SPRITE SHEET ANIMATION COMPONENT ---
const AIPetVisual: React.FC<AIPetVisualProps> = ({ petState, className }) => {
  const { stats, stage, sprite_sheet_url } = petState;

  // Keyframes for the 4x3 sprite sheet animation
  const animationKeyframes = `
    @keyframes pet-sprite-idle {
      from { background-position: 0% 0%; }
      to { background-position: -400% 0%; }
    }
    @keyframes pet-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5%); }
    }
  `;

  // Apply visual effects based on pet's energy
  const filterStyle: React.CSSProperties = {
    filter: stats.energy < 30 ? `saturate(${stats.energy + 20}%) opacity(0.8)` : 'none',
    imageRendering: 'pixelated',
  };

  // Render the egg if it's not hatched yet
  if (stage === 'egg' || !sprite_sheet_url) {
      return (
          <div style={filterStyle} className={`w-full h-full ${className || ''}`}>
              <EggVisual />
          </div>
      );
  }

  // Render the animated sprite
  return (
    <div 
        style={filterStyle}
        className={`w-full h-full object-contain ${className || ''}`}
    >
        <style>{animationKeyframes}</style>
        <div
            style={{
                width: '100%',
                height: '100%',
                backgroundImage: `url(${sprite_sheet_url})`,
                backgroundSize: '400% 300%', // 4x3 grid
                backgroundPosition: '0 0',
                animation: `pet-sprite-idle 1.2s steps(4) infinite, pet-float 4s ease-in-out infinite`,
            }}
        />
    </div>
  );
};

export default AIPetVisual;