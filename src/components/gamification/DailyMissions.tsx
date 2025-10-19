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

interface Props {
    show: boolean;
    onClose: () => void;
}

const DailyMissions: React.FC<Props> = ({ show, onClose }) => {
    const { user } = useAuth();
    const { addXp, deductCredits } = useUserActions();
    const [missions, setMissions] = useState<DailyMission[]>([]);
    const [xpGain, setXpGain] = useState<{ id: string, amount: number } | null>(null);

    useEffect(() => {
        if (!user || !show) return;
        const storageKey = getMissionStorageKey(user.id);
        const savedMissions = localStorage.getItem(storageKey);

        if (savedMissions) {
            setMissions(JSON.parse(savedMissions));
        } else {
            const newMissions = ALL_MISSIONS.map(m => ({ ...m, isCompleted: false }));
            setMissions(newMissions);
            localStorage.setItem(storageKey, JSON.stringify(newMissions));
        }
    }, [user, show]);

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
    
    if (!show) return null;

    const allComplete = missions.length > 0 && missions.every(m => m.isCompleted);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="relative max-w-lg w-full bg-surface rounded-2xl shadow-xl p-6">
                <button onClick={onClose} title="Tutup" className="absolute top-4 right-4 p-2 text-primary rounded-full hover:bg-background transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h3 className="text-2xl font-bold text-text-header mb-4 flex items-center gap-2" style={{fontFamily: 'var(--font-display)'}}>
                    <span>🎯</span> Misi Harian Juragan
                </h3>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
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
        </div>
    );
};

export default DailyMissions;