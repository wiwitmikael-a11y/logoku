// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.
// file: components/AIPetParts.tsx

import React from 'react';

// Fungsi bantuan untuk style default
const defaultStroke = "#1c1c20";
const defaultStrokeWidth = "2.5";
const defaultFill = "none";

// --- BASE BODY LIBRARY (Menambahkan bentuk yang lebih "monster-like") ---
export const BodyShapes = {
  egg: (fill: string) => <path d="M50,25 C20,25 20,95 50,95 C80,95 80,25 50,25 Z" fill={fill} />,
  child_chibi: (fill: string) => <path d="M50,25 C25,25 15,50 25,70 C30,95 70,95 75,70 C85,50 75,25 50,25 Z" fill={fill} />,
  child_beast: (fill: string) => <path d="M50,25 C15,30 20,85 50,90 C80,85 85,30 50,25 Z" fill={fill} />, // Bentuk awal binatang
  teen_humanoid: (fill: string) => <path d="M50,15 C20,15 10,90 45,95 C60,95 80,90 70,15 Z" fill={fill} />, // Bentuk awal humanoid/robot
  teen_mech: (fill: string) => <path d="M50,10 L80,30 L70,80 L50,90 L30,80 L20,30 Z" fill={fill} />, // Bentuk awal robotik
  adult_feral: (fill: string) => <path d="M50,10 C10,20 0,80 50,95 C100,80 90,20 50,10 Z" fill={fill} />, // Bentuk monster buas
  adult_guardian: (fill: string) => <path d="M50,5 C10,10 0,85 50,100 C100,85 90,10 50,5 Z" fill={fill} />, // Bentuk pelindung besar
  adult_cyborg: (fill: string) => <path d="M50,0 L90,20 L90,80 L50,100 L10,80 L10,20 Z" fill={fill} />, // Bentuk robot/cyborg
  adult_mystic: (fill: string) => <path d="M50,10 C20,0 0,60 50,90 C100,60 80,0 50,10 Z" fill={fill} />, // Bentuk elemen/magic
};

// --- EYE LIBRARY (Menambahkan detail iris/pupil) ---
export const EyeSets = {
  default: () => <><circle cx="35" cy="50" r="5" /><circle cx="65" cy="50" r="5" /></>, // Contoh: mata bulat sederhana
  happy: () => <><path d="M 32,50 a 8,4 0 0,1 16,0" /><path d="M 52,50 a 8,4 0 0,1 16,0" /></>, // Mata menyipit bahagia
  fierce: () => <><path d="M 30,50 L 45,45 L 45,55 L 30,50 Z" /><path d="M 55,45 L 70,50 L 55,55 L 55,45 Z" /></>, // Mata Digimon yang agresif
  digital: () => <><rect x="30" y="47" width="10" height="6" rx="1" /><rect x="60" y="47" width="10" height="6" rx="1" /></>, // Mata pixel/digital
  glowing: (fill: string) => <><circle cx="35" cy="50" r="6" fill={fill} /><circle cx="65" cy="50" r="6" fill={fill} /></>, // Mata bercahaya
  sleepy: () => <><path d="M 30,55 Q 38,50 46,55" /><path d="M 54,55 Q 62,50 70,55" /></>,
};

// --- MOUTH LIBRARY (Menambahkan taring, gigi, paruh) ---
export const MouthSets = {
  neutral: () => <path d="M 45,70 L 55,70" />,
  smile: () => <path d="M 40,70 Q 50,78 60,70" />,
  snarl: () => <path d="M 40,75 C 45,70 55,70 60,75 L 55,70 L 45,70 Z" />, // Mulut menyeringai dengan gigi
  beak: () => <path d="M 45,70 L 50,65 L 55,70 Z" />, // Mulut paruh
  digital_line: () => <path d="M 40,72 L 60,72" strokeDasharray="3 2" />, // Mulut garis digital
  open_sharp: () => <path d="M 40,70 A 10,5 0 0,1 60,70 L 55,75 L 45,75 Z" />, // Mulut terbuka dengan gigi tajam
};

