// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAIPet } from '../contexts/AIPetContext';
import AIPetVisual from './AIPetVisual';
import Button from './common/Button';

interface Props {
  show: boolean;
  onClose: () => void;
}

const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div>
        <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-semibold text-text-header">{label}</span>
            <span className="text-text-muted">{Math.round(value)}%</span>
        </div>
        <div className="w-full bg-background rounded-full h-2.5">
            <div className={`${color} h-2.5 rounded-full`} style={{ width: `${value}%` }}></div>
        </div>
    </div>
);

const BattleStatDisplay: React.FC<{ label: string; value: number; icon: string }> = ({ label, value, icon }) => (
    <div className="text-center bg-background p-3 rounded-lg border border-border-main">
        <p className="text-2xl">{icon}</p>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="font-bold text-2xl text-text-header">{value}</p>
    </div>
);

const AIPetLabModal: React.FC<Props> = ({ show, onClose }) => {
    const { profile } = useAuth();
    const { petState, isLoading } = useAIPet();

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in" onClick={onClose}>
            <div className="relative max-w-4xl w-full h-[90vh] bg-surface rounded-2xl shadow-xl flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} title="Tutup" className="absolute top-3 right-3 z-20 p-2 text-text-muted rounded-full hover:bg-background hover:text-text-header transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Left Panel: Visual */}
                <div className="w-full md:w-1/2 flex-shrink-0 flex flex-col items-center justify-center p-8 bg-background/50 rounded-t-2xl md:rounded-t-none md:rounded-l-2xl">
                    {isLoading || !petState ? (
                        <p>Loading Pet...</p>
                    ) : (
                        <>
                            <div className="w-full max-w-sm aspect-square mb-4">
                                <AIPetVisual petState={petState} />
                            </div>
                            <h2 className="text-4xl font-bold text-primary" style={{ fontFamily: 'var(--font-display)' }}>{petState.name}</h2>
                             <div className="mt-1 text-sm font-semibold bg-yellow-400 text-black px-3 py-0.5 rounded-full capitalize">{petState.tier}</div>
                        </>
                    )}
                </div>

                {/* Right Panel: Info & Actions */}
                <div className="flex-grow p-6 overflow-y-auto">
                    <h3 className="text-2xl font-bold text-text-header mb-4" style={{ fontFamily: 'var(--font-display)' }}>AIPet Lab</h3>
                    {isLoading || !petState ? <p>Loading stats...</p> : petState.stage === 'aipod' ? (
                        <div className="text-center p-8 border border-dashed border-border-main rounded-lg">
                            <p className="text-lg">🧬</p>
                            <p className="text-text-body">AIPod masih dalam mode tidur.</p>
                            <p className="text-sm text-text-muted mt-2">Buka menu AIPet di pojok kanan bawah dashboard untuk mengaktifkannya.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold text-splash mb-3 uppercase tracking-wider">Cerita Asal</h4>
                                <div className="bg-background p-4 rounded-lg border border-border-main">
                                    <p className="text-sm text-text-body italic selectable-text">{petState.narrative || "Asal-usulnya masih menjadi misteri..."}</p>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-semibold text-splash mb-3 uppercase tracking-wider">Statistik Pertempuran</h4>
                                {petState.battleStats ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <BattleStatDisplay label="HP" value={petState.battleStats.hp} icon="❤️" />
                                        <BattleStatDisplay label="ATK" value={petState.battleStats.atk} icon="⚔️" />
                                        <BattleStatDisplay label="DEF" value={petState.battleStats.def} icon="🛡️" />
                                        <BattleStatDisplay label="SPD" value={petState.battleStats.spd} icon="💨" />
                                    </div>
                                ) : <p className="text-sm text-text-muted italic">Statistik tempur belum ada.</p>}
                                {petState.buffs && petState.buffs.length > 0 && (
                                    <div className="mt-3 text-center text-xs font-bold text-sky-300 bg-sky-900/50 rounded-lg py-1">
                                        Buffs: {petState.buffs.join(', ')}
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <h4 className="font-semibold text-splash mb-3 uppercase tracking-wider">Statistik Kepribadian</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <StatBar label="⚡ Energi" value={petState.stats.energy} color="bg-green-500" />
                                    <StatBar label="🎨 Kreativitas" value={petState.stats.creativity} color="bg-sky-400" />
                                    <StatBar label="🧠 Kecerdasan" value={petState.stats.intelligence} color="bg-fuchsia-500" />
                                    <StatBar label="😎 Karisma" value={petState.stats.charisma} color="bg-yellow-400" />
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-splash mb-3 uppercase tracking-wider">Aktivitas (Segera Hadir)</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button size="small" variant="secondary" disabled>Beri Makan</Button>
                                    <Button size="small" variant="secondary" disabled>Ajak Main</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIPetLabModal;