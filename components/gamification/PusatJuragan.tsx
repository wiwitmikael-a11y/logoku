// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { Profile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import LoadingMessage from '../common/LoadingMessage';
import ErrorMessage from '../common/ErrorMessage';
import Card from '../common/Card';

const ACHIEVEMENTS_MAP: { [key: string]: { name: string; description: string; icon: string; } } = {
  BRAND_PERTAMA_LAHIR: { name: 'Brand Pertama Lahir!', description: 'Berhasil menyelesaikan project branding pertama.', icon: '🥉' },
  SANG_KOLEKTOR: { name: 'Sang Kolektor', description: 'Berhasil menyelesaikan 5 project branding.', icon: '🥈' },
  SULTAN_KONTEN: { name: 'Sultan Konten', description: 'Berhasil menyelesaikan 10 project branding.', icon: '🥇' },
};

const DAILY_MISSIONS = [
  { id: 'CREATE_CAPTION', description: 'Bikin 1 caption di Tools Lanjutan', xp: 10, progress: 0, target: 1 },
  { id: 'GIVE_LIKES', description: "Kasih 'Menyala!' di 3 karya Pameran Brand", xp: 15, progress: 0, target: 3 },
  { id: 'CREATE_POST', description: 'Bales 1 topik di WarKop Juragan', xp: 5, progress: 0, target: 1 },
];

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


const PusatJuragan: React.FC = () => {
    const { profile } = useAuth();
    const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, xp, level')
                    .not('full_name', 'is', null) // Only show users with names
                    .order('xp', { ascending: false })
                    .limit(10);
                if (error) throw error;
                setLeaderboard(data as Profile[]);
            } catch (err: any) {
                setError(`Gagal memuat papan peringkat: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);
    
    const userAchievements = profile?.achievements || [];

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-content-fade-in">
             <div className="text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-splash mb-2" style={{fontFamily: 'var(--font-display)'}}>Pusat Juragan</h2>
                <p className="text-text-muted">
                    Ini markas lo buat jadi juragan sejati! Selesain misi, koleksi lencana, dan rebut posisi puncak di papan peringkat.
                </p>
            </div>

            {error && <ErrorMessage message={error} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Left Column: Missions & Badges */}
                <div className="space-y-8">
                    <Card title="🎯 Misi Harian">
                        <p className="text-xs text-text-muted mb-4">Selesaikan misi ini setiap hari buat dapet bonus XP! (Fitur progres & klaim hadiah segera hadir)</p>
                        <div className="space-y-4">
                            {DAILY_MISSIONS.map(mission => (
                                <div key={mission.id}>
                                    <div className="flex justify-between items-center mb-1 text-sm">
                                        <p className="text-text-body">{mission.description}</p>
                                        <p className="font-bold text-accent">+{mission.xp} XP</p>
                                    </div>
                                    <div className="w-full bg-border-main rounded-full h-2.5">
                                        <div className="bg-accent h-2.5 rounded-full" style={{ width: `${(mission.progress / mission.target) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
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

                {/* Right Column: Leaderboard */}
                <Card title="👑 Papan Peringkat (Top 10)">
                    {isLoading ? <LeaderboardSkeleton /> : leaderboard.length === 0 ? (
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

        </div>
    );
};

export default PusatJuragan;