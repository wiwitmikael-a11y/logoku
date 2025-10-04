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

const getXpForLevel = (level: number): number => (level - 1) * 750;

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

  const currentLevel = profile.level ?? 1;
  const currentXp = profile.xp ?? 0;
  const xpForCurrentLevel = getXpForLevel(currentLevel);
  const xpForNextLevel = getXpForLevel(currentLevel + 1);
  const xpProgress = currentXp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = xpNeeded > 0 ? (xpProgress / xpNeeded) * 100 : 100;

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
        <header className="p-8 pb-0">
            <button onClick={handleClose} title="Tutup" className="absolute top-4 right-4 p-2 text-text-muted rounded-full hover:bg-background hover:text-text-header transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="flex items-center gap-4 mb-6">
                <img src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} className="w-16 h-16 rounded-full border-2 border-primary/20" />
                <div>
                    <h2 id="profile-modal-title" className="text-xl font-bold text-text-header">{user.user_metadata.full_name}</h2>
                    <p className="text-sm text-text-muted">{user.email}</p>
                </div>
            </div>
        </header>
        
        <main className="px-8 pb-8 space-y-6 overflow-y-auto">
            <div className="bg-background border border-border-main p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-primary mb-2">Progres Juragan</h3>
                <div className="flex items-center gap-4">
                    <div className="bg-orange-400 text-white rounded-full w-12 h-12 flex flex-col items-center justify-center font-bold flex-shrink-0">
                    <span className="text-xs -mb-1">LVL</span>
                    <span className="text-2xl">{currentLevel}</span>
                    </div>
                    <div className="w-full">
                    <p className="text-xs text-text-muted mb-1">XP: {currentXp.toLocaleString()} / {xpForNextLevel.toLocaleString()}</p>
                    <div className="w-full bg-border-main rounded-full h-2.5">
                        <div className="bg-orange-400 h-2.5 rounded-full" style={{ width: `${progressPercentage}%`, transition: 'width 0.5s ease-out' }}></div>
                    </div>
                    </div>
                </div>
            </div>

            <div className="bg-background border border-border-main p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-primary mb-3">Lencana Kejuraganan</h3>
                {profile.achievements && profile.achievements.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                    {profile.achievements.map(achId => {
                        const ach = ACHIEVEMENTS_MAP[achId];
                        return ach ? (
                        <div key={achId} className="flex items-center gap-2" title={ach.description}>
                            <span className="text-3xl">{ach.icon}</span>
                            <div>
                            <p className="font-semibold text-text-header text-sm">{ach.name}</p>
                            <p className="text-xs text-text-muted">{ach.description}</p>
                            </div>
                        </div>
                        ) : null;
                    })}
                    </div>
                ) : (
                    <p className="text-xs text-text-muted italic">Belum ada lencana yang didapat. Terus berkarya, Juragan!</p>
                )}
            </div>

            <div className="bg-background border border-border-main p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-primary mb-3">Aset Digital AIPet</h3>
                {profile.aipet_state && profile.aipet_state.stage !== 'egg' ? (
                     <Suspense fallback={<div className="h-64 flex items-center justify-center text-sm text-text-muted">Memuat Kartu...</div>}>
                         <AIPetCard petState={profile.aipet_state} />
                     </Suspense>
                 ) : (
                     <div className="text-center text-sm text-text-muted p-4 border border-dashed border-border-main rounded-lg">
                         <p>AIPet-mu masih di dalam telur! Buka menu AIPet di dashboard untuk menetaskannya.</p>
                     </div>
                 )}
            </div>

            <div className="w-full border-t border-border-main pt-6">
                <h3 className="text-base font-semibold text-text-header mb-3">Tindakan</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleLogoutClick} size="small" variant="secondary">Logout</Button>
                    <Button onClick={handleTosClick} size="small" variant="secondary">Ketentuan Layanan</Button>
                    <Button onClick={handleContactClick} size="small" variant="secondary">Info Dev</Button>
                </div>
            </div>

            <div className="w-full border-t border-red-500/30 pt-4 mt-6">
               <h3 className="text-base font-semibold text-red-500 mb-2">Zona Berbahaya</h3>
                <p className="text-xs text-text-muted mb-3">Tindakan ini tidak bisa dibatalkan. Semua data project dan akun lo akan dihapus permanen.</p>
               <Button onClick={onDeleteAccount} size="small" variant="secondary" className="!border-red-500/30 !text-red-500 hover:!bg-red-500/10 disabled:!border-slate-300 disabled:!text-slate-400 disabled:cursor-not-allowed" disabled={true} title="Fitur ini hanya tersedia untuk user Pro (Segera Hadir)."> Hapus Akun Saya (Fitur Pro) </Button>
            </div>
        </main>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;
