// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useMemo } from 'react';
import type { AIPetState, AIPetTier } from '../types';

interface AIPetVisualProps {
  petState: AIPetState;
  className?: string;
  behavior?: 'idle' | 'walking' | 'running' | 'jumping' | 'interacting' | 'turning' | 'somersault';
  direction?: number;
}

// --- NEW AIPOD VISUAL ---
const AIPodVisual: React.FC = () => {
    const podAnimation = `
        @keyframes pod-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes core-pulse { 0%, 100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
        @keyframes crystal-orbit-1 { 0% { transform: rotate(0deg) translateX(50px) rotate(0deg) scale(0.9); } 100% { transform: rotate(360deg) translateX(50px) rotate(-360deg) scale(0.9); } }
        @keyframes crystal-orbit-2 { 0% { transform: rotate(72deg) translateX(55px) rotate(0deg) scale(1.1); } 100% { transform: rotate(-288deg) translateX(55px) rotate(360deg) scale(1.1); } }
        @keyframes crystal-orbit-3 { 0% { transform: rotate(144deg) translateX(52px) rotate(0deg) scale(1.0); } 100% { transform: rotate(504deg) translateX(52px) rotate(-360deg) scale(1.0); } }
        @keyframes crystal-orbit-4 { 0% { transform: rotate(216deg) translateX(48px) rotate(0deg) scale(0.8); } 100% { transform: rotate(-144deg) translateX(48px) rotate(360deg) scale(0.8); } }
        @keyframes crystal-orbit-5 { 0% { transform: rotate(288deg) translateX(58px) rotate(0deg) scale(1.2); } 100% { transform: rotate(648deg) translateX(58px) rotate(-360deg) scale(1.2); } }
    `;
    return (
        <div className="w-full h-full" style={{ animation: `pod-float 4s ease-in-out infinite` }}>
            <style>{podAnimation}</style>
            <svg viewBox="0 0 120 120" className="w-full h-full">
                <defs>
                    <filter id="runeGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                     <linearGradient id="totemGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#4a4a52" />
                        <stop offset="50%" stopColor="#303036" />
                        <stop offset="100%" stopColor="#25252a" />
                    </linearGradient>
                </defs>

                {/* Floating Crystals */}
                <g filter="url(#runeGlow)">
                    <g style={{ animation: `crystal-orbit-1 12s linear infinite`, transformOrigin: '60px 85px' }}>
                        <path d="M-4,-6 L5,0 L-3,7 Z" fill="rgb(var(--c-primary))" />
                    </g>
                    <g style={{ animation: `crystal-orbit-2 15s linear infinite reverse`, transformOrigin: '60px 85px' }}>
                        <path d="M-5,5 L6,-2 L2,8 Z" fill="rgb(var(--c-primary))" />
                    </g>
                    <g style={{ animation: `crystal-orbit-3 10s linear infinite`, transformOrigin: '60px 85px' }}>
                        <path d="M0,-7 L6,5 L-6,5 Z" fill="rgb(var(--c-primary))" />
                    </g>
                    <g style={{ animation: `crystal-orbit-4 18s linear infinite reverse`, transformOrigin: '60px 85px' }}>
                        <path d="M-6,0 L0,8 L6,0 L0,-8 Z" fill="rgb(var(--c-primary))" />
                    </g>
                    <g style={{ animation: `crystal-orbit-5 9s linear infinite`, transformOrigin: '60px 85px' }}>
                        <path d="M-7,-2 L7,-2 L0,9 Z" fill="rgb(var(--c-primary))" />
                    </g>
                </g>
                
                {/* Main Totem Body */}
                <g>
                    <path d="M45 100 L40 80 L80 80 L75 100 Z" fill="url(#totemGradient)" stroke="#1a1a1c" strokeWidth="1.5" />
                    <path d="M40 80 L40 50 L80 50 L80 80 Z" fill="url(#totemGradient)" stroke="#1a1a1c" strokeWidth="1.5" />
                    <path d="M40 50 L45 30 L75 30 L80 50 Z" fill="url(#totemGradient)" stroke="#1a1a1c" strokeWidth="1.5" />
                </g>

                {/* Central Rune Core */}
                 <g style={{ animation: `core-pulse 2.5s ease-in-out infinite`, transformOrigin: 'center' }} filter="url(#runeGlow)">
                    <rect x="50" y="55" width="20" height="20" fill="rgb(var(--c-primary))" rx="2" />
                    {/* Rune Glyphs */}
                    <path d="M55 58 V 72 M52 65 H 58" stroke="rgb(var(--c-bg))" strokeWidth="1.5" />
                    <path d="M65 58 L 62 65 L 65 72" stroke="rgb(var(--c-bg))" strokeWidth="1.5" fill="none" />
                </g>
            </svg>
        </div>
    );
};

