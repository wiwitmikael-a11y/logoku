// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import type { AIPetState, AIPetTier } from '../types';

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
        @keyframes rock-orbit-1 { 
            0% { transform: translate(0, 0) rotate(0deg) translateX(38px) rotate(0deg); } 
            100% { transform: translate(0, 0) rotate(360deg) translateX(38px) rotate(-360deg); } 
        }
        @keyframes rock-orbit-2 { 
            0% { transform: translate(0, 0) rotate(0deg) translateX(42px) translateY(2px) rotate(0deg); } 
            100% { transform: translate(0, 0) rotate(-360deg) translateX(42px) translateY(2px) rotate(360deg); } 
        }
        @keyframes rock-float-3 { 
            0%, 100% { transform: translateY(0px) rotate(0deg); } 
            50% { transform: translateY(8px) rotate(15deg); } 
        }
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

                {/* Floating Rocks */}
                <g filter="url(#runeGlow)">
                    <g style={{ animation: `rock-orbit-1 10s linear infinite`, transformOrigin: '60px 65px' }}>
                        <path d="M0,0 l8,3 l-3,8 l-6,-5 Z" fill="rgb(var(--c-primary))" />
                    </g>
                    <g style={{ animation: `rock-orbit-2 15s linear infinite reverse`, transformOrigin: '60px 65px' }}>
                         <path d="M0,0 l-9,2 l3,6 l8,-3 Z" fill="rgb(var(--c-primary))" />
                    </g>
                    <g transform="translate(85, 40)" style={{ animation: `rock-float-3 7s ease-in-out infinite 0.5s` }}>
                         <path d="M0,0 l6,6 l-8,5 l-2,-9 Z" fill="rgb(var(--c-primary))" />
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

type PartPhysicsState = {
    x: number; y: number; angle: number;
    vx: number; vy: number; vAngle: number;
};
type RigPhysicsState = Record<string, PartPhysicsState>;

