// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { Profile, AIPetState, AIPetPersonalityVector, AIPetTier } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useUserActions } from '../../contexts/UserActionsContext';
import { useAIPet } from '../../contexts/AIPetContext';
import LoadingMessage from '../common/LoadingMessage';
import ErrorMessage from '../common/ErrorMessage';
import Card from '../common/Card';
import Button from '../common/Button';

// Lazy load heavy components
const AIPetCard = React.lazy(() => import('../gamification/AIPetCard'));
const AIPetActivation = React.lazy(() => import('../AIPetActivation'));
const AIPetVisual = React.lazy(() => import('../AIPetVisual'));

const ACHIEVEMENTS_MAP: { [key: string]: { name: string; description: string; icon: string; } } = {
  BRAND_PERTAMA_LAHIR: { name: 'Brand Pertama Lahir!', description: 'Berhasil menyelesaikan project branding pertama.', icon: '🥉' },
  SANG_KOLEKTOR: { name: 'Sang Kolektor', description: 'Berhasil menyelesaikan 5 project branding.', icon: '🥈' },
  SULTAN_KONTEN: { name: 'Sultan Konten', description: 'Berhasil menyelesaikan 10 project branding.', icon: '🥇' },
};

const DAILY_MISSIONS = [
  { id: 'created_captions', description: 'Bikin 1 caption di Tools Lanjutan', xp: 10, target: 1 },
  { id: 'liked_projects', description: "Kasih 'Menyala!' di 3 karya Pameran Brand", xp: 15, target: 3 },
  { id: 'created_posts', description: 'Bales 1 topik di WarKop Juragan', xp: 5, target: 1 },
];

const PUSAT_JURAGAN_TIPS = [
    { icon: '👑', title: 'Rebut Takhta Juragan Teratas', text: 'Papan Peringkat diurutin berdasarkan total XP. Makin aktif lo di aplikasi (bikin project, ngobrol di forum, nge-like di pameran), makin tinggi peringkat lo!' },
    { icon: '🎯', title: 'Bonus XP dari Misi Harian', text: 'Selesaikan Misi Harian buat dapet bonus XP setiap hari. Ini cara cepet buat jadi Sultan Branding Nusantara!' },
    { icon: '📜', title: 'Koleksi Lencana Kebanggaan', text: 'Lencana Pencapaian itu bukti perjalanan branding lo. Selesaikan 1, 5, atau 10 project buat ngebuka lencana perunggu, perak, dan emas!' },
    { icon: '🚀', title: 'Naik Level, Dapat Hadiah!', text: 'Levelmu nentuin pangkatmu! Tiap naik level, ada hadiah token menanti. Pangkat baru juga kebuka di level 5, 10, 20, dan 50.' },
];

const PusatJuraganInfoBox: React.FC = () => {
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => { setCurrentTipIndex(prev => (prev + 1) % PUSAT_JURAGAN_TIPS.length); }, 7000);
        return () => clearInterval(interval);
    }, []);

    const currentTip = PUSAT_JURAGAN_TIPS[currentTipIndex];

    return (
        <div key={currentTipIndex} className="w-full bg-surface border border-border-main rounded-lg p-4 flex items-start gap-4 text-left animate-content-fade-in shadow-lg shadow-black/20">
            <div className="flex-shrink-0 text-2xl pt-1">{currentTip.icon}</div>
            <div>
                <h4 className="font-bold text-primary">{currentTip.title}</h4>
                <p className="text-sm text-text-body" dangerouslySetInnerHTML={{ __html: currentTip.text }} />
            </div>
        </div>
    );
};

const LeaderboardSkeleton: React.FC = () => (
    <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-2 bg-background/50 rounded-md animate-pulse">
                <div className="w-4 h-6 bg-surface rounded-sm"></div>
                <div className="w-10 h-10 rounded-full bg-surface"></div>
                <div className="flex-grow space-y-2">
                    <div className="h-4 w-3/4 bg-surface rounded"></div>
                    <div className="h-3 w-1/2 bg-surface rounded"></div>
                </div>
                <div className="h-6 w-16 bg-surface rounded-md"></div>
            </div>
        ))}
    </div>
);

const SubTabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-3 text-sm font-semibold transition-colors ${active ? 'tab-active-accent' : 'text-text-muted hover:text-text-header'}`}
    >
        {children}
    </button>
);

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

const PusatJuragan: React.FC = () => {
    const { profile } = useAuth();
    const { dailyActions, claimMissionReward } = useUserActions();
    const { petState, isLoading: isAIPetLoading } = useAIPet();
    
    const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
    const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSubTab, setActiveSubTab] = useState<'missions' | 'leaderboard' | 'aipet'>('missions');
    const [showActivation, setShowActivation] = useState(false);

    useEffect(() => {
        if (activeSubTab !== 'leaderboard' || leaderboard.length > 0) return;
        
        const fetchLeaderboard = async () => {
            setIsLoadingLeaderboard(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, xp, level')
                    .not('full_name', 'is', null)
                    .order('xp', { ascending: false })
                    .limit(10);
                if (error) throw error;
                setLeaderboard(data as Profile[]);
            } catch (err: any) {
                setError(`Gagal memuat papan peringkat: ${err.message}`);
            } finally {
                setIsLoadingLeaderboard(false);
            }
        };

        fetchLeaderboard();
    }, [activeSubTab, leaderboard.length]);
    
    const userAchievements = profile?.achievements || [];

    const renderAIPetLabContent = () => {
        if (isAIPetLoading) return <div className="flex justify-center p-8"><LoadingMessage /></div>;

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
                    <Card title="AIPet Lab">
                        <div className="flex flex-col items-center">
                            <div className="w-40 h-48">
                                <Suspense fallback={null}><AIPetVisual petState={dummyPodState} /></Suspense>
                            </div>
                            <h3 className="text-xl font-bold text-text-header mt-4">AIPod Terdeteksi!</h3>
                            <p className="text-text-body mt-2 text-sm max-w-sm text-center">Di dalam artefak digital ini tersimpan data untuk mereplikasi wujud visual perdana AIPet-mu.</p>
                            <Button
                                onClick={() => setShowActivation(true)}
                                className="mt-6"
                                disabled={(profile?.credits ?? 0) < 5}
                                title={(profile?.credits ?? 0) < 5 ? 'Butuh 5 token untuk aktivasi' : 'Aktifkan wujud pet-mu!'}
                            >
                                Aktifkan AIPod (5 Token)
                            </Button>
                        </div>
                    </Card>
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
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="w-full max-w-xs mx-auto">
                    <Suspense fallback={<div className="h-96 flex items-center justify-center"><LoadingMessage /></div>}>
                        <AIPetCard petState={petState} />
                    </Suspense>
                </div>
                <div className="space-y-6">
                    <Card title="Analisis Kepribadian">
                        <div className="space-y-2">
                            {Object.entries(personality).map(([trait, value]) => (
                                <StatDisplay key={trait} label={trait} value={value as number} maxValue={maxPersonalityValue > 0 ? maxPersonalityValue : 1} colorClass="bg-primary" />
                            ))}
                        </div>
                    </Card>
                    {petState.battleStats && (
                        <Card title="Statistik Pertarungan">
                             <div className="space-y-2">
                                <p className="text-xs text-text-muted text-center mb-2">(Fitur pertarungan segera hadir!)</p>
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

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-content-fade-in">
             <div className="text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-green-400 mb-2" style={{fontFamily: 'var(--font-display)'}}>Gamify Center</h2>
                <p className="text-text-muted">
                    Ini markas lo buat jadi juragan sejati! Selesaikan misi, koleksi lencana, dan rebut posisi puncak di papan peringkat.
                </p>
            </div>

            <PusatJuraganInfoBox />

            <div className="flex justify-center border-b border-border-main mb-8">
                <SubTabButton active={activeSubTab === 'missions'} onClick={() => setActiveSubTab('missions')}>Misi & Lencana</SubTabButton>
                <SubTabButton active={activeSubTab === 'leaderboard'} onClick={() => setActiveSubTab('leaderboard')}>Papan Peringkat</SubTabButton>
                <SubTabButton active={activeSubTab === 'aipet'} onClick={() => setActiveSubTab('aipet')}>AIPet Lab</SubTabButton>
            </div>
            
            {error && <ErrorMessage message={error} />}

            {activeSubTab === 'missions' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-content-fade-in">
                     <Card title="🎯 Misi Harian">
                        <div className="space-y-4">
                            {DAILY_MISSIONS.map(mission => {
                                const progress = dailyActions ? (dailyActions[mission.id] as number || 0) : 0;
                                const isCompleted = progress >= mission.target;
                                const isClaimed = dailyActions?.claimed_missions?.includes(mission.id);
                                return (
                                <div key={mission.id}>
                                    <div className="flex justify-between items-start mb-1 text-sm">
                                        <div className="flex-grow pr-4">
                                            <p className="text-text-body">{mission.description}</p>
                                            <p className="font-bold text-accent text-xs">+{mission.xp} XP</p>
                                        </div>
                                        {isClaimed ? (
                                            <Button size="small" variant="secondary" disabled>Terklaim</Button>
                                        ) : (
                                            <Button size="small" onClick={() => claimMissionReward(mission.id, mission.xp)} disabled={!isCompleted}>Klaim</Button>
                                        )}
                                    </div>
                                    <div className="w-full bg-border-main rounded-full h-2.5">
                                        <div className="bg-accent h-2.5 rounded-full" style={{ width: `${Math.min(100, (progress / mission.target) * 100)}%` }}></div>
                                    </div>
                                </div>
                                )
                            })}
                        </div>
                    </Card>

                    <Card title="📜 Galeri Lencana">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {Object.entries(ACHIEVEMENTS_MAP).map(([id, ach]) => {
                                const isUnlocked = userAchievements.includes(id);
                                return (
                                    <div key={id} className="flex flex-col items-center text-center p-2 rounded-lg bg-background/50" title={ach.description}>
                                        <span className={`text-5xl transition-all duration-300 ${isUnlocked ? 'filter-none' : 'filter grayscale opacity-40'}`}>{ach.icon}</span>
                                        <p className={`font-bold text-xs mt-2 ${isUnlocked ? 'text-text-header' : 'text-text-muted'}`}>{ach.name}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            )}

            {activeSubTab === 'leaderboard' && (
                <div className="animate-content-fade-in">
                    <Card title="👑 Papan Peringkat (Top 10)">
                        {isLoadingLeaderboard ? <LeaderboardSkeleton /> : leaderboard.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-6xl mb-4">🏆</div>
                                <h4 className="font-bold text-text-header">Podium Masih Kosong!</h4>
                                <p className="text-sm text-text-muted mt-1">Jadilah yang pertama merebut takhta juragan teratas!</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {leaderboard.map((p, index) => {
                                    const isCurrentUser = p.id === profile?.id;
                                    return (
                                    <div key={p.id} className={`flex items-center gap-3 p-2 rounded-md transition-colors ${isCurrentUser ? 'bg-splash/20 border border-splash/30' : ''}`}>
                                        <span className={`font-bold w-6 text-center ${index < 3 ? 'text-accent' : 'text-text-muted'}`}>{index + 1}</span>
                                        <img src={p.avatar_url || ''} alt={p.full_name || ''} className="w-10 h-10 rounded-full" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-text-header text-sm truncate">{p.full_name}</p>
                                            <p className="text-xs text-text-muted">Level {p.level}</p>
                                        </div>
                                        <div className="font-bold text-accent text-sm">{p.xp.toLocaleString()} XP</div>
                                    </div>
                                    )
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {activeSubTab === 'aipet' && (
                 <div className="animate-content-fade-in">
                    {renderAIPetLabContent()}
                </div>
            )}
        </div>
    );
};

export default PusatJuragan;