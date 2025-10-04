// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useMemo, useEffect, useCallback } from 'react';
import type { AIPetState, AtlasManifest, AtlasPart, PartName } from '../types';

interface AIPetVisualProps {
  petState: AIPetState;
  className?: string;
}

const EggVisual: React.FC = () => (
    <svg viewBox="0 0 100 125">
        <g transform="translate(0, 5)">
            <path 
                d="M50,5 C25,5 10,40 10,70 C10,100 30,120 50,120 C70,120 90,100 90,70 C90,40 75,5 50,5Z" 
                fill="url(#eggGradient)" 
                stroke="#52525b" 
                strokeWidth="2"
            />
            <defs>
                <radialGradient id="eggGradient" cx="0.5" cy="0.9" r="0.9">
                    <stop offset="0%" stopColor="#e2e8f0" />
                    <stop offset="100%" stopColor="#f8fafc" />
                </radialGradient>
            </defs>
            <circle cx="50" cy="40" r="8" fill="#c084fc" opacity="0.5" />
            <circle cx="70" cy="70" r="12" fill="#60a5fa" opacity="0.5" />
            <circle cx="35" cy="85" r="10" fill="#f87171" opacity="0.5" />
        </g>
    </svg>
);

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
                if (part.name.includes('arm')) {
                    animationStyle.animation = `pet-arm-swing 3s ease-in-out infinite ${index * 0.1}s`;
                }
                 if (part.name === 'head') {
                    animationStyle.animation = `pet-head-bob 3s ease-in-out infinite`;
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
                            // Scale from the joint for correct positioning
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
        50% { transform: translateY(-2px); }
    }
    @keyframes pet-arm-swing {
        0%, 100% { transform: rotate(0deg); }
        50% { transform: rotate(5deg); }
    }
    @keyframes pet-head-bob {
        0%, 100% { transform: translateY(0) rotate(0); }
        50% { transform: translateY(-1px) rotate(1deg); }
    }
  `;

  const filterStyle: React.CSSProperties = {
    filter: stats.energy < 30 ? `saturate(${stats.energy + 20}%) opacity(0.8)` : 'none',
    imageRendering: 'pixelated',
  };

  const animationClass = stage !== 'egg' ? 'breathing-pet' : 'animate-pulse'; 

  if (stage === 'egg' || !atlas_url || !manifest) {
      return (
          <div style={filterStyle} className={`w-full h-full ${className || ''} ${animationClass}`}>
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
        <div style={{ animation: `pet-body-bob 3s ease-in-out infinite`, transform: `translate(${offsetX}px, ${offsetY}px)` }}>
             <Puppet manifest={manifest} atlasUrl={atlas_url} />
        </div>
    </div>
  );
};

export default AIPetVisual;