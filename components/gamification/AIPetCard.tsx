// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import type { AIPetState, AIPetPersonalityVector, AIPetTier } from '../../types';
import AIPetVisual from '../AIPetVisual';

interface AIPetCardProps {
    petState: AIPetState;
}

const StatBar: React.FC<{ label: string; value: number; color: string; bgColor: string; }> = ({ label, value, color, bgColor }) => (
    <div className="grid grid-cols-5 items-center gap-1 text-xs">
        <span className="font-semibold text-white/80 col-span-1">{label}</span>
        <div className={`w-full ${bgColor} rounded-full h-2 col-span-4 border border-black/20`}>
            <div className={`${color} h-full rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]`} style={{ width: `${value}%` }}></div>
        </div>
    </div>
);

const TierEmblem: React.FC<{ tier: AIPetTier }> = ({ tier }) => {
    const emblems = {
        common: { icon: 'C', color: 'text-orange-400', filter: 'drop-shadow(0 0 3px #a16207)', path: <circle cx="12" cy="12" r="8" strokeWidth="2.5" /> },
        epic: { icon: 'E', color: 'text-sky-300', filter: 'drop-shadow(0 0 4px #0ea5e9)', path: <path d="M12 2 L2 9 L12 22 L22 9 Z" strokeWidth="2" /> },
        legendary: { icon: 'L', color: 'text-yellow-300', filter: 'drop-shadow(0 0 5px #facc15)', path: <path d="M12 2 l2.5 7 h7.5 l-6 4.5 l2.5 7 l-6 -4.5 l-6 4.5 l2.5 -7 l-6 -4.5 h7.5 Z" strokeWidth="1.5" /> },
        mythic: { icon: 'M', color: 'text-purple-300', filter: 'drop-shadow(0 0 6px #a855f7)', path: <path d="M12 2 L14 8 L20 10 L16 14 L17 21 L12 17 L7 21 L8 14 L4 10 L10 8 Z" strokeWidth="1.5" /> }
    };
    const emblem = emblems[tier];
    return (
        <svg viewBox="0 0 24 24" className="w-8 h-8" style={{ filter: emblem.filter }}>
            <g fill="none" stroke="currentColor" className={emblem.color}>
                {emblem.path}
            </g>
            <text x="50%" y="50%" dy=".3em" textAnchor="middle" className={`font-bold text-xs ${emblem.color}`} fill="currentColor">{emblem.icon}</text>
        </svg>
    );
};


const AIPetCard: React.FC<AIPetCardProps> = ({ petState }) => {
    if (petState.stage === 'aipod' || !petState.blueprint) {
        return <p className="text-sm text-text-muted italic">AIPet belum diaktifkan.</p>;
    }

    const cardAnimations = `
        @keyframes card-flip-in {
            from { transform: perspective(1000px) rotateY(-45deg) scale(0.95); opacity: 0.8; }
            to { transform: perspective(1000px) rotateY(0deg) scale(1); opacity: 1; }
        }
        .animate-card-flip-in {
            animation: card-flip-in 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes holo-effect {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        .holo-effect::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(110deg, transparent 20%, rgba(255, 255, 255, 0.25) 48%, rgba(255, 255, 255, 0.25) 52%, transparent 80%);
            background-size: 300% 100%;
            animation: holo-effect 5s ease-in-out infinite;
            mix-blend-mode: overlay;
            opacity: 0;
            transition: opacity 0.3s;
        }
        .holo-mythic::after { opacity: 0.7; }
        .holo-legendary::after { opacity: 0.5; animation-duration: 6s; }
        .holo-epic::after { opacity: 0.3; animation-duration: 7s; }
    `;

    const getTierStyling = () => {
        switch(petState.tier) {
            case 'mythic': return { holo: 'holo-mythic', bg: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/80 via-indigo-900/90 to-black', border: 'border-purple-400', nameplate: 'bg-gradient-to-r from-purple-500 via-fuchsia-600 to-indigo-600' };
            case 'legendary': return { holo: 'holo-legendary', bg: 'bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-800/80 via-yellow-900/90 to-black', border: 'border-yellow-400', nameplate: 'bg-gradient-to-r from-yellow-500 via-amber-600 to-orange-600' };
            case 'epic': return { holo: 'holo-epic', bg: 'bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-sky-800/80 via-slate-900/90 to-black', border: 'border-sky-400', nameplate: 'bg-gradient-to-r from-sky-500 via-cyan-600 to-blue-600' };
            default: return { holo: '', bg: 'bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-stone-800/80 via-zinc-900/90 to-black', border: 'border-stone-500', nameplate: 'bg-gradient-to-r from-stone-600 via-zinc-700 to-gray-700' };
        }
    }
    const tierStyle = getTierStyling();
    const petId = petState.name.split('-')[1] || '0000';

    return (
        <div className="w-full mx-auto animate-card-flip-in">
            <style>{cardAnimations}</style>
            <div className={`relative aspect-[63/88] p-1.5 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden bg-gray-900 ${tierStyle.border}`}>
                <div className={`relative w-full h-full rounded-lg flex flex-col overflow-hidden p-1.5 ${tierStyle.bg}`}>
                    
                    {/* HOLO EFFECT OVERLAY */}
                    <div className={`absolute inset-0 z-10 pointer-events-none ${tierStyle.holo}`}></div>

                    {/* Card Content */}
                    <div className="flex flex-col flex-grow h-full z-0">
                        {/* Header */}
                        <div className={`relative flex justify-between items-center px-2 py-1 rounded-t-md shadow-md ${tierStyle.nameplate}`}>
                            <h3 className="font-bold text-lg text-white truncate" style={{fontFamily: 'var(--font-display)', letterSpacing: '0.05em', textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>{petState.name}</h3>
                            <div className="flex-shrink-0"><TierEmblem tier={petState.tier} /></div>
                        </div>

                        {/* Image */}
                        <div className="relative mx-auto mt-2 w-[95%] aspect-square border-2 border-black/30 bg-black/20 rounded-md shadow-inner shadow-black/50">
                            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgb(var(--c-border)) 0%, transparent 70%)' }}></div>
                             <div className="relative w-full h-full">
                                <AIPetVisual petState={petState} />
                             </div>
                        </div>

                        {/* Stats Box */}
                        <div className="mx-auto mt-2 p-2 w-[95%] border-2 border-black/30 bg-black/20 rounded-md flex-grow flex flex-col justify-between">
                            {/* Personality Stats */}
                            <div className="space-y-1">
                                <StatBar label="ENR" value={petState.stats.energy} color="bg-green-500" bgColor="bg-green-900" />
                                <StatBar label="CRT" value={petState.stats.creativity} color="bg-sky-400" bgColor="bg-sky-900" />
                                <StatBar label="INT" value={petState.stats.intelligence} color="bg-fuchsia-500" bgColor="bg-fuchsia-900" />
                                <StatBar label="CHA" value={petState.stats.charisma} color="bg-yellow-400" bgColor="bg-yellow-900" />
                            </div>

                            {/* Narrative Box */}
                            <div className="mt-2 pt-1 border-t border-white/10">
                               <p className="text-white/80 text-[10px] italic text-center leading-tight selectable-text">{petState.narrative || "Asal-usulnya masih menjadi misteri..."}</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-auto px-2 pt-1 flex justify-between items-center text-[9px] font-mono text-white/40 flex-shrink-0">
                            <p>ID: APH-{petId}</p>
                            <p>desain.fun</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIPetCard;