// --- HEAD SLOT ACCESSORY LIBRARY ---
export const HeadAccessories = {
  horns_demon: (stroke: string) => <path d="M 30,25 C 20,10 10,20 25,35 M 70,25 C 80,10 90,20 75,35" stroke={stroke} fill={defaultFill} strokeWidth={defaultStrokeWidth} strokeLinecap="round" />,
  ears_floppy: (stroke: string) => <path d="M 20,25 C 5,10 25,-5 35,20 M 80,25 C 95,10 75,-5 65,20" stroke={stroke} fill={defaultFill} strokeWidth={defaultStrokeWidth} strokeLinecap="round" />,
  antenna_tech: (stroke: string) => <path d="M 50,20 Q 55,10 52,5 M 52,5 a 3,3 0 1,1 -6,0 a 3,3 0 1,1 6,0" stroke={stroke} fill={defaultFill} strokeWidth={defaultStrokeWidth} strokeLinecap="round" />,
  crown_royal: (stroke: string) => <path d="M 30,20 L 40,10 L 50,20 L 60,10 L 70,20 L 65,30 L 35,30 Z" stroke={stroke} fill={stroke} strokeWidth="1" strokeLinejoin="round" />, // Mahkota dengan fill
  fin_crest: (stroke: string, fill: string) => <path d="M50,15 C40,5 30,10 35,25 Q50,20 65,25 C70,10 60,5 50,15 Z" stroke={stroke} fill={fill} strokeWidth={defaultStrokeWidth} />, // Sirip di kepala
  robot_ears: (stroke: string) => <path d="M25,30 L15,20 L25,10 L35,20 Z M75,30 L85,20 L75,10 L65,20 Z" stroke={stroke} fill={stroke} strokeWidth="1" />, // Telinga kotak robot
};

// --- BACK SLOT ACCESSORY LIBRARY (BARU!) ---
export const BackAccessories = {
  wings_small: (stroke: string, fill: string) => <path d="M 15,40 C 0,30 0,60 15,70 M 85,40 C 100,30 100,60 85,70" stroke={stroke} fill={fill} strokeWidth={defaultStrokeWidth} strokeLinecap="round" />,
  shell_spiky: (stroke: string, fill: string) => <path d="M 20,40 Q 50,30 80,40 Q 70,60 80,80 Q 50,70 20,80 Q 30,60 20,40 Z M 40,45 L 45,50 L 40,55 Z M 60,45 L 65,50 L 60,55 Z" stroke={stroke} fill={fill} strokeWidth={defaultStrokeWidth} />,
  jetpack: (stroke: string, fill: string) => <><rect x="35" y="40" width="30" height="20" rx="5" fill={fill} stroke={stroke} strokeWidth={defaultStrokeWidth} /><circle cx="45" cy="65" r="5" fill="#f00" /><circle cx="55" cy="65" r="5" fill="#f00" /></>,
  energy_aura: (color: string) => <circle cx="50" cy="50" r="45" fill={color} fillOpacity="0.1" />, // Efek aura
};

// --- TAIL SLOT ACCESSORY LIBRARY (BARU!) ---
export const TailAccessories = {
  tail_beast: (stroke: string) => <path d="M 50,90 Q 60,100 70,95 L 65,85 Q 55,80 50,90 Z" stroke={stroke} fill={stroke} strokeWidth={defaultStrokeWidth} strokeLinecap="round" />,
  tail_mech: (stroke: string) => <path d="M 50,90 L 55,95 L 50,100 L 45,95 L 50,90 Z" stroke={stroke} fill={stroke} strokeWidth={defaultStrokeWidth} strokeLinecap="square" />,
  tail_spiky: (stroke: string) => <path d="M 50,90 C 45,95 40,90 45,85 L 50,90 M 50,90 C 55,95 60,90 55,85 L 50,90" stroke={stroke} fill={defaultFill} strokeWidth={defaultStrokeWidth} strokeLinecap="round" />,
  tail_flame: (color: string) => <path d="M 50,90 Q 40,100 50,110 Q 60,100 50,90 Z" fill={color} fillOpacity="0.6" />,
};

// --- BODY PATTERN LIBRARY (Menambahkan pola yang lebih agresif/digital) ---
export const BodyPatterns = {
  speckle: (fill: string) => (
    <pattern id="speckle-pattern" patternUnits="userSpaceOnUse" width="10" height="10">
      <circle cx="2" cy="5" r="0.5" fill={fill} fillOpacity="0.3" />
      <circle cx="8" cy="8" r="0.5" fill={fill} fillOpacity="0.3" />
    </pattern>
  ),
  circuit: (fill: string) => (
    <pattern id="circuit-pattern" patternUnits="userSpaceOnUse" width="15" height="15">
      <path d="M0,0 L7.5,7.5 L0,15 M7.5,0 L15,7.5 L7.5,15" stroke={fill} strokeOpacity="0.4" strokeWidth="0.5" />
    </pattern>
  ),
  scales: (fill: string) => (
    <pattern id="scales-pattern" patternUnits="userSpaceOnUse" width="12" height="10">
      <path d="M0,0 L6,5 L0,10 Z M6,0 L12,5 L6,10 Z" fill={fill} fillOpacity="0.2" />
    </pattern>
  ),
};