const AIPetVisual: React.FC<AIPetVisualProps> = ({ petState, className, behavior = 'idle', direction = 1 }) => {
    const { stage, blueprint, colors, stats, name, tier } = petState;

    const petSpriteStyle = useMemo(() => {
        if (!blueprint || !name) return {};

        const petId = parseInt(name.split('-')[1] || '0', 10);
        const cellIndex = petId % 16;
        const gridX = cellIndex % 4;
        const gridY = Math.floor(cellIndex / 4);
        
        // Sprite sheet is 4x4, so each cell is 25% of the width/height.
        // The background position is calculated as a percentage.
        const backgroundPositionX = gridX * (100 / (4 - 1));
        const backgroundPositionY = gridY * (100 / (4 - 1));

        return {
            backgroundImage: `url(${blueprint.url})`,
            backgroundSize: '400% 400%', // 4x4 grid
            backgroundPosition: `${backgroundPositionX}% ${backgroundPositionY}%`,
        };
    }, [blueprint, name]);

    const glowStyle = useMemo(() => {
        if (!colors || stage === 'aipod') return {};
        const baseSize = tier === 'mythic' ? 12 : tier === 'epic' ? 8 : 4;
        const pulseSize = tier === 'mythic' ? 18 : tier === 'epic' ? 12 : 4;
        const energyFactor = (stats.energy / 100) * 0.5 + 0.6;
        const glowColor = colors.energy.base;
        const base = `${glowColor} 0px 0px ${baseSize}px, ${glowColor} 0px 0px ${baseSize * 2}px`;
        const pulse = `${glowColor} 0px 0px ${pulseSize}px, ${glowColor} 0px 0px ${pulseSize * 2}px`;
        
        return {
            '--glow-filter-base': `drop-shadow(${base})`,
            '--glow-filter-pulse': `drop-shadow(${pulse})`,
            filter: `var(--glow-filter-base)`,
            opacity: energyFactor,
        };
    }, [tier, stats.energy, colors, stage]);

    const animationClass = useMemo(() => {
        switch (behavior) {
            case 'walking':
            case 'running':
                return 'animate-aipet-walk';
            case 'jumping':
                return 'animate-aipet-jump';
            case 'interacting':
                return 'animate-aipet-interact';
            case 'somersault':
                return 'animate-aipet-somersault';
            default: // idle, turning
                return 'animate-aipet-idle';
        }
    }, [behavior]);

    const tierGlowClass = tier === 'mythic' ? 'animate-aipet-glow-mythic' : tier === 'epic' ? 'animate-aipet-glow-epic' : '';

    if (stage === 'aipod') {
        return <div className={`w-full h-full ${className || ''}`}><AIPodVisual /></div>;
    }
    
    if (!blueprint || !colors) {
        return <div className="w-full h-full flex items-center justify-center text-xs text-text-muted">Loading visual...</div>;
    }

    return (
        <div 
            style={{...glowStyle, imageRendering: 'pixelated'}}
            className={`w-full h-full ${tierGlowClass} ${className || ''}`}
            title={petState.name}
        >
            <div 
                className={`w-full h-full bg-no-repeat ${animationClass}`}
                style={{
                    ...petSpriteStyle,
                    transform: `scaleX(${direction})`,
                }}
            />
        </div>
    );
};

export default AIPetVisual;