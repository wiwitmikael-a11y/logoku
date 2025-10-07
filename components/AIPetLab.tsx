// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, Suspense, useCallback } from 'react';
import { useAIPet } from '../contexts/AIPetContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import Button from './common/Button';
import LoadingMessage from './common/LoadingMessage';
import Card from './common/Card';

const AIPetActivation = React.lazy(() => import('./AIPetActivation'));
const AIPetCard = React.lazy(() => import('./gamification/AIPetCard'));
const AIPetVisual = React.lazy(() => import('./AIPetVisual'));

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

const AIPetLab: React.FC = () => {
    const { petState, isLoading, notifyPetOfActivity } = useAIPet();
    const { profile } = useAuth();
    const [showActivation, setShowActivation] = useState(false);
    const [activeTab, setActiveTab] = useState<'stats' | 'personality'>('stats');

    const handleFeed = useCallback(() => {
        // For now, just a visual cue and an activity notification
        notifyPetOfActivity('feed');
    }, [notifyPetOfActivity]);

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-[40vh]"><LoadingMessage /></div>;
    }

    if (!petState || petState.stage === 'aipod') {
        const projectsCompleted = profile?.total_projects_completed ?? 0;
        const tokensAvailable = profile?.credits ?? 0;
        const hasCompletedProject = projectsCompleted >= 1;
        const hasEnoughTokens = tokensAvailable >= 5;
        const canActivate = hasCompletedProject && hasEnoughTokens;

        return (
            <div className="flex flex-col items-center gap-6 text-center max-w-2xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold text-primary" style={{fontFamily: 'var(--font-display)'}}>Inkubator AIPod</h2>
                <p className="text-text-muted">Di dalam artefak digital ini tersimpan potensi partner kreatifmu. Penuhi syaratnya untuk memulai proses aktivasi dan mereplikasi wujud visual perdana AIPet-mu berdasarkan DNA brand yang telah kamu ciptakan.</p>
                
                <div className="w-48 h-56 -my-4">
                    <Suspense fallback={null}>
                         <AIPetVisual petState={{ name: 'AIPod', stage: 'aipod', tier: 'common', stats: { energy: 100, creativity: 50, intelligence: 50, charisma: 50 }, lastFed: 0, lastPlayed: 0, personality: {} as any, narrative: null, blueprint: null, colors: null, battleStats: null, buffs: [] }} />
                    </Suspense>
                </div>

                <Card title="Status Aktivasi">
                    <div className="space-y-3">
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${hasCompletedProject ? 'bg-green-500/10' : 'bg-surface'}`}>
                            <span className="text-2xl">{hasCompletedProject ? '✅' : '❌'}</span>
                            <div>
                                <p className={`font-semibold ${hasCompletedProject ? 'text-green-400' : 'text-text-header'}`}>1 Project Selesai</p>
                                <p className="text-xs text-text-muted">Status: {projectsCompleted} / 1</p>
                            </div>
                        </div>
                         <div className={`flex items-center gap-3 p-3 rounded-lg ${hasEnoughTokens ? 'bg-green-500/10' : 'bg-surface'}`}>
                            <span className="text-2xl">{hasEnoughTokens ? '✅' : '❌'}</span>
                            <div>
                                <p className={`font-semibold ${hasEnoughTokens ? 'text-green-400' : 'text-text-header'}`}>5 Token Tersedia</p>
                                <p className="text-xs text-text-muted">Status: {tokensAvailable} / 5</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <Button onClick={() => setShowActivation(true)} disabled={!canActivate} size="large" variant="splash">
                    Mulai Proses Aktivasi
                </Button>
                
                {showActivation && (
                    <Suspense fallback={null}>
                        <AIPetActivation onClose={() => setShowActivation(false)} />
                    </Suspense>
                )}
            </div>
        );
    }
    
    // Active Pet View
    const maxPersonalityValue = Math.max(...(Object.values(petState.personality) as number[]));
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="w-full max-w-sm mx-auto">
                <Suspense fallback={<div className="h-96 flex items-center justify-center"><LoadingMessage /></div>}>
                    <AIPetCard petState={petState} />
                </Suspense>
            </div>
            <div className="space-y-6">
                <div className="flex border-b border-border-main">
                    <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'stats' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-header'}`}>Status & Interaksi</button>
                    <button onClick={() => setActiveTab('personality')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'personality' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-header'}`}>Analisis Kepribadian</button>
                </div>

                {activeTab === 'stats' && (
                     <Card title="Status Saat Ini">
                        <div className="space-y-4">
                            <StatDisplay label="Energi" value={petState.stats.energy} maxValue={100} colorClass="bg-green-500" />
                            <div className="pt-4 border-t border-border-main">
                                <h4 className="font-semibold text-text-header mb-2">Interaksi</h4>
                                <Button onClick={handleFeed} variant="secondary" size="small">Beri Makan (Coming Soon)</Button>
                            </div>
                        </div>
                     </Card>
                )}

                {activeTab === 'personality' && (
                     <Card title="Vektor Kepribadian">
                         <div className="space-y-2">
                            {Object.entries(petState.personality).map(([trait, value]) => (
                                <StatDisplay key={trait} label={trait} value={value as number} maxValue={maxPersonalityValue > 0 ? maxPersonalityValue : 1} colorClass="bg-primary" />
                            ))}
                        </div>
                     </Card>
                )}
                 {petState.battleStats && (
                    <Card title="Statistik Pertarungan">
                        <p className="text-sm text-text-muted italic mb-4">Fitur pertarungan antar AIPet akan segera hadir!</p>
                         <div className="space-y-2">
                            <StatDisplay label="HP" value={petState.battleStats.hp} maxValue={100} colorClass="bg-green-500" />
                            <StatDisplay label="ATK" value={petState.battleStats.atk} maxValue={100} colorClass="bg-red-500" />
                            <StatDisplay label="DEF" value={petState.battleStats.def} maxValue={100} colorClass="bg-blue-500" />
                            <StatDisplay label="SPD" value={petState.battleStats.spd} maxValue={100} colorClass="bg-yellow-500" />
                         </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default AIPetLab;