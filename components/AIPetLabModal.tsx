// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAIPet } from '../contexts/AIPetContext';
import Button from './common/Button';
import LoadingMessage from './common/LoadingMessage';
import AIPetVisual from './AIPetVisual';
import type { AIPetState, AIPetPersonalityVector } from '../types';

// Lazy load heavy components
const AIPetCard = React.lazy(() => import('../gamification/AIPetCard'));
const AIPetActivation = React.lazy(() => import('./AIPetActivation'));

interface AIPetLabModalProps {
  show: boolean;
  onClose: () => void;
}

const StatDisplay: React.FC<{ label: string; value: number; maxValue: number, colorClass: string }> = ({ label, value, maxValue, colorClass }) => {
    const percentage = (value / maxValue) * 100;
    return (
        <div className="grid grid-cols-3 gap-2 items-center text-sm">
            <span className="font-semibold text-text-muted capitalize">{label}</span>
            <div className="col-span-2 bg-background rounded-full h-3 border border-border-main">
                <div className={`${colorClass} h-full rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const AIPetLabModal: React.FC<AIPetLabModalProps> = ({ show, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const { profile } = useAuth();
    const { petState, isLoading } = useAIPet();

    const [showActivation, setShowActivation] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        if (show) { document.addEventListener('keydown', handleKeyDown); modalRef.current?.focus(); }
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [show, onClose]);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); };

    if (!show) return null;

    const renderContent = () => {
        if (isLoading) return <LoadingMessage />;

        if (!petState || petState.stage === 'aipod') {
            const dummyPodState: AIPetState = {
                name: 'AIPod', stage: 'aipod', tier: 'common',
                stats: { energy: 100, creativity: 50, intelligence: 50, charisma: 50 },
                lastFed: Date.now(), lastPlayed: Date.now(),
                personality: { minimalist: 5, rustic: 5, playful: 5, modern: 5, luxury: 5, feminine: 5, bold: 5, creative: 5 },
                narrative: null, blueprint: null, colors: null, battleStats: null, buffs: []
            };
            return (
                <>
                    <div className="flex flex-col items-center">
                        <div className="w-40 h-48">
                            <AIPetVisual petState={dummyPodState} />
                        </div>
                        <h3 className="text-xl font-bold text-text-header mt-4">AIPod Terdeteksi!</h3>
                        <p className="text-text-body mt-2 text-sm max-w-sm">Di dalam artefak digital ini tersimpan data untuk mereplikasi wujud visual perdana AIPet-mu. Aktifkan untuk memulai perjalananmu bersama partner kreatif barumu.</p>
                        <Button
                            onClick={() => setShowActivation(true)}
                            className="mt-6"
                            disabled={(profile?.credits ?? 0) < 5}
                            title={(profile?.credits ?? 0) < 5 ? 'Butuh 5 token untuk aktivasi' : 'Aktifkan wujud pet-mu!'}
                        >
                            Aktifkan AIPod (5 Token)
                        </Button>
                    </div>
                    {showActivation && (
                        <Suspense fallback={null}>
                            <AIPetActivation onClose={() => setShowActivation(false)} />
                        </Suspense>
                    )}
                </>
            );
        }

        const personality = petState.personality;
        const maxPersonalityValue = Math.max(...(Object.values(personality) as number[]));

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Left Column: Pet Card */}
                <div className="w-full max-w-xs mx-auto">
                    <Suspense fallback={<div className="h-96 flex items-center justify-center"><LoadingMessage /></div>}>
                        <AIPetCard petState={petState} />
                    </Suspense>
                </div>
                {/* Right Column: Details */}
                <div className="space-y-6">
                    <div>
                        <h4 className="text-lg font-bold text-primary mb-3">Analisis Kepribadian</h4>
                        <div className="space-y-2 p-4 bg-background border border-border-main rounded-lg">
                            {Object.entries(personality).map(([trait, value]) => (
                                <StatDisplay key={trait} label={trait} value={value as number} maxValue={maxPersonalityValue > 0 ? maxPersonalityValue : 1} colorClass="bg-primary" />
                            ))}
                        </div>
                    </div>
                    {petState.battleStats && (
                        <div>
                             <h4 className="text-lg font-bold text-primary mb-3">Statistik Pertarungan <span className="text-xs text-text-muted">(Segera Hadir)</span></h4>
                             <div className="space-y-2 p-4 bg-background border border-border-main rounded-lg">
                                <StatDisplay label="HP" value={petState.battleStats.hp} maxValue={100} colorClass="bg-green-500" />
                                <StatDisplay label="ATK" value={petState.battleStats.atk} maxValue={100} colorClass="bg-red-500" />
                                <StatDisplay label="DEF" value={petState.battleStats.def} maxValue={100} colorClass="bg-blue-500" />
                                <StatDisplay label="SPD" value={petState.battleStats.spd} maxValue={100} colorClass="bg-yellow-500" />
                             </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div
            ref={modalRef}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="aipet-lab-title"
            tabIndex={-1}
        >
            <div className="relative max-w-3xl w-full bg-surface rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
                 <header className="p-6 border-b border-border-main flex-shrink-0 flex justify-between items-center">
                    <h2 id="aipet-lab-title" className="text-4xl font-bold text-primary" style={{ fontFamily: 'var(--font-display)' }}>AIPet Lab</h2>
                    <button onClick={onClose} title="Tutup" className="p-2 text-primary rounded-full hover:bg-background hover:text-primary-hover transition-colors close-button-glow">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-6 overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default AIPetLabModal;
