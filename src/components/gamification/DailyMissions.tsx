// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import type { DailyMission } from '../../types';
import { useUserActions } from '../../contexts/UserActionsContext';
import Button from '../common/Button';
import { playSound } from '../../services/soundService';

interface Props {
  show: boolean;
  onClose: () => void;
}

const MISSIONS: Omit<DailyMission, 'isCompleted'>[] = [
  { id: 'mission_1', description: 'Buat proyek branding baru.', xp: 50, token: 5, action: 'CREATE_PROJECT' },
  { id: 'mission_2', description: 'Generate logo untuk sebuah proyek.', xp: 75, action: 'GENERATE_LOGO' },
  { id: 'mission_3', description: 'Gunakan salah satu tool di Sotoshop.', xp: 100, token: 10, action: 'USE_SOTOSHOP' },
];

const getTodayKey = () => `desainfun_missions_${new Date().toISOString().split('T')[0]}`;

const DailyMissions: React.FC<Props> = ({ show, onClose }) => {
  const { addXp } = useUserActions();
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [missions, setMissions] = useState<DailyMission[]>([]);

  useEffect(() => {
    if (show) {
      const todayKey = getTodayKey();
      const savedCompleted = JSON.parse(localStorage.getItem(todayKey) || '[]');
      setCompletedMissions(savedCompleted);
      
      const missionsWithStatus = MISSIONS.map(m => ({
        ...m,
        isCompleted: savedCompleted.includes(m.id)
      }));
      setMissions(missionsWithStatus);
    }
  }, [show]);

  const handleClaim = async (mission: DailyMission) => {
    if (mission.isCompleted) return;

    // Here, you would normally check if the user has actually performed the action.
    // For this example, we'll assume they did and just grant the reward.
    await addXp(mission.xp);
    playSound('success');

    const newCompleted = [...completedMissions, mission.id];
    setCompletedMissions(newCompleted);
    localStorage.setItem(getTodayKey(), JSON.stringify(newCompleted));

    setMissions(missions.map(m => m.id === mission.id ? { ...m, isCompleted: true } : m));
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative max-w-md w-full bg-surface rounded-2xl shadow-xl p-8">
        <button onClick={onClose} title="Tutup" className="absolute top-4 right-4 p-2 text-primary rounded-full hover:bg-background transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-2xl font-bold text-text-header mb-6">🎯 Misi Harian</h2>
        <p className="text-sm text-text-muted mb-4">Selesaikan misi untuk mendapatkan XP dan hadiah token tambahan. Misi di-reset setiap hari!</p>
        
        <div className="space-y-3">
          {missions.map(mission => (
            <div key={mission.id} className={`p-3 rounded-lg flex items-center justify-between ${mission.isCompleted ? 'bg-green-500/10' : 'bg-background'}`}>
              <div>
                <p className="font-semibold text-text-body">{mission.description}</p>
                <p className="text-xs text-primary">+{mission.xp} XP {mission.token && ` | +${mission.token} 🪙`}</p>
              </div>
              <Button size="small" onClick={() => handleClaim(mission)} disabled={mission.isCompleted}>
                {mission.isCompleted ? '✓ Selesai' : 'Klaim'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailyMissions;
