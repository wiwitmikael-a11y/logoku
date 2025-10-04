// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.
// file: components/AIPetParts.tsx

import React from 'react';

// --- BASE BODY LIBRARY (Bentuk lebih dinamis & tematik) ---
export const BodyShapes = {
  egg: (fill: string) => <path d="M50,25 C20,25 20,95 50,95 C80,95 80,25 50,25 Z" fill={fill} />,
  child_chibi: (fill: string) => <path d="M50,25 C25,25 15,50 25,70 C30,95 70,95 75,70 C85,50 75,25 50,25 Z" fill={fill} />, // Blob umum
  
  // Beast Archetype Bodies
  child_beast: (fill: string) => <path d="M50,35 C20,35 25,80 40,90 L60,90 C75,80 80,35 50,35 Z" fill={fill} />, // Badan gempal dengan cakar kecil
  teen_beast: (fill: string) => <path d="M50,20 C20,20 10,95 40,95 L60,95 C90,95 80,20 50,20 Z" fill={fill} />, // Badan lebih tinggi & garang
  adult_beast: (fill: string) => <path d="M50,10 C5,15 5,100 45,100 L55,100 C95,100 95,15 50,10 Z" fill={fill} />, // Badan monster buas besar
  
  // Machine Archetype Bodies
  child_machine: (fill: string) => <path d="M30,30 L70,30 L75,70 L25,70 Z" fill={fill} />, // Badan kotak robot kecil
  teen_machine: (fill: string) => <path d="M25,20 L75,20 L85,85 L15,85 Z" fill={fill} />, // Badan trapezoid lebih besar
  adult_machine: (fill: string) => <path d="M20,10 L80,10 L95,90 L5,90 Z" fill={fill} />, // Badan robot raksasa
  
  // Mystic Archetype Bodies
  child_mystic: (fill: string) => <path d="M50,30 C30,30 30,70 50,85 C70,70 70,30 50,30 Z" fill={fill} />, // Badan seperti api/roh
  teen_mystic: (fill: string) => <path d="M50,20 C20,20 20,80 50,95 C80,80 80,20 50,20 Z" fill={fill} />, // Badan lebih ramping & elegan
  adult_mystic: (fill: string) => <path d="M50,10 C10,10 20,100 50,100 C80,100 90,10 50,10 Z" fill={fill} />, // Badan agung seperti dewa
};


// --- EYE LIBRARY (Lebih banyak variasi ekspresif) ---
export const EyeSets = {
  // Generic
  default: () => <><circle cx="35" cy="50" r="5" /><circle cx="65" cy="50" r="5" /></>,
  happy: () => <><path d="M 32,50 a 8,4 0 0,1 16,0" /><path d="M 52,50 a 8,4 0 0,1 16,0" /></>,
  sleepy: () => <><path d="M 30,55 Q 38,50 46,55" /><path d="M 54,55 Q 62,50 70,55" /></>,

  // Thematic
  fierce_beast: (fill: string) => <><path d="M28 45 L42 55 M42 45 L28 55" stroke={fill} strokeWidth="3" /><path d="M58 45 L72 55 M72 45 L58 55" stroke={fill} strokeWidth="3" /></>, // Mata silang buas
  glowing_mystic: (fill: string) => <><circle cx="35" cy="50" r="6" fill={fill} filter="url(#glow)" /><circle cx="65" cy="50" r="6" fill={fill} filter="url(#glow)" /></>, // Mata aura
  visor_machine: (fill: string) => <rect x="25" y="45" width="50" height="10" rx="2" fill={fill} />, // Visor robot
};

// --- MOUTH LIBRARY ---
export const MouthSets = {
  // Generic
  neutral: () => <path d="M 45,70 L 55,70" />,
  smile: () => <path d="M 40,70 Q 50,78 60,70" />,

  // Thematic
  fangs_beast: () => <path d="M 40,68 L 45,75 L 55,75 L 60,68 M 48,75 L 52,75" />, // Taring
  grill_machine: () => <path d="M40 70 H 60 M40 73 H 60 M40 76 H 60" strokeWidth="1" />, // Grill/ventilasi
  serene_mystic: () => <path d="M 47,72 Q 50,75 53,72" />, // Senyum tipis
};


