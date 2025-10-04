// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useMemo, useEffect, useCallback } from 'react';
import type { AIPetState, AtlasManifest, AtlasPart, PartName } from '../types';

interface AIPetVisualProps {
  petState: AIPetState;
  className?: string;
}

// NEW: Consolidated, enhanced Egg visual component with mechanical base
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

                {/* Mechanical Base */}
                <g id="mechanical-base">
                    <path d="M 20 115 C 30 130, 70 130, 80 115 L 75 110 C 65 120, 35 120, 25 110 Z" fill="url(#metalGradient)" stroke="#18181b" strokeWidth="2" />
                    <ellipse cx="50" cy="118" rx="15" ry="4" fill="rgb(var(--c-splash))" filter="url(#glow)" />
                    <path d="M 22 114 L 35 105 M 78 114 L 65 105" stroke="#18181b" strokeWidth="1.5" />
                </g>

                {/* Egg Body */}
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


// --- NEW: Define ideal size ratios relative to the torso's width ---
const TARGET_RATIOS: { [key in PartName]?: number } = {
    'head': 0.8,
    'left_arm': 0.45,
    'right_arm': 0.45,
    'left_leg': 0.5,
    'right_leg': 0.5,
    'accessory1': 0.4,
    'accessory2': 0.4,
};

const Puppet: React.FC<{ manifest: AtlasManifest; atlasUrl: string }> = ({ manifest, atlasUrl }) => {
    const { parts, anchors, layering, atlasSize } = manifest;
    const partsMap = useMemo(() => new Map(parts.map(p => [p.name, p])), [parts]);

    const getPartPosition = useCallback((partName: PartName, memo: Map<PartName, { x: number; y: number }>): { x: number; y: number } => {
        if (memo.has(partName)) {
            return memo.get(partName)!;
        }

        const part = partsMap.get(partName);
        if (!part || !part.attachTo || !part.attachmentPoint) {
            memo.set(partName, { x: 0, y: 0 });
            return { x: 0, y: 0 };
        }

        const parent = partsMap.get(part.attachTo);
        const parentAnchor = anchors[part.attachTo]?.[part.attachmentPoint];
        if (!parent || !parentAnchor) {
            memo.set(partName, { x: 0, y: 0 });
            return { x: 0, y: 0 };
        }
        
        const parentPos = getPartPosition(part.attachTo, memo);
        const partAssemblyPoint = part.assemblyPoint;

        const x = parentPos.x + parentAnchor[0] - partAssemblyPoint[0];
        const y = parentPos.y + parentAnchor[1] - partAssemblyPoint[1];
        
        const finalPos = { x, y };
        memo.set(partName, finalPos);
        return finalPos;
    }, [partsMap, anchors]);


    const assembledParts = useMemo(() => {
        const memo = new Map<PartName, { x: number; y: number }>();
        const torso = partsMap.get('torso');
        if (!torso) return []; // Torso is essential for scaling

        return layering.map(partName => {
            const part = partsMap.get(partName);
            if (!part) return null;

            const pos = getPartPosition(partName, memo);

            // --- NEW: Scaling Logic ---
            let scale = 1.0;
            const targetRatio = TARGET_RATIOS[part.name];
            if (targetRatio) {
                const torsoWidth = torso.bbox[2];
                const partWidth = part.bbox[2];
                if (partWidth > 0) {
                    const targetWidth = torsoWidth * targetRatio;
                    scale = targetWidth / partWidth;
                }
            }

            return { ...part, ...pos, scale, id: partName };
        });
    }, [layering, partsMap, getPartPosition]);


    return (
        <div className="relative w-full h-full">
            {assembledParts.map((part, index) => {
                if (!part) return null;
                const [bx, by, bw, bh] = part.bbox;
                
                let animationStyle: React.CSSProperties = {};
                // NEW: Set transform origin based on AI-provided assembly point for natural movement
                const transformOrigin = `${part.assemblyPoint[0]}px ${part.assemblyPoint[1]}px`;

                if (part.name.includes('arm')) {
                    animationStyle = {
                        animation: `pet-arm-swing 4s ease-in-out infinite ${index * 0.2}s`,
                        transformOrigin: transformOrigin,
                    };
                } else if (part.name === 'head') {
                    animationStyle = {
                        animation: `pet-head-bob 5s ease-in-out infinite`,
                        transformOrigin: transformOrigin,
                    };
                }

                return (
                    <div
                        key={part.id}
                        style={{
                            position: 'absolute',
                            left: `${part.x}px`,
                            top: `${part.y}px`,
                            width: `${bw}px`,
                            height: `${bh}px`,
                            backgroundImage: `url(${atlasUrl})`,
                            backgroundPosition: `-${bx}px -${by}px`,
                            backgroundSize: `${atlasSize[0]}px ${atlasSize[1]}px`,
                            zIndex: index,
                            transform: `scale(${part.scale})`,
                            transformOrigin: `${part.assemblyPoint[0]}px ${part.assemblyPoint[1]}px`,
                            ...animationStyle
                        }}
                    />
                );
            })}
        </div>
    );
};


const AIPetVisual: React.FC<AIPetVisualProps> = ({ petState, className }) => {
  const { stats, stage, atlas_url, manifest } = petState;

  const animationKeyframes = `
    @keyframes pet-body-bob {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3%); }
    }
    @keyframes pet-arm-swing {
        0%, 100% { transform: rotate(-5deg); }
        50% { transform: rotate(7deg); }
    }
    @keyframes pet-head-bob {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: rotate(-3deg); }
        50% { transform: translateY(-4%) rotate(0deg); }
        75% { transform: rotate(3deg); }
    }
  `;

  const filterStyle: React.CSSProperties = {
    filter: stats.energy < 30 ? `saturate(${stats.energy + 20}%) opacity(0.8)` : 'none',
    imageRendering: 'pixelated',
  };

  if (stage === 'egg' || !atlas_url || !manifest) {
      return (
          <div style={filterStyle} className={`w-full h-full ${className || ''}`}>
              <EggVisual />
          </div>
      );
  }

  // Find the torso part to determine the center for scaling.
  const torso = manifest.parts.find(p => p.name === 'torso');
  const viewboxWidth = torso ? torso.bbox[2] * 2.5 : 200;
  const viewboxHeight = torso ? torso.bbox[3] * 2 : 200;
  const offsetX = torso ? -torso.bbox[0] + (viewboxWidth/2) - (torso.bbox[2]/2) : 0;
  const offsetY = torso ? -torso.bbox[1] + (viewboxHeight/2) - (torso.bbox[3]/2) : 0;

  return (
    <div 
        style={filterStyle}
        className={`w-full h-full object-contain ${className || ''}`}
    >
        <style>{animationKeyframes}</style>
        <div style={{ animation: `pet-body-bob 4s ease-in-out infinite`, transform: `translate(${offsetX}px, ${offsetY}px)` }}>
             <Puppet manifest={manifest} atlasUrl={atlas_url} />
        </div>
    </div>
  );
};

export default AIPetVisual;