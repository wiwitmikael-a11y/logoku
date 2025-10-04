// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.
// file: components/AIPetParts.tsx

import React from 'react';

type AnchorPoint = { x: number; y: number };

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


// --- REFACTORED ACCESSORIES WITH ANCHOR POINTS ---
const createAccessory = (path: React.ReactNode, anchor: AnchorPoint) => (
  <g transform={`translate(${anchor.x} ${anchor.y})`}>{path}</g>
);

// --- HEAD ACCESSORIES (Archetype-specific, redrawn relative to 0,0) ---
export const HeadAccessories = {
  horns_ram: (stroke: string, anchor: AnchorPoint) => createAccessory(
    <path d="M -20,0 C -40,-15 -40,15 -20,15 M 20,0 C 40,-15 40,15 20,15" stroke={stroke} fill="none" strokeWidth="4" strokeLinecap="round" />, anchor
  ),
  ears_wolf: (stroke: string, fill: string, anchor: AnchorPoint) => createAccessory(
    <path d="M -25,0 L -35,-20 -15,-5 Z M 25,0 L 35,-20 15,-5 Z" stroke={stroke} fill={fill} />, anchor
  ),
  antenna_single: (stroke: string, anchor: AnchorPoint) => createAccessory(
    <path d="M 0,-5 Q 5,-15 2,-20 M 2,-20 a 3,3 0 1,1 -6,0 a 3,3 0 1,1 6,0" stroke={stroke} fill="none" strokeWidth="2" strokeLinecap="round" />, anchor
  ),
  vents_side: (stroke: string, anchor: AnchorPoint) => createAccessory(
    <path d="M -30,5 L -35,10 -30,15 M -30,20 L -35,25 -30,30 M 30,5 L 35,10 30,15 M 30,20 L 35,25 30,30" stroke={stroke} strokeWidth="2" />, anchor
  ),
  crest_elemental: (fill: string, anchor: AnchorPoint) => createAccessory(
    <path d="M 0,-5 Q -10,-15 0,-25 Q 10,-15 0,-5 Z" fill={fill} />, anchor
  ),
  halo_divine: (fill: string, anchor: AnchorPoint) => createAccessory(
    <ellipse cx="0" cy="-10" rx="25" ry="5" fill="none" stroke={fill} strokeWidth="2" />, anchor
  ),
};

// --- BACK ACCESSORIES (Archetype-specific, redrawn relative to 0,0) ---
export const BackAccessories = {
  wings_bat: (stroke: string, fill: string, anchor: AnchorPoint) => createAccessory(
    <path d="M -30,-10 L -50,-20 -30,10 -20,0 Z M 30,-10 L 50,-20 30,10 20,0 Z" stroke={stroke} fill={fill} />, anchor
  ),
  spikes_dorsal: (stroke: string, fill: string, anchor: AnchorPoint) => createAccessory(
    <path d="M 0,-20 L -5,-10 L 0,0 L 5,-10 Z M 0,0 L -5,10 L 0,20 L 5,10 Z" stroke={stroke} fill={fill} />, anchor
  ),
  jetpack_dual: (stroke: string, fill: string, anchor: AnchorPoint) => createAccessory(
    <><rect x="-25" y="-10" width="15" height="25" rx="3" fill={fill} stroke={stroke} /><rect x="10" y="-10" width="15" height="25" rx="3" fill={fill} stroke={stroke} /></>, anchor
  ),
  cannon_shoulder: (stroke: string, fill: string, anchor: AnchorPoint) => createAccessory(
    <rect x="15" y="-20" width="25" height="10" rx="2" transform="rotate(-15 27.5 -15)" fill={fill} stroke={stroke} />, anchor
  ),
  wings_angelic: (stroke: string, fill: string, anchor: AnchorPoint) => createAccessory(
    <path d="M -25,-10 Q -60,10 -25,30 L -15,20 Q -40,10 -15,0 Z M 25,-10 Q 60,10 25,30 L 15,20 Q 40,10 15,0 Z" stroke={stroke} fill={fill} />, anchor
  ),
  runes_floating: (fill: string, anchor: AnchorPoint) => createAccessory(
    <><circle cx="-30" cy="0" r="4" fill={fill} /><path d="M 30,-5 L 25,5 L 35,5 Z" fill={fill} /></>, anchor
  ),
};

// --- TAIL ACCESSORIES (Archetype-specific, redrawn relative to 0,0) ---
export const TailAccessories = {
  tail_lizard: (stroke: string, anchor: AnchorPoint) => createAccessory(
    <path d="M 0,0 Q 20,5 30,-10" stroke={stroke} fill="none" strokeWidth="4" strokeLinecap="round" />, anchor
  ),
  tail_furry: (stroke: string, fill: string, anchor: AnchorPoint) => createAccessory(
    <path d="M 0,0 C 10,10 20,-10 10,-20" stroke={stroke} fill={fill} strokeWidth="3" strokeLinecap="round"/>, anchor
  ),
  tail_cable: (stroke: string, anchor: AnchorPoint) => createAccessory(
    <path d="M 0,0 Q 10,5 5,10 Q 0,15 5,20" stroke={stroke} fill="none" strokeWidth="2" />, anchor
  ),
  tail_thruster: (stroke: string, fill: string, anchor: AnchorPoint) => createAccessory(
    <path d="M 0,0 L 5,5 L -5,5 Z" fill={fill} stroke={stroke} />, anchor
  ),
  tail_wisp: (fill: string, anchor: AnchorPoint) => createAccessory(
    <path d="M 0,0 Q 10,5 0,10 Q -10,5 0,0" fill={fill} opacity="0.7"/>, anchor
  ),
  tail_crystal: (stroke: string, fill: string, anchor: AnchorPoint) => createAccessory(
    <path d="M 0,0 L 5,10 L -5,10 Z" stroke={stroke} fill={fill} />, anchor
  ),
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
