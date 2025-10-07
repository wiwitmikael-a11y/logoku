// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useMemo, useEffect, useRef } from 'react';
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

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

const AIPetVisual: React.FC<AIPetVisualProps> = ({ petState, className, behavior = 'idle', direction = 1 }) => {
    const { stage, blueprint, colors, stats, name, tier } = petState;
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        if (stage === 'aipod' || !blueprint || !colors) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous'; // Important for loading images from CDN
        img.src = blueprint.url;
        
        img.onload = () => {
            const petId = parseInt(name.split('-')[1] || '0', 10);
            const cellIndex = petId % 16;
            const gridX = cellIndex % 4;
            const gridY = Math.floor(cellIndex / 4);

            const sourceSize = 256; // Each cell in the 1024x1024 (4x4) grid is 256x256
            const sourceX = gridX * sourceSize;
            const sourceY = gridY * sourceSize;

            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = sourceSize;
            offscreenCanvas.height = sourceSize;
            const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
            if (!offscreenCtx) return;

            offscreenCtx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, sourceSize, sourceSize);
            const imageData = offscreenCtx.getImageData(0, 0, sourceSize, sourceSize);
            const data = imageData.data;

            const armorColor = hexToRgb(colors.mechanical.base);
            const skinColor = hexToRgb(colors.organic.base);
            const energyColor = hexToRgb(colors.energy.base);

            if (!armorColor || !skinColor || !energyColor) return;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                if (a === 0) continue;

                // White becomes transparent
                if (r > 240 && g > 240 && b > 240) {
                    data[i + 3] = 0;
                    continue;
                }

                // Black (outline) remains unchanged
                if (r < 15 && g < 15 && b < 15) {
                    continue;
                }

                // Green -> Armor (Mechanical)
                if (g > r && g > b) {
                    data[i] = armorColor.r;
                    data[i + 1] = armorColor.g;
                    data[i + 2] = armorColor.b;
                }
                // Red -> Skin/Flesh (Organic)
                else if (r > g && r > b) {
                    data[i] = skinColor.r;
                    data[i + 1] = skinColor.g;
                    data[i + 2] = skinColor.b;
                }
                // Blue -> Eyes/Energy
                else if (b > r && b > g) {
                    data[i] = energyColor.r;
                    data[i + 1] = energyColor.g;
                    data[i + 2] = energyColor.b;
                }
            }

            offscreenCtx.putImageData(imageData, 0, 0);

            // Draw final colored image to the visible canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = false; // Preserve pixelated style
            ctx.drawImage(offscreenCanvas, 0, 0, canvas.width, canvas.height);
        };
        img.onerror = () => {
             console.error(`Failed to load blueprint image: ${blueprint.url}`);
        }

    }, [petState, canvasRef]); // Redraw whenever the petState changes

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
            style={{ ...glowStyle, imageRendering: 'pixelated' }}
            className={`w-full h-full ${tierGlowClass} ${className || ''}`}
            title={petState.name}
        >
            <div 
                className={`w-full h-full ${animationClass}`}
                style={{
                    transform: `scaleX(${direction})`,
                }}
            >
                <canvas 
                    ref={canvasRef} 
                    width={256} 
                    height={256} 
                    className="w-full h-full"
                />
            </div>
        </div>
    );
};

export default AIPetVisual;