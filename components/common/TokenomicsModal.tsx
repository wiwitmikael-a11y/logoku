// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useRef } from 'react';
import { playSound, unlockAudio } from '../../services/soundService';
import Button from './Button';

interface Props {
  show: boolean;
  onClose: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const TokenomicsModal: React.FC<Props> = ({ show, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    if (show) { document.addEventListener('keydown', handleKeyDown); modalRef.current?.focus(); }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  if (!show) return null;

  const handleClose = async () => { await unlockAudio(); playSound('click'); onClose(); };
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) handleClose(); }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="token-modal-title"
      tabIndex={-1}
    >
      <div className="relative max-w-lg w-full bg-surface rounded-2xl shadow-xl p-8 flex flex-col items-center">
        <button onClick={handleClose} title="Tutup" className="absolute top-4 right-4 p-2 text-primary rounded-full hover:bg-background hover:text-primary-hover transition-colors close-button-glow">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="text-5xl mb-4">⚡</div>
        <h2 id="token-modal-title" className="text-3xl font-bold text-splash mb-2 text-center" style={{ fontFamily: 'var(--font-display)' }}>Sistem Token Mang AI</h2>
        <p className="text-text-muted mb-6 text-center text-sm">Token adalah "amunisi" buat ngejalanin fitur-fitur AI di aplikasi ini. Tenang, sistemnya dibikin biar lo tetep bisa eksplorasi gratis!</p>
        
        <div className="w-full text-left space-y-4 text-sm">
            <div className="p-4 bg-background rounded-lg border border-border-main">
                <h3 className="font-bold text-green-400">🎁 Bonus Sambutan</h3>
                <p className="text-text-body">Sebagai juragan baru, lo langsung dapet modal awal <strong className="text-text-header">20 Token GRATIS</strong> buat mulai petualangan branding lo.</p>
            </div>
            <div className="p-4 bg-background rounded-lg border border-border-main">
                <h3 className="font-bold text-sky-400">☀️ Jatah Harian</h3>
                <p className="text-text-body">Tiap pagi, kalo sisa token lo <strong className="text-text-header">kurang dari 5</strong>, Mang AI bakal otomatis <strong className="text-text-header">isiin lagi sampe jadi 5 Token</strong>. Kalo token lo lebih dari 5, jumlahnya gak akan direset. Aman!</p>
            </div>
             <div className="p-4 bg-background rounded-lg border border-border-main">
                <h3 className="font-bold text-orange-400">🚀 Hadiah Naik Level</h3>
                <p className="text-text-body">Setiap kali lo naik level, lo bakal dapet hadiah <strong className="text-text-header">1-5 Token</strong>, tergantung level yang lo capai. Makin aktif, makin banyak bonus!</p>
            </div>
             <div className="p-4 bg-background rounded-lg border border-border-main">
                <h3 className="font-bold text-text-header">Bagaimana Token Digunakan?</h3>
                <p className="text-text-body">Setiap aksi AI punya "harga"-nya sendiri, biasanya 1-4 Token. Biayanya selalu tertera di setiap tombol aksi. Transparan dan gak ada jebakan!</p>
            </div>
        </div>
        
        <div className="mt-8">
            <Button onClick={handleClose}>Oke, Paham!</Button>
        </div>
      </div>
    </div>
  );
};

export default TokenomicsModal;