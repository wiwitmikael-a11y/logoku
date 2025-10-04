// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.
// file: components/AIPetVisual.tsx

import React from 'react';
import type { AIPetState } from '../types';
import { useAIPetVisuals } from '../hooks/useAIPetVisuals';

interface AIPetVisualProps {
  petState: AIPetState;
}

const AIPetVisual: React.FC<AIPetVisualProps> = ({ petState }) => {
  const { stats, stage } = petState;
  
  // useAIPetVisuals now returns a Render function
  const visuals = useAIPetVisuals(petState);

  // If the hook is not ready, for example during initial state calculation.
  if (!visuals || !visuals.Render) {
    return React.createElement("svg", { viewBox: "0 0 100 100" });
  }
  
  const { Render } = visuals;

  const filterStyle: React.CSSProperties = {
    filter: stats.energy < 30 ? `saturate(${stats.energy + 20}%) opacity(0.8)` : 'none',
    overflow: 'visible',
  };
  const animationClass = stage !== 'egg' ? 'animate-breathing-ai' : ''; 

  const PetComponent = Render();

  // Clone the SVG element returned by Render and add our dynamic props
  return React.cloneElement(PetComponent, {
      style: { ...filterStyle, ...PetComponent.props.style },
      className: `${animationClass} ${PetComponent.props.className || ''}`
  });
};

export default AIPetVisual;