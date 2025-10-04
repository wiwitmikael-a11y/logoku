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
    SelectedHeadAccessory,
    SelectedBackAccessory,
    SelectedTailAccessory,
    SelectedPattern,
    bodyFill, // Digunakan untuk mengisi pola atau warna aksen
    accentColor // Warna aksen untuk stroke accessories
  } = useAIPetVisuals(petState);

  // Efek visual berdasarkan state (tetap sama)
  const filterStyle = stats.energy < 30 ? `saturate(${stats.energy + 20}%) opacity(0.8)` : 'none';
  const animationClass = stage !== 'egg' ? 'animate-breathing-ai' : ''; // Asumsikan ada CSS class ini

  return (
    <svg viewBox="0 0 100 100" style={{ filter: filterStyle, overflow: 'visible' }} className={animationClass}>
      
      {/* Definisi Pola SVG */}
      <defs>
        {SelectedPattern}
      </defs>

      {/* Layer 0: Aksesoris Punggung (Mungkin di belakang tubuh utama) */}
      {SelectedBackAccessory && (
        <g>
          {SelectedBackAccessory}
        </g>
      )}

      {/* Layer 1: Tubuh Utama */}
      <g>
        {SelectedBody}
        {/* Jika ada pola yang dipilih, aplikasikan ke tubuh */}
        {SelectedPattern && <path d={(SelectedBody as any).props.d} fill={`url(#${(SelectedPattern as any).props.id})`} />}
      </g>
      
      {/* Layer 2: Aksesoris Kepala */}
      {SelectedHeadAccessory && (
        <g>
          {SelectedHeadAccessory}
        </g>
      )}

      {/* Layer 3: Aksesoris Ekor */}
      {SelectedTailAccessory && (
        <g>
          {SelectedTailAccessory}
        </g>
      )}

      {/* Layer 4: Wajah (Mata & Mulut) - Do not show on egg */}
      {stage !== 'egg' && (
        <g fill="none" stroke="#1c1c20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {SelectedEyes}
          {SelectedMouth}
        </g>
      )}
      
    </svg>
  );
};

export default AIPetVisual;
