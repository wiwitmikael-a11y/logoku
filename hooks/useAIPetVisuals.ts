// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.
// file: hooks/useAIPetVisuals.ts

import React from 'react';
import type { AIPetState } from '../types';
import {
  BodyShapes, EyeSets, MouthSets, HeadAccessories,
  BackAccessories, TailAccessories, BodyPatterns
} from '../components/AIPetParts';

export const useAIPetVisuals = (petState: AIPetState) => {
  const { stats, personality, stage } = petState;

  const dominantPersonality = Object.entries(personality).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0])[0];

  // --- Tentukan Warna Tubuh ---
  const charismaFactor = stats.charisma / 100;
  const energyFactor = stats.energy / 100;
  const hue = 120 + (charismaFactor * 180); // Dari hijau ke ungu/merah
  const saturation = 50 + (energyFactor * 40);
  const lightness = 45 + (energyFactor * 10);
  const bodyFill = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const accentColor = `hsl(${hue + 30}, ${saturation + 10}%, ${lightness - 10}%)`; // Warna aksen lebih gelap/beda hue

  // --- 1. Pilih Base Body ---
  let SelectedBody;
  if (stage === 'egg') {
    SelectedBody = BodyShapes.egg(bodyFill);
  } else if (stage === 'child') {
    SelectedBody = dominantPersonality === 'bold' || dominantPersonality === 'rustic'
      ? BodyShapes.child_beast(bodyFill)
      : BodyShapes.child_chibi(bodyFill);
  } else if (stage === 'teen') {
    SelectedBody = dominantPersonality === 'modern' || dominantPersonality === 'minimalist'
      ? BodyShapes.teen_mech(bodyFill)
      : BodyShapes.teen_humanoid(bodyFill);
  } else { // Adult
    switch (dominantPersonality) {
      case 'modern':
      case 'minimalist':
        SelectedBody = BodyShapes.adult_cyborg(bodyFill);
        break;
      case 'feminine':
      case 'playful':
        SelectedBody = BodyShapes.adult_guardian(bodyFill); // Lebih 'lembut' tapi kuat
        break;
      case 'bold':
      case 'rustic':
        SelectedBody = BodyShapes.adult_feral(bodyFill);
        break;
      case 'luxury':
      case 'creative':
        SelectedBody = BodyShapes.adult_mystic(bodyFill);
        break;
      default:
        SelectedBody = BodyShapes.adult_guardian(bodyFill);
    }
  }

  // --- 2. Pilih Mata & Mulut (Ekspresi) ---
  let SelectedEyes = EyeSets.default();
  let SelectedMouth = MouthSets.neutral();

  // Logika ekspresi yang lebih kaya
  if (stats.energy < 30) {
    SelectedEyes = EyeSets.sleepy();
  } else if (stats.creativity > 80) {
    SelectedEyes = EyeSets.happy();
    SelectedMouth = MouthSets.smile();
  } else if (stats.intelligence > 75) {
    SelectedEyes = EyeSets.glowing(accentColor); // Mata bercahaya untuk intelijen tinggi
    SelectedMouth = MouthSets.digital_line();
  } else if (dominantPersonality === 'playful') {
    SelectedEyes = EyeSets.happy();
    SelectedMouth = MouthSets.smile();
  } else if (dominantPersonality === 'bold') {
    SelectedEyes = EyeSets.fierce();
    SelectedMouth = MouthSets.snarl();
  } else if (dominantPersonality === 'modern') {
    SelectedEyes = EyeSets.digital();
    SelectedMouth = MouthSets.digital_line();
  } else if (dominantPersonality === 'rustic') {
    SelectedEyes = EyeSets.fierce();
    SelectedMouth = MouthSets.open_sharp();
  }

  // --- 3. Pilih Aksesoris Kepala ---
  let SelectedHeadAccessory = null;
  if (stage === 'adult' || stage === 'teen') { // Aksesoris mulai muncul di Teen
    if (dominantPersonality === 'bold' || dominantPersonality === 'rustic') SelectedHeadAccessory = HeadAccessories.horns_demon(accentColor);
    else if (dominantPersonality === 'feminine' || dominantPersonality === 'playful') SelectedHeadAccessory = HeadAccessories.ears_floppy(accentColor);
    else if (dominantPersonality === 'modern' || stats.intelligence > 80) SelectedHeadAccessory = HeadAccessories.antenna_tech(accentColor);
    else if (dominantPersonality === 'luxury') SelectedHeadAccessory = HeadAccessories.crown_royal(accentColor);
    else if (dominantPersonality === 'creative') SelectedHeadAccessory = HeadAccessories.fin_crest(accentColor, bodyFill);
  }

  // --- 4. Pilih Aksesoris Punggung ---
  let SelectedBackAccessory = null;
  if (stage === 'adult' && (dominantPersonality === 'bold' || dominantPersonality === 'playful' || dominantPersonality === 'modern')) {
    if (dominantPersonality === 'bold') SelectedBackAccessory = BackAccessories.shell_spiky(accentColor, bodyFill);
    else if (dominantPersonality === 'playful') SelectedBackAccessory = BackAccessories.wings_small(accentColor, bodyFill);
    else if (dominantPersonality === 'modern' || stats.intelligence > 85) SelectedBackAccessory = BackAccessories.jetpack(accentColor, bodyFill);
  } else if (stage === 'adult' && stats.energy > 90) { // Aura energi untuk pet berenergi tinggi
    SelectedBackAccessory = BackAccessories.energy_aura(accentColor);
  }

  // --- 5. Pilih Aksesoris Ekor ---
  let SelectedTailAccessory = null;
  if (stage === 'adult' || stage === 'teen') {
    if (dominantPersonality === 'bold' || dominantPersonality === 'rustic') SelectedTailAccessory = TailAccessories.tail_beast(accentColor);
    else if (dominantPersonality === 'modern' || stats.intelligence > 70) SelectedTailAccessory = TailAccessories.tail_mech(accentColor);
    else if (dominantPersonality === 'creative') SelectedTailAccessory = TailAccessories.tail_flame(accentColor);
  }

  // --- 6. Pilih Pola Tubuh ---
  let SelectedPattern = null;
  if (stage === 'egg') {
    SelectedPattern = BodyPatterns.speckle(bodyFill);
  } else if (dominantPersonality === 'modern' || stats.intelligence > 90) {
    SelectedPattern = BodyPatterns.circuit(accentColor);
  } else if (dominantPersonality === 'rustic' || dominantPersonality === 'bold') {
    SelectedPattern = BodyPatterns.scales(accentColor);
  }

  return {
    SelectedBody,
    SelectedEyes,
    SelectedMouth,
    SelectedHeadAccessory,
    SelectedBackAccessory, // Baru
    SelectedTailAccessory, // Baru
    SelectedPattern,
    bodyFill,
    accentColor
  };
};
