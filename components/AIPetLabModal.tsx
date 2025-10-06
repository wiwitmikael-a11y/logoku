// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAIPet } from '../contexts/AIPetContext';
import AIPetVisual from './AIPetVisual';
import Button from './common/Button';
import type { AIPetState } from '../types';
import { playSound } from '../services/soundService';

const AIPetCard = React.lazy(() => import('./gamification/AIPetCard'));

interface Props {
  show: boolean;
  onClose: () => void;
}

const ACTIVATION_COST_TOKENS = 5;
const ACTIVATION_COST_FRAGMENTS = 10;

const statusMessages = [
    "Menghubungi Lab Mang AI...", "Mensintesis matriks kepribadian...", "Memilih blueprint dasar...",
    "Meracik palet warna dinamis...", "Mengkalibrasi statistik...", "Menulis bio & cerita asal...",
    "Finalisasi... Inisiasi protokol aktivasi!",
];

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
    const { petState, isLoading: isPetLoading, activatePetWithTokens, activatePetWithFragments, dismantlePet } = useAIPet();
    
    const [activationStep, setActivationStep] = useState<'idle' | 'loading' | 'reveal' | 'done'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("Siap aktivasi?");

    useEffect(() => {
        if (!show) {
            setTimeout(() => { setActivationStep('idle'); setError(null); setProgress(0); }, 300);
        }
    }, [show]);

    useEffect(() => {
        let interval: number;
        if (activationStep === 'loading') {
            let messageIndex = 0;
            interval = window.setInterval(() => {
                messageIndex = (messageIndex + 1) % statusMessages.length;
                setStatusText(statusMessages[messageIndex]);
                setProgress(p => Math.min(95, p + 14));
            }, 800);
        }
        return () => clearInterval(interval);
    }, [activationStep]);

    const handleActivate = async (method: 'tokens' | 'fragments') => {
        setActivationStep('loading');
        setError(null);
        playSound('start');
        setProgress(10);
        setStatusText(statusMessages[0]);
        
        try {
            if (method === 'tokens') {
                await activatePetWithTokens();
            } else {
                await activatePetWithFragments();
            }
            setProgress(100);
            setStatusText("Aktivasi Berhasil! AIPet telah lahir!");
            playSound('success');
            setActivationStep('reveal');
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal mengaktifkan pet.");
            playSound('error');
            setActivationStep('idle');
            setProgress(0);
        }
    };
    
    const handleDismantle = async () => {
        if (window.confirm("Yakin mau daur ulang pet ini? Kamu akan dapat 1 Data Fragment dan pet-mu akan kembali jadi AIPod.")) {
            try {
                await dismantlePet();
                playSound('success');
            } catch (err) {
                setError(err instanceof Error ? err.message : "Gagal daur ulang.");
                playSound('error');
            }
        }
    };

    const podAnimation = `@keyframes pod-wobble { 0%{transform:rotate(0deg)} 25%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} 75%{transform:rotate(-3deg)} 100%{transform:rotate(0deg)} } .animate-pod-wobble { animation: pod-wobble 0.3s linear infinite; } @keyframes pet-reveal { 0% { transform: scale(0) rotate(-180deg); opacity: 0; filter: brightness(3) saturate(0); } 100% { transform: scale(1) rotate(0deg); opacity: 1; filter: brightness(1) saturate(1); } } .animate-pet-reveal { animation: pet-reveal 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards; }`;

    const dummyPodState: AIPetState = { name: 'AIPod', stage: 'aipod', tier: 'common', stats: { energy: 100, creativity: 50, intelligence: 50, charisma: 50 }, lastFed: Date.now(), lastPlayed: Date.now(), personality: { minimalist: 5, rustic: 5, playful: 5, modern: 5, luxury: 5, feminine: 5, bold: 5, creative: 5 }, narrative: null, blueprint: null, colors: null, battleStats: null, buffs: [], };
    
    const renderActivationView = () => (
        <div className="flex flex-col items-center justify-center h-full text-center">
             <h2 className="text-3xl font-bold text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>Aktifkan AIPod?</h2>
            <div className={`w-40 h-48 my-4 ${activationStep === 'loading' ? 'animate-pod-wobble' : ''}`}>
                <AIPetVisual petState={dummyPodState} />
            </div>
            {activationStep === 'loading' ? (
                <div className="w-full max-w-xs">
                    <p className="text-sm text-splash font-semibold animate-pulse">{statusText}</p>
                    <div className="w-full bg-background rounded-full h-2.5 mt-2 border border-border-main"><div className="bg-splash h-2.5 rounded-full transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }}></div></div>
                </div>
            ) : (
                 <>
                    <p className="text-text-body mb-4 text-sm max-w-xs">
                        Proses ini akan menggunakan <strong className="text-text-header">{ACTIVATION_COST_TOKENS} token</strong>.
                        <span className="block mt-2 font-semibold text-primary">Kamu punya: {profile?.data_fragments ?? 0} Data Fragment.</span>
                    </p>
                    <div className="flex flex-col items-center gap-3">
                        <Button onClick={() => handleActivate('tokens')}>Ya, Aktifkan Sekarang! ({ACTIVATION_COST_TOKENS} Token)</Button>
                        <Button onClick={() => handleActivate('fragments')} variant="secondary" disabled={(profile?.data_fragments ?? 0) < ACTIVATION_COST_FRAGMENTS}>Gunakan {ACTIVATION_COST_FRAGMENTS} Fragment</Button>
                        <Button onClick={onClose} variant="secondary" size="small">Nanti Aja Deh</Button>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                </>
            )}
        </div>
    );

    const renderLabView = (pet: AIPetState) => (
        <div className="space-y-1">
            <details open>
                <summary className="font-semibold text-splash uppercase tracking-wider text-xs py-2 cursor-pointer">Cerita Asal</summary>
                <div className="bg-background p-4 rounded-lg border border-border-main mb-4">
                    <p className="text-sm text-text-body italic selectable-text">{pet.narrative || "Asal-usulnya masih menjadi misteri..."}</p>
                </div>
            </details>
            <details open>
                <summary className="font-semibold text-splash uppercase tracking-wider text-xs py-2 cursor-pointer">Statistik Pertempuran</summary>
                <div className="mb-4">
                    {pet.battleStats ? (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><BattleStatDisplay label="HP" value={pet.battleStats.hp} icon="❤️" /><BattleStatDisplay label="ATK" value={pet.battleStats.atk} icon="⚔️" /><BattleStatDisplay label="DEF" value={pet.battleStats.def} icon="🛡️" /><BattleStatDisplay label="SPD" value={pet.battleStats.spd} icon="💨" /></div>
                            {pet.buffs && pet.buffs.length > 0 && (<div className="mt-3 text-center text-xs font-bold text-sky-300 bg-sky-900/50 rounded-lg py-1">Buffs: {pet.buffs.join(', ')}</div>)}
                        </>
                    ) : <p className="text-sm text-text-muted italic bg-background p-4 rounded-lg border border-border-main">Statistik tempur belum ada.</p>}
                </div>
            </details>
             <details open>
                <summary className="font-semibold text-splash uppercase tracking-wider text-xs py-2 cursor-pointer">Statistik Kepribadian</summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <StatBar label="⚡ Energi" value={pet.stats.energy} color="bg-green-500" />
                    <StatBar label="🎨 Kreativitas" value={pet.stats.creativity} color="bg-sky-400" />
                    <StatBar label="🧠 Kecerdasan" value={pet.stats.intelligence} color="bg-fuchsia-500" />
                    <StatBar label="😎 Karisma" value={pet.stats.charisma} color="bg-yellow-400" />
                </div>
            </details>
            {pet.tier === 'common' && (
                <details>
                    <summary className="font-semibold text-red-400 uppercase tracking-wider text-xs py-2 cursor-pointer">Zona Daur Ulang</summary>
                    <div className="bg-background p-4 rounded-lg border border-border-main mb-4">
                        <p className="text-xs text-text-muted my-2">Punya pet Common dan mau coba peruntungan lagi? Lo bisa daur ulang pet ini untuk mendapatkan <strong className="text-text-header">1 Data Fragment</strong>. Pet-mu akan kembali menjadi AIPod.</p>
                        <Button onClick={handleDismantle} size="small" variant="secondary" className="!border-red-500/30 !text-red-400 hover:!bg-red-500/10">Daur Ulang AIPet</Button>
                    </div>
                </details>
            )}
        </div>
    );

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in" onClick={onClose}>
            <style>{podAnimation}</style>
            <div className="relative max-w-4xl w-full h-[90vh] bg-surface rounded-2xl shadow-xl flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} title="Tutup" className="absolute top-3 right-3 z-20 p-2 text-primary rounded-full hover:bg-background hover:text-primary-hover transition-colors close-button-glow">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Left Panel: Visual */}
                <div className="w-full md:w-1/2 flex-shrink-0 flex flex-col items-center justify-center p-4 bg-background/50 rounded-t-2xl md:rounded-t-none md:rounded-l-2xl overflow-hidden">
                    {isPetLoading ? <p>Loading Pet...</p> : (
                        <div className={`w-full max-w-sm aspect-square ${activationStep === 'reveal' ? 'animate-pet-reveal' : ''}`}>
                             {(petState && petState.stage === 'active') ? (
                                <Suspense fallback={<p>Loading card...</p>}>
                                    <AIPetCard petState={petState} />
                                </Suspense>
                             ) : (
                                <AIPetVisual petState={dummyPodState} />
                            )}
                        </div>
                    )}
                </div>

                {/* Right Panel: Info & Actions */}
                <div className="flex-grow p-6 overflow-y-auto">
                    <h3 className="text-2xl font-bold text-text-header mb-4" style={{ fontFamily: 'var(--font-display)' }}>AIPet Lab</h3>
                    {isPetLoading ? <p>Loading stats...</p> : 
                        (petState?.stage === 'aipod') ? renderActivationView() :
                        (petState && petState.stage === 'active') ? renderLabView(petState) :
                        (
                            <div className="text-center p-8 border border-dashed border-border-main rounded-lg">
                                <p className="text-lg">🧬</p>
                                <p className="text-text-body">Terjadi kesalahan saat memuat data AIPet.</p>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    );
};

export default AIPetLabModal;