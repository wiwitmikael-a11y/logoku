// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import type { DailyMission } from '../../types';
import { useUserActions } from '../../contexts/UserActionsContext';
import { useAuth } from '../../contexts/AuthContext';
import { playSound } from '../../services/soundService';

const getMissionStorageKey = (userId: string) => `desainfun_missions_${userId}_${new Date().toISOString().split('T')[0]}`;

const ALL_MISSIONS: Omit<DailyMission, 'isCompleted'>[] = [
    { id: 'mission_1', description: "Buat Proyek Branding Baru", xp: 50, action: 'CREATE_PROJECT' },
    { id: 'mission_2', description: "Selesaikan 1 Sesi Persona Brand", xp: 75, action: 'COMPLETE_PERSONA' },
    { id: 'mission_3', description: "Generate 1 set Logo", xp: 100, token: 2, action: 'GENERATE_LOGO' },
    { id: 'mission_4', description: "Gunakan 1 tool Sotoshop", xp: 50, token: 1, action: 'USE_SOTOSHOP' },
    { id: 'mission_5', description: "Simpan 1 Aset ke Lemari Brand", xp: 25, action: 'SAVE_ASSET' },
];

const DailyMissions: React.FC = () => {
    const { user } = useAuth();
    const { addXp, deductCredits } = useUserActions();
    const [missions, setMissions] = useState<DailyMission[]>([]);
    const [xpGain, setXpGain] = useState<{ id: string, amount: number } | null>(null);

    useEffect(() => {
        if (!user) return;
        const storageKey = getMissionStorageKey(user.id);
        const savedMissions = localStorage.getItem(storageKey);

        if (savedMissions) {
            setMissions(JSON.parse(savedMissions));
        } else {
            const newMissions = ALL_MISSIONS.map(m => ({ ...m, isCompleted: false }));
            setMissions(newMissions);
            localStorage.setItem(storageKey, JSON.stringify(newMissions));
        }
    }, [user]);

    const completeMission = async (missionId: string) => {
        if (!user) return;

        const updatedMissions = missions.map(m => {
            if (m.id === missionId && !m.isCompleted) {
                playSound('success');
                addXp(m.xp);
                setXpGain({ id: m.id, amount: m.xp });
                setTimeout(() => setXpGain(null), 1500);
                if (m.token) {
                    // deductCredits with negative value to add credits
                    deductCredits(-m.token); 
                }
                return { ...m, isCompleted: true };
            }
            return m;
        });

        if (JSON.stringify(updatedMissions) !== JSON.stringify(missions)) {
            setMissions(updatedMissions);
            localStorage.setItem(getMissionStorageKey(user.id), JSON.stringify(updatedMissions));
        }
    };
    
    const allComplete = missions.length > 0 && missions.every(m => m.isCompleted);

    return (
        <div className="mt-8 p-4 bg-surface rounded-2xl animate-item-appear">
            <h3 className="text-2xl font-bold text-text-header mb-3 flex items-center gap-2" style={{fontFamily: 'var(--font-display)'}}>
                <span>🎯</span> Misi Harian Juragan
            </h3>
            <div className="space-y-3">
                {missions.map(mission => (
                     <div key={mission.id} className={`relative flex items-center justify-between p-3 rounded-lg transition-all ${mission.isCompleted ? 'bg-green-500/10 text-text-muted' : 'bg-background'}`}>
                        <div>
                            <p className={`font-semibold text-sm ${mission.isCompleted ? 'line-through' : 'text-text-header'}`}>{mission.description}</p>
                            <p className="text-xs">
                                <span className="text-accent font-bold">+{mission.xp} XP</span>
                                {mission.token && <span className="text-primary font-bold ml-2"> +{mission.token} Token</span>}
                            </p>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${mission.isCompleted ? 'bg-green-500' : 'bg-border-main'}`}>
                           {mission.isCompleted && '✓'}
                        </div>
                        {xpGain?.id === mission.id && (
                            <div className="xp-gain-animation">+{xpGain.amount} XP</div>
                        )}
                    </div>
                ))}
            </div>
             {allComplete && (
                <p className="text-center text-sm text-green-400 mt-4 font-semibold">Mantap! Semua misi hari ini beres. Sampai jumpa besok!</p>
            )}
        </div>
    );
};

export default DailyMissions;
