// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useMemo } from 'react';
import type { AIPetState, AIPetPersonalityVector, AIPetStage } from '../types';
import AIPetVisual from './AIPetVisual';

interface Props {
  show: boolean;
  onClose: () => void;
}

type Archetype = 'Beast' | 'Machine' | 'Mystic' | 'Chibi' | 'Auto';

const personalityKeys: (keyof AIPetPersonalityVector)[] = ['minimalist', 'rustic', 'playful', 'modern', 'luxury', 'feminine', 'bold', 'creative'];
const statKeys: (keyof AIPetState['stats'])[] = ['energy', 'creativity', 'intelligence', 'charisma'];

const getDerivedArchetype = (personality: AIPetPersonalityVector): Exclude<Archetype, 'Auto'> => {
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


const AIPetVisualizerModal: React.FC<Props> = ({ show, onClose }) => {
  const [stage, setStage] = useState<AIPetStage>('child');
  const [forcedArchetype, setForcedArchetype] = useState<Archetype>('Auto');
  const [personality, setPersonality] = useState<AIPetPersonalityVector>({ minimalist: 5, rustic: 5, playful: 5, modern: 5, luxury: 5, feminine: 5, bold: 5, creative: 5 });
  const [stats, setStats] = useState<AIPetState['stats']>({ energy: 100, creativity: 50, intelligence: 50, charisma: 50 });

  const derivedArchetype = useMemo(() => getDerivedArchetype(personality), [personality]);

  const previewState: AIPetState = useMemo(() => {
    let finalPersonality = { ...personality };
    if (forcedArchetype !== 'Auto') {
        // Override personality to guarantee the chosen archetype
        finalPersonality = { minimalist: 0, rustic: 0, playful: 0, modern: 0, luxury: 0, feminine: 0, bold: 0, creative: 0 };
        if (forcedArchetype === 'Beast') finalPersonality.bold = 10;
        else if (forcedArchetype === 'Machine') finalPersonality.modern = 10;
        else if (forcedArchetype === 'Mystic') finalPersonality.creative = 10;
        else finalPersonality.playful = 10; // Chibi
    }

    return {
      name: 'Preview Pet',
      stage,
      personality: finalPersonality,
      stats,
      lastFed: Date.now(),
      lastPlayed: Date.now(),
    };
  }, [stage, forcedArchetype, personality, stats]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-stretch z-50 p-4 animate-content-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-w-4xl w-full m-auto bg-surface rounded-2xl shadow-xl flex flex-col md:flex-row h-[90vh]" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} title="Tutup" className="absolute top-3 right-3 z-20 p-2 text-text-muted rounded-full hover:bg-background hover:text-text-header transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0-0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        {/* Kontrol Panel */}
        <aside className="w-full md:w-80 flex-shrink-0 p-4 border-b md:border-b-0 md:border-r border-border-main overflow-y-auto">
          <h2 className="text-xl font-bold text-primary mb-4">AIPet Visualizer</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <label className="font-semibold text-text-header">Tahap Evolusi</label>
              <select value={stage} onChange={e => setStage(e.target.value as AIPetStage)} className="w-full mt-1 p-2 bg-background border border-border-main rounded-md">
                <option value="egg">Egg</option>
                <option value="child">Child</option>
                <option value="teen">Teen</option>
                <option value="adult">Adult</option>
              </select>
            </div>
             <div>
              <label className="font-semibold text-text-header">Paksa Archetype</label>
              <select value={forcedArchetype} onChange={e => setForcedArchetype(e.target.value as Archetype)} className="w-full mt-1 p-2 bg-background border border-border-main rounded-md">
                <option value="Auto">Otomatis dari Kepribadian</option>
                <option value="Beast">Beast</option>
                <option value="Machine">Machine</option>
                <option value="Mystic">Mystic</option>
                <option value="Chibi">Chibi</option>
              </select>
            </div>
            
            <div className="pt-2 border-t border-border-main">
                <h3 className="font-semibold text-text-header mb-2">Kepribadian (Archetype: <span className="text-splash">{derivedArchetype}</span>)</h3>
                 {personalityKeys.map(key => (
                    <div key={key}>
                        <label className="flex justify-between text-xs text-text-muted capitalize"><span>{key}</span><span>{personality[key]}</span></label>
                        <input type="range" min="0" max="10" value={personality[key]} onChange={e => setPersonality(p => ({...p, [key]: +e.target.value}))} className="w-full" disabled={forcedArchetype !== 'Auto'}/>
                    </div>
                ))}
            </div>

            <div className="pt-2 border-t border-border-main">
                <h3 className="font-semibold text-text-header mb-2">Statistik (Warna & Efek)</h3>
                 {statKeys.map(key => (
                    <div key={key}>
                        <label className="flex justify-between text-xs text-text-muted capitalize"><span>{key}</span><span>{stats[key]}</span></label>
                        <input type="range" min="0" max="100" value={stats[key]} onChange={e => setStats(s => ({...s, [key]: +e.target.value}))} className="w-full"/>
                    </div>
                ))}
            </div>
          </div>
        </aside>
        
        {/* Display Area */}
        <main className="flex-grow flex items-center justify-center p-4 bg-background/50 rounded-b-2xl md:rounded-b-none md:rounded-r-2xl">
            <div className="w-full h-full max-w-[500px] max-h-[500px]">
                <AIPetVisual petState={previewState} />
            </div>
        </main>
      </div>
    </div>
  );
};

export default AIPetVisualizerModal;
