import React from 'react';
import type { AIPetState } from '../../types';

interface AIPetCardProps {
    petState: AIPetState;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div>
        <div className="flex justify-between items-center text-xs mb-0.5">
            <span className="font-semibold text-text-header">{label}</span>
            <span className="text-text-muted">{Math.round(value)}</span>
        </div>
        <div className="w-full bg-border-main rounded-full h-1.5">
            <div className={`h-1.5 rounded-full`} style={{ width: `${value}%`, backgroundColor: color }}></div>
        </div>
    </div>
);


const AIPetCard: React.FC<AIPetCardProps> = ({ petState }) => {
    if (petState.stage === 'egg' || !petState.visual_base64) {
        return <p className="text-sm text-text-muted italic">AIPet belum menetas.</p>;
    }

    const cardShineAnimation = `
        @keyframes card-shine {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        .animate-card-shine {
            background: linear-gradient(110deg, transparent 20%, rgba(255, 255, 255, 0.2) 50%, transparent 80%);
            background-size: 200% 100%;
            animation: card-shine 4s linear infinite;
        }
    `;

    return (
        <div className="w-full max-w-xs mx-auto">
            <style>{cardShineAnimation}</style>
            <div className="relative aspect-[3/4.5] bg-surface border-2 border-splash/50 rounded-2xl shadow-2xl shadow-splash/20 p-3 flex flex-col overflow-hidden">
                {/* Holo Shine Effect */}
                <div className="absolute inset-0 animate-card-shine z-10"></div>
                
                {/* Card Content */}
                <div className="relative z-0 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg text-text-header" style={{fontFamily: 'var(--font-display)', letterSpacing: '0.05em'}}>{petState.name}</h3>
                        <div className="text-xs font-semibold bg-splash/20 text-splash px-2 py-0.5 rounded-full capitalize">{petState.stage}</div>
                    </div>

                    {/* Image */}
                    <div className="flex-grow bg-background border-2 border-border-main rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                        <img src={petState.visual_base64} alt={petState.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-2">
                        <StatBar label="Energi" value={petState.stats.energy} color="#22c55e" />
                        <StatBar label="Kreativitas" value={petState.stats.creativity} color="#38bdf8" />
                        <StatBar label="Kecerdasan" value={petState.stats.intelligence} color="#c026d3" />
                        <StatBar label="Karisma" value={petState.stats.charisma} color="#facc15" />
                    </div>

                    {/* Narrative */}
                    <div className="bg-background/50 border border-border-main rounded-md p-2 text-center text-xs text-text-body italic">
                        <p>{petState.narrative || "Deskripsi belum tersedia."}</p>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-2 flex justify-between items-center text-xs text-text-muted">
                        <p>Aset Digital desain.fun</p>
                        <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIPetCard;