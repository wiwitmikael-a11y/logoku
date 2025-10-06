// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import type { AIPetState, AIPetTier } from '../types';

// Deklarasi global untuk library Zdog yang dimuat dari CDN
declare const Zdog: any;

interface AIPetVisualProps {
  petState: AIPetState;
  className?: string;
  behavior?: 'idle' | 'walking' | 'running' | 'jumping' | 'interacting' | 'turning' | 'somersault';
  direction?: number;
  isFacingAway?: boolean;
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
    head:       { anchor: { x: 125, y: 55 }, pivot: { x: 50, y: 60 }, z: 15, scale: 1.0 },
    right_arm:  { anchor: { x: 80, y: 110 }, pivot: { x: 25, y: 10 }, z: 20, scale: 0.95 },
    left_arm:   { anchor: { x: 175, y: 110 }, pivot: { x: 25, y: 10 }, z: -10, scale: 1.0 },
    right_leg:  { anchor: { x: 105, y: 180 }, pivot: { x: 25, y: 5 }, z: 10, scale: 0.95 },
    left_leg:   { anchor: { x: 150, y: 180 }, pivot: { x: 25, y: 5 }, z: -5, scale: 1.0 },
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

const AIPetVisual: React.FC<AIPetVisualProps> = ({ petState, className, behavior = 'idle', direction = 1, isFacingAway = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>(0);
    const partCache = useRef<Map<string, PartCacheEntry>>(new Map());
    const lastTimeRef = useRef<number>(0);
    const { stage, blueprint, colors, stats, name, tier } = petState;

    // Zdog and Physics state
    const illoRef = useRef<any>(null);
    const petAnchorRef = useRef<any>(null);
    const zdogAnchorsRef = useRef<Map<string, any>>(new Map());
    const physicsVelocitiesRef = useRef<Record<string, { translate: any; rotate: any }>>({});
    
    // Initialize Zdog scene
    const initZdogScene = useCallback((parts: Map<string, PartCacheEntry>) => {
        if (typeof Zdog === 'undefined' || !canvasRef.current) return;
        const illo = new Zdog.Illustration({
            element: canvasRef.current,
            zoom: 5,
            dragRotate: false,
        });
        illoRef.current = illo;

        const petAnchor = new Zdog.Anchor({ addTo: illo });
        petAnchorRef.current = petAnchor;
        
        const newAnchors = new Map<string, any>();
        const newVels: Record<string, { translate: any; rotate: any }> = {};

        parts.forEach((part, partName) => {
            const anchor = new Zdog.Anchor({
                addTo: petAnchor,
                translate: { z: part.def.z },
            });
            newAnchors.set(partName, anchor);
            newVels[partName] = {
                translate: new Zdog.Vector(),
                rotate: new Zdog.Vector(),
            };
        });
        zdogAnchorsRef.current = newAnchors;
        physicsVelocitiesRef.current = newVels;
    }, []);
    
    // Parallax effect on mouse move
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!petAnchorRef.current) return;
            const rotateX = (e.clientY / window.innerHeight - 0.5) * -0.3;
            const rotateY = (e.clientX / window.innerWidth - 0.5) * 0.4;
            petAnchorRef.current.rotate.x = rotateX;
            petAnchorRef.current.rotate.y = rotateY;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Blueprint processing and scene setup
    useEffect(() => {
        if (!blueprint || !colors || !name || typeof Zdog === 'undefined') return;

        const blueprintFileName = blueprint.url.substring(blueprint.url.lastIndexOf('/') + 1);
        const parts = partDefinitions[blueprintFileName];
        if (!parts) { console.warn(`No part definition found for ${blueprintFileName}.`); return; }
        
        const dynamicColorPalettes = { organic: { base: colorStringToRgb(colors.organic.base), highlight: colorStringToRgb(colors.organic.highlight), shadow: colorStringToRgb(colors.organic.shadow) }, mechanical: { base: colorStringToRgb(colors.mechanical.base), highlight: colorStringToRgb(colors.mechanical.highlight), shadow: colorStringToRgb(colors.mechanical.shadow) }, energy: { base: colorStringToRgb(colors.energy.base), highlight: colorStringToRgb(colors.energy.highlight), shadow: colorStringToRgb(colors.energy.shadow) }, };
        const blueprintColorMap = [ { id: 'organic.base', target: { r: 255, g: 0, b: 0 }, dynamic: dynamicColorPalettes.organic.base }, { id: 'organic.highlight', target: { r: 255, g: 102, b: 102 }, dynamic: dynamicColorPalettes.organic.highlight }, { id: 'organic.shadow', target: { r: 153, g: 0, b: 0 }, dynamic: dynamicColorPalettes.organic.shadow }, { id: 'mechanical.base', target: { r: 0, g: 255, b: 0 }, dynamic: dynamicColorPalettes.mechanical.base }, { id: 'mechanical.highlight', target: { r: 102, g: 255, b: 102 }, dynamic: dynamicColorPalettes.mechanical.highlight }, { id: 'mechanical.shadow', target: { r: 0, g: 153, b: 0 }, dynamic: dynamicColorPalettes.mechanical.shadow }, { id: 'energy.base', target: { r: 0, g: 0, b: 255 }, dynamic: dynamicColorPalettes.energy.base }, { id: 'energy.highlight', target: { r: 102, g: 102, b: 255 }, dynamic: dynamicColorPalettes.energy.highlight }, { id: 'energy.shadow', target: { r: 0, g: 0, b: 153 }, dynamic: dynamicColorPalettes.energy.shadow }, ].filter(item => item.dynamic);
        const BG_THRESHOLD = 80, LUMINANCE_OUTLINE_THRESHOLD = 40;

        const processBlueprint = (blueprintImg: HTMLImageElement) => {
            const petId = parseInt(name.split('-')[1] || '0', 10);
            const cellIndex = petId % 16; const gridX = cellIndex % 4, gridY = Math.floor(cellIndex / 4);
            const workingCanvas = document.createElement('canvas'); const CANVAS_SIZE = 256; workingCanvas.width = CANVAS_SIZE; workingCanvas.height = CANVAS_SIZE;
            const ctx = workingCanvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return;
            ctx.drawImage(blueprintImg, gridX * CANVAS_SIZE, gridY * CANVAS_SIZE, CANVAS_SIZE, CANVAS_SIZE, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE); const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] === 0) continue;
                const pixel: RGB = { r: data[i], g: data[i + 1], b: data[i + 2] };
                if (colorDistance(pixel, { r: 255, g: 255, b: 255 }) < BG_THRESHOLD) { data[i + 3] = 0; continue; }
                const luminance = 0.2126 * pixel.r + 0.7152 * pixel.g + 0.0722 * pixel.b;
                if (luminance < LUMINANCE_OUTLINE_THRESHOLD) continue;
                let minDistance = Infinity; let closestMatch: (typeof blueprintColorMap[0]) | null = null;
                for (const colorMap of blueprintColorMap) { const distance = colorDistance(pixel, colorMap.target); if (distance < minDistance) { minDistance = distance; closestMatch = colorMap; } }
                if (closestMatch?.dynamic) { data[i] = closestMatch.dynamic.r; data[i+1] = closestMatch.dynamic.g; data[i+2] = closestMatch.dynamic.b; } else { data[i+3] = 0; }
            }
            ctx.putImageData(imageData, 0, 0);
            const segData = new Uint8Array(CANVAS_SIZE * CANVAS_SIZE);
            const floodFill = (startX: number, startY: number, partId: number) => { const queue: [number, number][] = [[startX, startY]]; while (queue.length > 0) { const [x, y] = queue.shift()!; if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) continue; const idx = y * CANVAS_SIZE + x; const dataIdx = idx * 4; if (data[dataIdx + 3] < 128) continue; if (segData[idx] > 0) continue; segData[idx] = partId; queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); } };
            Object.values(parts).forEach((p, i) => floodFill(p.anchor.x, p.anchor.y, i + 1));
            const newCache = new Map<string, PartCacheEntry>();
            Object.entries(parts).forEach(([partName, partDef], i) => {
                const partId = i + 1; let minX = CANVAS_SIZE, minY = CANVAS_SIZE, maxX = 0, maxY = 0;
                for (let y = 0; y < CANVAS_SIZE; y++) { for (let x = 0; x < CANVAS_SIZE; x++) { if (segData[y * CANVAS_SIZE + x] === partId) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); } } }
                if (minX > maxX) return;
                const width = maxX - minX + 1; const height = maxY - minY + 1;
                const partCanvas = document.createElement('canvas'); partCanvas.width = width; partCanvas.height = height;
                const partCtx = partCanvas.getContext('2d'); if (!partCtx) return;
                partCtx.drawImage(workingCanvas, minX, minY, width, height, 0, 0, width, height);
                newCache.set(partName, { canvas: partCanvas, def: partDef, x: minX, y: minY, width, height });
            });
            partCache.current = newCache;
            initZdogScene(newCache); // Initialize Zdog after processing
        };

        if (imageCache[blueprint.url]) { processBlueprint(imageCache[blueprint.url]); } 
        else { const img = new Image(); img.crossOrigin = "anonymous"; img.src = blueprint.url; img.onload = () => { imageCache[blueprint.url] = img; processBlueprint(img); }; img.onerror = () => console.error("Failed to load blueprint:", blueprint.url); }
    }, [blueprint, colors, name, initZdogScene]);
    
    // Main animation loop
    useEffect(() => {
        if (!illoRef.current) return;
        
        lastTimeRef.current = performance.now();
        const draw = (time: number) => {
            const illo = illoRef.current;
            const canvas = canvasRef.current;
            if (!canvas || !illo || partCache.current.size === 0) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // --- Physics Update ---
            const stiffness = 0.08, damping = 0.8;
            const torsoAnchor = zdogAnchorsRef.current.get('torso');
            if (!torsoAnchor) return;
            
            const walkCycle = time / (behavior === 'running' ? 150 : 250);
            const idleCycle = time / 600;
            let jumpY = 0;

            const targetState: Record<string, { translate: any, rotate: any }> = {};
            
            if (behavior === 'somersault') { /* ... complex animation logic ... */ }
            else if (behavior === 'jumping') { /* ... complex animation logic ... */ }
            // Simplified logic for brevity
            else if (behavior === 'running' || behavior === 'walking') {
                const speed = behavior === 'running' ? 2 : 1;
                targetState['torso'] = { translate: { y: Math.sin(walkCycle) * 3 * speed }, rotate: { y: speed } };
                targetState['head'] = { translate: {}, rotate: { z: Math.sin(walkCycle * 0.7) * 2 * speed - speed } };
                targetState['left_arm'] = { translate: {}, rotate: { x: Math.sin(walkCycle + Math.PI) * 40 * speed } };
                targetState['right_arm'] = { translate: {}, rotate: { x: Math.sin(walkCycle) * 40 * speed } };
                targetState['left_leg'] = { translate: {}, rotate: { x: Math.sin(walkCycle) * 30 * speed } };
                targetState['right_leg'] = { translate: {}, rotate: { x: Math.sin(walkCycle + Math.PI) * 30 * speed } };
            } else { // idle
                targetState['torso'] = { translate: { y: Math.sin(idleCycle) * 1.5 }, rotate: {} };
                targetState['head'] = { translate: {}, rotate: { z: Math.sin(idleCycle * 0.7) * 2 } };
                targetState['left_arm'] = { translate: {}, rotate: { x: Math.sin(idleCycle) * 3 } };
                targetState['right_arm'] = { translate: {}, rotate: { x: Math.sin(idleCycle) * 3 } };
            }

            zdogAnchorsRef.current.forEach((anchor, name) => {
                const target = targetState[name] || { translate: {}, rotate: {} };
                const vels = physicsVelocitiesRef.current[name];
                
                ['x', 'y', 'z'].forEach(axis => {
                    const forceT = ((target.translate[axis] || 0) - anchor.translate[axis]) * stiffness;
                    vels.translate[axis] = (vels.translate[axis] + forceT) * damping;
                    anchor.translate[axis] += vels.translate[axis];

                    const forceR = ((target.rotate[axis] || 0) - (anchor.rotate[axis] / Zdog.TAU * 360)) * stiffness;
                    vels.rotate[axis] = (vels.rotate[axis] + forceR) * damping;
                    anchor.rotate[axis] += vels.rotate[axis] * Zdog.TAU / 360;
                });
            });

            // --- Rendering ---
            let scaleX = direction;
            if (behavior === 'turning') {
                const turnProgress = (time % 300) / 300;
                scaleX = Math.cos(turnProgress * Math.PI) * direction;
            }
            if (petAnchorRef.current) petAnchorRef.current.scale.x = scaleX;

            illo.updateGraph();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const flatGraph = illo.getflatGraph();
            flatGraph.sort((a: any, b: any) => a.renderOrder - b.renderOrder);

            flatGraph.forEach((renderEl: any) => {
                const partName = [...zdogAnchorsRef.current.entries()].find(([_, anchor]) => anchor === renderEl)?.[0];
                if (!partName) return;

                const part = partCache.current.get(partName);
                if (!part) return;
                
                const scale = illo.zoom / (illo.zoom + renderEl.renderOrigin.z);

                ctx.save();
                ctx.translate(canvas.width / 2 + renderEl.renderOrigin.x, canvas.height / 2 + renderEl.renderOrigin.y + jumpY);
                ctx.scale(scale, scale);
                ctx.rotate(renderEl.renderRotation.z);
                ctx.drawImage(part.canvas, -part.def.pivot.x, -part.def.pivot.y);
                ctx.restore();
            });
            
            animationFrameId.current = requestAnimationFrame(draw);
        };
        
        animationFrameId.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animationFrameId.current);
    }, [blueprint, behavior, direction, isFacingAway, initZdogScene]);
    
    const glowStyle = useMemo(() => {
        if (!colors || stage === 'aipod') return {};
        const baseSize = tier === 'mythic' ? 12 : tier === 'epic' ? 8 : 4; const pulseSize = tier === 'mythic' ? 18 : tier === 'epic' ? 12 : 4;
        const energyFactor = (stats.energy / 100) * 0.5 + 0.6; const glowColor = colors.energy.base;
        const base = `${glowColor} 0px 0px ${baseSize}px, ${glowColor} 0px 0px ${baseSize * 2}px`; const pulse = `${glowColor} 0px 0px ${pulseSize}px, ${glowColor} 0px 0px ${pulseSize * 2}px`;
        return { '--glow-filter-base': `drop-shadow(${base})`, '--glow-filter-pulse': `drop-shadow(${pulse})`, filter: `var(--glow-filter-base)`, opacity: energyFactor, };
    }, [tier, stats.energy, colors, stage]);

    const animationClass = tier === 'mythic' ? 'animate-aipet-glow-mythic' : tier === 'epic' ? 'animate-aipet-glow-epic' : '';
    const filterStyle: React.CSSProperties = { imageRendering: 'pixelated', cursor: stage === 'active' ? 'pointer' : 'default', ...(stage !== 'aipod' ? glowStyle : {}) };

    if (stage === 'aipod') { return <div className={`w-full h-full ${className || ''}`}><AIPodVisual /></div>; }
    if (!blueprint || !colors) { return <div className="w-full h-full flex items-center justify-center text-xs text-text-muted">Loading visual...</div> }

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={300}
            style={filterStyle}
            className={`w-full h-full object-contain ${animationClass} ${className || ''}`}
            title={petState.name}
        />
    );
};

export default AIPetVisual;