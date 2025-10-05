// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useRef, Suspense } from 'react';
import { playSound, unlockAudio } from '../../services/soundService';
import { User, Profile } from '../../types';
import Button from './Button';

const AIPetCard = React.lazy(() => import('../gamification/AIPetCard'));

const ACHIEVEMENTS_MAP: { [key: string]: { name: string; description: string; icon: string; } } = {
  BRAND_PERTAMA_LAHIR: { name: 'Brand Pertama Lahir!', description: 'Berhasil menyelesaikan project branding pertama.', icon: '🥉' },
  SANG_KOLEKTOR: { name: 'Sang Kolektor', description: 'Berhasil menyelesaikan 5 project branding.', icon: '🥈' },
  SULTAN_KONTEN: { name: 'Sultan Konten', description: 'Berhasil menyelesaikan 10 project branding.', icon: '🥇' },
};

// FIX: Added the missing 'Props' interface definition.
interface Props {
  show: boolean;
  onClose: () => void;
  user: User | null;
  profile: Profile | null;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onShowToS: () => void;
  onShowContact: () => void;
}

const ProfileSettingsModal: React.FC<Props> = ({ show, onClose, user, profile, onLogout, onDeleteAccount, onShowToS, onShowContact }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    if (show) { document.addEventListener('keydown', handleKeyDown); modalRef.current?.focus(); }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  if (!show || !user || !profile) return null;

  const handleClose = async () => { await unlockAudio(); playSound('click'); onClose(); };
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) handleClose(); }
  const handleLogoutClick = () => { onLogout(); onClose(); }
  const handleTosClick = () => { onShowToS(); onClose(); };
  const handleContactClick = () => { onShowContact(); onClose(); };

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
          <button onClick={handleClose} title="Tutup" className="absolute top-4 right-4 z-10 p-2 text-text-muted rounded-full hover:bg-background hover:text-text-header transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        
        <main className="px-8 py-8 space-y-6 overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
                <img src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} className="w-16 h-16 rounded-full border-2 border-primary/20" />
                <div>
                    <h2 id="profile-modal-title" className="text-xl font-bold text-text-header">{user.user_metadata.full_name}</h2>
                    <p className="text-sm text-text-muted">{user.email}</p>
                </div>
            </div>

            <div className="bg-background border border-border-main p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Aset Digital AIPet</h3>
                {profile.aipet_state && profile.aipet_state.stage !== 'aipod' ? (
                     <Suspense fallback={<div className="h-64 flex items-center justify-center text-sm text-text-muted">Memuat Kartu...</div>}>
                         <AIPetCard petState={profile.aipet_state} />
                     </Suspense>
                 ) : (
                     <div className="text-center text-sm text-text-muted p-4 border border-dashed border-border-main rounded-lg">
                         <p>AIPet-mu masih di dalam AIPod! Buka menu AIPet di dashboard untuk mengaktifkannya.</p>
                     </div>
                 )}
            </div>

            <div className="w-full border-t border-border-main pt-6">
                <h3 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Tindakan</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Button onClick={handleLogoutClick} size="small" variant="secondary">Logout</Button>
                    <Button onClick={handleTosClick} size="small" variant="secondary">Ketentuan Layanan</Button>
                    <Button onClick={handleContactClick} size="small" variant="secondary">Info Dev</Button>
                </div>
            </div>

            <div className="w-full border-t border-red-500/30 pt-4 mt-6">
               <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider">Zona Berbahaya</h3>
               <Button onClick={onDeleteAccount} size="small" variant="secondary" className="mt-3 !border-red-500/30 !text-red-500 hover:!bg-red-500/10 disabled:!border-slate-300 disabled:!text-slate-400 disabled:cursor-not-allowed" disabled={true} title="Fitur ini hanya tersedia untuk user Pro (Segera Hadir)."> Hapus Akun Saya </Button>
            </div>
        </main>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;