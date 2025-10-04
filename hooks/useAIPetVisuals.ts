// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.
// file: hooks/useAIPetVisuals.ts

import React from 'react';
import type { AIPetState } from '../types';
import {
  BodyShapes, EyeSets, MouthSets, HeadAccessories,
  BackAccessories, TailAccessories, SVGDefs
} from '../components/AIPetParts';

// Tentukan tipe Archetype
type Archetype = 'Beast' | 'Machine' | 'Mystic' | 'Chibi';

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

    // Fallback berdasarkan dominant personality
    switch (dominant) {
      case 'bold': case 'rustic': return 'Beast';
      case 'modern': case 'minimalist': return 'Machine';
      case 'creative': case 'luxury': case 'feminine': return 'Mystic';
      default: return 'Chibi'; // 'playful' atau default
    }
  };
  
  const archetype = getArchetype();

  // --- 2. Tentukan Warna ---
  const charismaFactor = stats.charisma / 100;
  const energyFactor = stats.energy / 100;
  
  // Penentuan HUE berdasarkan Archetype untuk tema warna yang lebih kuat
  let baseHue: number;
  switch(archetype) {
    case 'Beast': baseHue = 0; break; // Merah/Oranye
    case 'Machine': baseHue = 180; break; // Cyan/Biru
    case 'Mystic': baseHue = 270; break; // Ungu/Pink
    default: baseHue = 120; // Hijau (Chibi)
  }
  const hue = baseHue + (charismaFactor * 60);
  const saturation = 60 + (energyFactor * 40);
  const lightness = 40 + (energyFactor * 20);

  const bodyFill = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const accentColor = `hsl(${(hue + 180) % 360}, ${saturation}%, ${lightness + (lightness > 50 ? -20 : 20)}%)`; // Warna komplementer

  // --- 3. Rakit AIPet Berdasarkan Archetype dan Stage ---
  let SelectedBody, SelectedEyes, SelectedMouth;
  let SelectedHeadAccessory, SelectedBackAccessory, SelectedTailAccessory;

  if (stage === 'egg') {
    SelectedBody = BodyShapes.egg(bodyFill);
    SelectedEyes = () => null;
    SelectedMouth = () => null;
  } else {
    // Evolusi berdasarkan Archetype
    switch (archetype) {
      case 'Beast':
        if (stage === 'child') {
          SelectedBody = BodyShapes.child_beast(bodyFill);
          SelectedEyes = EyeSets.default();
          SelectedMouth = MouthSets.neutral();
          SelectedHeadAccessory = HeadAccessories.ears_wolf(accentColor, 'none');
          SelectedTailAccessory = TailAccessories.tail_lizard(accentColor, 'none');
        } else if (stage === 'teen') {
          SelectedBody = BodyShapes.teen_beast(bodyFill);
          SelectedEyes = EyeSets.fierce_beast(accentColor);
          SelectedMouth = MouthSets.fangs_beast();
          SelectedHeadAccessory = HeadAccessories.horns_ram(accentColor);
          SelectedBackAccessory = BackAccessories.spikes_dorsal(accentColor, bodyFill);
          SelectedTailAccessory = TailAccessories.tail_lizard(accentColor, 'none');
        } else { // Adult
          SelectedBody = BodyShapes.adult_beast(bodyFill);
          SelectedEyes = EyeSets.fierce_beast(accentColor);
          SelectedMouth = MouthSets.fangs_beast();
          SelectedHeadAccessory = HeadAccessories.horns_ram(accentColor);
          SelectedBackAccessory = BackAccessories.wings_bat(accentColor, bodyFill);
          SelectedTailAccessory = TailAccessories.tail_furry(accentColor, bodyFill);
        }
        break;

      case 'Machine':
        if (stage === 'child') {
          SelectedBody = BodyShapes.child_machine(bodyFill);
          SelectedEyes = EyeSets.visor_machine(accentColor);
          SelectedMouth = MouthSets.grill_machine();
          SelectedHeadAccessory = HeadAccessories.antenna_single(accentColor);
        } else if (stage === 'teen') {
          SelectedBody = BodyShapes.teen_machine(bodyFill);
          SelectedEyes = EyeSets.visor_machine(accentColor);
          SelectedMouth = MouthSets.grill_machine();
          SelectedHeadAccessory = HeadAccessories.vents_side(accentColor);
          SelectedTailAccessory = TailAccessories.tail_thruster(accentColor, bodyFill);
        } else { // Adult
          SelectedBody = BodyShapes.adult_machine(bodyFill);
          SelectedEyes = EyeSets.visor_machine(accentColor);
          SelectedMouth = MouthSets.grill_machine();
          SelectedBackAccessory = BackAccessories.jetpack_dual(accentColor, bodyFill);
          SelectedHeadAccessory = BackAccessories.cannon_shoulder(accentColor, bodyFill); // Gunakan slot punggung untuk bahu
          SelectedTailAccessory = TailAccessories.tail_cable(accentColor);
        }
        break;

      case 'Mystic':
        if (stage === 'child') {
          SelectedBody = BodyShapes.child_mystic(bodyFill);
          SelectedEyes = EyeSets.glowing_mystic(accentColor);
          SelectedMouth = MouthSets.serene_mystic();
        } else if (stage === 'teen') {
          SelectedBody = BodyShapes.teen_mystic(bodyFill);
          SelectedEyes = EyeSets.glowing_mystic(accentColor);
          SelectedMouth = MouthSets.serene_mystic();
          SelectedHeadAccessory = HeadAccessories.crest_elemental(accentColor);
          SelectedTailAccessory = TailAccessories.tail_wisp(accentColor);
        } else { // Adult
          SelectedBody = BodyShapes.adult_mystic(bodyFill);
          SelectedEyes = EyeSets.glowing_mystic(accentColor);
          SelectedMouth = MouthSets.serene_mystic();
          SelectedHeadAccessory = HeadAccessories.halo_divine(accentColor);
          SelectedBackAccessory = BackAccessories.wings_angelic(accentColor, 'none');
          SelectedTailAccessory = TailAccessories.tail_crystal(accentColor, bodyFill);
        }
        break;

      default: // Chibi (fallback)
        SelectedBody = BodyShapes.child_chibi(bodyFill);
        SelectedEyes = EyeSets.happy();
        SelectedMouth = MouthSets.smile();
        break;
    }
  }

  // Defs diperlukan untuk efek seperti glow
  const SelectedPattern = SVGDefs.glow(accentColor); // Menggunakan slot Pattern untuk Defs

  return {
    SelectedBody,
    SelectedEyes: SelectedEyes || (() => null),
    SelectedMouth: SelectedMouth || (() => null),
    SelectedHeadAccessory,
    SelectedBackAccessory,
    SelectedTailAccessory,
    SelectedPattern, // Ini sebenarnya adalah <defs>
    bodyFill,
    accentColor
  };
};