// --- HEAD ACCESSORIES (Archetype-specific) ---
export const HeadAccessories = {
  // Beast
  horns_ram: (stroke: string) => <path d="M 30,25 C 10,10 10,40 30,40 M 70,25 C 90,10 90,40 70,40" stroke={stroke} fill="none" strokeWidth="4" strokeLinecap="round" />,
  ears_wolf: (stroke: string, fill: string) => <path d="M25,25 L15,5 L35,20 Z M75,25 L85,5 L65,20 Z" stroke={stroke} fill={fill} />,
  
  // Machine
  antenna_single: (stroke: string) => <path d="M 50,20 Q 55,10 52,5 M 52,5 a 3,3 0 1,1 -6,0 a 3,3 0 1,1 6,0" stroke={stroke} fill="none" strokeWidth="2" strokeLinecap="round" />,
  vents_side: (stroke: string) => <path d="M20 30 L15 35 L20 40 M20 45 L15 50 L20 55 M80 30 L85 35 L80 40 M80 45 L85 50 L80 55" stroke={stroke} strokeWidth="2" />,
  
  // Mystic
  crest_elemental: (fill: string) => <path d="M50,20 Q40,10 50,0 Q60,10 50,20 Z" fill={fill} />,
  halo_divine: (fill: string) => <ellipse cx="50" cy="15" rx="25" ry="5" fill="none" stroke={fill} strokeWidth="2" />,
};


// --- BACK ACCESSORIES (Archetype-specific) ---
export const BackAccessories = {
  // Beast
  wings_bat: (stroke: string, fill: string) => <path d="M20 40 L0 30 L20 60 L30 50 Z M80 40 L100 30 L80 60 L70 50 Z" stroke={stroke} fill={fill} />,
  spikes_dorsal: (stroke: string, fill: string) => <path d="M50 30 L45 40 L50 50 L55 40 Z M50 50 L45 60 L50 70 L55 60 Z" stroke={stroke} fill={fill} />,
  
  // Machine
  jetpack_dual: (stroke: string, fill: string) => <><rect x="30" y="40" width="15" height="25" rx="3" fill={fill} stroke={stroke} /><rect x="55" y="40" width="15" height="25" rx="3" fill={fill} stroke={stroke} /></>,
  cannon_shoulder: (stroke: string, fill: string) => <rect x="65" y="30" width="25" height="10" rx="2" transform="rotate(-15 77.5 35)" fill={fill} stroke={stroke} />,
  
  // Mystic
  wings_angelic: (stroke: string, fill: string) => <path d="M25 40 Q-10 60 25 80 L35 70 Q10 60 35 50 Z M75 40 Q110 60 75 80 L65 70 Q90 60 65 50 Z" stroke={stroke} fill={fill} />,
  runes_floating: (fill: string) => <><circle cx="20" cy="50" r="4" fill={fill} /><path d="M80 45 L75 55 L85 55 Z" fill={fill} /></>,
};

// --- TAIL ACCESSORIES (Archetype-specific) ---
export const TailAccessories = {
  // Beast
  tail_lizard: (stroke: string, fill: string) => <path d="M50 90 Q70 95 80 80" stroke={stroke} fill="none" strokeWidth="4" strokeLinecap="round" />,
  tail_furry: (stroke: string, fill: string) => <path d="M50 90 C 60 100, 70 80, 60 70" stroke={stroke} fill={fill} strokeWidth="3" strokeLinecap="round"/>,

  // Machine
  tail_cable: (stroke: string) => <path d="M50 90 Q 60 95 55 100 Q 50 105 55 110" stroke={stroke} fill="none" strokeWidth="2" />,
  tail_thruster: (stroke: string, fill: string) => <path d="M50 90 L 55 95 L 45 95 Z" fill={fill} stroke={stroke} />,
  
  // Mystic
  tail_wisp: (fill: string) => <path d="M50 90 Q 60 95 50 100 Q 40 95 50 90" fill={fill} opacity="0.7"/>,
  tail_crystal: (stroke: string, fill: string) => <path d="M50 90 L 55 100 L 45 100 Z" stroke={stroke} fill={fill} />,
};

// --- SVG DEFS for effects ---
export const SVGDefs = {
  glow: (color: string) => (
    <filter id="glow">
      <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  ),
};
