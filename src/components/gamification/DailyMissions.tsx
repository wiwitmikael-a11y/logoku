// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import type { DailyMission } from '../../types';

interface Props {
  show: boolean;
  onClose: () => void;
}

// In a real app, this would be fetched from a server
const MOCK_MISSIONS: DailyMission[] = [
  { id: '1', description: 'Buat proyek branding baru', xp: 50, token: 5, isCompleted: true, action: 'CREATE_PROJECT' },
  { id: '2', description: 'Gunakan salah satu tool di Sotoshop', xp: 25, isCompleted: false, action: 'USE_SOTOSHOP' },
  { id: '3', description: 'Simpan sebuah aset ke Lemari Brand', xp: 15, isCompleted: false, action: 'SAVE_ASSET' },
  { id: '4', description: 'Generate logo untuk sebuah proyek', xp: 30, token: 2, isCompleted: false, action: 'GENERATE_LOGO' },
];

const DailyMissions: React.FC<Props> = ({ show, onClose }) => {
  if (!show) return null;

  // Logic to check mission completion would go here, comparing user actions against mission requirements.
  // For now, we'll just display the mock data.

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative max-w-md w-full bg-surface rounded-2xl shadow-xl p-8">
        <button onClick={onClose} title="Tutup" className="absolute top-4 right-4 p-2 text-primary rounded-full hover:bg-background transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-2xl font-bold text-text-header mb-6">🎯 Misi Harian</h2>
        <p className="text-sm text-text-muted mb-4">Selesaikan misi untuk dapat XP dan token tambahan! Misi di-reset setiap hari.</p>
        <div className="space-y-3">
          {MOCK_MISSIONS.map(mission => (
            <div key={mission.id} className={`p-3 rounded-lg flex items-center justify-between transition-all ${mission.isCompleted ? 'bg-green-500/10 text-text-muted' : 'bg-background'}`}>
              <div>
                <p className={`font-semibold ${mission.isCompleted ? 'line-through' : 'text-text-body'}`}>{mission.description}</p>
                <p className="text-xs">
                  <span className="text-accent">+{mission.xp} XP</span>
                  {mission.token && <span className="text-primary ml-2">+{mission.token} 🪙</span>}
                </p>
              </div>
              {mission.isCompleted && <span className="text-green-400 font-bold text-lg">✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailyMissions;
