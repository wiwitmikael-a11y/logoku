// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useMemo } from 'react';
import type { AIPetState } from '../types';
import AIPetVisual from './AIPetVisual';

interface Props {
  pets: AIPetState[];
}

const AIPetParade: React.FC<Props> = ({ pets }) => {
  const [animationStyles, setAnimationStyles] = useState<React.CSSProperties[]>([]);

  // Generate random animation properties for each pet to make them look natural
  useEffect(() => {
    if (pets.length > 0) {
      const styles = pets.map(() => ({
        animationDuration: `${Math.random() * 10 + 15}s`, // 15-25 seconds
        animationDelay: `-${Math.random() * 25}s`, // Start at a random point in the animation
        bottom: `${Math.random() * 15 + 20}%`, // Vary vertical position
        transform: `scale(${0.6 + Math.random() * 0.2})`, // Vary size
      }));
      setAnimationStyles(styles);
    }
  }, [pets]);

  const keyframes = `
    @keyframes pet-parade-walk {
      0% { transform: translateX(-60vw) scaleX(1); }
      49% { transform: translateX(60vw) scaleX(1); }
      50% { transform: translateX(60vw) scaleX(-1); }
      99% { transform: translateX(-60vw) scaleX(-1); }
      100% { transform: translateX(-60vw) scaleX(1); }
    }
  `;

  if (pets.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      <style>{keyframes}</style>
      {pets.map((pet, index) => (
        <div
          key={pet.name + index}
          className="absolute left-1/2"
          style={{
            ...animationStyles[index],
            animationName: 'pet-parade-walk',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          }}
        >
          <div className="w-16 h-16 opacity-60 hover:opacity-100 transition-opacity">
            <AIPetVisual petState={pet} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AIPetParade;