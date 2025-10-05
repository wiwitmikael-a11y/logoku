// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { AIPetState, AIPetColorPalette } from '../types';

interface AIPetVisualProps {
  petState: AIPetState;
  className?: string;
}

// --- NEW AIPOD VISUAL ---
const AIPodVisual: React.FC = () => {
    const podAnimation = `
        @keyframes pod-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes core-pulse { 0%, 100% { r: 8; opacity: 0.8; } 50% { r: 10; opacity: 1; } }
        @keyframes ring-rotate { 0% { transform: rotateY(0deg) rotateZ(-10deg); } 100% { transform: rotateY(360deg) rotateZ(-10deg); } }
    `;
    return (
        <div className="w-full h-full" style={{ animation: `pod-float 3.5s ease-in-out infinite` }}>
            <style>{podAnimation}</style>
            <svg viewBox="0 0 120 120" className="w-full h-full">
                <defs>
                    <linearGradient id="podMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#555" />
                        <stop offset="50%" stopColor="#333" />
                        <stop offset="100%" stopColor="#444" />
                    </linearGradient>
                    <linearGradient id="podGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(var(--c-primary), 0.2)" />
                        <stop offset="100%" stopColor="rgba(var(--c-primary), 0.1)" />
                    </linearGradient>
                     <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgb(var(--c-splash))" />
                        <stop offset="100%" stopColor="rgba(var(--c-splash), 0)" />
                    </radialGradient>
                    <filter id="podGlow">
                        <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <g transform="translate(10, 0)">
                    {/* Base */}
                    <path d="M 20,115 H 80 L 75,120 H 25 Z" fill="url(#podMetal)" />
                    <rect x="30" y="110" width="40" height="5" fill="#222" />

                    {/* Main Body */}
                    <path d="M 10,110 C 0,80 0,40 10,10 H 90 C 100,40 100,80 90,110 Z" fill="url(#podGlass)" stroke="rgba(var(--c-primary), 0.4)" strokeWidth="1" />
                    <path d="M 10,110 C 0,80 0,40 10,10 H 90 C 100,40 100,80 90,110 Z" stroke="rgba(var(--c-splash), 0.1)" strokeWidth="3" fill="none" />

                    {/* Core */}
                    <g style={{ filter: 'url(#podGlow)' }}>
                        <circle cx="50" cy="65" r="15" fill="url(#coreGlow)" />
                        <circle cx="50" cy="65" fill="rgb(var(--c-splash))">
                            <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
                        </circle>
                    </g>
                    
                    {/* Floating Ring */}
                    <ellipse cx="50" cy="75" rx="35" ry="10" fill="none" stroke="rgba(var(--c-primary), 0.7)" strokeWidth="1.5" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'ring-rotate 8s linear infinite' }} />

                     {/* Glass Highlight */}
                    <path d="M 20 20 C 30 50, 25 80, 22 100" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
                </g>
            </svg>
        </div>
    );
};


// --- NEW SINGLE FULL-BODY CANVAS RENDERER ---
const imageCache: { [key: string]: HTMLImageElement } = {};
type RGB = { r: number; g: number; b: number };

const colorStringToRgb = (color: string): RGB | null => {
    // This is a robust HSL/HEX to RGB converter using a temporary canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return { r, g, b };
};

const colorDistance = (c1: RGB, c2: RGB): number => {
  const rDiff = c1.r - c2.r;
  const gDiff = c1.g - c2.g;
  const bDiff = c1.b - c2.b;
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
};

