// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { AIPetState } from '../types';

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


// --- PROCEDURAL RIGGING RENDERER ---
const imageCache: { [key: string]: HTMLImageElement } = {};
type RGB = { r: number; g: number; b: number };

// FIX: Added a type definition for a part of the rigging data structure.
type PartDefinition = { x: number; y: number; w: number; h: number; z: number };

// --- Part Definitions for Rigging (Used as hints for flood fill) ---
const partDefinitions: Record<string, Record<string, PartDefinition>> = {
  'Common_Gorilla.png': {
    torso:      { x: 80, y: 70, w: 96, h: 90, z: 1 },
    head:       { x: 75, y: 25, w: 100, h: 70, z: 2 },
    right_arm:  { x: 35, y: 75, w: 60, h: 80, z: 3 }, // Visually left arm
    left_arm:   { x: 165, y: 75, w: 60, h: 80, z: 0 }, // Visually right arm
    right_leg:  { x: 70, y: 155, w: 60, h: 65, z: 2 },
    left_leg:   { x: 125, y: 155, w: 60, h: 65, z: 0 },
  },
   'Common_Beast.png': {
    torso:      { x: 85, y: 80, w: 80, h: 90, z: 1 },
    head:       { x: 60, y: 30, w: 120, h: 80, z: 2 },
    right_arm:  { x: 40, y: 90, w: 55, h: 60, z: 3 },
    left_arm:   { x: 155, y: 90, w: 55, h: 60, z: 0 },
    right_leg:  { x: 80, y: 165, w: 50, h: 55, z: 2 },
    left_leg:   { x: 120, y: 165, w: 50, h: 55, z: 0 },
  },
  'Common_Mutant.png': {
    torso:      { x: 80, y: 60, w: 90, h: 100, z: 1 },
    head:       { x: 90, y: 20, w: 70, h: 60, z: 2 },
    right_arm:  { x: 40, y: 70, w: 50, h: 90, z: 3 },
    left_arm:   { x: 160, y: 70, w: 50, h: 90, z: 0 },
    right_leg:  { x: 70, y: 150, w: 60, h: 70, z: 2 },
    left_leg:   { x: 120, y: 150, w: 60, h: 70, z: 0 },
  },
  'Epic_Random.png': { // A generic full-body definition if a pet doesn't fit others
    torso: { x: 50, y: 50, w: 156, h: 156, z: 1 },
    head:  { x: 50, y: 0, w: 156, h: 100, z: 2 },
  }
};

const colorStringToRgb = (color: string): RGB | null => {
    const canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1;
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data; return { r, g, b };
};
const colorDistance = (c1: RGB, c2: RGB): number => Math.sqrt((c1.r - c2.r)**2 + (c1.g - c2.g)**2 + (c1.b - c2.b)**2);

