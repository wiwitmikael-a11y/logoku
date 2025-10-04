// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.
// file: components/AIPetVisual.tsx

import React from 'react';
import type { AIPetState } from '../types'; // Asumsikan Anda punya file types.ts
import { useAIPetVisuals } from '../hooks/useAIPetVisuals';

interface AIPetVisualProps {
  petState: AIPetState;
}

const AIPetVisual: React.FC<AIPetVisualProps> = ({ petState }) => {
  const { stats, stage } = petState;
  
  const {
    SelectedBody,
    SelectedEyes,
    SelectedMouth,
    SelectedNose, // Ambil hidung dari hook
    SelectedHeadAccessory,
    SelectedBackAccessory,
    SelectedTailAccessory,
    SelectedPattern,
    bodyFill, 
    accentColor
  } = useAIPetVisuals(petState);

  const filterStyle = stats.energy < 30 ? `saturate(${stats.energy + 20}%) opacity(0.8)` : 'none';
  const animationClass = stage !== 'egg' ? 'animate-breathing-ai' : ''; 

  return (
    <svg viewBox="0 0 100 100" style={{ filter: filterStyle, overflow: 'visible' }} className={animationClass}>
      
      <defs>
        {SelectedPattern}
      </defs>

      {SelectedBackAccessory && (
        <g>
          {SelectedBackAccessory}
        </g>
      )}

      <g>
        {SelectedBody}
        {SelectedPattern && <path d={(SelectedBody as any).props.d} fill={`url(#${(SelectedPattern as any).props.id})`} />}
      </g>
      
      {SelectedHeadAccessory && (
        <g>
          {SelectedHeadAccessory}
        </g>
      )}

      {SelectedTailAccessory && (
        <g>
          {SelectedTailAccessory}
        </g>
      )}

      {stage !== 'egg' && (
        <g fill="none" stroke="#1c1c20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {SelectedEyes}
          {SelectedNose} 
          {SelectedMouth}
        </g>
      )}
      
    </svg>
  );
};

export default AIPetVisual;