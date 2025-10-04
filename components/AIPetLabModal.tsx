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

const AIPetLabModal: React.FC<Props> = ({ show, onClose }) => {
    const { profile } = useAuth();
    const { petState, isLoading } = useAIPet();

    if (!show) return null;

    const ACHIEVEMENTS_MAP: { [key: string]: { name: string; description: string; icon: string; } } = {
        BRAND_PERTAMA_LAHIR: { name: 'Brand Pertama Lahir!', description: 'Selesaikan 1 project.', icon: '🥉' },
        SANG_KOLEKTOR: { name: 'Sang Kolektor', description: 'Selesaikan 5 project.', icon: '🥈' },
        SULTAN_KONTEN: { name: 'Sultan Konten', description: 'Selesaikan 10 project.', icon: '🥇' },
    };
    const userAchievements = profile?.achievements || [];

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
                            <div className="w-full max-w-xs aspect-square mb-4">
                                {petState.assembled_url ? (
                                    <img src={petState.assembled_url} alt={petState.name} className="w-full h-full object-contain" />
                                ) : (
                                    <AIPetVisual petState={petState} />
                                )}
                            </div>
                            <h2 className="text-3xl font-bold text-primary" style={{ fontFamily: 'var(--font-display)' }}>{petState.name}</h2>
                            <p className="text-sm text-text-muted italic text-center">"{petState.narrative || 'A mysterious creature.'}"</p>
                        </>
                    )}
                </div>

                {/* Right Panel: Info & Actions */}
                <div className="flex-grow p-6 overflow-y-auto">
                    <h3 className="text-2xl font-bold text-text-header mb-4" style={{ fontFamily: 'var(--font-display)' }}>AIPet Lab</h3>
                    {isLoading || !petState ? <p>Loading stats...</p> : petState.stage === 'egg' ? (
                        <div className="text-center p-8 border border-dashed border-border-main rounded-lg">
                            <p className="text-lg">🥚</p>
                            <p className="text-text-body">Telurmu masih perlu waktu untuk menetas.</p>
                            <p className="text-sm text-text-muted mt-2">Buka menu AIPet di pojok kanan bawah dashboard untuk menetaskannya.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold text-splash mb-3">STATISTIK</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <StatBar label="⚡ Energi" value={petState.stats.energy} color="bg-green-500" />
                                    <StatBar label="🎨 Kreativitas" value={petState.stats.creativity} color="bg-sky-400" />
                                    <StatBar label="🧠 Kecerdasan" value={petState.stats.intelligence} color="bg-fuchsia-500" />
                                    <StatBar label="😎 Karisma" value={petState.stats.charisma} color="bg-yellow-400" />
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-splash mb-3">AKTIVITAS (SEGERA HADIR)</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button size="small" variant="secondary" disabled>Beri Makan</Button>
                                    <Button size="small" variant="secondary" disabled>Ajak Main</Button>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-splash mb-3">DINDING PRESTASI</h4>
                                <div className="p-4 bg-background rounded-lg">
                                {userAchievements.length > 0 ? (
                                    <div className="flex justify-center gap-4">
                                        {userAchievements.map(id => ACHIEVEMENTS_MAP[id] && (
                                            <div key={id} className="text-center" title={ACHIEVEMENTS_MAP[id].description}>
                                                <span className="text-5xl">{ACHIEVEMENTS_MAP[id].icon}</span>
                                                <p className="text-xs font-semibold">{ACHIEVEMENTS_MAP[id].name}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-text-muted italic text-center">Belum ada lencana. Selesaikan project untuk mendapatkannya!</p>
                                )}
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