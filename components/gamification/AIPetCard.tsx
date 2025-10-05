// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import type { AIPetState, AIPetPersonalityVector } from '../../types';
import AIPetVisual from '../AIPetVisual';

interface AIPetCardProps {
    petState: AIPetState;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div className="grid grid-cols-3 items-center gap-1 text-xs">
        <span className="font-semibold text-yellow-200/80 col-span-1">{label}</span>
        <div className="w-full bg-black/50 rounded-full h-2 col-span-2 border border-white/10">
            <div className={`h-full rounded-full`} style={{ width: `${value}%`, backgroundColor: color }}></div>
        </div>
    </div>
);


const AIPetCard: React.FC<AIPetCardProps> = ({ petState }) => {
    if (petState.stage === 'aipod' || !petState.blueprint) {
        return <p className="text-sm text-text-muted italic">AIPet belum diaktifkan.</p>;
    }

    const cardShineAnimation = `
        @keyframes card-shine {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        .animate-card-shine::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.25) 50%, transparent 70%);
            background-size: 250% 100%;
            animation: card-shine 5s linear infinite;
            z-index: 1;
        }
    `;
    
    const getArchetypeAndTheme = () => {
        const p = petState.personality;
        const sorted = Object.entries(p).sort(([, a], [, b]) => Number(b) - Number(a));
        const dominant: keyof AIPetPersonalityVector = sorted.length > 0 ? sorted[0][0] as keyof AIPetPersonalityVector : 'playful';

        let theme;
        switch(dominant) {
            case 'bold': case 'rustic': theme = { bg: 'from-amber-800 via-stone-700 to-black', border: 'border-amber-500' }; break;
            case 'modern': case 'minimalist': theme = { bg: 'from-sky-800 via-slate-700 to-black', border: 'border-sky-400' }; break;
            case 'creative': case 'feminine': theme = { bg: 'from-purple-800 via-fuchsia-900 to-black', border: 'border-purple-400' }; break;
            case 'playful': theme = { bg: 'from-emerald-700 via-teal-800 to-black', border: 'border-emerald-400' }; break;
            default: theme = { bg: 'from-gray-700 via-gray-800 to-black', border: 'border-yellow-400' };
        }
        return { dominant, theme };
    }
    const { dominant: dominantPersonality, theme } = getArchetypeAndTheme();
    const petId = petState.name.split('-')[1] || '0000';


    return (
        <div className="w-full mx-auto">
            <style>{cardShineAnimation}</style>
            <div className={`relative aspect-[63/88] bg-gradient-to-br ${theme.bg} ${theme.border} border-4 rounded-2xl shadow-2xl shadow-black/50 p-1.5`}>
                <div className="relative w-full h-full bg-gray-900/50 border-2 border-gray-500 rounded-lg flex flex-col overflow-hidden">
                    
                    {/* Card Content */}
                    <div className="flex flex-col flex-grow h-full z-0">
                        {/* Header */}
                        <div className="flex justify-between items-center p-2 mx-1 border-b-2 border-yellow-600 flex-shrink-0">
                            <h3 className="font-bold text-lg text-white" style={{fontFamily: 'var(--font-display)', letterSpacing: '0.05em'}}>{petState.name}</h3>
                            <div className="text-xs font-semibold bg-yellow-400 text-black px-2 py-0.5 rounded-full capitalize">{petState.tier}</div>
                        </div>

                        {/* Image */}
                        <div className="relative mx-1.5 my-1.5 border-4 border-yellow-700 rounded-md shadow-inner shadow-black/50 animate-card-shine">
                            <div className="absolute inset-0 bg-background" style={{ backgroundImage: 'radial-gradient(circle, rgb(var(--c-border)) 0%, transparent 70%)' }}></div>
                             <div className="relative w-full h-full aspect-square">
                                <AIPetVisual petState={petState} />
                             </div>
                        </div>

                        {/* Info Box */}
                        <div className="mx-1.5 mb-1 p-2 border-2 border-yellow-700 bg-black/30 rounded-md flex-grow flex flex-col justify-around">
                            {/* Personality Stats */}
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                <StatBar label="ENR" value={petState.stats.energy} color="#22c55e" />
                                <StatBar label="CRT" value={petState.stats.creativity} color="#38bdf8" />
                                <StatBar label="INT" value={petState.stats.intelligence} color="#c026d3" />
                                <StatBar label="CHA" value={petState.stats.charisma} color="#facc15" />
                            </div>

                            {/* Battle Stats */}
                            <div className="border-t-2 border-yellow-700/50 mt-2 pt-1.5 space-y-1">
                                {petState.battleStats ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-x-2 text-xs font-semibold text-center text-yellow-100/90">
                                            <span>HP: <span className="font-bold text-base">{petState.battleStats.hp}</span></span>
                                            <span>ATK: <span className="font-bold text-base">{petState.battleStats.atk}</span></span>
                                            <span>DEF: <span className="font-bold text-base">{petState.battleStats.def}</span></span>
                                            <span>SPD: <span className="font-bold text-base">{petState.battleStats.spd}</span></span>
                                        </div>
                                        {petState.buffs && petState.buffs.length > 0 && (
                                            <div className="text-center text-[9px] font-bold text-sky-300 bg-sky-900/50 rounded-sm py-0.5">
                                                {petState.buffs.join(', ')}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                     <div className="text-center text-xs text-yellow-100/80 italic">Statistik battle belum ada.</div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-auto px-2 pb-1 flex justify-between items-center text-[9px] font-mono text-yellow-200/60 flex-shrink-0">
                            <p>ID: APH-{petId}</p>
                            <p>{dominantPersonality.toUpperCase()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIPetCard;