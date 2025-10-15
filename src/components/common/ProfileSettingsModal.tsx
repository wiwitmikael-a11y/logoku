// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useRef } from 'react';
import { playSound, unlockAudio } from '../../services/soundService';
import { useAuth } from '../../contexts/AuthContext';
import type { User, Profile } from '../../types';
import Button from './Button';
import { BgmSelection } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

const ACHIEVEMENTS_MAP: { [key: string]: { name: string; description: string; icon: string; } } = {
  BRAND_PERTAMA_LAHIR: { name: 'Brand Pertama Lahir!', description: 'Berhasil menyelesaikan project branding pertama.', icon: '🥉' },
  SANG_KOLEKTOR: { name: 'Sang Kolektor', description: 'Berhasil menyelesaikan 5 project branding.', icon: '🥈' },
  SULTAN_KONTEN: { name: 'Sultan Konten', description: 'Berhasil menyelesaikan 10 project branding.', icon: '🥇' },
};

interface Props {
  show: boolean;
  onClose: () => void;
}

const ProfileSettingsModal: React.FC<Props> = ({ show, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { user, profile, handleLogout, handleDeleteAccount, isMuted, handleToggleMute, bgmSelection, handleBgmChange } = useAuth();
  const { toggleToSModal, toggleContactModal } = useUI();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    if (show) { document.addEventListener('keydown', handleKeyDown); modalRef.current?.focus(); }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  if (!show || !user || !profile) return null;

  const handleClose = async () => { await unlockAudio(); playSound('click'); onClose(); };
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) handleClose(); }
  const handleLogoutClick = () => { handleLogout(); onClose(); };
  const handleTosClick = () => { toggleToSModal(true); onClose(); };
  const handleContactClick = () => { toggleContactModal(true); onClose(); };

  const getXpForLevel = (level: number): number => (level - 1) * 750;
  const currentLevel = profile.level ?? 1;
  const currentXp = profile.xp ?? 0;
  const xpForCurrentLevel = getXpForLevel(currentLevel);
  const xpForNextLevel = getXpForLevel(currentLevel + 1);
  const xpProgress = currentXp - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = xpNeededForLevel > 0 ? (xpProgress / xpNeededForLevel) * 100 : 100;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in"
      style={{ animationDuration: '0.2s' }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      tabIndex={-1}
    >
      <div className="relative bg-surface rounded-2xl shadow-xl flex flex-col max-w-lg w-full max-h-[90vh]">
          <button onClick={handleClose} title="Tutup" className="absolute top-4 right-4 z-10 p-2 text-primary rounded-full hover:bg-background hover:text-primary-hover transition-colors close-button-glow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        
        <main className="px-8 py-8 space-y-6 overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
                <img src={profile.avatar_url || ''} alt={profile.full_name || 'User Avatar'} className="w-16 h-16 rounded-full border-2 border-primary/20" />
                <div>
                    <h2 id="profile-modal-title" className="text-xl font-bold text-text-header">{profile.full_name || 'Juragan'}</h2>
                    <p className="text-sm text-text-muted">{user.email}</p>
                </div>
            </div>

            <div className="w-full">
                <h3 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Tindakan</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Button onClick={handleLogoutClick} size="small" variant="secondary">Logout</Button>
                    <Button onClick={handleTosClick} size="small" variant="secondary">Ketentuan Layanan</Button>
                    <Button onClick={handleContactClick} size="small" variant="secondary">Info Dev</Button>
                </div>
            </div>
            
            <div className="w-full border-t border-border-main pt-6">
                <h3 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Pengaturan Audio</h3>
                <div className="bg-background border border-border-main p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                        <label htmlFor="bgm-select" className="text-sm text-text-body">Musik Latar</label>
                        <select id="bgm-select" value={bgmSelection} onChange={(e) => handleBgmChange(e.target.value as BgmSelection)} className="bg-surface border border-border-main rounded-md text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-splash">
                            {(['Mute', 'Random', 'Jingle', 'Acoustic', 'Uplifting', 'LoFi', 'Bamboo', 'Ethnic', 'Cozy'] as BgmSelection[]).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-text-body">Master Mute</span>
                        <button onClick={handleToggleMute} role="switch" aria-checked={isMuted} className={`relative inline-flex items-center h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-splash focus:ring-offset-2 focus:ring-offset-surface ${isMuted ? 'bg-background' : 'bg-primary'}`}>
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isMuted ? 'translate-x-0' : 'translate-x-5'}`}/>
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full border-t border-border-main pt-6">
                <h3 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Progres Juragan</h3>
                <div className="bg-background border border-border-main p-4 rounded-lg">
                    <div className="flex justify-between items-baseline mb-1">
                        <p className="font-bold text-orange-400">Level {currentLevel}</p>
                        <p className="text-xs text-text-muted">{currentXp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP</p>
                    </div>
                    <div className="w-full bg-border-main rounded-full h-2.5">
                        <div className="bg-orange-400 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>
            </div>

             <div className="w-full">
                <h3 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Lencana Pencapaian</h3>
                <div className="flex gap-4 p-4 bg-background border border-border-main rounded-lg">
                    {Object.keys(ACHIEVEMENTS_MAP).length > 0 && profile.achievements.length > 0 ? (
                        Object.entries(ACHIEVEMENTS_MAP).map(([id, ach]) => {
                            const isUnlocked = profile.achievements.includes(id);
                            if (isUnlocked) {
                                return (
                                    <div key={id} className="flex flex-col items-center text-center" title={`${ach.name}: ${ach.description}`}>
                                        <span className={`text-5xl transition-all duration-300`}>{ach.icon}</span>
                                    </div>
                                );
                            }
                            return null;
                        })
                    ) : (
                        <p className="text-xs text-text-muted italic text-center w-full">Belum ada lencana yang didapat.</p>
                    )}
                </div>
            </div>

            <div className="w-full border-t border-red-500/30 pt-4 mt-6">
               <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider">Zona Berbahaya</h3>
               <Button onClick={handleDeleteAccount} size="small" variant="secondary" className="mt-3 !border-red-500/30 !text-red-500 hover:!bg-red-500/10 disabled:!border-slate-300 disabled:!text-slate-400 disabled:cursor-not-allowed" disabled={true} title="Fitur ini hanya tersedia untuk user Pro (Segera Hadir)."> Hapus Akun Saya </Button>
            </div>
        </main>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;