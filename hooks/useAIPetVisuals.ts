// hooks/useAIPetVisuals.ts
import React, { useMemo } from "react";
import { BodyShapes, Eyes, Mouths, Accessories } from "../components/AIPetParts";
import type { AIPetState } from '../types';

type Archetype = "beast" | "machine" | "mystic" | "blob";

const getArchetypeFromPersonality = (personality: AIPetState['personality']): Archetype => {
    const p = personality;
    const sorted = Object.entries(p).sort(([, a], [, b]) => b - a);
    const dominant = sorted.length > 0 ? sorted[0][0] : 'playful';

    switch (dominant) {
      case 'bold':
      case 'rustic':
        return 'beast';
      case 'modern':
      case 'minimalist':
        return 'machine';
      case 'creative':
      case 'luxury':
      case 'feminine':
        return 'mystic';
      default: // 'playful' and others
        return 'blob';
    }
}


export const useAIPetVisuals = (pet: AIPetState) => {
  return useMemo(() => {
    // Handle egg stage separately
    if (pet.stage === 'aipod') {
      const hue = (Date.now() / 10000) % 360; // slow color cycle for egg
      const bodyColor = `hsl(${hue}, 60%, 70%)`;
      const Body = BodyShapes.blob; // Use blob shape for egg
      return {
        Render: () => (
          React.createElement("svg", { width: "120", height: "120", viewBox: "0 0 120 120" },
            React.createElement("g", { transform: "translate(10, 5) scale(0.9)" },
              Body(bodyColor),
              React.createElement("circle", { cx: "50", cy: "40", r: "5", fill: `hsl(${hue + 30}, 60%, 65%)` }),
              React.createElement("circle", { cx: "70", cy: "65", r: "8", fill: `hsl(${hue + 30}, 60%, 65%)` }),
              React.createElement("circle", { cx: "35", cy: "75", r: "6", fill: `hsl(${hue - 30}, 60%, 65%)` })
            )
          )
        ),
      };
    }

    // Archetype simplifikasi dari personality vector
    const archetype: Archetype = getArchetypeFromPersonality(pet.personality);

    // Warna berdasarkan charisma & energy, adapted for 0-100 scale
    const hue = Math.round((pet.stats.charisma * 3.6) % 360);
    const saturation = 60 + (pet.stats.energy / 100) * 20; // 60-80% range
    const lightness = 55;
    const bodyColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const accentColor = `hsl(${(hue + 180) % 360}, 70%, 50%)`;

    // Pilih body shape
    const Body = BodyShapes[archetype] || BodyShapes.blob;

    // Pilih eyes/mouth secara deterministik, bukan random
    const nameHash = pet.name.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const Eye = (nameHash % 2 === 0) ? Eyes.round : Eyes.fierce;
    const Mouth = ((nameHash >> 1) % 2 === 0) ? Mouths.smile : Mouths.fang;

    // Accessories sesuai archetype
    const Accessory =
      archetype === "beast" ? Accessories.horn :
      archetype === "mystic" ? Accessories.wing :
      archetype === "machine" ? Accessories.tail : undefined;

    return {
      archetype,
      stage: pet.stage,
      bodyColor,
      accentColor,
      Render: () => (
        React.createElement("svg", { width: "120", height: "120", viewBox: "0 0 120 120" },
          React.createElement("g", null,
            Body(bodyColor),
            Accessory && Accessory(accentColor),
            Eye(accentColor),
            Mouth()
          )
        )
      ),
    };
  }, [pet]);
};