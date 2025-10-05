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
type Point = { x: number; y: number };

type PartDefinition = {
  anchor: Point;
  pivot: Point;
  z: number;
  scale?: number;
};

const standardHumanoidRig: Record<string, PartDefinition> = {
    torso:      { anchor: { x: 128, y: 115 }, pivot: { x: 48, y: 45 }, z: 1, scale: 1.0 },
    head:       { anchor: { x: 125, y: 55 }, pivot: { x: 50, y: 60 }, z: 2, scale: 1.0 },
    right_arm:  { anchor: { x: 80, y: 110 }, pivot: { x: 25, y: 10 }, z: 3, scale: 0.95 },
    left_arm:   { anchor: { x: 175, y: 110 }, pivot: { x: 25, y: 10 }, z: 0, scale: 1.0 },
    right_leg:  { anchor: { x: 105, y: 180 }, pivot: { x: 25, y: 5 }, z: 2, scale: 0.95 },
    left_leg:   { anchor: { x: 150, y: 180 }, pivot: { x: 25, y: 5 }, z: 0, scale: 1.0 },
};

const allPetFileNames = [
    'Common_Beast.png', 'Epic_Vikings.png', 'Common_Samurai.png', 'Epic_Siberian.png',
    'Common_Dogs.png', 'Epic_Aztec.png', 'Myth_Zodiac.png', 'Common_Animalia.png',
    'Myth_Predator.png', 'Epic_Transformer.png', 'Common_Insects.png', 'Myth_Desert.png',
    'Myth_Olympian.png', 'Common_Dinosaurus.png', 'Epic_Masked.png', 'Common_Unggas.png',
    'Common_Amfibia.png', 'Myth_Archangel.png', 'Myth_Wayang.png'
];

const partDefinitions: Record<string, Record<string, PartDefinition>> = 
    Object.fromEntries(allPetFileNames.map(name => [name, standardHumanoidRig]));

const colorStringToRgb = (color: string): RGB | null => {
    const canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1;
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data; return { r, g, b };
};
const colorDistance = (c1: RGB, c2: RGB): number => Math.sqrt((c1.r - c2.r)**2 + (c1.g - c2.g)**2 + (c1.b - c2.b)**2);

interface PartCacheEntry {
    canvas: HTMLCanvasElement;
    def: PartDefinition;
    x: number;
    y: number;
    width: number;
    height: number;
}


