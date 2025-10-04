// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.
// file: hooks/useAIPetVisuals.ts

import React from 'react';
import type { AIPetState } from '../types';
import {
  BodyShapes, EyeSets, MouthSets, HeadAccessories,
  BackAccessories, TailAccessories, SVGDefs
} from '../components/AIPetParts';

type Archetype = 'Beast' | 'Machine' | 'Mystic' | 'Chibi';
type AnchorPoint = { x: number; y: number };
type BodyAnchorMap = { [bodyName: string]: { head: AnchorPoint; back: AnchorPoint; tail: AnchorPoint; head_side: AnchorPoint } };

// --- Definisi "Soket" atau Anchor Point untuk Setiap Bentuk Tubuh ---
const BodyAnchors: BodyAnchorMap = {
  // Chibi & Beast
  child_chibi:   { head: {x: 50, y: 28}, back: {x: 50, y: 50}, tail: {x: 50, y: 92}, head_side: {x: 50, y: 35} },
  child_beast:   { head: {x: 50, y: 35}, back: {x: 50, y: 60}, tail: {x: 50, y: 90}, head_side: {x: 50, y: 40} },
  teen_beast:    { head: {x: 50, y: 22}, back: {x: 50, y: 55}, tail: {x: 50, y: 95}, head_side: {x: 50, y: 30} },
  adult_beast:   { head: {x: 50, y: 15}, back: {x: 50, y: 50}, tail: {x: 50, y: 98}, head_side: {x: 50, y: 25} },
  // Machine
  child_machine: { head: {x: 50, y: 30}, back: {x: 50, y: 50}, tail: {x: 50, y: 72}, head_side: {x: 50, y: 40} },
  teen_machine:  { head: {x: 50, y: 20}, back: {x: 50, y: 50}, tail: {x: 50, y: 85}, head_side: {x: 50, y: 30} },
  adult_machine: { head: {x: 50, y: 12}, back: {x: 50, y: 45}, tail: {x: 50, y: 90}, head_side: {x: 50, y: 25} },
  // Mystic
  child_mystic:  { head: {x: 50, y: 30}, back: {x: 50, y: 55}, tail: {x: 50, y: 85}, head_side: {x: 50, y: 35} },
  teen_mystic:   { head: {x: 50, y: 22}, back: {x: 50, y: 55}, tail: {x: 50, y: 95}, head_side: {x: 50, y: 30} },
  adult_mystic:  { head: {x: 50, y: 12}, back: {x: 50, y: 50}, tail: {x: 50, y: 100}, head_side: {x: 50, y: 20} },
};

