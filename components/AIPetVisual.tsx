// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
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

// --- NEW CANVAS-BASED BLUEPRINT RENDERER ---
const imageCache: { [key: string]: HTMLImageElement } = {};
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

const AIPetVisual: React.FC<AIPetVisualProps> = ({ petState, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>(0);
    const partCache = useRef<Map<number, HTMLCanvasElement>>(new Map());
    const [interactionTs, setInteractionTs] = useState(0);
    const { stage, blueprint, colors, stats } = petState;

    // --- Part Assembly Definitions ---
    const partDefinitions = useMemo(() => ({
        'Common_Beast.png': [{ index: 5 }, { index: 1, y: -45, x: 0 }, { index: 4, y: 10, x: -35 }, { index: 6, y: 10, x: 35 }, { index: 9, y: 55, x: -25 }, { index: 11, y: 55, x: 25 }, ],
        'Common_Gorilla.png': [{ index: 6 }, { index: 2, y: -40, x: 0 }, { index: 5, y: 5, x: -45 }, { index: 7, y: 5, x: 45 }, { index: 13, y: 50, x: -20 }, { index: 15, y: 50, x: 20 }, ],
        'Common_Mutant.png': [{ index: 9 }, { index: 1, y: -50, x: 0 }, { index: 4, y: 0, x: -40 }, { index: 7, y: 0, x: 40 }, { index: 12, y: 40, x: -25 }, { index: 14, y: 40, x: 25 }, ],
        'Epic_Random.png': [{ index: 10 }, { index: 1, y: -50, x: 0 }, { index: 4, y: -10, x: -45 }, { index: 7, y: -10, x: 45 }, { index: 13, y: 50, x: 0 }, ],
    }), []);
    
    const handleInteraction = useCallback(() => setInteractionTs(Date.now()), []);

    // Effect to create and color cached part canvases for performance
    useEffect(() => {
        if (!blueprint || !colors) return;
        const blueprintName = blueprint.url.substring(blueprint.url.lastIndexOf('/') + 1);
        const assembly = partDefinitions[blueprintName as keyof typeof partDefinitions];
        if (!assembly) return;

        const organicRGB = hexToRgb(colors.organic);
        const mechanicalRGB = hexToRgb(colors.mechanical);
        const energyRGB = hexToRgb(colors.energy);
        if (!organicRGB || !mechanicalRGB || !energyRGB) return;

        const processBlueprint = (blueprintImg: HTMLImageElement) => {
            partCache.current.clear();
            for (const part of assembly) {
                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = 256;
                offscreenCanvas.height = 256;
                const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
                if (!offscreenCtx) continue;

                const gridX = part.index % 4;
                const gridY = Math.floor(part.index / 4);
                
                offscreenCtx.drawImage(blueprintImg, gridX * 256, gridY * 256, 256, 256, 0, 0, 256, 256);
                const imageData = offscreenCtx.getImageData(0, 0, 256, 256);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i+1], b = data[i+2];
                    if (r > 240 && g < 15 && b < 15) { data[i] = organicRGB.r; data[i+1] = organicRGB.g; data[i+2] = organicRGB.b; } 
                    else if (r < 15 && g > 240 && b < 15) { data[i] = mechanicalRGB.r; data[i+1] = mechanicalRGB.g; data[i+2] = mechanicalRGB.b; } 
                    else if (r < 15 && g < 15 && b > 240) { data[i] = energyRGB.r; data[i+1] = energyRGB.g; data[i+2] = energyRGB.b; }
                }
                offscreenCtx.putImageData(imageData, 0, 0);
                partCache.current.set(part.index, offscreenCanvas);
            }
        };

        if (imageCache[blueprint.url]) {
            processBlueprint(imageCache[blueprint.url]);
        } else {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = blueprint.url;
            img.onload = () => { imageCache[blueprint.url] = img; processBlueprint(img); };
            img.onerror = () => console.error("Failed to load blueprint image:", blueprint.url);
        }
    }, [blueprint, colors, partDefinitions]);
    
    // Animation Loop Effect
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !blueprint) return;
        
        const blueprintName = blueprint.url.substring(blueprint.url.lastIndexOf('/') + 1);
        const assembly = partDefinitions[blueprintName as keyof typeof partDefinitions];
        if (!assembly) return;

        const draw = (time: number) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const now = Date.now();
            let interactY = 0;
            const INTERACTION_DURATION = 500;
            if (interactionTs > 0 && now - interactionTs < INTERACTION_DURATION) {
                const progress = (now - interactionTs) / INTERACTION_DURATION;
                interactY = -Math.sin(progress * Math.PI) * 20; // Jump up 20px
            }
            
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            for (const [i, part] of assembly.entries()) {
                const cachedPart = partCache.current.get(part.index);
                if (!cachedPart) continue;

                // Procedural "battle stance" animation offsets
                let bobY = 0, bobX = 0;
                if (i === 0) { // Body
                    bobY = Math.sin(time / 400) * 2;
                } else if (i === 1) { // Head
                    bobY = Math.sin(time / 450) * 2.5;
                } else { // Limbs
                    bobY = Math.sin(time / 350 + i) * 3;
                    bobX = Math.cos(time / 350 + i) * 1.5;
                }

                const drawX = centerX - 128 + (part.x || 0) + bobX;
                const drawY = centerY - 128 + (part.y || 0) + bobY + interactY;
                
                ctx.drawImage(cachedPart, drawX, drawY);
            }
            animationFrameId.current = requestAnimationFrame(draw);
        };
        
        animationFrameId.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animationFrameId.current);
    }, [blueprint, partDefinitions, interactionTs]);
    
    // Apply visual effects based on pet's energy
    const filterStyle: React.CSSProperties = {
        filter: stats.energy < 30 ? `saturate(${stats.energy + 20}%) opacity(0.8)` : 'none',
        imageRendering: 'pixelated',
        cursor: stage === 'hatched' ? 'pointer' : 'default',
    };

    if (stage === 'egg') {
        return <div style={filterStyle} className={`w-full h-full ${className || ''}`}><EggVisual /></div>;
    }

    if (!blueprint || !colors) {
        return <div className="w-full h-full flex items-center justify-center text-xs text-text-muted">Loading visual...</div>
    }

    return (
        <canvas
            ref={canvasRef}
            width={256}
            height={256}
            style={filterStyle}
            className={`w-full h-full object-contain ${className || ''}`}
            onClick={handleInteraction}
            title={petState.name}
        />
    );
};

export default AIPetVisual;