const AIPetVisual: React.FC<AIPetVisualProps> = ({ petState, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>(0);
    const spriteCache = useRef<HTMLCanvasElement | null>(null);
    const [interactionTs, setInteractionTs] = useState(0);
    const { stage, blueprint, colors, stats, name } = petState;

    const handleInteraction = useCallback(() => setInteractionTs(Date.now()), []);

    // Effect to create and color the cached full-body sprite for performance
    useEffect(() => {
        if (!blueprint || !colors || !name) return;

        const dynamicColorPalettes = {
            organic: { base: colorStringToRgb(colors.organic.base), highlight: colorStringToRgb(colors.organic.highlight), shadow: colorStringToRgb(colors.organic.shadow) },
            mechanical: { base: colorStringToRgb(colors.mechanical.base), highlight: colorStringToRgb(colors.mechanical.highlight), shadow: colorStringToRgb(colors.mechanical.shadow) },
            energy: { base: colorStringToRgb(colors.energy.base), highlight: colorStringToRgb(colors.energy.highlight), shadow: colorStringToRgb(colors.energy.shadow) },
        };

        const blueprintColorMap = [
            { id: 'organic.base', target: { r: 255, g: 0, b: 0 }, dynamic: dynamicColorPalettes.organic.base },
            { id: 'organic.highlight', target: { r: 255, g: 102, b: 102 }, dynamic: dynamicColorPalettes.organic.highlight },
            { id: 'organic.shadow', target: { r: 153, g: 0, b: 0 }, dynamic: dynamicColorPalettes.organic.shadow },
            { id: 'mechanical.base', target: { r: 0, g: 255, b: 0 }, dynamic: dynamicColorPalettes.mechanical.base },
            { id: 'mechanical.highlight', target: { r: 102, g: 255, b: 102 }, dynamic: dynamicColorPalettes.mechanical.highlight },
            { id: 'mechanical.shadow', target: { r: 0, g: 153, b: 0 }, dynamic: dynamicColorPalettes.mechanical.shadow },
            { id: 'energy.base', target: { r: 0, g: 0, b: 255 }, dynamic: dynamicColorPalettes.energy.base },
            { id: 'energy.highlight', target: { r: 102, g: 102, b: 255 }, dynamic: dynamicColorPalettes.energy.highlight },
            { id: 'energy.shadow', target: { r: 0, g: 0, b: 153 }, dynamic: dynamicColorPalettes.energy.shadow },
        ].filter(item => item.dynamic); // Filter out any null colors

        const pureWhite: RGB = { r: 255, g: 255, b: 255 };
        const pureBlack: RGB = { r: 0, g: 0, b: 0 };

        const processBlueprint = (blueprintImg: HTMLImageElement) => {
            const petId = parseInt(name.split('-')[1] || '0', 10);
            const cellIndex = petId % 16; // 16 cells in a 4x4 grid

            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = 256;
            offscreenCanvas.height = 256;
            const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
            if (!offscreenCtx) return;

            const gridX = cellIndex % 4;
            const gridY = Math.floor(cellIndex / 4);
            
            offscreenCtx.drawImage(blueprintImg, gridX * 256, gridY * 256, 256, 256, 0, 0, 256, 256);
            
            const imageData = offscreenCtx.getImageData(0, 0, 256, 256);
            const data = imageData.data;
            
            const BG_THRESHOLD = 80; // Increased to catch anti-aliased grid lines (grayish pixels)
            const OUTLINE_THRESHOLD = 80;

            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] === 0) continue; // Skip already transparent pixels

                const pixel: RGB = { r: data[i], g: data[i + 1], b: data[i + 2] };

                // 1. Aggressively remove background (white and near-white/gray pixels). No more highlight exceptions.
                if (colorDistance(pixel, pureWhite) < BG_THRESHOLD) {
                    data[i + 3] = 0; // Make transparent
                    continue;
                }

                // 2. Preserve outlines (black and near-black pixels).
                if (colorDistance(pixel, pureBlack) < OUTLINE_THRESHOLD) {
                    continue;
                }
                
                // 3. "Gunpla" Step: If it's not background or outline, it MUST be a color. Find the closest match and replace it.
                let minDistance = Infinity;
                let closestMatch: (typeof blueprintColorMap[0]) | null = null;

                for (const colorMap of blueprintColorMap) {
                    const distance = colorDistance(pixel, colorMap.target);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestMatch = colorMap;
                    }
                }
                
                // By removing any further distance checks, we ensure every "in-between" anti-aliased pixel
                // gets "painted" according to its closest blueprint color.
                if (closestMatch && closestMatch.dynamic) {
                    data[i] = closestMatch.dynamic.r;
                    data[i + 1] = closestMatch.dynamic.g;
                    data[i + 2] = closestMatch.dynamic.b;
                }
            }
            offscreenCtx.putImageData(imageData, 0, 0);
            spriteCache.current = offscreenCanvas;
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
    }, [blueprint, colors, name]);
    
    // Animation Loop Effect
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !blueprint) return;
        
        const draw = (time: number) => {
            if (!canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const cachedSprite = spriteCache.current;
            if (!cachedSprite) {
                animationFrameId.current = requestAnimationFrame(draw);
                return;
            };

            const now = Date.now();
            let interactY = 0;
            const INTERACTION_DURATION = 500;
            if (interactionTs > 0 && now - interactionTs < INTERACTION_DURATION) {
                const progress = (now - interactionTs) / INTERACTION_DURATION;
                interactY = -Math.sin(progress * Math.PI) * 10; // Jump up 10px
            }
            
            // Procedural "breathing" animation
            const bobY = Math.sin(time / 450) * 2;
            
            const drawX = (canvas.width - cachedSprite.width) / 2;
            const drawY = (canvas.height - cachedSprite.height) / 2 + bobY + interactY;
            
            ctx.drawImage(cachedSprite, drawX, drawY);
            
            animationFrameId.current = requestAnimationFrame(draw);
        };
        
        animationFrameId.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animationFrameId.current);
    }, [blueprint, interactionTs]);
    
    // Apply visual effects based on pet's energy
    const filterStyle: React.CSSProperties = {
        filter: stats.energy < 30 ? `saturate(${stats.energy + 20}%) opacity(0.8)` : 'none',
        imageRendering: 'pixelated',
        cursor: stage === 'active' ? 'pointer' : 'default',
    };

    if (stage === 'aipod') {
        return <div style={filterStyle} className={`w-full h-full ${className || ''}`}><AIPodVisual /></div>;
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