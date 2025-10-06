// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import type { AIPetState, AIPetTier } from '../types';
import { useAIPet, VisualEffect } from '../contexts/AIPetContext';

// Deklarasi global untuk library Zdog yang dimuat dari CDN
declare const Zdog: any;

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
    'Common_Amfibia.png', 'Common_Animalia.png', 'Common_Aves.png', 'Common_Beast.png', 'Common_Dinosaurs.png', 'Common_Dogs.png',
    'Epic_Aztec.png', 'Epic_Desert.png', 'Epic_Insects.png', 'Epic_Samurai.png', 'Epic_Siberian.png', 'Epic_Vikings.png',
    'Legendary_Knights.png', 'Legendary_Masked.png', 'Legendary_Predator.png', 'Legendary_Transformer.png',
    'Myth_Archangels.png', 'Myth_Cosmos.png', 'Myth_Daemons.png',
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

type VfxState = { id: number; type: 'feed', progress: number; particle: any; } | null;

const AIPetVisual: React.FC<AIPetVisualProps> = ({ petState, className, behavior = 'idle', direction = 1 }) => {
    const { visualEffect, clearVisualEffect } = useAIPet();
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
    const [vfxState, setVfxState] = useState<VfxState>(null);
    
    // New state for advanced animations
    const parallaxRef = useRef({ x: 0, y: 0 });
    const currentYRotationRef = useRef(0);
    const lightSource = useMemo(() => new Zdog.Vector({ x: -0.75, y: -1, z: 1.5 }).normalize(), []);
    const animationStartTime = useRef(0);
    const [draggedPart, setDraggedPart] = useState<{name: string; offset: {x: number; y: number}} | null>(null);

    
    // Initialize Zdog scene
    const initZdogScene = useCallback((parts: Map<string, PartCacheEntry>) => {
        if (typeof Zdog === 'undefined' || !canvasRef.current) return;
        const illo = new Zdog.Illustration({
            element: canvasRef.current,
            zoom: 5,
            dragRotate: false,
        });
        illoRef.current = illo;

        // Environment
        new Zdog.Ellipse({ addTo: illo, diameter: 180, rotate: { x: Zdog.TAU/4 }, translate: { y: 60 }, stroke: 4, color: '#404040' });
        new Zdog.Box({ addTo: illo, width: 20, height: 40, depth: 10, translate: { x: -100, y: 20, z: -100 }, rotate: { y: Zdog.TAU/8 }, color: '#333' });
        new Zdog.Shape({ addTo: illo, path: [{x: -40, y: -40}, {x: 40, y: -40}], translate: {z: -150}, stroke: 2, color: '#555' });
        
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
            if (!illoRef.current) return;
            parallaxRef.current.x = (e.clientY / window.innerHeight - 0.5) * -0.4;
            parallaxRef.current.y = (e.clientX / window.innerWidth - 0.5) * 0.5;
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
    
    useEffect(() => { animationStartTime.current = performance.now(); }, [behavior]);
    
    // Handle visual effects from context
    useEffect(() => {
        if (visualEffect?.type === 'feed' && illoRef.current) {
            const particle = new Zdog.Shape({
                addTo: illoRef.current,
                path: [{ x: -2, y: -2 }, { x: 2, y: -2 }, { x: 2, y: 2 }, { x: -2, y: 2 }],
                translate: { x: 0, y: -150, z: 200 },
                stroke: 4, color: colors?.energy.highlight || '#FFF',
            });
            setVfxState({ id: visualEffect.id, type: 'feed', progress: 0, particle });
        }
    }, [visualEffect, colors]);

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

            // --- VFX Update ---
            if (vfxState?.type === 'feed') {
                const head = zdogAnchorsRef.current.get('head');
                const target = head ? petAnchorRef.current.localToWorld(head.translate) : petAnchorRef.current.translate;
                vfxState.progress += 0.05;
                if (vfxState.progress < 1) {
                    vfxState.particle.translate.lerp(target, vfxState.progress);
                } else {
                    vfxState.particle.remove();
                    setVfxState(null);
                    clearVisualEffect();
                }
            }

            // --- Physics Update ---
            const stiffness = 0.08, damping = 0.8;
            const walkCycle = time / (behavior === 'running' ? 150 : 250);
            const idleCycle = time / 600;

            const targetState: Record<string, { translate: any, rotate: any }> = {};
            const petBody = petAnchorRef.current;
            
            if (behavior === 'somersault' && petBody) {
                const duration = 1400;
                const elapsed = time - animationStartTime.current;
                const progress = Math.min(elapsed / duration, 1);
                petBody.rotate.x = -Zdog.TAU * progress;
            } else if (behavior === 'interacting' && petBody) {
                 petBody.rotate.y += Math.sin(time / 100) * 0.1;
                 targetState['torso'] = { translate: { y: Math.sin(time / 150) * 4 }, rotate: {} };
            }
            else if (behavior === 'running' || behavior === 'walking') {
                const speed = behavior === 'running' ? 2 : 1;
                targetState['torso'] = { translate: { y: Math.sin(walkCycle) * 3 * speed }, rotate: {} };
                targetState['head'] = { translate: {}, rotate: { z: Math.sin(walkCycle * 0.7) * 0.5 } };
                targetState['left_arm'] = { translate: {}, rotate: { x: Math.sin(walkCycle + Math.PI) * 40 * speed } };
                targetState['right_arm'] = { translate: {}, rotate: { x: Math.sin(walkCycle) * 40 * speed } };
                targetState['left_leg'] = { translate: {}, rotate: { x: Math.sin(walkCycle) * 30 * speed } };
                targetState['right_leg'] = { translate: {}, rotate: { x: Math.sin(walkCycle + Math.PI) * 30 * speed } };
            } else { // idle
                const isTired = (stats?.energy ?? 100) < 20;
                const tiredSlouch = isTired ? 15 : 0;
                targetState['torso'] = { translate: { y: Math.sin(idleCycle) * 1.5 }, rotate: { x: tiredSlouch } };
                targetState['head'] = { translate: {}, rotate: { z: Math.sin(idleCycle * 0.7) * 2, x: tiredSlouch } };
                targetState['left_arm'] = { translate: {}, rotate: { x: Math.sin(idleCycle) * 3 + tiredSlouch } };
                targetState['right_arm'] = { translate: {}, rotate: { x: Math.sin(idleCycle) * 3 + tiredSlouch } };
            }

            zdogAnchorsRef.current.forEach((anchor, name) => {
                if (draggedPart?.name === name) return;
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

            // --- Rotation & Head Tracking Update ---
            if (petAnchorRef.current && behavior !== 'somersault' && behavior !== 'interacting') {
                const targetY = direction === 1 ? 0 : Zdog.TAU / 2;
                currentYRotationRef.current += (targetY - currentYRotationRef.current) * 0.1;
            }
            // Apply parallax to the whole scene for environment
            illo.rotate.x = parallaxRef.current.x * 0.5;
            illo.rotate.y = parallaxRef.current.y * 0.5;
            // Apply stronger parallax to the pet itself
            petAnchorRef.current.rotate.x = parallaxRef.current.x;
            petAnchorRef.current.rotate.y = currentYRotationRef.current + parallaxRef.current.y;


            const headAnchor = zdogAnchorsRef.current.get('head');
            if (headAnchor && !draggedPart) {
                headAnchor.rotate.x += (parallaxRef.current.x * 0.5 - headAnchor.rotate.x) * 0.1;
                headAnchor.rotate.y += (parallaxRef.current.y * 0.5 - headAnchor.rotate.y) * 0.1;
            }

            // --- Rendering ---
            illo.updateGraph();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const flatGraph = illo.getflatGraph();
            flatGraph.sort((a: any, b: any) => a.renderOrder - b.renderOrder);

            flatGraph.forEach((renderEl: any) => {
                if (renderEl.element === '#illo-canvas') {
                    // This is a Zdog shape not tied to our pet parts (e.g., environment)
                    renderEl.render(ctx);
                    return;
                }
                const partName = [...zdogAnchorsRef.current.entries()].find(([_, anchor]) => anchor === renderEl)?.[0];
                if (!partName) return;

                const part = partCache.current.get(partName);
                if (!part) return;
                
                const zFactor = 1.2;
                const scale = illo.zoom / (illo.zoom + renderEl.renderOrigin.z * zFactor);

                ctx.save();
                ctx.translate(canvas.width / 2 + renderEl.renderOrigin.x, canvas.height / 2 + renderEl.renderOrigin.y);
                ctx.scale(scale, scale);
                ctx.rotate(renderEl.renderRotation.z);

                ctx.drawImage(part.canvas, -part.def.pivot.x, -part.def.pivot.y);

                const partNormal = new Zdog.Vector({ z: 1 }).rotate(renderEl.renderRotation);
                const dotProduct = partNormal.dot(lightSource);

                ctx.globalCompositeOperation = 'source-atop';
                if (dotProduct > 0.3) {
                    const alpha = Math.min(0.25, dotProduct * 0.25);
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.fillRect(-part.def.pivot.x, -part.def.pivot.y, part.width, part.height);
                } else if (dotProduct < -0.3) {
                    const alpha = Math.min(0.3, -dotProduct * 0.3);
                    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                    ctx.fillRect(-part.def.pivot.x, -part.def.pivot.y, part.width, part.height);
                }
                
                ctx.restore();
            });
            
            animationFrameId.current = requestAnimationFrame(draw);
        };
        
        animationFrameId.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animationFrameId.current);
    }, [blueprint, behavior, direction, initZdogScene, lightSource, stats, draggedPart, vfxState, clearVisualEffect]);
    
    // --- Interaction Handlers ---
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const illo = illoRef.current;
        const canvas = canvasRef.current;
        if (!illo || !canvas) return;
        const { offsetX, offsetY } = e.nativeEvent;

        const flatGraph = illo.getflatGraph();
        for (const renderEl of [...flatGraph].reverse()) {
            const partName = [...zdogAnchorsRef.current.entries()].find(([_, anchor]) => anchor === renderEl)?.[0];
            if (!partName) continue;
            const part = partCache.current.get(partName);
            if (!part) continue;

            const scale = illo.zoom / (illo.zoom + renderEl.renderOrigin.z * 1.2);
            const renderX = canvas.width / 2 + renderEl.renderOrigin.x;
            const renderY = canvas.height / 2 + renderEl.renderOrigin.y;
            const renderWidth = part.width * scale;
            const renderHeight = part.height * scale;
            const pivotX = part.def.pivot.x * scale;
            const pivotY = part.def.pivot.y * scale;

            if (offsetX > renderX - pivotX && offsetX < renderX - pivotX + renderWidth &&
                offsetY > renderY - pivotY && offsetY < renderY - pivotY + renderHeight) {
                
                const anchor = zdogAnchorsRef.current.get(partName);
                if (anchor) {
                    const worldTranslate = petAnchorRef.current.localToWorld(anchor.translate);
                    setDraggedPart({ name: partName, offset: { x: worldTranslate.x - (offsetX - canvas.width / 2), y: worldTranslate.y - (offsetY - canvas.height / 2) } });
                }
                return;
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!draggedPart || !illoRef.current || !canvasRef.current) return;
        const { offsetX, offsetY } = e.nativeEvent;
        const anchor = zdogAnchorsRef.current.get(draggedPart.name);
        if (anchor) {
            const newWorldPos = { x: offsetX - canvasRef.current.width / 2 + draggedPart.offset.x, y: offsetY - canvasRef.current.height / 2 + draggedPart.offset.y, z: anchor.translate.z };
            const newLocalPos = petAnchorRef.current.worldToLocal(newWorldPos);
            anchor.translate.set(newLocalPos);
        }
    };
    const handleMouseUp = () => setDraggedPart(null);


    const glowStyle = useMemo(() => {
        if (!colors || stage === 'aipod') return {};
        const baseSize = tier === 'mythic' ? 12 : tier === 'epic' ? 8 : 4; const pulseSize = tier === 'mythic' ? 18 : tier === 'epic' ? 12 : 4;
        const energyFactor = (stats.energy / 100) * 0.5 + 0.6; const glowColor = colors.energy.base;
        const base = `${glowColor} 0px 0px ${baseSize}px, ${glowColor} 0px 0px ${baseSize * 2}px`; const pulse = `${glowColor} 0px 0px ${pulseSize}px, ${glowColor} 0px 0px ${pulseSize * 2}px`;
        return { '--glow-filter-base': `drop-shadow(${base})`, '--glow-filter-pulse': `drop-shadow(${pulse})`, filter: `var(--glow-filter-base)`, opacity: energyFactor, };
    }, [tier, stats.energy, colors, stage]);

    const animationClass = tier === 'mythic' ? 'animate-aipet-glow-mythic' : tier === 'epic' ? 'animate-aipet-glow-epic' : '';
    const cursorClass = draggedPart ? 'cursor-grabbing' : 'cursor-grab';
    const filterStyle: React.CSSProperties = { imageRendering: 'pixelated', ...(stage !== 'aipod' ? glowStyle : {}) };

    if (stage === 'aipod') { return <div className={`w-full h-full ${className || ''}`}><AIPodVisual /></div>; }
    if (!blueprint || !colors) { return <div className="w-full h-full flex items-center justify-center text-xs text-text-muted">Loading visual...</div> }

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={300}
            style={filterStyle}
            className={`w-full h-full object-contain ${animationClass} ${cursorClass} ${className || ''}`}
            title={petState.name}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
    );
};

export default AIPetVisual;