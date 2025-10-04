// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useMemo } from 'react';
import type { AIPetState } from '../types';

interface AIPetVisualProps {
  petState: AIPetState;
}

// --- SVG Part Library ---
const BODY_SHAPES = {
  egg: "M50,25 C20,25 20,95 50,95 C80,95 80,25 50,25 Z",
  child: "M50,30 C20,30 20,90 50,90 C80,90 80,30 50,30 Z",
  teen: "M50,25 C20,25 15,95 40,95 Q50,90 60,95 C85,95 80,25 50,25 Z",
  adult_default: "M50,20 C20,20 10,95 30,95 Q50,85 70,95 C90,95 80,20 50,20 Z",
  adult_geometric: "M50 15 L85 35 L85 75 L50 95 L15 75 L15 35 Z",
  adult_smooth: "M50,15 C20,15 20,95 50,95 C80,95 80,15 50,15 Z",
};

const EYE_SETS = {
  default: { left: "M 38,50 a 4,4 0 1,1 -8,0 a 4,4 0 1,1 8,0", right: "M 62,50 a 4,4 0 1,1 -8,0 a 4,4 0 1,1 8,0" },
  happy: { left: "M 32,50 a 6,3 0 0,1 12,0", right: "M 56,50 a 6,3 0 0,1 12,0" },
  focused: { left: "M 32,52 L 44,52", right: "M 56,52 L 68,52" },
  playful: { left: "M 35,45 L 41,51 M 41,45 L 35,51", right: "M 59,45 L 65,51 M 65,45 L 59,51" },
  bold: { left: "M 32,48 L 44,48 L 38,55 Z", right: "M 56,48 L 68,48 L 62,55 Z" },
  sleepy: { left: "M 32,55 Q 38,50 44,55", right: "M 56,55 Q 62,50 68,55" },
};

const MOUTH_SETS = {
    neutral: "M 45,70 L 55,70",
    smile: "M 45,70 Q 50,75 55,70",
    sad: "M 45,75 Q 50,70 55,75",
    open: "M 45,70 a 5,3 0 0,0 10,0",
};

const ACCESSORIES = {
  horns: "M 35,20 C 30,10 20,15 25,25 M 65,20 C 70,10 80,15 75,25",
  ears: "M 25,25 C 10,10 30,0 35,20 M 75,25 C 90,10 70,0 65,20",
  antenna: "M 50,20 Q 55,10 52,5 M 52,5 a 2,2 0 1,1 -4,0 a 2,2 0 1,1 4,0",
  crown: "M 35,20 L 40,15 L 50,20 L 60,15 L 65,20",
};

const AIPetVisual: React.FC<AIPetVisualProps> = ({ petState }) => {
    const { stats, personality, stage } = petState;

    const visualProps = useMemo(() => {
        const dominantPersonality = Object.entries(personality).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0])[0];
        
        // --- Determine Body Shape ---
        let bodyPath = BODY_SHAPES.child;
        if (stage === 'egg') bodyPath = BODY_SHAPES.egg;
        else if (stage === 'teen') bodyPath = BODY_SHAPES.teen;
        else if (stage === 'adult') {
            switch (dominantPersonality) {
                case 'minimalist': case 'modern': bodyPath = BODY_SHAPES.adult_geometric; break;
                case 'rustic': case 'feminine': bodyPath = BODY_SHAPES.adult_smooth; break;
                default: bodyPath = BODY_SHAPES.adult_default;
            }
        }
        
        // --- Determine Expression ---
        let eyeSet = EYE_SETS.default;
        let mouthPath = MOUTH_SETS.neutral;
        if (stats.energy < 30) {
            eyeSet = EYE_SETS.sleepy;
            mouthPath = MOUTH_SETS.neutral;
        } else if (stats.creativity > 80) {
            eyeSet = EYE_SETS.happy;
            mouthPath = MOUTH_SETS.smile;
        } else if (stats.intelligence > 75) {
            eyeSet = EYE_SETS.focused;
        } else if (stats.energy < 50 && stats.creativity < 50) {
            mouthPath = MOUTH_SETS.sad;
        } else if (dominantPersonality === 'playful') {
            eyeSet = EYE_SETS.playful;
            mouthPath = MOUTH_SETS.open;
        } else if (dominantPersonality === 'bold') {
            eyeSet = EYE_SETS.bold;
        }

        // --- Determine Accessory ---
        let accessoryPath: string | null = null;
        if (stage === 'adult') {
            if (dominantPersonality === 'bold' || dominantPersonality === 'rustic') accessoryPath = ACCESSORIES.horns;
            else if (dominantPersonality === 'feminine' || dominantPersonality === 'playful') accessoryPath = ACCESSORIES.ears;
            else if (dominantPersonality === 'modern' || stats.intelligence > 80) accessoryPath = ACCESSORIES.antenna;
            else if (dominantPersonality === 'luxury') accessoryPath = ACCESSORIES.crown;
        }

        // --- Determine Color ---
        const charismaFactor = stats.charisma / 100;
        const energyFactor = stats.energy / 100;
        const hue = 120 + (charismaFactor * 180); // From green to purple
        const saturation = 50 + (energyFactor * 40);
        const lightness = 45 + (energyFactor * 10);
        const bodyFill = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

        return { bodyPath, bodyFill, eyeSet, mouthPath, accessoryPath };
    }, [stats, personality, stage]);
    
    // Low energy effect
    const filterStyle = stats.energy < 30 ? `saturate(${stats.energy + 20}%) opacity(0.8)` : 'none';
    const animationClass = petState.stage !== 'egg' ? 'animate-breathing-ai' : '';

    return (
        <svg viewBox="0 0 100 100" style={{ filter: filterStyle, overflow: 'visible' }} className={animationClass}>
            {/* Body */}
            <g>
                <path d={visualProps.bodyPath} fill={visualProps.bodyFill} />
                {petState.stage === 'egg' && <path d={visualProps.bodyPath} fill="url(#egg-speckle)" />}
            </g>

            {/* Accessory */}
            {visualProps.accessoryPath && (
                 <g stroke={visualProps.bodyFill} strokeWidth="3" fill="none" strokeLinecap="round">
                    <path d={visualProps.accessoryPath} />
                </g>
            )}

            {/* Face (Eyes and Mouth) - Do not show on egg */}
            {petState.stage !== 'egg' && (
                <g fill="none" stroke="#1c1c20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={visualProps.eyeSet.left} />
                    <path d={visualProps.eyeSet.right} />
                    <path d={visualProps.mouthPath} />
                </g>
            )}

            {/* SVG Definitions */}
            <defs>
                <pattern id="egg-speckle" patternUnits="userSpaceOnUse" width="10" height="10">
                    <circle cx="2" cy="5" r="0.5" fill={visualProps.bodyFill} fillOpacity="0.3" />
                    <circle cx="8" cy="8" r="0.5" fill={visualProps.bodyFill} fillOpacity="0.3" />
                </pattern>
            </defs>
        </svg>
    );
};

export default AIPetVisual;