const AIPetVisual: React.FC<AIPetVisualProps> = ({ petState, className, behavior = 'idle', direction = 1, isFacingAway = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>(0);
    const partCache = useRef<Map<string, PartCacheEntry>>(new Map());
    const physicsStateRef = useRef<RigPhysicsState | null>(null);
    const lastTimeRef = useRef<number>(0);
    const { stage, blueprint, colors, stats, name, tier } = petState;

    useEffect(() => {
        if (!blueprint || !colors || !name) return;

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
            const newCache = new Map<string, PartCacheEntry>(); const newPhysicsState: RigPhysicsState = {};
            Object.entries(parts).forEach(([partName, partDef], i) => {
                const partId = i + 1; let minX = CANVAS_SIZE, minY = CANVAS_SIZE, maxX = 0, maxY = 0;
                for (let y = 0; y < CANVAS_SIZE; y++) { for (let x = 0; x < CANVAS_SIZE; x++) { if (segData[y * CANVAS_SIZE + x] === partId) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); } } }
                if (minX > maxX) return;
                const width = maxX - minX + 1; const height = maxY - minY + 1;
                const partCanvas = document.createElement('canvas'); partCanvas.width = width; partCanvas.height = height;
                const partCtx = partCanvas.getContext('2d'); if (!partCtx) return;
                partCtx.drawImage(workingCanvas, minX, minY, width, height, 0, 0, width, height);
                newCache.set(partName, { canvas: partCanvas, def: partDef, x: minX, y: minY, width, height });
                newPhysicsState[partName] = { x: 0, y: 0, angle: 0, vx: 0, vy: 0, vAngle: 0 };
            });
            partCache.current = newCache; physicsStateRef.current = newPhysicsState;
        };

        if (imageCache[blueprint.url]) { processBlueprint(imageCache[blueprint.url]); } 
        else { const img = new Image(); img.crossOrigin = "anonymous"; img.src = blueprint.url; img.onload = () => { imageCache[blueprint.url] = img; processBlueprint(img); }; img.onerror = () => console.error("Failed to load blueprint:", blueprint.url); }
    }, [blueprint, colors, name]);
    
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx || !blueprint || !physicsStateRef.current) return;
        
        lastTimeRef.current = performance.now();
        
        const draw = (time: number) => {
            if (!canvas || !physicsStateRef.current) return;
            const deltaTime = time - lastTimeRef.current;
            lastTimeRef.current = time;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            let scaleX = direction;
            if (behavior === 'turning') {
                const turnProgress = (time % 300) / 300;
                const scaleValue = Math.cos(turnProgress * Math.PI); // Goes from 1 -> -1
                scaleX = scaleValue * direction;
            }

            const sortedPartNames = [...partCache.current.keys()].sort((a, b) => {
                const zA = partCache.current.get(a)?.def.z || 0;
                const zB = partCache.current.get(b)?.def.z || 0;
                return isFacingAway ? zB - zA : zA - zB;
            });
            
            const stiffness = 0.08, damping = 0.8;
            const targets: Record<string, { y: number; angle: number }> = {};
            const walkCycle = time / (behavior === 'running' ? 150 : 250);
            const idleCycle = time / 600;
            let jumpY = 0, torsoYTarget = 0, torsoAngleTarget = 0;

            if (behavior === 'somersault') {
                const p = (time % 1500) / 1500; // 1.5 second animation
                jumpY = -Math.sin(p * Math.PI) * 80; // Arc of the jump
                torsoAngleTarget = p < 0.2 ? 0 : (p-0.2) / 0.6 * -360; // Rotate after a brief pause
                const tuck = Math.sin(p * Math.PI) * 45;
                targets['torso'] = { y: 0, angle: 0 };
                targets['head'] = { y: 0, angle: tuck * 0.5 };
                targets['left_arm'] = { y: 0, angle: tuck };
                targets['right_arm'] = { y: 0, angle: tuck };
                targets['left_leg'] = { y: 0, angle: tuck };
                targets['right_leg'] = { y: 0, angle: tuck };
            } else if (behavior === 'jumping') {
                const jumpProgress = (time % 800) / 800; jumpY = -Math.sin(jumpProgress * Math.PI) * 40; const legTuck = Math.sin(jumpProgress * Math.PI) * 30;
                torsoAngleTarget = 5; targets['head'] = { y: 0, angle: -5 }; targets['left_arm'] = { y: 0, angle: 45 }; targets['right_arm'] = { y: 0, angle: -45 }; targets['left_leg'] = { y: 0, angle: legTuck }; targets['right_leg'] = { y: 0, angle: legTuck };
            } else if (behavior === 'interacting') {
                const p = (time % 1200) / 1200; torsoYTarget = Math.sin(p * Math.PI * 2) * 5; torsoAngleTarget = Math.sin(p * Math.PI * 2) * 3;
                targets['head'] = {y: 0, angle: -5}; targets['right_arm'] = {y: 0, angle: -45 + Math.sin(p * Math.PI * 4) * 15}; targets['left_arm'] = {y: 0, angle: 5}; targets['left_leg'] = {y: 0, angle: 0}; targets['right_leg'] = {y: 0, angle: 0};
            } else if (behavior === 'running' || behavior === 'walking') {
                const speed = behavior === 'running' ? 2 : 1; torsoYTarget = Math.sin(walkCycle) * 3 * speed; torsoAngleTarget = speed;
                targets['head'] = { y: 0, angle: Math.sin(walkCycle * 0.7) * 2 * speed - speed }; targets['left_arm'] = { y: 0, angle: Math.sin(walkCycle + Math.PI) * 40 * speed }; targets['right_arm'] = { y: 0, angle: Math.sin(walkCycle) * 40 * speed }; targets['left_leg'] = { y: 0, angle: Math.sin(walkCycle) * 30 * speed }; targets['right_leg'] = { y: 0, angle: Math.sin(walkCycle + Math.PI) * 30 * speed };
            } else { // idle
                torsoYTarget = Math.sin(idleCycle) * 1.5;
                targets['head'] = { y: 0, angle: Math.sin(idleCycle * 0.7) * 2 }; targets['left_arm'] = { y: 0, angle: Math.sin(idleCycle) * 3 }; targets['right_arm'] = { y: 0, angle: Math.sin(idleCycle) * 3 }; targets['left_leg'] = { y: 0, angle: 0 }; targets['right_leg'] = { y: 0, angle: 0 };
            }

            for (const partName of sortedPartNames) {
                const state = physicsStateRef.current[partName]; const target = targets[partName] || { y: 0, angle: 0 };
                let forceY = (target.y - state.y) * stiffness; let forceAngle = (target.angle - state.angle) * stiffness;
                if (partName === 'torso') { forceY = (torsoYTarget - state.y) * stiffness; forceAngle = (torsoAngleTarget - state.angle) * stiffness; } 
                else { const torsoState = physicsStateRef.current['torso']; forceY += (torsoState.y - state.y) * 0.05; }
                state.vy = (state.vy + forceY) * damping; state.vAngle = (state.vAngle + forceAngle) * damping;
                state.y += state.vy; state.angle += state.vAngle;
            }
            
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(scaleX, 1);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);

            for (const partName of sortedPartNames) {
                const part = partCache.current.get(partName); if (!part) continue;
                ctx.save();
                const state = physicsStateRef.current[partName]; const partX = (canvas.width - 256) / 2 + part.x; const partY = (canvas.height - 256) / 2 + part.y + state.y + jumpY;
                const pivotX = partX + part.def.pivot.x; const pivotY = partY + part.def.pivot.y;
                ctx.translate(pivotX, pivotY); ctx.rotate(state.angle * Math.PI / 180); const scale = part.def.scale || 1.0; ctx.scale(scale, scale);
                ctx.drawImage(part.canvas, -part.def.pivot.x, -part.def.pivot.y);
                ctx.restore();
            }
            ctx.restore();
            
            animationFrameId.current = requestAnimationFrame(draw);
        };
        
        animationFrameId.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animationFrameId.current);
    }, [blueprint, behavior, direction, isFacingAway]);
    
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
            width={256}
            height={256}
            style={filterStyle}
            className={`w-full h-full object-contain ${animationClass} ${className || ''}`}
            title={petState.name}
        />
    );
};

export default AIPetVisual;