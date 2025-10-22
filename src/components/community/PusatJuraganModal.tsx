// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import type { LeaderboardUser } from '../../types';
import Button from '../common/Button';

interface Props {
  show: boolean;
  onClose: () => void;
}

// Mock data, in a real app this would be fetched
const MOCK_LEADERBOARD: LeaderboardUser[] = [
    { id: '1', full_name: 'Juragan Sultan', avatar_url: 'https://i.pravatar.cc/40?u=1', level: 15, xp: 15200 },
    { id: '2', full_name: 'Ratu Konten', avatar_url: 'https://i.pravatar.cc/40?u=2', level: 14, xp: 14100 },
    { id: '3', full_name: 'Anak Senja', avatar_url: 'https://i.pravatar.cc/40?u=3', level: 12, xp: 11500 },
    { id: '4', full_name: 'Mas Barista', avatar_url: 'https://i.pravatar.cc/40?u=4', level: 10, xp: 9800 },
    { id: '5', full_name: 'Mbak Desainer', avatar_url: 'https://i.pravatar.cc/40?u=5', level: 9, xp: 8500 },
];

const PusatJuraganModal: React.FC<Props> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative max-w-md w-full bg-surface rounded-2xl shadow-xl p-8">
        <button onClick={onClose} title="Tutup" className="absolute top-4 right-4 p-2 text-primary rounded-full hover:bg-background transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-2xl font-bold text-text-header mb-6">🏆 Pusat Juragan</h2>
        <p className="text-sm text-text-muted mb-4">Lihat siapa saja para Juragan paling aktif di desain.fun! Teruslah berkarya untuk naik peringkat.</p>
        
        <div className="space-y-2">
            <h3 className="font-bold text-primary">Papan Peringkat (Segera Hadir)</h3>
            {MOCK_LEADERBOARD.map((user, index) => (
                <div key={user.id} className="flex items-center gap-4 p-2 bg-background rounded-lg">
                    <span className="font-bold text-lg w-6 text-center">{index + 1}</span>
                    <img src={user.avatar_url} alt={user.full_name} className="w-10 h-10 rounded-full"/>
                    <div className="flex-grow">
                        <p className="font-semibold text-text-body">{user.full_name}</p>
                        <p className="text-xs text-text-muted">Level {user.level} - {user.xp} XP</p>
                    </div>
                </div>
            ))}
        </div>

        <div className="mt-6 text-center">
            <Button onClick={onClose} variant="secondary">Tutup</Button>
        </div>
      </div>
    </div>
  );
};

export default PusatJuraganModal;