export const useAIPetVisuals = (petState: AIPetState) => {
  const { stats, personality, stage } = petState;

  // --- 1. Tentukan Archetype (Jalur Evolusi) ---
  const getArchetype = (): Archetype => {
    const p = personality;
    const sorted = Object.entries(p).sort(([, a], [, b]) => b - a);
    const dominant = sorted[0][0];
    const secondary = sorted[1][0];

    if (p.bold > 7 || p.rustic > 7 || (dominant === 'bold' && secondary === 'rustic')) return 'Beast';
    if (p.modern > 7 || p.minimalist > 7 || (dominant === 'modern' && secondary === 'minimalist')) return 'Machine';
    if (p.creative > 7 || p.luxury > 7 || (dominant === 'creative' && secondary === 'feminine')) return 'Mystic';
    
    switch (dominant) {
      case 'bold': case 'rustic': return 'Beast';
      case 'modern': case 'minimalist': return 'Machine';
      case 'creative': case 'luxury': case 'feminine': return 'Mystic';
      default: return 'Chibi';
    }
  };
  
  const archetype = getArchetype();

  // --- 2. Tentukan Warna ---
  const charismaFactor = stats.charisma / 100;
  const energyFactor = stats.energy / 100;
  
  let baseHue: number;
  switch(archetype) {
    case 'Beast': baseHue = 0; break;
    case 'Machine': baseHue = 180; break;
    case 'Mystic': baseHue = 270; break;
    default: baseHue = 120;
  }
  const hue = baseHue + (charismaFactor * 60);
  const saturation = 60 + (energyFactor * 40);
  const lightness = 40 + (energyFactor * 20);

  const bodyFill = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const accentColor = `hsl(${(hue + 180) % 360}, ${saturation}%, ${lightness + (lightness > 50 ? -20 : 20)}%)`;

  // --- 3. Rakit AIPet Berdasarkan Archetype, Stage, dan Anchor Points ---
  let SelectedBody: React.ReactElement, bodyKey: keyof typeof BodyShapes;
  let SelectedEyes, SelectedMouth;
  let SelectedHeadAccessory, SelectedBackAccessory, SelectedTailAccessory;

  if (stage === 'egg') {
    SelectedBody = BodyShapes.egg(bodyFill);
    bodyKey = 'egg'; // Not in anchors, but needed for key
  } else {
    // Evolusi berdasarkan Archetype
    switch (archetype) {
      case 'Beast':
        if (stage === 'child') {
          bodyKey = 'child_beast';
          SelectedEyes = EyeSets.default();
          SelectedMouth = MouthSets.neutral();
          SelectedHeadAccessory = HeadAccessories.ears_wolf(accentColor, 'none', BodyAnchors[bodyKey].head_side);
          SelectedTailAccessory = TailAccessories.tail_lizard(accentColor, BodyAnchors[bodyKey].tail);
        } else if (stage === 'teen') {
          bodyKey = 'teen_beast';
          SelectedEyes = EyeSets.fierce_beast(accentColor);
          SelectedMouth = MouthSets.fangs_beast();
          SelectedHeadAccessory = HeadAccessories.horns_ram(accentColor, BodyAnchors[bodyKey].head);
          SelectedBackAccessory = BackAccessories.spikes_dorsal(accentColor, bodyFill, BodyAnchors[bodyKey].back);
          SelectedTailAccessory = TailAccessories.tail_lizard(accentColor, BodyAnchors[bodyKey].tail);
        } else { // Adult
          bodyKey = 'adult_beast';
          SelectedEyes = EyeSets.fierce_beast(accentColor);
          SelectedMouth = MouthSets.fangs_beast();
          SelectedHeadAccessory = HeadAccessories.horns_ram(accentColor, BodyAnchors[bodyKey].head);
          SelectedBackAccessory = BackAccessories.wings_bat(accentColor, 'rgba(0,0,0,0.2)', BodyAnchors[bodyKey].back);
          SelectedTailAccessory = TailAccessories.tail_furry(accentColor, bodyFill, BodyAnchors[bodyKey].tail);
        }
        break;

      case 'Machine':
        if (stage === 'child') {
          bodyKey = 'child_machine';
          SelectedEyes = EyeSets.visor_machine(accentColor);
          SelectedMouth = MouthSets.grill_machine();
          SelectedHeadAccessory = HeadAccessories.antenna_single(accentColor, BodyAnchors[bodyKey].head);
        } else if (stage === 'teen') {
          bodyKey = 'teen_machine';
          SelectedEyes = EyeSets.visor_machine(accentColor);
          SelectedMouth = MouthSets.grill_machine();
          SelectedHeadAccessory = HeadAccessories.vents_side(accentColor, BodyAnchors[bodyKey].head_side);
          SelectedTailAccessory = TailAccessories.tail_thruster(accentColor, bodyFill, BodyAnchors[bodyKey].tail);
        } else { // Adult
          bodyKey = 'adult_machine';
          SelectedEyes = EyeSets.visor_machine(accentColor);
          SelectedMouth = MouthSets.grill_machine();
          SelectedBackAccessory = BackAccessories.jetpack_dual(accentColor, bodyFill, BodyAnchors[bodyKey].back);
          SelectedHeadAccessory = BackAccessories.cannon_shoulder(accentColor, bodyFill, BodyAnchors[bodyKey].back);
          SelectedTailAccessory = TailAccessories.tail_cable(accentColor, BodyAnchors[bodyKey].tail);
        }
        break;

      case 'Mystic':
        if (stage === 'child') {
          bodyKey = 'child_mystic';
          SelectedEyes = EyeSets.glowing_mystic(accentColor);
          SelectedMouth = MouthSets.serene_mystic();
          SelectedHeadAccessory = HeadAccessories.crest_elemental(accentColor, BodyAnchors[bodyKey].head);
        } else if (stage === 'teen') {
          bodyKey = 'teen_mystic';
          SelectedEyes = EyeSets.glowing_mystic(accentColor);
          SelectedMouth = MouthSets.serene_mystic();
          SelectedHeadAccessory = HeadAccessories.crest_elemental(accentColor, BodyAnchors[bodyKey].head);
          SelectedTailAccessory = TailAccessories.tail_wisp(accentColor, BodyAnchors[bodyKey].tail);
        } else { // Adult
          bodyKey = 'adult_mystic';
          SelectedEyes = EyeSets.glowing_mystic(accentColor);
          SelectedMouth = MouthSets.serene_mystic();
          SelectedHeadAccessory = HeadAccessories.halo_divine(accentColor, BodyAnchors[bodyKey].head);
          SelectedBackAccessory = BackAccessories.wings_angelic(accentColor, 'none', BodyAnchors[bodyKey].back);
          SelectedTailAccessory = TailAccessories.tail_crystal(accentColor, bodyFill, BodyAnchors[bodyKey].tail);
        }
        break;

      default: // Chibi (fallback)
        bodyKey = 'child_chibi';
        SelectedEyes = EyeSets.happy();
        SelectedMouth = MouthSets.smile();
        break;
    }
    SelectedBody = BodyShapes[bodyKey](bodyFill);
  }

  // Defs diperlukan untuk efek seperti glow
  const SelectedPattern = SVGDefs.glow(accentColor);

  return {
    SelectedBody,
    SelectedEyes: SelectedEyes || (() => null),
    SelectedMouth: SelectedMouth || (() => null),
    SelectedHeadAccessory,
    SelectedBackAccessory,
    SelectedTailAccessory,
    SelectedPattern,
    bodyFill,
    accentColor
  };
};