const AIPetVisual: React.FC<AIPetVisualProps> = ({ petState, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>(0);
    const partCache = useRef<Map<string, PartCacheEntry>>(new Map());
    const [interactionTs, setInteractionTs] = useState(0);
    const { stage, blueprint, colors, stats, name } = petState;

    const handleInteraction = useCallback(() => setInteractionTs(Date.now()), []);

    useEffect(() => {
        if (!blueprint || !colors || !name) return;

        const blueprintFileName = blueprint.url.substring(blueprint.url.lastIndexOf('/') + 1);
        const parts = partDefinitions[blueprintFileName];
        if (!parts) {
            console.warn(`No part definition found for ${blueprintFileName}.`);
            return;
        }
        
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
        const BG_THRESHOLD = 80, LUMINANCE_OUTLINE_THRESHOLD = 40;

        const processBlueprint = (blueprintImg: HTMLImageElement) => {
            const petId = parseInt(name.split('-')[1] || '0', 10);
            const cellIndex = petId % 16;
            const gridX = cellIndex % 4, gridY = Math.floor(cellIndex / 4);
            
            const workingCanvas = document.createElement('canvas');
            const CANVAS_SIZE = 256;
            workingCanvas.width = CANVAS_SIZE; workingCanvas.height = CANVAS_SIZE;
            const ctx = workingCanvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;
            ctx.drawImage(blueprintImg, gridX * CANVAS_SIZE, gridY * CANVAS_SIZE, CANVAS_SIZE, CANVAS_SIZE, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            
            const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] === 0) continue;
                const pixel: RGB = { r: data[i], g: data[i + 1], b: data[i + 2] };
                if (colorDistance(pixel, { r: 255, g: 255, b: 255 }) < BG_THRESHOLD) { data[i + 3] = 0; continue; }
                const luminance = 0.2126 * pixel.r + 0.7152 * pixel.g + 0.0722 * pixel.b;
                if (luminance < LUMINANCE_OUTLINE_THRESHOLD) continue;
                
                let minDistance = Infinity; let closestMatch: (typeof blueprintColorMap[0]) | null = null;
                for (const colorMap of blueprintColorMap) {
                    const distance = colorDistance(pixel, colorMap.target);
                    if (distance < minDistance) { minDistance = distance; closestMatch = colorMap; }
                }
                if (closestMatch?.dynamic) { data[i] = closestMatch.dynamic.r; data[i+1] = closestMatch.dynamic.g; data[i+2] = closestMatch.dynamic.b; } else { data[i+3] = 0; }
            }
            ctx.putImageData(imageData, 0, 0);

            const segData = new Uint8Array(CANVAS_SIZE * CANVAS_SIZE);
            const floodFill = (startX: number, startY: number, partId: number) => {
                const queue: [number, number][] = [[startX, startY]];
                while (queue.length > 0) {
                    const [x, y] = queue.shift()!;
                    if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) continue;
                    const idx = y * CANVAS_SIZE + x;
                    const dataIdx = idx * 4;
                    if (data[dataIdx + 3] < 128) continue;
                    const luminance = 0.2126 * data[dataIdx] + 0.7152 * data[dataIdx + 1] + 0.0722 * data[dataIdx + 2];
                    if (luminance < LUMINANCE_OUTLINE_THRESHOLD) continue;
                    if (segData[idx] > 0) continue;
                    segData[idx] = partId;
                    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
                }
            };
            
            Object.values(parts).forEach((p, i) => floodFill(p.anchor.x, p.anchor.y, i + 1));
            
            const newCache = new Map<string, PartCacheEntry>();
            Object.entries(parts).forEach(([partName, partDef], i) => {
                const partId = i + 1;
                let minX = CANVAS_SIZE, minY = CANVAS_SIZE, maxX = 0, maxY = 0;
                for (let y = 0; y < CANVAS_SIZE; y++) {
                    for (let x = 0; x < CANVAS_SIZE; x++) {
                        if (segData[y * CANVAS_SIZE + x] === partId) {
                            minX = Math.min(minX, x); minY = Math.min(minY, y);
                            maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
                        }
                    }
                }

                if (minX > maxX) return;

                const width = maxX - minX + 1;
                const height = maxY - minY + 1;
                
                const partCanvas = document.createElement('canvas');
                partCanvas.width = width; partCanvas.height = height;
                const partCtx = partCanvas.getContext('2d');
                if (!partCtx) return;

                partCtx.drawImage(workingCanvas, minX, minY, width, height, 0, 0, width, height);
                newCache.set(partName, { canvas: partCanvas, def: partDef, x: minX, y: minY, width, height });
            });
            partCache.current = newCache;
        };

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
        
        // FIX: Used spread syntax to convert the Map keys iterator to an array, which provides better type inference.
        const sortedPartNames = [...partCache.current.keys()].sort((a, b) => {
            const partA = partCache.current.get(a)?.def.z || 0;
            const partB = partCache.current.get(b)?.def.z || 0;
            return partA - partB;
        });

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
            
            for (const partName of sortedPartNames) {
                const part = partCache.current.get(partName);
                if (!part) continue;

                ctx.save();
                
                const partX = (canvas.width - 256) / 2 + part.x;
                let partY = (canvas.height - 256) / 2 + part.y;
                let animRot = 0;
                
                if (partName.includes('arm')) {
                    partY += torsoBobY;
                    animRot = Math.sin(time / 500 + (partName.includes('left') ? Math.PI : 0)) * 5;
                } else if (partName.includes('leg')) {
                    partY += torsoBobY;
                } else {
                    partY += torsoBobY + (partName === 'head' ? Math.sin(time / 400) * 1 : 0);
                }

                const pivotX = partX + part.def.pivot.x;
                const pivotY = partY + part.def.pivot.y;
                
                ctx.translate(pivotX, pivotY);
                ctx.rotate(animRot * Math.PI / 180);
                const scale = part.def.scale || 1.0;
                ctx.scale(scale, scale);
                ctx.drawImage(part.canvas, -part.def.pivot.x, -part.def.pivot.y);
                
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