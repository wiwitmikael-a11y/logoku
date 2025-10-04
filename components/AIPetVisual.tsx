// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useMemo } from 'react';
import type { AIPetState } from '../types';

interface AIPetVisualProps {
  petState: AIPetState;
}

const AIPetVisual: React.FC<AIPetVisualProps> = ({ petState }) => {
    const { stats, personality, stage } = petState;

    const visualProps = useMemo(() => {
        // --- Base Shape & Color ---
        let bodyPath = "M50 20 C 80 20, 85 70, 50 90 S 20 20, 50 20 Z"; // Default child shape
        let bodyFill = `hsl(120, ${Math.max(20, stats.energy / 1.5)}%, 50%)`;
        
        // --- Evolution based on Personality ---
        if (stage === 'adult') {
            const dominantPersonality = Object.entries(personality).reduce((a, b) => a[1] > b[1] ? a : b)[0];
            switch (dominantPersonality) {
                case 'minimalist':
                case 'modern':
                    bodyPath = "M50 15 L85 50 L50 95 L15 50 Z"; // Diamond/Geometric
                    break;
                case 'rustic':
                case 'feminine':
                    bodyPath = "M50 20 C 90 30, 95 70, 50 90 S 10 30, 50 20 Z"; // Smoother, wider
                    break;
                case 'playful':
                    bodyPath = "M50,20 C85,20 100,50 85,70 C70,90 30,90 15,70 C0,50 15,20 50,20 Z"; // Rounder blob
                    break;
                case 'bold':
                     bodyPath = "M40 15 L60 15 L85 50 L60 95 L40 95 L15 50 Z"; // Hexagon
                     break;
                default:
                    bodyPath = "M50 15 C 80 15, 90 70, 50 95 S 20 15, 50 15 Z"; // Default adult shape
            }
        }
        
        // --- Eyes ---
        const eyeSize = 4 + (stats.intelligence / 25);
        const eyeY = 50 - (stats.energy / 20);

        // --- Pattern based on Creativity ---
        const creativityFactor = stats.creativity / 100;
        const patternOpacity = creativityFactor * 0.3;
        const patternScale = 1 + creativityFactor;

        return { bodyPath, bodyFill, eyeSize, eyeY, patternOpacity, patternScale };
    }, [stats, personality, stage]);
    
    // Low energy effect
    const filterStyle = stats.energy < 30 ? `saturate(${stats.energy + 20}%)` : 'none';

    return (
        <svg viewBox="0 0 100 100" style={{ filter: filterStyle, overflow: 'visible' }}>
            {/* Pattern Layer */}
            <g opacity={visualProps.patternOpacity} transform={`scale(${visualProps.patternScale}) translate(-${(visualProps.patternScale-1)*50}, -${(visualProps.patternScale-1)*50})`}>
                <defs>
                    <pattern id="petPattern" patternUnits="userSpaceOnUse" width="20" height="20">
                        <path d="M 5 0 L 5 20 M 0 5 L 20 5" stroke={visualProps.bodyFill} strokeWidth="1" opacity="0.5"/>
                        <circle cx="15" cy="15" r="1" fill={visualProps.bodyFill} />
                    </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#petPattern)" />
            </g>

            {/* Body Layer */}
            <g>
                <path d={visualProps.bodyPath} fill={visualProps.bodyFill} />
            </g>

            {/* Eyes Layer */}
            <g fill="#0D0D0F">
                <circle cx="38" cy={visualProps.eyeY} r={visualProps.eyeSize} />
                <circle cx="62" cy={visualProps.eyeY} r={visualProps.eyeSize} />
            </g>

            {/* Eye Shine */}
            <g fill="white">
                 <circle cx="40" cy={visualProps.eyeY - visualProps.eyeSize*0.2} r={visualProps.eyeSize * 0.3} />
                 <circle cx="64" cy={visualProps.eyeY - visualProps.eyeSize*0.2} r={visualProps.eyeSize * 0.3} />
            </g>
        </svg>
    );
};

export default AIPetVisual;