const AIPetVisual: React.FC<AIPetVisualProps> = ({ petState, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>(0);
    // FIX: Updated the useRef type to use the new PartDefinition type, which provides correct type inference.
    const partCache = useRef<Map<string, { canvas: HTMLCanvasElement, def: PartDefinition }>>(new Map());
    const [interactionTs, setInteractionTs] = useState(0);
    const { stage, blueprint, colors, stats, name } = petState;

    const handleInteraction = useCallback(() => setInteractionTs(Date.now()), []);

    useEffect(() => {
        if (!blueprint || !colors || !name) return;

        const blueprintFileName = blueprint.url.substring(blueprint.url.lastIndexOf('/') + 1);
        const parts = partDefinitions[blueprintFileName] || partDefinitions['Epic_Random.png'];
        
        // --- 1. SETUP COLORS & THRESHOLDS ---
        const dynamicColorPalettes = {
            organic: { base: colorStringToRgb(colors.organic.base), highlight: colorStringToRgb(colors.organic.highlight), shadow: colorStringToRgb(colors.organic.shadow) },
            mechanical: { base: colorStringToRgb(colors.mechanical.base), highlight: colorStringToRgb(colors.mechanical.highlight), shadow: colorStringToRgb(colors.mechanical.shadow) },
            energy: { base: colorStringToRgb(colors.energy.base), highlight: colorStringToRgb(colors.energy.highlight), shadow: colorStringToRgb(colors.energy.shadow) },
        };
        const blueprintColorMap = [
            { id: 'organic.base', target: { r: 255, g: 0, b: 0 }, dynamic: dynamicColorPalettes.organic.base }, { id: 'organic.highlight', target: { r: 255, g: 102, b: 102 }, dynamic: dynamicColorPalettes.organic.highlight }, { id: 'organic.shadow', target: { r: 153, g: 0, b: 0 }, dynamic: dynamicColorPalettes.organic.shadow },
            { id: 'mechanical.base', target: { r: 0, g: 255, b: 0 }, dynamic: dynamicColorPalettes.mechanical.base }, { id: 'mechanical.highlight', target: { r: 102, g: 255, b: 102 }, dynamic: dynamicColorPalettes.mechanical.highlight }, { id: 'mechanical.shadow', target: { r: 0, g: 153, b: 0 }, dynamic: dynamicColorPalettes.mechanical.shadow },
            { id: 'energy.base', target: { r: 0, g: 0, b: 255 }, dynamic: dynamicColorPalettes.energy.base }, { id: 'energy.highlight', target: { r: 102, g: 102, b: 255 }, dynamic: dynamicColorPalettes.energy.highlight }, { id: 'energy.shadow', target: { r: 0, g: 0, b: 153 }, dynamic: dynamicColorPalettes.energy.shadow },
        ].filter(item => item.dynamic);
        const pureBlack: RGB = { r: 0, g: 0, b: 0 };
        const BG_THRESHOLD = 80, OUTLINE_THRESHOLD = 80;

        // --- 2. PROCESSING FUNCTION ---
        const processBlueprint = (blueprintImg: HTMLImageElement) => {
            // --- A. SELECT & COLOR CELL ---
            const petId = parseInt(name.split('-')[1] || '0', 10);
            const cellIndex = petId % 16;
            const gridX = cellIndex % 4, gridY = Math.floor(cellIndex / 4);
            
            const workingCanvas = document.createElement('canvas');
            workingCanvas.width = 256; workingCanvas.height = 256;
            const ctx = workingCanvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;
            ctx.drawImage(blueprintImg, gridX * 256, gridY * 256, 256, 256, 0, 0, 256, 256);
            
            const imageData = ctx.getImageData(0, 0, 256, 256);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] === 0) continue;
                const pixel: RGB = { r: data[i], g: data[i + 1], b: data[i + 2] };
                if (colorDistance(pixel, { r: 255, g: 255, b: 255 }) < BG_THRESHOLD) { data[i + 3] = 0; continue; }
                if (colorDistance(pixel, pureBlack) < OUTLINE_THRESHOLD) continue;
                let minDistance = Infinity; let closestMatch: (typeof blueprintColorMap[0]) | null = null;
                for (const colorMap of blueprintColorMap) {
                    const distance = colorDistance(pixel, colorMap.target);
                    if (distance < minDistance) { minDistance = distance; closestMatch = colorMap; }
                }
                if (closestMatch?.dynamic) { data[i] = closestMatch.dynamic.r; data[i+1] = closestMatch.dynamic.g; data[i+2] = closestMatch.dynamic.b; }
            }
            ctx.putImageData(imageData, 0, 0);

            // --- B. SEGMENT PARTS USING FLOOD FILL ---
            const segmentationCanvas = document.createElement('canvas');
            segmentationCanvas.width = 256; segmentationCanvas.height = 256;
            const segCtx = segmentationCanvas.getContext('2d', { willReadFrequently: true });
            if (!segCtx) return;
            const segData = segCtx.createImageData(256, 256);
            
            const floodFill = (startX: number, startY: number, partId: number) => {
                const queue: [number, number][] = [[startX, startY]];
                while (queue.length > 0) {
                    const [x, y] = queue.shift()!;
                    if (x < 0 || x >= 256 || y < 0 || y >= 256) continue;
                    const idx = (y * 256 + x) * 4;
                    if (data[idx + 3] < 128) continue; // Boundary: transparent
                    if (colorDistance({ r: data[idx], g: data[idx + 1], b: data[idx + 2] }, pureBlack) < OUTLINE_THRESHOLD) continue; // Boundary: outline
                    if (segData.data[idx + 3] > 0) continue; // Already visited
                    
                    segData.data[idx] = partId; segData.data[idx+3] = 255;
                    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
                }
            };
            Object.values(parts).forEach((p, i) => floodFill(Math.floor(p.x + p.w / 2), Math.floor(p.y + p.h / 2), i + 1));
            segCtx.putImageData(segData, 0, 0);
            
            // --- C. EXTRACT & CACHE CLEAN PARTS ---
            const newCache = new Map<string, { canvas: HTMLCanvasElement, def: PartDefinition }>();
            Object.entries(parts).forEach(([partName, partDef], i) => {
                const partId = i + 1;
                const partCanvas = document.createElement('canvas');
                partCanvas.width = partDef.w; partCanvas.height = partDef.h;
                const partCtx = partCanvas.getContext('2d', { willReadFrequently: true });
                if (!partCtx) return;
                
                const partImageData = partCtx.createImageData(partDef.w, partDef.h);
                for (let y = 0; y < partDef.h; y++) {
                    for (let x = 0; x < partDef.w; x++) {
                        const sourceX = partDef.x + x;
                        const sourceY = partDef.y + y;
                        const segIdx = (sourceY * 256 + sourceX) * 4;
                        if (segData.data[segIdx] === partId) {
                             const sourceIdx = (sourceY * 256 + sourceX) * 4;
                             const destIdx = (y * partDef.w + x) * 4;
                             partImageData.data[destIdx] = data[sourceIdx];
                             partImageData.data[destIdx+1] = data[sourceIdx+1];
                             partImageData.data[destIdx+2] = data[sourceIdx+2];
                             partImageData.data[destIdx+3] = data[sourceIdx+3];
                        }
                    }
                }
                partCtx.putImageData(partImageData, 0, 0);
                newCache.set(partName, { canvas: partCanvas, def: partDef });
            });
            partCache.current = newCache;
        };

        // --- 3. LOAD & RUN ---
        if (imageCache[blueprint.url]) {
            processBlueprint(imageCache[blueprint.url]);
        } else {
            const img = new Image(); img.crossOrigin = "anonymous"; img.src = blueprint.url;
            img.onload = () => { imageCache[blueprint.url] = img; processBlueprint(img); };
            img.onerror = () => console.error("Failed to load blueprint:", blueprint.url);
        }
    }, [blueprint, colors, name]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !blueprint) return;
        
        const sortedParts = Array.from(partCache.current.values()).sort((a, b) => a.def.z - b.def.z);

        const draw = (time: number) => {
            if (!canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const now = Date.now();
            let interactY = 0;
            const INTERACTION_DURATION = 500;
            if (interactionTs > 0 && now - interactionTs < INTERACTION_DURATION) {
                const progress = (now - interactionTs) / INTERACTION_DURATION;
                interactY = -Math.sin(progress * Math.PI) * 10;
            }
            
            const torsoBobY = Math.sin(time / 450) * 1.5 + interactY;
            
            for (const { canvas: partCanvas, def: partDef } of sortedParts) {
                const partName = Object.keys(partDefinitions[blueprint.url.substring(blueprint.url.lastIndexOf('/')+1)] || {}).find(key => (partDefinitions[blueprint.url.substring(blueprint.url.lastIndexOf('/')+1)] as any)[key] === partDef) || '';
                
                let partX = (canvas.width - 256) / 2 + partDef.x;
                let partY = (canvas.height - 256) / 2 + partDef.y;

                ctx.save();
                if (partName === 'torso') {
                    partY += torsoBobY;
                } else if (partName === 'head') {
                    partY += torsoBobY + Math.sin(time / 400) * 1;
                } else if (partName.includes('arm')) {
                    partY += torsoBobY;
                    const sway = Math.sin(time / 500 + (partName.includes('left') ? Math.PI : 0)) * 3;
                    const pivotX = partX + partCanvas.width * 0.5;
                    const pivotY = partY + partCanvas.height * 0.1;
                    ctx.translate(pivotX, pivotY);
                    ctx.rotate(sway * Math.PI / 180);
                    ctx.translate(-pivotX, -pivotY);
                } else if (partName.includes('leg')) {
                    partY += torsoBobY;
                }
                
                ctx.drawImage(partCanvas, partX, partY);
                ctx.restore();
            }
            
            animationFrameId.current = requestAnimationFrame(draw);
        };
        
        animationFrameId.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animationFrameId.current);
    }, [blueprint, interactionTs]);
    
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
